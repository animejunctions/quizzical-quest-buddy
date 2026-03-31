-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  secret_code TEXT NOT NULL,
  time_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attempts table with telegram_username tracking
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  telegram_username TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  warnings INTEGER DEFAULT 0,
  auto_submitted BOOLEAN DEFAULT false,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cheat violations table
CREATE TABLE IF NOT EXISTS cheat_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_telegram_username ON attempts(telegram_username);
CREATE INDEX IF NOT EXISTS idx_attempts_device_fingerprint ON attempts(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_tests_slug ON tests(slug);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);

-- Create a unique constraint to prevent same user from attempting same test twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attempt_per_user_per_test 
ON attempts(test_id, telegram_username);

-- Create leaderboard view
DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
SELECT 
  a.test_id,
  t.name as test_name,
  a.telegram_username,
  a.score,
  a.total_questions,
  ROUND((a.score::DECIMAL / NULLIF(a.total_questions, 0)) * 100, 2) as percentage,
  a.submitted_at,
  a.warnings,
  a.auto_submitted,
  a.answers,
  RANK() OVER (PARTITION BY a.test_id ORDER BY a.score DESC, a.submitted_at ASC) as rank
FROM attempts a
JOIN tests t ON t.id = a.test_id
WHERE a.submitted_at IS NOT NULL
ORDER BY a.test_id, a.score DESC, a.submitted_at ASC;

-- Disable RLS for public access (this is a simple quiz app)
ALTER TABLE tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_violations DISABLE ROW LEVEL SECURITY;
