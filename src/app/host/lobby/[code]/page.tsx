'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Logo, Button, Card } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useGameChannel, saveSession, getSession as getStoredSession, GameMessage } from '@/lib/gameSync';
import { getSessionPlayers, subscribeToPlayers, updateGameSession } from '@/lib/supabase';
import Link from 'next/link';

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { session, setSession } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);

  // Handle incoming messages from players
  const handleMessage = useCallback((message: GameMessage) => {
    if (message.type === 'sync_request') {
      // Player is requesting current game state
      const currentSession = getStoredSession(code);
      if (currentSession) {
        // Send sync response
        const channel = new BroadcastChannel('pflege-quiz-game');
        channel.postMessage({
          type: 'sync_response',
          code,
          payload: currentSession,
          timestamp: Date.now(),
        });
        channel.close();
      }
    }
  }, [code]);

  const { broadcast } = useGameChannel(code, handleMessage);

  // Initialize session in localStorage and set up polling
  useEffect(() => {
    if (session && session.code === code) {
      // Save to localStorage for cross-tab communication
      saveSession(session);
    }
  }, [session, code]);

  // Subscribe to database players and poll localStorage as fallback
  useEffect(() => {
    if (!code || !session) return;

    let subscription: any = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const setupDatabaseSync = async () => {
      try {
        // Try to get initial players from database
        const players = await getSessionPlayers(session.id);
        if (players.length > 0) {
          setDbPlayers(players);
          
          // Convert database players to local format
          const localPlayers = players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar || '👤',
            score: p.score,
          }));
          
          setSession({
            ...session,
            players: localPlayers,
          });

          // Subscribe to real-time updates
          subscription = subscribeToPlayers(session.id, (updatedPlayers) => {
            setDbPlayers(updatedPlayers);
            const localPlayers = updatedPlayers.map(p => ({
              id: p.id,
              nickname: p.nickname,
              avatar: p.avatar || '👤',
              score: p.score,
            }));
            
            if (session) {
              setSession({
                ...session,
                players: localPlayers,
              });
            }
          });
        } else {
          // Fallback to localStorage polling
          pollInterval = setInterval(() => {
            const storedSession = getStoredSession(code);
            if (storedSession && session) {
              // Check if players changed
              if (JSON.stringify(storedSession.players) !== JSON.stringify(session.players)) {
                setSession({
                  ...session,
                  players: storedSession.players,
                });
              }
            }
          }, 500);
        }
      } catch (error) {
        console.log('Database sync failed, using localStorage polling...');
        // Fallback to localStorage polling
        pollInterval = setInterval(() => {
          const storedSession = getStoredSession(code);
          if (storedSession && session) {
            // Check if players changed
            if (JSON.stringify(storedSession.players) !== JSON.stringify(session.players)) {
              setSession({
                ...session,
                players: storedSession.players,
              });
            }
          }
        }, 500);
      }
    };

    setupDatabaseSync();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [code, session?.id, setSession]);

  // Redirect if no session
  useEffect(() => {
    if (!session || session.code !== code) {
      // Try to load from localStorage
      const storedSession = getStoredSession(code);
      if (storedSession) {
        setSession(storedSession);
      } else {
        router.push('/host');
      }
    }
  }, [session, code, router, setSession]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (session && session.players.length > 0) {
      try {
        // Update database if we have database players
        if (dbPlayers.length > 0) {
          await updateGameSession(session.id, {
            status: 'playing',
            started_at: new Date().toISOString(),
          });
        }

        const updatedSession = {
          ...session,
          status: 'playing' as const,
          startedAt: new Date(),
        };
        setSession(updatedSession);
        saveSession(updatedSession);

        // Broadcast to all players
        broadcast({
          type: 'game_started',
          code,
          payload: updatedSession,
        });

        router.push(`/host/game/${code}`);
      } catch (error) {
        console.error('Failed to start game:', error);
        // Fallback to local-only start
        const updatedSession = {
          ...session,
          status: 'playing' as const,
          startedAt: new Date(),
        };
        setSession(updatedSession);
        saveSession(updatedSession);

        broadcast({
          type: 'game_started',
          code,
          payload: updatedSession,
        });

        router.push(`/host/game/${code}`);
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/host">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" onClick={() => router.push('/host')}>
            Quiz beenden
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Game Code Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="text-white/70 text-lg mb-4">
              Teile diesen Code mit deinen Spielern:
            </p>
            <div className="flex items-center justify-center gap-4">
              <motion.div
                className="glass-card px-8 py-6 inline-block"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-6xl md:text-8xl font-black tracking-widest text-[var(--primary)]">
                  {code}
                </span>
              </motion.div>
            </div>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={copyCode}
            >
              {copied ? '✓ Kopiert!' : '📋 Code kopieren'}
            </Button>

            <p className="text-white/50 mt-4">
              Spieler öffnen <span className="text-[var(--primary)]">/play</span> und geben den Code ein
            </p>
          </motion.div>

          {/* Quiz Info */}
          <Card className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{session.quiz?.title}</h2>
                <p className="text-white/60">
                  {session.quiz?.questions.length} Fragen
                </p>
              </div>
              <span className="text-4xl">🏥</span>
            </div>
          </Card>

          {/* Players List */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                Spieler ({session.players.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white/60 text-sm">Warten auf Spieler...</span>
              </div>
            </div>

            {session.players.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  👀
                </motion.div>
                <p className="text-white/60">
                  Noch keine Spieler beigetreten
                </p>
                <p className="text-white/40 text-sm mt-2">
                  Teile den Code, damit Spieler beitreten können
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {session.players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-4 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">
                          {player.avatar || '👤'}
                        </span>
                      </div>
                      <p className="font-medium truncate">{player.nickname}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button
              size="xl"
              variant="primary"
              onClick={startGame}
              disabled={session.players.length === 0}
              className="min-w-[200px]"
            >
              🚀 Spiel starten
            </Button>
            {session.players.length === 0 && (
              <p className="text-white/50 text-sm mt-3">
                Warte auf mindestens einen Spieler
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
