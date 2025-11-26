'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Logo, Button, Card, Timer, Leaderboard, Confetti, VotingChart, ResultChart } from '@/components';
import { useGameStore } from '@/store/gameStore';
import {
  useGameChannel,
  saveSession,
  getSession as getStoredSession,
  GameMessage,
  GamePhase,
  GameState
} from '@/lib/gameSync';
import { PlayerAnswer } from '@/types';
import Link from 'next/link';

export default function HostGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { session, setSession, getLeaderboard } = useGameStore();
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const broadcastRef = useRef<((message: Omit<GameMessage, 'timestamp'>) => void) | null>(null);

  const currentQuestion = session?.quiz?.questions[session.currentQuestionIndex];

  // Broadcast phase change to all players
  const broadcastPhaseChange = useCallback((newPhase: GamePhase, questionIdx?: number) => {
    if (broadcastRef.current) {
      const gameState: GameState = {
        phase: newPhase,
        questionIndex: questionIdx ?? session?.currentQuestionIndex ?? 0,
        countdown: newPhase === 'countdown' ? 3 : undefined,
      };
      broadcastRef.current({
        type: 'phase_change',
        code,
        gameState,
        payload: session,
      });
    }
  }, [code, session]);

  // Handle incoming messages from players
  const handleMessage = useCallback((message: GameMessage) => {
    if (message.type === 'player_answered' && message.code === code) {
      const answer = message.payload as PlayerAnswer;
      setPlayerAnswers(prev => {
        if (prev.find(p => p.playerId === answer.playerId)) return prev;
        return [...prev, answer];
      });
      setAnsweredCount(prev => prev + 1);
    }
    if (message.type === 'sync_request' && message.code === code) {
      // Send current game state to player
      const currentSession = getStoredSession(code);
      if (currentSession && broadcastRef.current) {
        const gameState: GameState = {
          phase,
          questionIndex: currentSession.currentQuestionIndex,
          countdown: phase === 'countdown' ? countdown : undefined,
        };
        broadcastRef.current({
          type: 'sync_response',
          code,
          payload: currentSession,
          gameState,
        });
      }
    }
  }, [code, phase, countdown]);

  const { broadcast } = useGameChannel(code, handleMessage);

  // Store broadcast function in ref
  useEffect(() => {
    broadcastRef.current = broadcast;
  }, [broadcast]);

  // Handle countdown
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('question');
      broadcastPhaseChange('question');
      setPlayerAnswers([]);
      setAnsweredCount(0);
    }
  }, [phase, countdown, broadcastPhaseChange]);

  // Load session on mount
  useEffect(() => {
    if (!session || session.code !== code) {
      const storedSession = getStoredSession(code);
      if (storedSession) {
        setSession(storedSession);
      } else {
        router.push('/host');
      }
    }
  }, [session, code, router, setSession]);

  // Simulate player answers for demo
  useEffect(() => {
    if (phase === 'question' && session?.players && currentQuestion) {
      session.players.forEach((player, index) => {
        setTimeout(() => {
          const randomAnswerIndex = Math.floor(Math.random() * currentQuestion.answers.length);
          const selectedAnswer = currentQuestion.answers[randomAnswerIndex];
          const answer: PlayerAnswer = {
            playerId: player.id,
            playerAvatar: player.avatar,
            playerNickname: player.nickname,
            questionId: currentQuestion.id,
            answerId: selectedAnswer.id,
            timeTaken: Math.random() * currentQuestion.timeLimit,
            pointsEarned: selectedAnswer.isCorrect ? Math.floor(Math.random() * 500) + 500 : 0,
            isCorrect: selectedAnswer.isCorrect,
          };
          setPlayerAnswers(prev => [...prev, answer]);
          setAnsweredCount(prev => prev + 1);
        }, (index + 1) * 800 + Math.random() * 1000);
      });
    }
  }, [phase, session?.players, currentQuestion]);

  const handleTimeUp = useCallback(() => {
    setPhase('results');
    broadcastPhaseChange('results');
  }, [broadcastPhaseChange]);

  const showLeaderboard = () => {
    setPhase('leaderboard');
    broadcastPhaseChange('leaderboard');
  };

  const nextQuestion = () => {
    if (!session || !session.quiz) return;

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= session.quiz.questions.length) {
      setPhase('finished');
      setShowConfetti(true);
      broadcastPhaseChange('finished');
    } else {
      const updatedSession = {
        ...session,
        currentQuestionIndex: nextIndex,
      };
      setSession(updatedSession);
      saveSession(updatedSession);

      setPlayerAnswers([]);
      setAnsweredCount(0);
      setCountdown(3);
      setPhase('countdown');
      broadcastPhaseChange('countdown', nextIndex);
    }
  };

  const finishGame = () => {
    router.push(`/results/${code}`);
  };

  if (!session || !currentQuestion) {
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
    <main className="min-h-screen py-6 overflow-hidden">
      <Confetti active={showConfetti} />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/host">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="glass-card px-4 py-2 text-sm">
              <span className="text-white/60">Code:</span>{' '}
              <span className="font-bold text-[var(--primary)]">{code}</span>
            </span>
            <span className="glass-card px-4 py-2 text-sm">
              <span className="text-white/60">Frage</span>{' '}
              <span className="font-bold">{session.currentQuestionIndex + 1}</span>
              <span className="text-white/60">/{session.quiz?.questions.length}</span>
            </span>
            {currentQuestion.category && (
              <span className="glass-card px-4 py-2 text-sm bg-[var(--primary)]/20">
                {currentQuestion.category}
              </span>
            )}
            <span className="glass-card px-4 py-2 text-sm">
              <span className="text-white/60">Spieler:</span>{' '}
              <span className="font-bold text-[var(--secondary)]">{session.players.length}</span>
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Countdown Phase */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center min-h-[75vh]"
            >
              {/* Question preview */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center max-w-4xl"
              >
                {currentQuestion.image && (
                  <motion.span
                    className="text-8xl mb-6 block"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentQuestion.image}
                  </motion.span>
                )}
                <h2 className="text-3xl md:text-4xl font-bold text-white/90 leading-relaxed">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.difficulty && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentQuestion.difficulty === 'easy' ? '🟢 Leicht' :
                       currentQuestion.difficulty === 'medium' ? '🟡 Mittel' : '🔴 Schwer'}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                key={countdown}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-[12rem] font-black text-[var(--primary)] leading-none"
              >
                {countdown || '🚀'}
              </motion.div>

              <motion.p
                className="text-2xl text-white/60 mt-8"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Macht euch bereit!
              </motion.p>
            </motion.div>
          )}

          {/* Question Phase */}
          {phase === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Timer - Large and prominent */}
              <div className="flex justify-center mb-8">
                <Timer
                  duration={currentQuestion.timeLimit}
                  onComplete={handleTimeUp}
                  size="lg"
                />
              </div>

              {/* Question Card */}
              <Card className="text-center mb-8 py-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {currentQuestion.image && (
                    <span className="text-6xl">{currentQuestion.image}</span>
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  {currentQuestion.text}
                </h2>
              </Card>

              {/* Answer Options with Live Voting */}
              <div className="max-w-5xl mx-auto mb-8">
                <VotingChart
                  answers={currentQuestion.answers}
                  playerAnswers={playerAnswers}
                  showResults={false}
                />
              </div>

              {/* Answer Progress */}
              <motion.div
                className="text-center"
                animate={{ scale: answeredCount > 0 ? [1, 1.02, 1] : 1 }}
                key={answeredCount}
              >
                <div className="inline-flex items-center gap-4 glass-card px-8 py-4">
                  <div className="flex -space-x-2">
                    {playerAnswers.slice(0, 10).map((pa, i) => (
                      <motion.div
                        key={pa.playerId}
                        initial={{ scale: 0, x: -20 }}
                        animate={{ scale: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 500, delay: i * 0.05 }}
                        className="w-10 h-10 rounded-full bg-[var(--primary)]/30 flex items-center justify-center text-xl border-2 border-[var(--bg-dark)]"
                      >
                        {pa.playerAvatar || '👤'}
                      </motion.div>
                    ))}
                    {playerAnswers.length > 10 && (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        +{playerAnswers.length - 10}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold">
                      <span className="text-[var(--primary)]">{answeredCount}</span>
                      <span className="text-white/40">/{session.players.length}</span>
                    </p>
                    <p className="text-white/60 text-sm">haben geantwortet</p>
                  </div>
                </div>

                {/* Skip button if all answered */}
                {answeredCount === session.players.length && session.players.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <Button onClick={handleTimeUp} variant="primary" size="lg">
                      Alle haben geantwortet - Weiter!
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Results Phase */}
          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {/* Question Recap */}
              <Card className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-2">
                  {currentQuestion.image && (
                    <span className="text-5xl">{currentQuestion.image}</span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {currentQuestion.text}
                  </h2>
                </div>
              </Card>

              {/* Voting Results with Emojis */}
              <div className="mb-8">
                <VotingChart
                  answers={currentQuestion.answers}
                  playerAnswers={playerAnswers}
                  showResults={true}
                />
              </div>

              {/* Explanation and Fun Fact - Side by Side */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="h-full">
                      <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                        <span className="text-2xl">💡</span> Erklärung
                      </h3>
                      <p className="text-white/80 text-lg leading-relaxed">{currentQuestion.explanation}</p>
                    </Card>
                  </motion.div>
                )}

                {currentQuestion.funFact && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="h-full bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--primary)]/20 border-[var(--secondary)]/30">
                      <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                        <span className="text-2xl">🎯</span> Wusstest du?
                      </h3>
                      <p className="text-white/80 text-lg leading-relaxed">{currentQuestion.funFact}</p>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Chart Visualization */}
              {currentQuestion.chartData && currentQuestion.chartData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8"
                >
                  <Card>
                    <h3 className="font-bold text-lg mb-4 text-center text-white/70">📊 Statistik</h3>
                    <ResultChart
                      data={currentQuestion.chartData}
                      type={currentQuestion.chartData.length <= 3 ? 'pie' : 'bar'}
                    />
                  </Card>
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <Button size="lg" onClick={showLeaderboard} className="px-12">
                  🏆 Rangliste zeigen
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Leaderboard Phase */}
          {phase === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-bold text-center mb-10"
              >
                🏆 Rangliste
              </motion.h2>

              <Leaderboard
                entries={getLeaderboard()}
                showTopOnly={10}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-10"
              >
                <Button size="lg" onClick={nextQuestion} className="px-12">
                  {session.currentQuestionIndex + 1 < (session.quiz?.questions.length || 0)
                    ? '➡️ Nächste Frage'
                    : '🏁 Ergebnisse zeigen'
                  }
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Finished Phase */}
          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ y: -50, rotate: -10 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-9xl mb-8"
              >
                🎉
              </motion.div>
              <h2 className="text-5xl font-bold mb-4">Quiz beendet!</h2>
              <p className="text-xl text-white/70 mb-10">
                Vielen Dank fürs Mitspielen!
              </p>

              <Leaderboard
                entries={getLeaderboard()}
                showTopOnly={3}
              />

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={finishGame}>
                  📊 Alle Ergebnisse
                </Button>
                <Button size="lg" variant="secondary" onClick={() => router.push('/host')}>
                  🔄 Neues Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
