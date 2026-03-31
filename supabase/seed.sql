-- Seed SQL - Insert initial admin user
-- NOTE: In production, use bcrypt or similar. For development, you can use this simple hash function.
-- Password: "test123" (you should change this in production!)

INSERT INTO admin_users (username, password_hash, is_active)
VALUES ('alter69x', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36MM4aSi', true)
ON CONFLICT (username) DO NOTHING;

-- Example test (optional - for reference)
-- Uncomment and modify if you want to seed with a test
/*
WITH admin AS (
  SELECT id FROM admin_users WHERE username = 'alter69x' LIMIT 1
)
INSERT INTO tests (admin_id, name, slug, secret_code, time_limit, is_active, shuffle_questions, shuffle_options)
SELECT admin.id, 'Sample Math Test', 'math-101', 'secret123', 30, true, true, true
FROM admin;

-- Add sample questions
WITH test AS (
  SELECT id FROM tests WHERE slug = 'math-101' LIMIT 1
)
INSERT INTO questions (test_id, question, options, correct_answer, explanation, display_order)
SELECT 
  test.id,
  'What is 2 + 2?',
  ARRAY['3', '4', '5', '6'],
  1,
  'The correct answer is 4 because 2 plus 2 equals 4.',
  1
FROM test;
*/
