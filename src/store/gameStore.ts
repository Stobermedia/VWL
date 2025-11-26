import { create } from 'zustand';
import { GameSession, Player, Quiz, LeaderboardEntry, PlayerAnswer } from '@/types';

interface GameStore {
  // Game state
  session: GameSession | null;
  currentQuiz: Quiz | null;
  timeRemaining: number;
  playerAnswers: Map<string, PlayerAnswer>;

  // Player state (for players joining)
  currentPlayer: Player | null;
  hasAnswered: boolean;
  lastAnswerCorrect: boolean | null;
  lastPointsEarned: number;

  // Actions
  setSession: (session: GameSession | null) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setTimeRemaining: (time: number) => void;
  setCurrentPlayer: (player: Player | null) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  setHasAnswered: (hasAnswered: boolean) => void;
  setLastAnswerResult: (correct: boolean, points: number) => void;
  recordAnswer: (answer: PlayerAnswer) => void;
  nextQuestion: () => void;
  getLeaderboard: () => LeaderboardEntry[];
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  currentQuiz: null,
  timeRemaining: 0,
  playerAnswers: new Map(),
  currentPlayer: null,
  hasAnswered: false,
  lastAnswerCorrect: null,
  lastPointsEarned: 0,

  setSession: (session) => set({ session }),

  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  addPlayer: (player) => set((state) => {
    if (!state.session) return state;
    return {
      session: {
        ...state.session,
        players: [...state.session.players, player],
      },
    };
  }),

  removePlayer: (playerId) => set((state) => {
    if (!state.session) return state;
    return {
      session: {
        ...state.session,
        players: state.session.players.filter((p) => p.id !== playerId),
      },
    };
  }),

  updatePlayerScore: (playerId, score) => set((state) => {
    if (!state.session) return state;
    return {
      session: {
        ...state.session,
        players: state.session.players.map((p) =>
          p.id === playerId ? { ...p, score } : p
        ),
      },
      currentPlayer: state.currentPlayer?.id === playerId
        ? { ...state.currentPlayer, score }
        : state.currentPlayer,
    };
  }),

  setHasAnswered: (hasAnswered) => set({ hasAnswered }),

  setLastAnswerResult: (correct, points) => set({
    lastAnswerCorrect: correct,
    lastPointsEarned: points
  }),

  recordAnswer: (answer) => set((state) => {
    const newAnswers = new Map(state.playerAnswers);
    newAnswers.set(`${answer.playerId}-${answer.questionId}`, answer);
    return { playerAnswers: newAnswers };
  }),

  nextQuestion: () => set((state) => {
    if (!state.session) return state;
    return {
      session: {
        ...state.session,
        currentQuestionIndex: state.session.currentQuestionIndex + 1,
      },
      hasAnswered: false,
      lastAnswerCorrect: null,
      lastPointsEarned: 0,
    };
  }),

  getLeaderboard: () => {
    const state = get();
    if (!state.session) return [];

    const sorted = [...state.session.players].sort((a, b) => b.score - a.score);
    return sorted.map((player, index) => ({
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      rank: index + 1,
    }));
  },

  reset: () => set({
    session: null,
    currentQuiz: null,
    timeRemaining: 0,
    playerAnswers: new Map(),
    currentPlayer: null,
    hasAnswered: false,
    lastAnswerCorrect: null,
    lastPointsEarned: 0,
  }),
}));
