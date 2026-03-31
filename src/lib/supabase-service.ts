import { supabase, isSupabaseConfigured } from './supabase';
import { Question, Test, Attempt, getAttemptsByTest as getLocalAttemptsByTest, getTestById as getLocalTestById } from './store';

// ============= TESTS =============
export async function getTests(): Promise<Test[]> {
  const { data, error } = await supabase
    .from('tests')
    .select(`
      id,
      name,
      slug,
      secret_code,
      time_limit,
      created_at,
      updated_at,
      is_active,
      shuffle_questions,
      shuffle_options,
      questions:questions(*)
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching tests:', error);
    return [];
  }

  return (data || []).map(test => ({
    id: test.id,
    name: test.name,
    slug: test.slug,
    secretCode: test.secret_code,
    timeLimit: test.time_limit,
    createdAt: test.created_at,
    isActive: test.is_active,
    shuffleQuestions: test.shuffle_questions,
    shuffleOptions: test.shuffle_options,
    questions: (test.questions || []).map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
  }));
}

export async function getTestById(id: string): Promise<Test | undefined> {
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
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching test:', error);
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
}

export async function getTestBySlug(slug: string): Promise<Test | undefined> {
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
}

export async function saveTest(test: Test): Promise<Test | null> {
  const { id, secretCode, timeLimit, createdAt, isActive, shuffleQuestions, shuffleOptions, questions, ...rest } = test;

  // This would need admin context - for now, save test metadata
  const { data, error } = await supabase
    .from('tests')
    .upsert({
      id,
      secret_code: secretCode,
      time_limit: timeLimit,
      created_at: createdAt,
      is_active: isActive,
      shuffle_questions: shuffleQuestions ?? true,
      shuffle_options: shuffleOptions ?? true,
      updated_at: new Date().toISOString(),
      ...rest,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving test:', error);
    return null;
  }

  return data ? getTestById(data.id) : null;
}

export async function deleteTest(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tests')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting test:', error);
    return false;
  }

  return true;
}

// ============= QUESTIONS =============
export async function saveQuestion(testId: string, question: Question, displayOrder: number): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .upsert({
      id: question.id,
      test_id: testId,
      question: question.question,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      display_order: displayOrder,
    });

  if (error) {
    console.error('Error saving question:', error);
    return false;
  }

  return true;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting question:', error);
    return false;
  }

  return true;
}

// ============= ATTEMPTS =============
export async function saveAttempt(attempt: Attempt, deviceFingerprint: string, ipAddress?: string): Promise<boolean> {
  const { id, testId, telegramUsername, answers, score, totalQuestions, startedAt, submittedAt, warnings, autoSubmitted } = attempt;

  const { error } = await supabase
    .from('attempts')
    .insert({
      id,
      test_id: testId,
      telegram_username: telegramUsername,
      answers,
      score,
      total_questions: totalQuestions,
      started_at: startedAt,
      submitted_at: submittedAt,
      warnings,
      auto_submitted: autoSubmitted,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
    });

  if (error) {
    console.error('Error saving attempt:', error);
    return false;
  }

  return true;
}

export async function getAttempts(): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    testId: a.test_id,
    telegramUsername: a.telegram_username,
    answers: a.answers || [],
    score: a.score,
    totalQuestions: a.total_questions,
    startedAt: a.started_at,
    submittedAt: a.submitted_at,
    warnings: a.warnings,
    autoSubmitted: a.auto_submitted,
  }));
}

export async function getAttemptsByTest(testId: string): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    testId: a.test_id,
    telegramUsername: a.telegram_username,
    answers: a.answers || [],
    score: a.score,
    totalQuestions: a.total_questions,
    startedAt: a.started_at,
    submittedAt: a.submitted_at,
    warnings: a.warnings,
    autoSubmitted: a.auto_submitted,
  }));
}

export async function checkExistingAttempt(testId: string, deviceFingerprint: string): Promise<Attempt | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('device_fingerprint', deviceFingerprint)
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
}

// ============= CHEAT VIOLATIONS =============
export async function logCheatViolation(
  attemptId: string,
  violationType: string,
  details?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('cheat_violations')
    .insert({
      attempt_id: attemptId,
      violation_type: violationType,
      violation_details: details || '',
      timestamp: new Date().toISOString(),
    });

  if (error) {
    console.error('Error logging cheat violation:', error);
    return false;
  }

  return true;
}

export async function getCheatViolations(attemptId: string) {
  const { data, error } = await supabase
    .from('cheat_violations')
    .select('*')
    .eq('attempt_id', attemptId);

  if (error) {
    console.error('Error fetching violations:', error);
    return [];
  }

  return data || [];
}

// ============= LEADERBOARD =============
export async function getLeaderboard(testId: string, limit: number = 10) {
  // First try Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('test_id', testId)
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error('Error fetching leaderboard from Supabase:', err);
    }
  }

  // Fallback to localStorage
  const localAttempts = getLocalAttemptsByTest(testId);
  const test = getLocalTestById(testId);
  
  // Convert to leaderboard format
  const leaderboard = localAttempts
    .filter(a => a.submittedAt)
    .map((a, index) => ({
      test_id: a.testId,
      test_name: test?.name || 'Unknown Test',
      telegram_username: a.telegramUsername,
      score: a.score,
      total_questions: a.totalQuestions,
      percentage: (a.score / a.totalQuestions) * 100,
      submitted_at: a.submittedAt,
      rank: 0, // Will be set after sorting
    }))
    .sort((a, b) => b.percentage - a.percentage || new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime())
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return leaderboard;
}

export async function getTopScorers(limit: number = 50) {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }

  return data || [];
}
