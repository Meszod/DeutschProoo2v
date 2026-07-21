export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type Skill = 'lesen' | 'hoeren' | 'schreiben' | 'sprechen';
export type ExamType = 'Goethe' | 'telc' | 'OSD';
export type Lang = 'uz' | 'ru' | 'en';
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  target_level: Level | null;
  target_exam_type: ExamType | null;
  exam_date: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_points: number;
  role: UserRole;
  placement_level: Level | null;
  created_at: string;
}

export interface TaskQuestion {
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  answer: number | boolean;
  explanation: string;
}

export interface TaskContent {
  text?: string;
  questions?: TaskQuestion[];
  audio_script?: string;
  prompt?: string;
  max_words?: number;
  min_words?: number;
  leitpunkte?: string[];
  max_duration_seconds?: number;
  min_duration_seconds?: number;
}

export interface Task {
  id: string;
  skill: Skill;
  level: Level;
  exam_type: ExamType | null;
  teil_number: number | null;
  title: string;
  content: TaskContent;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  skill: Skill;
  level: Level | null;
  task_id: string | null;
  score: number | null;
  max_score: number | null;
  ai_feedback: Record<string, unknown> | null;
  user_input: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface VocabCard {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  created_at: string;
}

export interface MockExam {
  id: string;
  user_id: string;
  level: Level;
  exam_type: ExamType | null;
  lesen_score: number | null;
  hoeren_score: number | null;
  schreiben_score: number | null;
  sprechen_score: number | null;
  total_score: number | null;
  passed: boolean | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_points: number;
  week_start: string;
  updated_at: string;
}

export interface DailyWord {
  id: string;
  word_date: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  level: Level | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_code: string;
  earned_at: string;
}
