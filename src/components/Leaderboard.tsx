'use client';

import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string;
  showTopOnly?: number;
}

export function Leaderboard({ entries, highlightPlayerId, showTopOnly }: LeaderboardProps) {
  const displayEntries = showTopOnly ? entries.slice(0, showTopOnly) : entries;

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-3">
        {displayEntries.map((entry, index) => {
          const isHighlighted = entry.playerId === highlightPlayerId;
          const medal = getMedalEmoji(entry.rank);

          return (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`
                flex items-center gap-4 p-4 rounded-xl
                ${isHighlighted
                  ? 'bg-[var(--primary)]/30 border-2 border-[var(--primary)]'
                  : 'bg-white/10'
                }
                ${entry.rank <= 3 ? 'transform scale-100' : ''}
              `}
            >
              {/* Rank */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
                ${entry.rank === 1 ? 'bg-yellow-500 text-yellow-900' : ''}
                ${entry.rank === 2 ? 'bg-gray-300 text-gray-700' : ''}
                ${entry.rank === 3 ? 'bg-amber-600 text-amber-100' : ''}
                ${entry.rank > 3 ? 'bg-white/20 text-white' : ''}
              `}>
                {medal || entry.rank}
              </div>

              {/* Name */}
              <div className="flex-1">
                <p className={`font-bold text-lg ${isHighlighted ? 'text-[var(--primary)]' : 'text-white'}`}>
                  {entry.nickname}
                </p>
                {entry.previousRank && entry.previousRank !== entry.rank && (
                  <p className={`text-sm ${entry.previousRank > entry.rank ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.previousRank > entry.rank ? '↑' : '↓'}
                    {Math.abs(entry.previousRank - entry.rank)} Plätze
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="font-bold text-2xl text-white">{entry.score.toLocaleString()}</p>
                <p className="text-sm text-white/60">Punkte</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
