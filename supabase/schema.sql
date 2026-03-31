-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  secret_code TEXT NOT NULL,
  time_limit INTEGER DEFAULT 0, -- minutes, 0 = no limit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  explanation TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attempts table (stores all test submissions)
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  telegram_username TEXT NOT NULL,
  answers INTEGER[], -- Array of selected option indices (null if not answered)
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  started_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  warnings INTEGER DEFAULT 0,
  auto_submitted BOOLEAN DEFAULT false,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cheat violations table (detailed anti-cheat tracking)
CREATE TABLE IF NOT EXISTS cheat_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL, -- e.g., "tab_switch", "right_click", "copy_attempt", "dev_tools"
  violation_details TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for better performance
CREATE INDEX IF NOT EXISTS idx_tests_slug ON tests(slug);
CREATE INDEX IF NOT EXISTS idx_tests_admin_id ON tests(admin_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_telegram ON attempts(telegram_username);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cheat_violations_attempt_id ON cheat_violations(attempt_id);

-- View for leaderboard (top scores per test)
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  t.id as test_id,
  t.name as test_name,
  a.telegram_username,
  a.score,
  a.total_questions,
  ROUND((a.score::NUMERIC / NULLIF(a.total_questions, 0) * 100)::NUMERIC, 2) as percentage,
  a.submitted_at,
  ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY a.score DESC, a.submitted_at ASC) as rank
FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
WHERE a.submitted_at IS NOT NULL
ORDER BY t.id, a.score DESC, a.submitted_at ASC;

-- Enable RLS (Row Level Security)
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anyone can read, insert attempts; only admins can manage tests)
CREATE POLICY "Allow read tests" ON tests FOR SELECT USING (is_active = true);
CREATE POLICY "Allow read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow insert attempts" ON attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read attempts" ON attempts FOR SELECT USING (true);
CREATE POLICY "Allow insert cheat violations" ON cheat_violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read cheat violations" ON cheat_violations FOR SELECT USING (true);
