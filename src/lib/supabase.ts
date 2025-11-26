import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface DbQuiz {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbQuestion {
  id: string;
  quiz_id: string;
  type: 'multiple_choice' | 'true_false' | 'estimate' | 'order';
  question_text: string;
  explanation: string | null;
  time_limit: number;
  points: number;
  sort_order: number;
  created_at: string;
}

export interface DbAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  color: 'red' | 'blue' | 'yellow' | 'green' | null;
  sort_order: number;
  created_at: string;
}

export interface DbGameSession {
  id: string;
  quiz_id: string;
  code: string;
  status: 'waiting' | 'playing' | 'showing_answer' | 'showing_leaderboard' | 'finished';
  current_question_index: number;
  host_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface DbPlayer {
  id: string;
  session_id: string;
  nickname: string;
  avatar: string | null;
  score: number;
  is_connected: boolean;
  joined_at: string;
}

export interface DbPlayerAnswer {
  id: string;
  player_id: string;
  question_id: string;
  answer_id: string | null;
  time_taken: number | null;
  points_earned: number;
  is_correct: boolean;
  answered_at: string;
}

// Helper functions
export async function getQuizWithQuestions(quizId: string) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (quizError) throw quizError;

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order');

  if (questionsError) throw questionsError;

  const questionsWithAnswers = await Promise.all(
    questions.map(async (question) => {
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', question.id)
        .order('sort_order');

      if (answersError) throw answersError;

      return {
        ...question,
        answers,
      };
    })
  );

  return {
    ...quiz,
    questions: questionsWithAnswers,
  };
}

export async function getDefaultQuiz() {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('id')
    .eq('is_default', true)
    .single();

  if (error) throw error;

  return getQuizWithQuestions(quiz.id);
}

export async function createGameSession(quizId: string, code: string, hostId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      quiz_id: quizId,
      code,
      host_id: hostId,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGameSession(code: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('code', code)
    .single();

  if (error) throw error;
  return data;
}

export async function updateGameSession(sessionId: string, updates: Partial<DbGameSession>) {
  const { data, error } = await supabase
    .from('game_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinGame(sessionId: string, nickname: string, avatar: string) {
  const { data, error } = await supabase
    .from('players')
    .insert({
      session_id: sessionId,
      nickname,
      avatar,
      score: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionPlayers(sessionId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updatePlayerScore(playerId: string, score: number) {
  const { data, error } = await supabase
    .from('players')
    .update({ score })
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitAnswer(
  playerId: string,
  questionId: string,
  answerId: string,
  timeTaken: number,
  pointsEarned: number,
  isCorrect: boolean
) {
  const { data, error } = await supabase
    .from('player_answers')
    .insert({
      player_id: playerId,
      question_id: questionId,
      answer_id: answerId,
      time_taken: timeTaken,
      points_earned: pointsEarned,
      is_correct: isCorrect,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Realtime subscriptions
export function subscribeToPlayers(sessionId: string, callback: (players: DbPlayer[]) => void) {
  return supabase
    .channel(`players:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      },
      async () => {
        const players = await getSessionPlayers(sessionId);
        callback(players);
      }
    )
    .subscribe();
}

export function subscribeToGameSession(code: string, callback: (session: DbGameSession) => void) {
  return supabase
    .channel(`session:${code}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `code=eq.${code}`,
      },
      (payload) => {
        callback(payload.new as DbGameSession);
      }
    )
    .subscribe();
}
