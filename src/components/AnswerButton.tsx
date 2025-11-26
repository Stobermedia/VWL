'use client';

import { motion } from 'framer-motion';
import { Answer } from '@/types';

interface AnswerButtonProps {
  answer: Answer;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
}

const icons: Record<string, React.ReactNode> = {
  red: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 22h20L12 2z" />
    </svg>
  ),
  blue: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
    </svg>
  ),
  yellow: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  green: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  ),
};

export function AnswerButton({
  answer,
  index,
  onClick,
  disabled = false,
  selected = false,
  showResult = false,
  isCorrect = false,
}: AnswerButtonProps) {
  const colorClasses: Record<string, string> = {
    red: 'answer-red',
    blue: 'answer-blue',
    yellow: 'answer-yellow',
    green: 'answer-green',
  };

  const getStateStyles = () => {
    if (showResult) {
      if (answer.isCorrect) {
        return 'ring-4 ring-green-400 ring-offset-2 ring-offset-transparent brightness-110';
      }
      if (selected && !answer.isCorrect) {
        return 'opacity-50 ring-4 ring-red-500';
      }
      return 'opacity-40';
    }
    if (selected) {
      return 'ring-4 ring-white ring-offset-2 ring-offset-transparent scale-105';
    }
    return '';
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[answer.color]}
        ${getStateStyles()}
        w-full p-4 md:p-6 rounded-xl
        flex items-center gap-4
        text-white font-bold text-lg md:text-xl
        transition-all duration-200
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        min-h-[80px]
      `}
    >
      <span className="flex-shrink-0 opacity-80">
        {icons[answer.color]}
      </span>
      <span className="flex-1 text-left">{answer.text}</span>
      {showResult && answer.isCorrect && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-3xl"
        >
          ✓
        </motion.span>
      )}
      {showResult && selected && !answer.isCorrect && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-3xl"
        >
          ✗
        </motion.span>
      )}
    </motion.button>
  );
}
