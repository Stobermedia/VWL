'use client';

import { motion } from 'framer-motion';
import { Answer, PlayerAnswer } from '@/types';

interface VotingChartProps {
  answers: Answer[];
  playerAnswers: PlayerAnswer[];
  showResults?: boolean;
}

export function VotingChart({ answers, playerAnswers, showResults = false }: VotingChartProps) {
  const answerColors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  const answerBgColors = {
    red: 'bg-red-500/20',
    blue: 'bg-blue-500/20',
    yellow: 'bg-yellow-500/20',
    green: 'bg-green-500/20',
  };

  // Group player answers by answer ID
  const answerGroups = answers.map((answer) => {
    const players = playerAnswers.filter((pa) => pa.answerId === answer.id);
    return {
      answer,
      players,
      count: players.length,
    };
  });

  const totalAnswers = playerAnswers.length;
  const maxCount = Math.max(...answerGroups.map((g) => g.count), 1);

  return (
    <div className="space-y-4">
      {answerGroups.map((group, index) => {
        const percentage = totalAnswers > 0 ? (group.count / totalAnswers) * 100 : 0;
        const barWidth = maxCount > 0 ? (group.count / maxCount) * 100 : 0;

        return (
          <motion.div
            key={group.answer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-xl overflow-hidden ${answerBgColors[group.answer.color]} p-4`}
          >
            {/* Answer bar background */}
            <motion.div
              className={`absolute inset-0 ${answerColors[group.answer.color]} opacity-30`}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Answer indicator */}
                <div
                  className={`w-10 h-10 rounded-lg ${answerColors[group.answer.color]} flex items-center justify-center font-bold text-white`}
                >
                  {['A', 'B', 'C', 'D'][index]}
                </div>

                {/* Answer text */}
                <div>
                  <p className="font-medium text-white">{group.answer.text}</p>
                  {showResults && (
                    <p className={`text-sm ${group.answer.isCorrect ? 'text-green-400' : 'text-white/60'}`}>
                      {group.answer.isCorrect ? '✓ Richtig' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats and emojis */}
              <div className="flex items-center gap-4">
                {/* Player emojis */}
                <div className="flex -space-x-2">
                  {group.players.slice(0, 8).map((player, i) => (
                    <motion.div
                      key={player.playerId}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-lg
                        ${showResults
                          ? player.isCorrect
                            ? 'bg-green-500/30 ring-2 ring-green-500'
                            : 'bg-red-500/30 ring-2 ring-red-500'
                          : 'bg-white/20'
                        }`}
                      title={player.playerNickname}
                    >
                      {player.playerAvatar || '👤'}
                    </motion.div>
                  ))}
                  {group.players.length > 8 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold"
                    >
                      +{group.players.length - 8}
                    </motion.div>
                  )}
                </div>

                {/* Count and percentage */}
                <div className="text-right min-w-[60px]">
                  <p className="text-2xl font-bold text-white">{group.count}</p>
                  <p className="text-xs text-white/60">{percentage.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Summary */}
      {showResults && totalAnswers > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex justify-center gap-8"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">✅</span>
              <span className="text-3xl font-bold text-green-400">
                {playerAnswers.filter((p) => p.isCorrect).length}
              </span>
            </div>
            <p className="text-white/60 text-sm">Richtig</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">❌</span>
              <span className="text-3xl font-bold text-red-400">
                {playerAnswers.filter((p) => !p.isCorrect).length}
              </span>
            </div>
            <p className="text-white/60 text-sm">Falsch</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
