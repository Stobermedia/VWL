export type QuestionType = 'multiple_choice' | 'true_false' | 'estimate' | 'order' | 'slider';

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  color: 'red' | 'blue' | 'yellow' | 'green';
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  answers: Answer[];
  timeLimit: number; // in seconds
  points: number;
  explanation?: string;
  order: number;
  // Enhanced interactive content
  image?: string; // URL or emoji
  chartData?: ChartData[]; // For showing charts in explanation
  funFact?: string; // Extra interesting fact
  category?: string; // Question category
  difficulty?: 'easy' | 'medium' | 'hard';
  // For estimate questions
  correctValue?: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  createdBy?: string;
}

export interface Player {
  id: string;
  nickname: string;
  avatar?: string;
  score: number;
  currentAnswer?: string;
  answerTime?: number;
}

export interface GameSession {
  id: string;
  code: string;
  quizId: string;
  quiz?: Quiz;
  status: 'waiting' | 'playing' | 'showing_answer' | 'showing_leaderboard' | 'finished';
  currentQuestionIndex: number;
  players: Player[];
  hostId: string;
  startedAt?: Date;
}

export interface PlayerAnswer {
  playerId: string;
  playerAvatar?: string;
  playerNickname?: string;
  questionId: string;
  answerId: string;
  timeTaken: number;
  pointsEarned: number;
  isCorrect: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  previousRank?: number;
}
