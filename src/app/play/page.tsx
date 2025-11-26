'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Logo, Button, Card } from '@/components';

export default function PlayPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleanValue.length <= 1) {
      const newCode = [...code];
      newCode[index] = cleanValue;
      setCode(newCode);
      setError('');

      // Auto-focus next input
      if (cleanValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chars = pastedData.slice(0, 6).split('');
    const newCode = [...code];
    chars.forEach((char, index) => {
      if (index < 6) {
        newCode[index] = char;
      }
    });
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleJoin = async () => {
    const gameCode = code.join('');

    if (gameCode.length !== 6) {
      setError('Bitte gib einen 6-stelligen Code ein');
      return;
    }

    setIsLoading(true);

    // Navigate to nickname page with the code
    router.push(`/play/${gameCode}`);
  };

  const isCodeComplete = code.every(c => c !== '');

  return (
    <main className="min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="container mx-auto px-4 py-6 flex justify-center">
        <Logo size="md" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Spiel beitreten
            </h1>
            <p className="text-white/70">
              Gib den Code ein, den du vom Host bekommen hast
            </p>
          </motion.div>

          <Card>
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-3 text-center">
                Spielcode
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      w-12 h-14 md:w-14 md:h-16
                      text-center text-2xl md:text-3xl font-bold
                      bg-white/10 border-2 rounded-xl
                      text-white uppercase
                      focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/50
                      transition-all duration-200
                      ${error ? 'border-red-500' : 'border-white/20'}
                      ${digit ? 'border-[var(--primary)]/50' : ''}
                    `}
                  />
                ))}
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center mt-3"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Join Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleJoin}
              loading={isLoading}
              disabled={!isCodeComplete}
            >
              Beitreten
            </Button>
          </Card>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/50 text-sm mt-6"
          >
            Der Code wird auf dem Bildschirm des Hosts angezeigt
          </motion.p>
        </div>
      </div>
    </main>
  );
}
