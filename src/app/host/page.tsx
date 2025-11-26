'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Logo, Button, Card } from '@/components';
import { defaultQuiz, generateGameCode } from '@/lib/questions';
import { useGameStore } from '@/store/gameStore';
import { v4 as uuidv4 } from 'uuid';

export default function HostPage() {
  const router = useRouter();
  const { setSession, setCurrentQuiz } = useGameStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartQuiz = async (quizId: string) => {
    setIsLoading(true);

    const gameCode = generateGameCode();
    const sessionId = uuidv4();
    const hostId = uuidv4();

    // Set up the game session
    setCurrentQuiz(defaultQuiz);
    setSession({
      id: sessionId,
      code: gameCode,
      quizId: quizId,
      quiz: defaultQuiz,
      status: 'waiting',
      currentQuestionIndex: 0,
      players: [],
      hostId: hostId,
    });

    // Navigate to lobby
    router.push(`/host/lobby/${gameCode}`);
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Logo size="md" />
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Quiz starten</h1>
          <p className="text-white/70 text-lg">
            Starte das Pflegeversicherung-Quiz für deine Gruppe
          </p>
        </motion.div>

        {/* Quiz Card - Centered */}
        <div className="flex justify-center">
          <Card delay={0.1} className="max-w-md w-full">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-5xl">🏥</span>
                  <div>
                    <h3 className="text-2xl font-bold">{defaultQuiz.title}</h3>
                    <p className="text-sm text-white/60">
                      {defaultQuiz.questions.length} Fragen
                    </p>
                  </div>
                </div>
                <p className="text-white/70 mb-6">{defaultQuiz.description}</p>

                {/* Question types preview */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    Multiple Choice
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    Wahr/Falsch
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    Schätzfragen
                  </span>
                </div>

                {/* Difficulty badges */}
                <div className="glass-card p-4 mb-6">
                  <p className="text-sm text-white/60 mb-2">Schwierigkeit:</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">5 Leicht</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">6 Mittel</span>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">4 Schwer</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => handleStartQuiz(defaultQuiz.id)}
                loading={isLoading}
              >
                🚀 Quiz starten
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
