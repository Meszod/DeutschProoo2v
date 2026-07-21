/*
# German Exam Prep Platform - Core Schema

## Overview
Creates the full database schema for a German language exam preparation platform
(Goethe/telc format, levels A1-C1). Includes user profiles, task bank, attempts,
vocabulary flashcards with spaced repetition, achievements, mock exams, and
leaderboard aggregation.

## New Tables
1. `profiles` - Extends auth.users with app-specific user data (target level, exam type,
   exam date, streak counters, total points, role for admin access).
2. `tasks` - Bank of exercises for Lesen/Horen/Schreiben/Sprechen, keyed by skill,
   level, exam_type, and teil_number. Content stored as JSONB.
3. `attempts` - Records every exercise attempt with score, AI feedback, user input,
   optional audio URL, and duration.
4. `vocabulary_cards` - User-owned flashcards with SM-2 spaced repetition fields.
5. `achievements` - Badge records per user (badge_code + earned_at).
6. `mock_exams` - Full mock exam sessions with per-skill scores, total, pass flag.
7. `daily_word` - "Wort des Tages" entries (one per day, global, admin-managed).
8. `leaderboard_weekly` - Aggregated weekly points per user for leaderboard display.

## Security
- RLS enabled on ALL tables.
- profiles: each user reads/updates their own row; admins read all.
- tasks, daily_word: readable by all authenticated (shared content); only admins write.
- attempts, vocabulary_cards, achievements, mock_exams: owner-scoped CRUD.
- leaderboard_weekly: readable by all authenticated (shared ranking), writes via RPC only.

## Important Notes
1. `profiles.id` references auth.users; a trigger auto-creates the profile on signup.
2. `role` column defaults to 'user'; first admin set manually via SQL.
3. Owner columns on user-scoped tables default to `auth.uid()`.
4. Indexes added for common query patterns.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  target_level text CHECK (target_level IN ('A1','A2','B1','B2','C1')),
  target_exam_type text CHECK (target_exam_type IN ('Goethe','telc','OSD')),
  exam_date date,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_activity_date date,
  total_points int NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  placement_level text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill text NOT NULL CHECK (skill IN ('lesen','hoeren','schreiben','sprechen')),
  level text NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1')),
  exam_type text CHECK (exam_type IN ('Goethe','telc','OSD')),
  teil_number int,
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_skill_level ON tasks (skill, level);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks (level);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tasks" ON tasks;
CREATE POLICY "select_tasks" ON tasks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_tasks" ON tasks;
CREATE POLICY "admin_insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_tasks" ON tasks;
CREATE POLICY "admin_update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_tasks" ON tasks;
CREATE POLICY "admin_delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ATTEMPTS
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  skill text NOT NULL CHECK (skill IN ('lesen','hoeren','schreiben','sprechen')),
  level text,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  score numeric,
  max_score numeric,
  ai_feedback jsonb,
  user_input text,
  audio_url text,
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_skill ON attempts (user_id, skill);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON attempts;
CREATE POLICY "select_own_attempts" ON attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON attempts;
CREATE POLICY "insert_own_attempts" ON attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attempts" ON attempts;
CREATE POLICY "update_own_attempts" ON attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON attempts;
CREATE POLICY "delete_own_attempts" ON attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_attempts" ON attempts;
CREATE POLICY "admin_select_attempts" ON attempts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- VOCABULARY CARDS
CREATE TABLE IF NOT EXISTS vocabulary_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  example_sentence text,
  ease_factor numeric NOT NULL DEFAULT 2.5,
  interval_days int NOT NULL DEFAULT 1,
  repetitions int NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocab_user_review ON vocabulary_cards (user_id, next_review_date);

ALTER TABLE vocabulary_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vocab" ON vocabulary_cards;
CREATE POLICY "select_own_vocab" ON vocabulary_cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_vocab" ON vocabulary_cards;
CREATE POLICY "insert_own_vocab" ON vocabulary_cards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_vocab" ON vocabulary_cards;
CREATE POLICY "update_own_vocab" ON vocabulary_cards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_vocab" ON vocabulary_cards;
CREATE POLICY "delete_own_vocab" ON vocabulary_cards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements (user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_achievements" ON achievements;
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- MOCK EXAMS
CREATE TABLE IF NOT EXISTS mock_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  level text NOT NULL,
  exam_type text,
  lesen_score numeric,
  hoeren_score numeric,
  schreiben_score numeric,
  sprechen_score numeric,
  total_score numeric,
  passed boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mockexams_user ON mock_exams (user_id, created_at DESC);

ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mockexams" ON mock_exams;
CREATE POLICY "select_own_mockexams" ON mock_exams FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mockexams" ON mock_exams;
CREATE POLICY "insert_own_mockexams" ON mock_exams FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mockexams" ON mock_exams;
CREATE POLICY "delete_own_mockexams" ON mock_exams FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- DAILY WORD
CREATE TABLE IF NOT EXISTS daily_word (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_date date NOT NULL UNIQUE,
  word text NOT NULL,
  translation text NOT NULL,
  example_sentence text,
  level text CHECK (level IN ('A1','A2','B1','B2','C1')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_word ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_daily_word" ON daily_word;
CREATE POLICY "select_daily_word" ON daily_word FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_daily_word" ON daily_word;
CREATE POLICY "admin_insert_daily_word" ON daily_word FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_daily_word" ON daily_word;
CREATE POLICY "admin_update_daily_word" ON daily_word FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_daily_word" ON daily_word;
CREATE POLICY "admin_delete_daily_word" ON daily_word FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- LEADERBOARD
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text,
  total_points int NOT NULL DEFAULT 0,
  week_start date NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard_weekly (total_points DESC);

ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_leaderboard" ON leaderboard_weekly;
CREATE POLICY "select_leaderboard" ON leaderboard_weekly FOR SELECT
  TO authenticated USING (true);

-- RPC: record_activity (award points + update streak + upsert leaderboard)
CREATE OR REPLACE FUNCTION public.record_activity(p_points int DEFAULT 0)
RETURNS void AS $$
DECLARE
  v_today date := now()::date;
  v_last date;
  v_new_streak int;
  v_longest int;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last, v_new_streak, v_longest
  FROM profiles WHERE id = auth.uid();

  IF v_last IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last = v_today THEN
    v_new_streak := GREATEST(v_new_streak, 1);
  ELSIF v_last = v_today - 1 THEN
    v_new_streak := v_new_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_longest := GREATEST(v_longest, v_new_streak);

  UPDATE profiles
  SET current_streak = v_new_streak,
      longest_streak = v_longest,
      last_activity_date = v_today,
      total_points = total_points + p_points
  WHERE id = auth.uid();

  INSERT INTO leaderboard_weekly (user_id, full_name, total_points, week_start)
  SELECT auth.uid(), p2.full_name, p_points, date_trunc('week', v_today)::date
  FROM profiles p2 WHERE p2.id = auth.uid()
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = leaderboard_weekly.total_points + p_points,
        full_name = EXCLUDED.full_name,
        week_start = EXCLUDED.week_start,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: review_vocab_card (SM-2 algorithm)
CREATE OR REPLACE FUNCTION public.review_vocab_card(p_card_id uuid, p_quality int)
RETURNS void AS $$
DECLARE
  v_ease numeric;
  v_interval int;
  v_reps int;
  v_next date;
BEGIN
  SELECT ease_factor, interval_days, repetitions
  INTO v_ease, v_interval, v_reps
  FROM vocabulary_cards WHERE id = p_card_id AND user_id = auth.uid();

  IF NOT FOUND THEN RETURN; END IF;

  IF p_quality < 3 THEN
    v_reps := 0;
    v_interval := 1;
  ELSE
    v_reps := v_reps + 1;
    IF v_reps = 1 THEN
      v_interval := 1;
    ELSIF v_reps = 2 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(v_interval * v_ease)::int;
    END IF;
  END IF;

  v_ease := GREATEST(1.3, v_ease + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02)));
  v_next := (now()::date + v_interval);

  UPDATE vocabulary_cards
  SET ease_factor = v_ease,
      interval_days = v_interval,
      repetitions = v_reps,
      next_review_date = v_next
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
