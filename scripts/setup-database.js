import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log("Setting up database tables...");

    // Create tests table
    const { error: testsError } = await supabase.rpc("execute_sql", {
      sql: `
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
      `,
    });

    if (testsError) console.log("Tests table:", testsError);

    // Create questions table
    const { error: questionsError } = await supabase.rpc("execute_sql", {
      sql: `
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
      `,
    });

    if (questionsError) console.log("Questions table:", questionsError);

    // Create attempts table
    const { error: attemptsError } = await supabase.rpc("execute_sql", {
      sql: `
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
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(test_id, telegram_username)
        );
      `,
    });

    if (attemptsError) console.log("Attempts table:", attemptsError);

    // Create cheat violations table
    const { error: violationsError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS cheat_violations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
          violation_type TEXT NOT NULL,
          violation_details TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });

    if (violationsError) console.log("Violations table:", violationsError);

    console.log("Database setup complete!");
  } catch (error) {
    console.error("Setup error:", error);
  }
}

setupDatabase();
