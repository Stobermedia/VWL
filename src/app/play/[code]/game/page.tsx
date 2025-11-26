'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Logo, Button, Card, TimerBar, AnswerButton, Confetti, ResultChart } from '@/components';
import { useGameStore } from '@/store/gameStore';
import {
  getSession as getStoredSession,
  useGameChannel,
  GameMessage,
  GamePhase,
  GameState,
} from '@/lib/gameSync';
import { GameSession, PlayerAnswer } from '@/types';
import Link from 'next/link';

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const {
    session,
    setSession,
    currentPlayer,
    hasAnswered,
    lastAnswerCorrect,
    lastPointsEarned,
    setHasAnswered,
    setLastAnswerResult,
    updatePlayerScore,
  } = useGameStore();

  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const currentQuestion = session?.quiz?.questions[questionIndex];

  // Handle incoming messages from host
  const handleMessage = useCallback((message: GameMessage) => {
    // Handle session updates
    if (message.type === 'player_joined' || message.type === 'sync_response') {
      if (message.payload) {
        setSession(message.payload as GameSession);
      }
      // Also sync game state if provided
      if (message.gameState) {
        setPhase(message.gameState.phase);
        setQuestionIndex(message.gameState.questionIndex);
        if (message.gameState.countdown !== undefined) {
          setCountdown(message.gameState.countdown);
        }
      }
    }

    // Handle game start
    if (message.type === 'game_started') {
      if (message.payload) {
        setSession(message.payload as GameSession);
      }
      setCountdown(3);
      setPhase('countdown');
    }

    // Handle phase changes from host - THIS IS THE KEY SYNC
    if (message.type === 'phase_change' && message.gameState) {
      const { phase: newPhase, questionIndex: newQuestionIndex, countdown: newCountdown } = message.gameState;

      // Update question index if changed
      if (newQuestionIndex !== questionIndex) {
        setQuestionIndex(newQuestionIndex);
        setSelectedAnswerId(null);
        setHasAnswered(false);
      }

      // Update phase
      setPhase(newPhase);

      // Update countdown if provided
      if (newCountdown !== undefined) {
        setCountdown(newCountdown);
      }

      // Update session if provided
      if (message.payload) {
        setSession(message.payload as GameSession);
      }
    }

    // Handle game updates
    if (message.type === 'game_updated') {
      if (message.payload) {
        const updatedSession = message.payload as GameSession;
        setSession(updatedSession);

        // Check if question changed
        if (updatedSession.currentQuestionIndex !== questionIndex) {
          setQuestionIndex(updatedSession.currentQuestionIndex);
          setSelectedAnswerId(null);
          setHasAnswered(false);
        }

        // Check game status
        if (updatedSession.status === 'finished') {
          setPhase('finished');
        }
      }
    }
  }, [setSession, questionIndex, setHasAnswered]);

  const { broadcast } = useGameChannel(code, handleMessage);

  // Load session from localStorage on mount
  useEffect(() => {
    if (code) {
      const storedSession = getStoredSession(code);
      if (storedSession) {
        setSession(storedSession);
        if (storedSession.status === 'playing') {
          setQuestionIndex(storedSession.currentQuestionIndex);
          // Request current state from host
          broadcast({
            type: 'sync_request',
            code,
          });
        }
      }

      // Request sync from host
      broadcast({
        type: 'sync_request',
        code,
      });
    }
  }, [code, setSession, broadcast]);

  // Poll for session updates (backup sync)
  useEffect(() => {
    if (!code) return;

    const pollInterval = setInterval(() => {
      const storedSession = getStoredSession(code);
      if (storedSession) {
        if (storedSession.status === 'playing' && phase === 'waiting') {
          setSession(storedSession);
          setQuestionIndex(storedSession.currentQuestionIndex);
          setCountdown(3);
          setPhase('countdown');
        }
        if (phase === 'waiting' && JSON.stringify(storedSession.players) !== JSON.stringify(session?.players)) {
          setSession(storedSession);
        }
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [code, phase, session?.players, setSession]);

  // Redirect if no player
  useEffect(() => {
    if (!currentPlayer) {
      router.push(`/play/${code}`);
    }
  }, [currentPlayer, code, router]);

  // Handle countdown locally (synced with host)
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      // Don't auto-advance - wait for host's phase_change message
      // But set a local "ready" state
      setTimeRemaining(currentQuestion?.timeLimit || 20);
    }
  }, [phase, countdown, currentQuestion?.timeLimit]);

  // Timer countdown during question phase
  useEffect(() => {
    if (phase === 'question' && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, timeRemaining]);

  const handleAnswer = (answerId: string) => {
    if (hasAnswered || !currentQuestion || !currentPlayer) return;

    setSelectedAnswerId(answerId);
    setHasAnswered(true);

    const answer = currentQuestion.answers.find(a => a.id === answerId);
    const isCorrect = answer?.isCorrect || false;

    // Calculate points based on time
    const basePoints = currentQuestion.points;
    const timeBonus = timeRemaining ? Math.floor((timeRemaining / currentQuestion.timeLimit) * 500) : 0;
    const points = isCorrect ? Math.floor(basePoints * 0.5) + timeBonus : 0;

    setLastAnswerResult(isCorrect, points);

    if (isCorrect) {
      updatePlayerScore(currentPlayer.id, (currentPlayer.score || 0) + points);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Broadcast answer to host
    const playerAnswer: PlayerAnswer = {
      playerId: currentPlayer.id,
      playerAvatar: currentPlayer.avatar,
      playerNickname: currentPlayer.nickname,
      questionId: currentQuestion.id,
      answerId: answerId,
      timeTaken: currentQuestion.timeLimit - (timeRemaining || 0),
      pointsEarned: points,
      isCorrect,
    };

    broadcast({
      type: 'player_answered',
      code,
      payload: playerAnswer,
    });
  };

  if (!currentPlayer) {
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
    <main className="min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom">
      <Confetti active={showConfetti} />

      {/* Header - Player info */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentPlayer.avatar}</span>
          <div>
            <p className="font-bold">{currentPlayer.nickname}</p>
            <p className="text-xs text-white/60">Spieler</p>
          </div>
        </div>
        <div className="glass-card px-4 py-2">
          <p className="text-xs text-white/60">Punkte</p>
          <p className="text-xl font-bold text-[var(--primary)]">
            {currentPlayer.score.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Waiting Phase */}
            {phase === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-6"
                >
                  ⏳
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Warte auf den Host...</h2>
                <p className="text-white/60 mb-8">Das Spiel startet gleich!</p>

                {session && session.players.length > 0 && (
                  <Card className="text-left">
                    <h3 className="text-sm font-medium text-white/60 mb-4">
                      Spieler in der Lobby ({session.players.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {session.players.map((player) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg
                            ${player.id === currentPlayer.id
                              ? 'bg-[var(--primary)]/20 border border-[var(--primary)]/50'
                              : 'bg-white/5'
                            }
                          `}
                        >
                          <span className="text-xl">{player.avatar || '👤'}</span>
                          <span className={`text-sm ${player.id === currentPlayer.id ? 'font-bold' : ''}`}>
                            {player.nickname}
                            {player.id === currentPlayer.id && ' (Du)'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Countdown Phase */}
            {phase === 'countdown' && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                {currentQuestion?.image && (
                  <motion.span
                    className="text-6xl mb-4 block"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {currentQuestion.image}
                  </motion.span>
                )}
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-9xl font-black text-[var(--primary)]"
                >
                  {countdown || '🚀'}
                </motion.div>
                <p className="text-xl text-white/70 mt-6">Mach dich bereit!</p>
                {currentQuestion?.difficulty && (
                  <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {currentQuestion.difficulty === 'easy' ? 'Leicht' :
                     currentQuestion.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                  </span>
                )}
              </motion.div>
            )}

            {/* Question Phase */}
            {phase === 'question' && currentQuestion && (
              <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Timer Bar */}
                <div className="mb-6">
                  {timeRemaining !== null && (
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </div>
                  )}
                  <p className="text-center text-white/60 text-sm mt-2">
                    {timeRemaining !== null ? `${timeRemaining}s` : '...'}
                  </p>
                </div>

                {/* Question Info */}
                <Card className="mb-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {currentQuestion.image && (
                      <span className="text-4xl">{currentQuestion.image}</span>
                    )}
                    <span className="text-white/60 text-sm">
                      Frage {questionIndex + 1}/{session?.quiz?.questions.length}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-relaxed">{currentQuestion.text}</h2>
                </Card>

                {/* Answer Buttons */}
                {!hasAnswered ? (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.answers.map((answer, index) => (
                      <AnswerButton
                        key={answer.id}
                        answer={answer}
                        index={index}
                        onClick={() => handleAnswer(answer.id)}
                        disabled={hasAnswered}
                        selected={selectedAnswerId === answer.id}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-6xl mb-4"
                    >
                      {lastAnswerCorrect ? '🎉' : '🤞'}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">
                      {lastAnswerCorrect ? 'Super!' : 'Antwort abgegeben!'}
                    </h3>
                    <p className="text-white/60">Warte auf die Auflösung...</p>
                    {lastAnswerCorrect && lastPointsEarned > 0 && (
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-[var(--secondary)] mt-4"
                      >
                        +{lastPointsEarned} Punkte!
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Results Phase - Controlled by Host */}
            {phase === 'results' && currentQuestion && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-7xl mb-6"
                >
                  {lastAnswerCorrect ? '✅' : '❌'}
                </motion.div>

                <h2 className={`text-3xl font-bold mb-4 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {lastAnswerCorrect ? 'Richtig!' : 'Falsch!'}
                </h2>

                {lastAnswerCorrect && lastPointsEarned > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card inline-block px-6 py-3 mb-6"
                  >
                    <p className="text-white/60 text-sm">Du erhältst</p>
                    <p className="text-3xl font-bold text-[var(--secondary)]">
                      +{lastPointsEarned.toLocaleString()}
                    </p>
                    <p className="text-white/60 text-sm">Punkte</p>
                  </motion.div>
                )}

                {currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="text-left mb-4">
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <span>💡</span> Erklärung
                      </h3>
                      <p className="text-white/90">{currentQuestion.explanation}</p>
                    </Card>
                  </motion.div>
                )}

                {currentQuestion.funFact && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="text-left bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20">
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <span>🎯</span> Fun Fact
                      </h3>
                      <p className="text-white/90">{currentQuestion.funFact}</p>
                    </Card>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 text-sm mt-6"
                >
                  Warte auf den Host...
                </motion.p>
              </motion.div>
            )}

            {/* Leaderboard Phase - Controlled by Host */}
            {phase === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold mb-6">🏆 Rangliste</h2>

                <Card className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{currentPlayer.avatar}</span>
                      <div className="text-left">
                        <p className="font-bold">{currentPlayer.nickname}</p>
                        <p className="text-sm text-white/60">Deine Position</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[var(--primary)]">
                        {currentPlayer.score.toLocaleString()}
                      </p>
                      <p className="text-sm text-white/60">Punkte</p>
                    </div>
                  </div>
                </Card>

                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-white/50 text-sm"
                >
                  Schau auf den Bildschirm des Hosts...
                </motion.p>
              </motion.div>
            )}

            {/* Finished Phase */}
            {phase === 'finished' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl mb-6"
                >
                  🏆
                </motion.div>

                <h2 className="text-3xl font-bold mb-2">Quiz beendet!</h2>
                <p className="text-white/70 mb-6">Dein Endergebnis:</p>

                <Card className="inline-block px-8 py-6 mb-8">
                  <p className="text-5xl font-black text-[var(--primary)]">
                    {currentPlayer.score.toLocaleString()}
                  </p>
                  <p className="text-white/60 mt-2">Punkte</p>
                </Card>

                <div>
                  <Link href="/play">
                    <Button variant="secondary" size="lg">
                      🎮 Neues Spiel
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
