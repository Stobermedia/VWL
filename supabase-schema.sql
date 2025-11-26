-- PflegeQuiz Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'estimate', 'order')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    time_limit INTEGER DEFAULT 20,
    points INTEGER DEFAULT 1000,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    color VARCHAR(20) CHECK (color IN ('red', 'blue', 'yellow', 'green')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    code VARCHAR(6) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'showing_answer', 'showing_leaderboard', 'finished')),
    current_question_index INTEGER DEFAULT 0,
    host_id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    nickname VARCHAR(15) NOT NULL,
    avatar VARCHAR(10),
    score INTEGER DEFAULT 0,
    is_connected BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Answers table (for tracking individual responses)
CREATE TABLE player_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_id UUID REFERENCES answers(id),
    time_taken INTEGER, -- milliseconds
    points_earned INTEGER DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_game_sessions_code ON game_sessions(code);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_player_answers_player_id ON player_answers(player_id);
CREATE INDEX idx_player_answers_question_id ON player_answers(question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes (public read for all)
CREATE POLICY "Quizzes are viewable by everyone" ON quizzes
    FOR SELECT USING (true);

-- Policies for questions (public read for all)
CREATE POLICY "Questions are viewable by everyone" ON questions
    FOR SELECT USING (true);

-- Policies for answers (public read for all)
CREATE POLICY "Answers are viewable by everyone" ON answers
    FOR SELECT USING (true);

-- Policies for game sessions (public access for game functionality)
CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions" ON game_sessions
    FOR UPDATE USING (true);

-- Policies for players
CREATE POLICY "Players are viewable by everyone" ON players
    FOR SELECT USING (true);

CREATE POLICY "Anyone can join as a player" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their own data" ON players
    FOR UPDATE USING (true);

-- Policies for player answers
CREATE POLICY "Player answers are viewable by everyone" ON player_answers
    FOR SELECT USING (true);

CREATE POLICY "Anyone can submit answers" ON player_answers
    FOR INSERT WITH CHECK (true);

-- ============================================
-- DEFAULT DATA - Pflegeversicherung Quiz
-- ============================================

-- Insert default quiz
INSERT INTO quizzes (id, title, description, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Pflegeversicherung Grundlagen', 'Teste dein Wissen über die deutsche Pflegeversicherung!', true);

-- Question 1
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Seit wann gibt es die Pflegeversicherung in Deutschland?',
'Die Pflegeversicherung wurde am 1. Januar 1995 als fünfte Säule der Sozialversicherung eingeführt.',
20, 1000, 1);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000001', '1990', false, 'red', 1),
('00000000-0000-0000-0001-000000000001', '1995', true, 'blue', 2),
('00000000-0000-0000-0001-000000000001', '2000', false, 'yellow', 3),
('00000000-0000-0000-0001-000000000001', '2005', false, 'green', 4);

-- Question 2
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wie viele Pflegegrade gibt es?',
'Es gibt 5 Pflegegrade (1-5), die den Grad der Pflegebedürftigkeit beschreiben.',
15, 1000, 2);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000002', '3', false, 'red', 1),
('00000000-0000-0000-0001-000000000002', '4', false, 'blue', 2),
('00000000-0000-0000-0001-000000000002', '5', true, 'yellow', 3),
('00000000-0000-0000-0001-000000000002', '6', false, 'green', 4);

-- Question 3
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wer trägt die Beiträge zur Pflegeversicherung?',
'Die Beiträge werden von Arbeitgeber und Arbeitnehmer je zur Hälfte getragen (mit Ausnahme in Sachsen).',
20, 1000, 3);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000003', 'Nur Arbeitnehmer', false, 'red', 1),
('00000000-0000-0000-0001-000000000003', 'Nur Arbeitgeber', false, 'blue', 2),
('00000000-0000-0000-0001-000000000003', 'Beide hälftig', true, 'yellow', 3),
('00000000-0000-0000-0001-000000000003', 'Der Staat', false, 'green', 4);

-- Question 4
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Was bedeutet "Pflegesachleistung"?',
'Pflegesachleistungen sind Leistungen, die von professionellen Pflegediensten erbracht werden.',
20, 1000, 4);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000004', 'Geld für Angehörige', false, 'red', 1),
('00000000-0000-0000-0001-000000000004', 'Professionelle Pflege durch Dienste', true, 'blue', 2),
('00000000-0000-0000-0001-000000000004', 'Hilfsmittel', false, 'yellow', 3),
('00000000-0000-0000-0001-000000000004', 'Kuren', false, 'green', 4);

