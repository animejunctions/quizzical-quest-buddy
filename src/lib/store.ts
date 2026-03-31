// Types
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export interface Test {
  id: string;
  name: string;
  slug: string;
  secretCode: string;
  timeLimit: number; // minutes, 0 = no limit
  questions: Question[];
  createdAt: string;
  isActive: boolean;
  shuffleQuestions?: boolean; // Shuffle question order
  shuffleOptions?: boolean; // Randomize option order
}

export interface Attempt {
  id: string;
  testId: string;
  telegramUsername: string;
  answers: (number | null)[]; // index of selected option per question
  score: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string | null;
  warnings: number;
  autoSubmitted: boolean;
}

import { supabase } from './supabase';

const ADMIN_USERNAME = "alter69x";
const ADMIN_PASSWORD = "test123";

// Admin auth
export function verifyAdmin(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

// Storage helpers
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Tests CRUD
export function getTests(): Test[] {
  return getItem<Test[]>("quizlab_tests", []);
}

export function getTestById(id: string): Test | undefined {
  return getTests().find((t) => t.id === id);
}

export async function getTestBySlug(slug: string): Promise<Test | undefined> {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select(`
        id,
        name,
        slug,
        secret_code,
        time_limit,
        created_at,
        is_active,
        shuffle_questions,
        shuffle_options,
        questions:questions(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching test by slug:', error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      secretCode: data.secret_code,
      timeLimit: data.time_limit,
      createdAt: data.created_at,
      isActive: data.is_active,
      shuffleQuestions: data.shuffle_questions,
      shuffleOptions: data.shuffle_options,
      questions: (data.questions || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
    };
  } catch (error) {
    console.error('Error in getTestBySlug:', error);
    return undefined;
  }
}

export function saveTest(test: Test) {
  const tests = getTests();
  const idx = tests.findIndex((t) => t.id === test.id);
  if (idx >= 0) tests[idx] = test;
  else tests.push(test);
  setItem("quizlab_tests", tests);
}

export function deleteTest(id: string) {
  setItem("quizlab_tests", getTests().filter((t) => t.id !== id));
}

// Attempts
export function getAttempts(): Attempt[] {
  return getItem<Attempt[]>("quizlab_attempts", []);
}

export function getAttemptsByTest(testId: string): Attempt[] {
  return getAttempts().filter((a) => a.testId === testId);
}

export async function checkExistingAttemptByUsername(testId: string, telegramUsername: string): Promise<Attempt | null> {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('telegram_username', telegramUsername)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      testId: data.test_id,
      telegramUsername: data.telegram_username,
      answers: data.answers || [],
      score: data.score,
      totalQuestions: data.total_questions,
      startedAt: data.started_at,
      submittedAt: data.submitted_at,
      warnings: data.warnings,
      autoSubmitted: data.auto_submitted,
    };
  } catch (error) {
    console.error('Error checking existing attempt:', error);
    return null;
  }
}

export async function saveAttemptToSupabase(
  attempt: Attempt,
  deviceFingerprint: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('attempts')
      .insert({
        id: attempt.id,
        test_id: attempt.testId,
        telegram_username: attempt.telegramUsername,
        answers: attempt.answers,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        started_at: attempt.startedAt,
        submitted_at: attempt.submittedAt,
        warnings: attempt.warnings,
        auto_submitted: attempt.autoSubmitted,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
      });

    if (error) {
      console.error('Error saving attempt to Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveAttemptToSupabase:', error);
    return false;
  }
}

export function saveAttempt(attempt: Attempt) {
  const attempts = getAttempts();
  const idx = attempts.findIndex((a) => a.id === attempt.id);
  if (idx >= 0) attempts[idx] = attempt;
  else attempts.push(attempt);
  setItem("quizlab_attempts", attempts);
}

export function generateId(): string {
  return crypto.randomUUID();
}
