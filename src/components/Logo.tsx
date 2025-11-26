'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

export function Logo({ size = 'md', animate = true }: LogoProps) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const Container = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }
    : {};

  return (
    <Container {...animationProps} className="flex items-center gap-3">
      {/* Heart with Plus Icon */}
      <div className={`${iconSizes[size]} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Heart shape */}
          <path
            d="M50 88 C20 60, 5 40, 15 25 C25 10, 45 15, 50 30 C55 15, 75 10, 85 25 C95 40, 80 60, 50 88"
            fill="var(--primary)"
            className="drop-shadow-lg"
          />
          {/* Plus sign */}
          <rect x="42" y="35" width="16" height="4" fill="white" rx="2" />
          <rect x="48" y="29" width="4" height="16" fill="white" rx="2" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span className={`${sizes[size]} font-black tracking-tight`}>
          <span className="text-white">Pflege</span>
          <span className="text-[var(--primary)]">versicherung</span>
        </span>
      </div>
    </Container>
  );
}