-- Question 5
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wie hoch ist der Beitragssatz zur Pflegeversicherung 2024 (mit Kind)?',
'Der Beitragssatz beträgt 3,4% des Bruttoeinkommens (für Personen mit Kindern).',
20, 1000, 5);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000005', '2,5%', false, 'red', 1),
('00000000-0000-0000-0001-000000000005', '3,05%', false, 'blue', 2),
('00000000-0000-0000-0001-000000000005', '3,4%', true, 'yellow', 3),
('00000000-0000-0000-0001-000000000005', '4,0%', false, 'green', 4);

-- Question 6 (True/False)
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'true_false',
'Die Pflegeversicherung ist eine Pflichtversicherung.',
'Ja, die Pflegeversicherung ist seit 1995 eine Pflichtversicherung für alle gesetzlich und privat Krankenversicherten.',
15, 1000, 6);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000006', 'Wahr', true, 'blue', 1),
('00000000-0000-0000-0001-000000000006', 'Falsch', false, 'red', 2);

-- Question 7
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Ab welchem Pflegegrad hat man Anspruch auf Pflegegeld?',
'Pflegegeld wird ab Pflegegrad 2 gezahlt. Bei Pflegegrad 1 gibt es nur den Entlastungsbetrag.',
20, 1000, 7);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000007', 'Pflegegrad 1', false, 'red', 1),
('00000000-0000-0000-0001-000000000007', 'Pflegegrad 2', true, 'blue', 2),
('00000000-0000-0000-0001-000000000007', 'Pflegegrad 3', false, 'yellow', 3),
('00000000-0000-0000-0001-000000000007', 'Pflegegrad 4', false, 'green', 4);

-- Question 8 (True/False)
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'true_false',
'Die Pflegeversicherung deckt alle Pflegekosten vollständig ab.',
'Falsch! Die Pflegeversicherung ist eine Teilkaskoversicherung und deckt nicht alle Kosten ab.',
15, 1000, 8);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000008', 'Wahr', false, 'blue', 1),
('00000000-0000-0000-0001-000000000008', 'Falsch', true, 'red', 2);

-- Question 9
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wie hoch ist das monatliche Pflegegeld bei Pflegegrad 5?',
'Das Pflegegeld bei Pflegegrad 5 beträgt 901 Euro monatlich (Stand 2024).',
20, 1000, 9);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000009', '545 Euro', false, 'red', 1),
('00000000-0000-0000-0001-000000000009', '728 Euro', false, 'blue', 2),
('00000000-0000-0000-0001-000000000009', '901 Euro', true, 'yellow', 3),
('00000000-0000-0000-0001-000000000009', '1.100 Euro', false, 'green', 4);

-- Question 10
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wer führt die Begutachtung zur Feststellung des Pflegegrades durch?',
'Der Medizinische Dienst (MD, früher MDK) bei gesetzlich Versicherten oder MEDICPROOF bei privat Versicherten.',
20, 1000, 10);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000010', 'Der Hausarzt', false, 'red', 1),
('00000000-0000-0000-0001-000000000010', 'Der MDK / MEDICPROOF', true, 'blue', 2),
('00000000-0000-0000-0001-000000000010', 'Das Sozialamt', false, 'yellow', 3),
('00000000-0000-0000-0001-000000000010', 'Die Krankenkasse', false, 'green', 4);

-- Question 11 (True/False)
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000001', 'true_false',
'Pflegebedürftige können Pflegegeld und Pflegesachleistungen kombinieren.',
'Ja, das nennt sich Kombinationsleistung. Man kann beide Leistungsarten anteilig nutzen.',
15, 1000, 11);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000011', 'Wahr', true, 'blue', 1),
('00000000-0000-0000-0001-000000000011', 'Falsch', false, 'red', 2);

-- Question 12
INSERT INTO questions (id, quiz_id, type, question_text, explanation, time_limit, points, sort_order) VALUES
('00000000-0000-0000-0001-000000000012', '00000000-0000-0000-0000-000000000001', 'multiple_choice',
'Wie lange muss man versichert sein, um Leistungen zu erhalten?',
'Die Vorversicherungszeit beträgt 2 Jahre innerhalb der letzten 10 Jahre vor der Antragstellung.',
20, 1000, 12);

INSERT INTO answers (question_id, answer_text, is_correct, color, sort_order) VALUES
('00000000-0000-0000-0001-000000000012', '6 Monate', false, 'red', 1),
('00000000-0000-0000-0001-000000000012', '12 Monate', false, 'blue', 2),
('00000000-0000-0000-0001-000000000012', '2 Jahre in den letzten 10 Jahren', true, 'yellow', 3),
('00000000-0000-0000-0001-000000000012', '5 Jahre', false, 'green', 4);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for game sessions
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;
