'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Logo, Button, Card, Leaderboard, Confetti } from '@/components';
import { useGameStore } from '@/store/gameStore';
import Link from 'next/link';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { session, getLeaderboard, currentPlayer, reset } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(true);

  const leaderboard = getLeaderboard();
  const podium = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const exportResults = () => {
    if (!session || !leaderboard.length) return;

    const csvContent = [
      ['Platz', 'Nickname', 'Punkte'].join(','),
      ...leaderboard.map((entry) =>
        [entry.rank, entry.nickname, entry.score].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pflege-quiz-ergebnisse-${code}.csv`;
    link.click();
  };

  const handlePlayAgain = () => {
    reset();
    router.push('/host');
  };

  const handleBackHome = () => {
    reset();
    router.push('/host');
  };

  return (
    <main className="min-h-screen py-8 safe-area-inset-top safe-area-inset-bottom">
      <Confetti active={showConfetti} duration={5000} />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/host">
            <Logo size="sm" />
          </Link>
          <span className="glass-card px-4 py-2 text-sm">
            Quiz: <span className="font-bold text-[var(--primary)]">{code}</span>
          </span>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-6xl md:text-8xl mb-4"
          >
            🏆
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Endergebnis
          </h1>
          <p className="text-white/70 text-lg">
            {session?.quiz?.title || 'PflegeQuiz'}
          </p>
        </motion.div>

        {/* Podium - Top 3 */}
        {podium.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex justify-center items-end gap-4 md:gap-8">
              {/* 2nd Place */}
              {podium[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <Card className="text-center p-4 md:p-6 mb-2">
                    <span className="text-4xl md:text-5xl mb-2 block">🥈</span>
                    <p className="font-bold text-lg md:text-xl truncate max-w-[100px] md:max-w-[150px]">
                      {podium[1].nickname}
                    </p>
                    <p className="text-[var(--primary)] font-bold text-xl md:text-2xl">
                      {podium[1].score.toLocaleString()}
                    </p>
                  </Card>
                  <div className="w-20 md:w-28 h-16 md:h-20 bg-gray-400/30 rounded-t-lg" />
                </motion.div>
              )}

              {/* 1st Place */}
              {podium[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Card className="text-center p-4 md:p-6 mb-2 bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border-yellow-500/50">
                      <span className="text-5xl md:text-6xl mb-2 block">🥇</span>
                      <p className="font-bold text-xl md:text-2xl truncate max-w-[100px] md:max-w-[150px]">
                        {podium[0].nickname}
                      </p>
                      <p className="text-[var(--secondary)] font-bold text-2xl md:text-3xl">
                        {podium[0].score.toLocaleString()}
                      </p>
                    </Card>
                  </motion.div>
                  <div className="w-24 md:w-32 h-24 md:h-32 bg-yellow-500/30 rounded-t-lg" />
                </motion.div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <Card className="text-center p-4 md:p-6 mb-2">
                    <span className="text-4xl md:text-5xl mb-2 block">🥉</span>
                    <p className="font-bold text-lg md:text-xl truncate max-w-[100px] md:max-w-[150px]">
                      {podium[2].nickname}
                    </p>
                    <p className="text-[var(--primary)] font-bold text-xl md:text-2xl">
                      {podium[2].score.toLocaleString()}
                    </p>
                  </Card>
                  <div className="w-20 md:w-28 h-12 md:h-16 bg-amber-700/30 rounded-t-lg" />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        {restOfLeaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-white/70">
              Weitere Platzierungen
            </h2>
            <Leaderboard
              entries={restOfLeaderboard}
              highlightPlayerId={currentPlayer?.id}
            />
          </motion.div>
        )}

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Card>
            <h3 className="text-xl font-bold mb-6 text-center">Spielstatistik</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="glass-card p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">
                  {leaderboard.length}
                </p>
                <p className="text-white/60 text-sm">Spieler</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-3xl font-bold text-[var(--secondary)]">
                  {session?.quiz?.questions.length || 0}
                </p>
                <p className="text-white/60 text-sm">Fragen</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">
                  {leaderboard.length > 0
                    ? Math.round(
                        leaderboard.reduce((sum, e) => sum + e.score, 0) /
                          leaderboard.length
                      ).toLocaleString()
                    : 0}
                </p>
                <p className="text-white/60 text-sm">Ø Punkte</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-3xl font-bold text-[var(--secondary)]">
                  {podium[0]?.score.toLocaleString() || 0}
                </p>
                <p className="text-white/60 text-sm">Höchste Punktzahl</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={handlePlayAgain}
            className="flex-1"
          >
            🔄 Neues Spiel
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={exportResults}
            className="flex-1"
          >
            📥 Ergebnisse exportieren
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center mt-6"
        >
          <Button variant="ghost" onClick={handleBackHome}>
            ← Zurück zur Host-Auswahl
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
