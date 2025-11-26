'use client';

import { useEffect, useCallback, useRef } from 'react';
import { GameSession, Player } from '@/types';

// BroadcastChannel for same-browser communication (demo mode)
// For production, use Supabase Realtime

const CHANNEL_NAME = 'pflege-quiz-game';
const STORAGE_KEY = 'pflege-quiz-sessions';

export type GamePhase = 'waiting' | 'countdown' | 'question' | 'results' | 'leaderboard' | 'finished';

export interface GameState {
  phase: GamePhase;
  questionIndex: number;
  countdown?: number;
}

export interface GameMessage {
  type: 'player_joined' | 'player_left' | 'game_started' | 'game_updated' | 'sync_request' | 'sync_response' | 'phase_change' | 'player_answered';
  code: string;
  payload?: unknown;
  gameState?: GameState;
  timestamp: number;
}

// Get all sessions from localStorage
export function getSessions(): Record<string, GameSession> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Save session to localStorage
export function saveSession(session: GameSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  sessions[session.code] = session;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Get a specific session
export function getSession(code: string): GameSession | null {
  const sessions = getSessions();
  return sessions[code] || null;
}

// Delete a session
export function deleteSession(code: string): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  delete sessions[code];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Add player to session
export function addPlayerToSession(code: string, player: Player): GameSession | null {
  const session = getSession(code);
  if (!session) return null;

  // Check if player already exists
  if (session.players.some(p => p.id === player.id)) {
    return session;
  }

  session.players = [...session.players, player];
  saveSession(session);
  return session;
}

// Remove player from session
export function removePlayerFromSession(code: string, playerId: string): GameSession | null {
  const session = getSession(code);
  if (!session) return null;

  session.players = session.players.filter(p => p.id !== playerId);
  saveSession(session);
  return session;
}

// Update session
export function updateSession(code: string, updates: Partial<GameSession>): GameSession | null {
  const session = getSession(code);
  if (!session) return null;

  const updatedSession = { ...session, ...updates };
  saveSession(updatedSession);
  return updatedSession;
}

// BroadcastChannel hook for real-time updates
export function useGameChannel(
  code: string,
  onMessage: (message: GameMessage) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === 'undefined' || !code) return;

    // Create channel
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    // Listen for messages
    const handleMessage = (event: MessageEvent<GameMessage>) => {
      if (event.data.code === code) {
        onMessageRef.current(event.data);
      }
    };

    channelRef.current.addEventListener('message', handleMessage);

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage);
      channelRef.current?.close();
    };
  }, [code]);

  const broadcast = useCallback((message: Omit<GameMessage, 'timestamp'>) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        ...message,
        timestamp: Date.now(),
      });
    }
  }, []);

  return { broadcast };
}

// Hook for host to manage game session
export function useHostGame(code: string) {
  const handleMessage = useCallback((message: GameMessage) => {
    // Host responds to sync requests
    if (message.type === 'sync_request') {
      const session = getSession(code);
      if (session) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({
          type: 'sync_response',
          code,
          payload: session,
          timestamp: Date.now(),
        });
        channel.close();
      }
    }
  }, [code]);

  const { broadcast } = useGameChannel(code, handleMessage);

  const addPlayer = useCallback((player: Player) => {
    const session = addPlayerToSession(code, player);
    if (session) {
      broadcast({
        type: 'player_joined',
        code,
        payload: session,
      });
    }
    return session;
  }, [code, broadcast]);

  const removePlayer = useCallback((playerId: string) => {
    const session = removePlayerFromSession(code, playerId);
    if (session) {
      broadcast({
        type: 'player_left',
        code,
        payload: session,
      });
    }
    return session;
  }, [code, broadcast]);

  const startGame = useCallback(() => {
    const session = updateSession(code, {
      status: 'playing',
      startedAt: new Date()
    });
    if (session) {
      broadcast({
        type: 'game_started',
        code,
        payload: session,
      });
    }
    return session;
  }, [code, broadcast]);

  const updateGameState = useCallback((updates: Partial<GameSession>) => {
    const session = updateSession(code, updates);
    if (session) {
      broadcast({
        type: 'game_updated',
        code,
        payload: session,
      });
    }
    return session;
  }, [code, broadcast]);

  return {
    addPlayer,
    removePlayer,
    startGame,
    updateGameState,
    broadcast,
  };
}

// Hook for player to sync with game
export function usePlayerGame(
  code: string,
  onSessionUpdate: (session: GameSession) => void
) {
  const onSessionUpdateRef = useRef(onSessionUpdate);

  useEffect(() => {
    onSessionUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

  const handleMessage = useCallback((message: GameMessage) => {
    if (
      message.type === 'player_joined' ||
      message.type === 'player_left' ||
      message.type === 'game_started' ||
      message.type === 'game_updated' ||
      message.type === 'sync_response'
    ) {
      if (message.payload) {
        onSessionUpdateRef.current(message.payload as GameSession);
      }
    }
  }, []);

  const { broadcast } = useGameChannel(code, handleMessage);

  // Request sync on mount
  useEffect(() => {
    if (code) {
      broadcast({
        type: 'sync_request',
        code,
      });
    }
  }, [code, broadcast]);

  const requestSync = useCallback(() => {
    broadcast({
      type: 'sync_request',
      code,
    });
  }, [code, broadcast]);

  return { requestSync, broadcast };
}
