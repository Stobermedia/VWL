'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number;
  onComplete?: () => void;
  isPaused?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Timer({ duration, onComplete, isPaused = false, size = 'md' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onComplete]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 5;

  const sizes = {
    sm: { circle: 60, stroke: 4, text: 'text-lg' },
    md: { circle: 100, stroke: 6, text: 'text-3xl' },
    lg: { circle: 150, stroke: 8, text: 'text-5xl' },
  };

  const { circle, stroke, text } = sizes[size];
  const radius = (circle - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={circle}
        height={circle}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={circle / 2}
          cy={circle / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={circle / 2}
          cy={circle / 2}
          r={radius}
          stroke={isLow ? '#E21B3C' : 'var(--primary)'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <motion.span
        className={`absolute ${text} font-bold ${isLow ? 'text-red-500' : 'text-white'}`}
        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isLow ? Infinity : 0 }}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}

interface TimerBarProps {
  duration: number;
  onComplete?: () => void;
  isPaused?: boolean;
}

export function TimerBar({ duration, onComplete, isPaused = false }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onComplete]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 5;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-white/60">Zeit</span>
        <span className={`text-sm font-bold ${isLow ? 'text-red-500 animate-countdown' : 'text-white'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-[var(--primary)]'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
