'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export function Card({ children, className = '', animate = true, delay = 0 }: CardProps) {
  if (!animate) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
