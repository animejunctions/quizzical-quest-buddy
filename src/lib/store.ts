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

export function getTestBySlug(slug: string): Test | undefined {
  return getTests().find((t) => t.slug === slug);
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
