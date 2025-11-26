'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo, Button, Card, Input } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { getSession as getStoredSession, addPlayerToSession, saveSession } from '@/lib/gameSync';
import { getGameSession, joinGame } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const avatars = ['😀', '😎', '🤓', '🥳', '🤠', '👻', '🐱', '🦊', '🐸', '🦄', '🌟', '🔥'];

export default function JoinGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { setCurrentPlayer, setSession } = useGameStore();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameExists, setGameExists] = useState<boolean | null>(null);

  // Check if game exists
  useEffect(() => {
    const checkGameExists = async () => {
      if (code) {
        try {
          // First try to get from database
          const dbSession = await getGameSession(code);
          if (dbSession) {
            setGameExists(true);
            return;
          }
        } catch (error) {
          console.log('Game not found in database, checking localStorage...');
        }

        // Fallback to localStorage
        const session = getStoredSession(code);
        if (session) {
          setGameExists(true);
          setSession(session);
        } else {
          setGameExists(false);
        }
      }
    };

    checkGameExists();
  }, [code, setSession]);

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('Bitte gib einen Nickname ein');
      return;
    }

    if (nickname.trim().length < 2) {
      setError('Nickname muss mindestens 2 Zeichen haben');
      return;
    }

    if (nickname.trim().length > 15) {
      setError('Nickname darf maximal 15 Zeichen haben');
      return;
    }

    setIsLoading(true);

    try {
      // First try to get session from database
      let dbSession;
      try {
        dbSession = await getGameSession(code);
      } catch (error) {
        console.log('Database session not found, checking localStorage...');
      }

      // Check if game session exists (database or localStorage)
      const storedSession = getStoredSession(code);
      if (!dbSession && !storedSession) {
        setError('Spiel nicht gefunden. Prüfe den Code.');
        setIsLoading(false);
        return;
      }

      // Check if game already started
      const sessionStatus = dbSession?.status || storedSession?.status;
      if (sessionStatus !== 'waiting') {
        setError('Das Spiel hat bereits begonnen.');
        setIsLoading(false);
        return;
      }

      const player = {
        id: uuidv4(),
        nickname: nickname.trim(),
        avatar: selectedAvatar,
        score: 0,
      };

      // If we have a database session, join via database
      if (dbSession) {
        try {
          await joinGame(dbSession.id, player.nickname, player.avatar);
          
          // Create local session for immediate UI update
          const localSession = {
            id: dbSession.id,
            code: code,
            quizId: dbSession.quiz_id,
            status: 'waiting' as const,
            currentQuestionIndex: 0,
            players: [player], // Will be updated by real-time sync
            hostId: dbSession.host_id || '',
          };
          
          setSession(localSession);
          setCurrentPlayer(player);
          
          // Navigate to waiting screen
          router.push(`/play/${code}/game`);
        } catch (error) {
          console.error('Failed to join game:', error);
          setError('Fehler beim Beitreten. Versuche es erneut.');
          setIsLoading(false);
          return;
        }
      } else {
        // Fallback to localStorage method
        const updatedSession = addPlayerToSession(code, player);
        if (updatedSession) {
          // Update local state
          setSession(updatedSession);
          setCurrentPlayer(player);

          // Broadcast player joined via BroadcastChannel
          const channel = new BroadcastChannel('pflege-quiz-game');
          channel.postMessage({
            type: 'player_joined',
            code,
            payload: updatedSession,
            timestamp: Date.now(),
          });
          channel.close();

          // Navigate to waiting screen
          router.push(`/play/${code}/game`);
        } else {
          setError('Fehler beim Beitreten. Versuche es erneut.');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Fehler beim Beitreten. Versuche es erneut.');
      setIsLoading(false);
    }
  };

  if (gameExists === false) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-6">
          <Link href="/play">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">Spiel nicht gefunden</h2>
            <p className="text-white/70 mb-6">
              Das Spiel mit dem Code <span className="text-[var(--primary)] font-bold">{code}</span> existiert nicht oder ist bereits beendet.
            </p>
            <Link href="/play">
              <Button variant="primary">Anderen Code eingeben</Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  if (gameExists === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Suche Spiel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/play">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="glass-card inline-block px-6 py-2 mb-4">
              <span className="text-2xl font-bold text-[var(--primary)]">
                {code}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Fast geschafft!</h1>
            <p className="text-white/70">Wähle deinen Avatar und Nickname</p>
          </motion.div>

          <Card>
            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-3">
                Avatar wählen
              </label>
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((avatar, index) => (
                  <motion.button
                    key={avatar}
                    type="button"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                      transition-all duration-200 cursor-pointer
                      ${selectedAvatar === avatar
                        ? 'bg-[var(--primary)] ring-2 ring-white scale-110'
                        : 'bg-white/10 hover:bg-white/20'
                      }
                    `}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div className="mb-6">
              <Input
                label="Nickname"
                placeholder="Dein Spitzname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={15}
                error={error}
              />
              <p className="text-white/40 text-xs mt-2 text-right">
                {nickname.length}/15 Zeichen
              </p>
            </div>

            {/* Preview */}
            <motion.div
              className="glass-card p-4 mb-6 flex items-center gap-4"
              animate={{ opacity: nickname ? 1 : 0.5 }}
            >
              <span className="text-4xl">{selectedAvatar}</span>
              <div>
                <p className="text-sm text-white/60">Dein Profil:</p>
                <p className="font-bold text-lg">
                  {nickname || 'Dein Nickname'}
                </p>
              </div>
            </motion.div>

            {/* Join Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleJoin}
              loading={isLoading}
              disabled={!nickname.trim()}
            >
              🎮 Spiel beitreten
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
