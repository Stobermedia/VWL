'use client';

import { motion } from 'framer-motion';
import { ChartData } from '@/types';

interface ResultChartProps {
  data: ChartData[];
  type?: 'bar' | 'pie' | 'horizontal';
  title?: string;
  unit?: string;
}

export function ResultChart({ data, type = 'bar', title, unit }: ResultChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  if (type === 'pie') {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let cumulativePercent = 0;

    return (
      <div className="flex flex-col items-center">
        {title && <h4 className="text-sm font-medium text-white/60 mb-4">{title}</h4>}

        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const percent = (item.value / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = -cumulativePercent;
              cumulativePercent += percent;

              return (
                <motion.circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color || '#00B4A6'}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  pathLength="100"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || '#00B4A6' }}
              />
              <span className="text-sm text-white/80">
                {item.label}: {item.value}{unit ? ` ${unit}` : '%'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'horizontal') {
    return (
      <div className="space-y-3">
        {title && <h4 className="text-sm font-medium text-white/60 mb-4">{title}</h4>}

        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/80">{item.label}</span>
              <span className="font-medium text-white">
                {item.value}{unit ? ` ${unit}` : ''}
              </span>
            </div>
            <div className="h-6 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color || '#00B4A6' }}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Default: vertical bar chart
  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium text-white/60 text-center mb-4">{title}</h4>}

      <div className="flex items-end justify-center gap-3 h-40">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;

          return (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Value label */}
              <span className="text-sm font-medium text-white">
                {item.value}{unit ? ` ${unit}` : ''}
              </span>

              {/* Bar */}
              <motion.div
                className="w-12 sm:w-16 rounded-t-lg"
                style={{ backgroundColor: item.color || '#00B4A6' }}
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
              />

              {/* Label */}
              <span className="text-xs text-white/60 text-center max-w-[60px] truncate">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
