/**
 * Advanced Analytics Module
 * Provides insights on performance, difficulty scoring, and detailed metrics
 */

import { Attempt, Question } from './store';

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeSpent: number; // seconds
  difficulty: number; // 0-100, higher = harder
  mostSelectedWrongAnswer: number;
}

export interface TestAnalytics {
  testId: string;
  testName: string;
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  maxScore: number;
  minScore: number;
  standardDeviation: number;
  averageTimeSpent: number; // seconds
  overallDifficulty: number; // 0-100
  passRate: number; // percentage
  passThreshold: number; // default 70%
}

export interface UserAnalytics {
  username: string;
  totalTests: number;
  averageScore: number;
  averagePercentage: number;
  bestScore: number;
  worstScore: number;
  totalTimeSpent: number; // seconds
  improvementTrend: number; // percentage change over time
  consistencyScore: number; // 0-100, how consistent
}

/**
 * Calculate difficulty score for a single question
 * Returns 0-100 where 100 is extremely difficult
 */
export function calculateQuestionDifficulty(
  attempts: Attempt[],
  questionIndex: number,
  totalQuestions: number
): number {
  if (attempts.length === 0) return 50; // Default to medium

  const correctCount = attempts.filter(
    a => a.answers[questionIndex] === a.answers[questionIndex] // This would need correct answer
  ).length;

  const successRate = correctCount / attempts.length;
  
  // Convert success rate to difficulty
  // 100% success = difficulty 0 (very easy)
  // 50% success = difficulty 50 (medium)
  // 0% success = difficulty 100 (very hard)
  return Math.round((1 - successRate) * 100);
}

/**
 * Calculate analytics for a single question
 */
export function analyzeQuestion(
  question: Question,
  questionIndex: number,
  attempts: Attempt[]
): QuestionAnalytics {
  const totalAttempts = attempts.length;
  let correctAttempts = 0;
  let totalTime = 0;
  const answerFrequency: Record<number, number> = {};

  attempts.forEach(attempt => {
    const answer = attempt.answers[questionIndex];

    if (answer !== null) {
      answerFrequency[answer] = (answerFrequency[answer] || 0) + 1;

      if (answer === question.correctAnswer) {
        correctAttempts++;
      }
    }

    // Estimate time per question (total time / number of questions)
    const startTime = new Date(attempt.startedAt).getTime();
    const endTime = new Date(attempt.submittedAt).getTime();
    totalTime += (endTime - startTime) / 1000; // Convert to seconds
  });

  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;
  const difficulty = Math.round((1 - successRate / 100) * 100);

  // Find most selected wrong answer
  let mostWrongAnswer = -1;
  let maxWrongCount = 0;
  Object.entries(answerFrequency).forEach(([idx, count]) => {
    const index = parseInt(idx);
    if (index !== question.correctAnswer && count > maxWrongCount) {
      mostWrongAnswer = index;
      maxWrongCount = count;
    }
  });

  return {
    questionId: question.id,
    questionText: question.question,
    totalAttempts,
    correctAttempts,
    successRate,
    averageTimeSpent: averageTime,
    difficulty,
    mostSelectedWrongAnswer: mostWrongAnswer,
  };
}

/**
 * Calculate comprehensive analytics for a test
 */
export function analyzeTest(
  testName: string,
  testId: string,
  attempts: Attempt[],
  questions: Question[],
  passThreshold: number = 70
): TestAnalytics {
  if (attempts.length === 0) {
    return {
      testId,
      testName,
      totalAttempts: 0,
      averageScore: 0,
      averagePercentage: 0,
      maxScore: 0,
      minScore: 0,
      standardDeviation: 0,
      averageTimeSpent: 0,
      overallDifficulty: 50,
      passRate: 0,
      passThreshold,
    };
  }

  const scores = attempts.map(a => a.score);
  const percentages = attempts.map(a => (a.score / a.totalQuestions) * 100);
  const times = attempts.map(a => {
    const start = new Date(a.startedAt).getTime();
    const end = new Date(a.submittedAt).getTime();
    return (end - start) / 1000; // seconds
  });

  const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[], mean: number) => {
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const avgScore = average(scores);
  const avgPercentage = average(percentages);
  const avgTime = average(times);
  const passCount = percentages.filter(p => p >= passThreshold).length;
  const passRate = (passCount / attempts.length) * 100;

  // Calculate overall difficulty based on class performance
  const overallDifficulty = Math.round((1 - avgPercentage / 100) * 100);

  return {
    testId,
    testName,
    totalAttempts: attempts.length,
    averageScore: Math.round(avgScore * 10) / 10,
    averagePercentage: Math.round(avgPercentage * 10) / 10,
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    standardDeviation: Math.round(stdDev(scores, avgScore) * 10) / 10,
    averageTimeSpent: avgTime,
    overallDifficulty,
    passRate: Math.round(passRate * 10) / 10,
    passThreshold,
  };
}

/**
 * Calculate analytics for a specific user
 */
export function analyzeUser(
  username: string,
  userAttempts: Attempt[]
): UserAnalytics {
  if (userAttempts.length === 0) {
    return {
      username,
      totalTests: 0,
      averageScore: 0,
      averagePercentage: 0,
      bestScore: 0,
      worstScore: 0,
      totalTimeSpent: 0,
      improvementTrend: 0,
      consistencyScore: 0,
    };
  }

  // Sort by date
  const sorted = [...userAttempts].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  const percentages = sorted.map(a => (a.score / a.totalQuestions) * 100);
  const times = sorted.map(a => {
    const start = new Date(a.startedAt).getTime();
    const end = new Date(a.submittedAt).getTime();
    return (end - start) / 1000;
  });

  const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[], mean: number) => {
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const avgPercentage = average(percentages);
  const avgTime = average(times);
  const avgScore = average(sorted.map(a => a.score));

  // Calculate improvement trend (compare first and last 30% of attempts)
  const sampleSize = Math.max(1, Math.floor(sorted.length * 0.3));
  const firstSample = percentages.slice(0, sampleSize);
  const lastSample = percentages.slice(-sampleSize);
  const firstAvg = average(firstSample);
  const lastAvg = average(lastSample);
  const improvementTrend = lastAvg - firstAvg;

  // Consistency score (low std dev = high consistency)
  const stdDeviation = stdDev(percentages, avgPercentage);
  const consistencyScore = Math.max(0, 100 - stdDeviation);

  return {
    username,
    totalTests: sorted.length,
    averageScore: Math.round(avgScore * 10) / 10,
    averagePercentage: Math.round(avgPercentage * 10) / 10,
    bestScore: Math.max(...sorted.map(a => a.score)),
    worstScore: Math.min(...sorted.map(a => a.score)),
    totalTimeSpent: times.reduce((a, b) => a + b, 0),
    improvementTrend: Math.round(improvementTrend * 10) / 10,
    consistencyScore: Math.round(consistencyScore),
  };
}

/**
 * Format time for display
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${Math.round(secs)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Get difficulty level label
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 25) return 'Very Easy';
  if (difficulty < 50) return 'Easy';
  if (difficulty < 75) return 'Hard';
  return 'Very Hard';
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 25) return 'text-emerald-500';
  if (difficulty < 50) return 'text-blue-500';
  if (difficulty < 75) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Predict score based on historical performance
 */
export function predictScore(
  userHistory: Attempt[],
  testQuestions: number
): { predictedScore: number; confidence: number } {
  if (userHistory.length === 0) {
    return { predictedScore: 0, confidence: 0 };
  }

  const percentages = userHistory.map(a => (a.score / a.totalQuestions) * 100);
  const avgPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;

  // Calculate confidence based on consistency
  const stdDev = Math.sqrt(
    percentages.reduce((sum, p) => sum + Math.pow(p - avgPercentage, 2), 0) / percentages.length
  );

  // Higher std dev = lower confidence
  const confidence = Math.max(0, 100 - stdDev);
  const predictedScore = Math.round((avgPercentage / 100) * testQuestions);

  return { predictedScore, confidence: Math.round(confidence) };
}

/**
 * Identify weak areas
 */
export function identifyWeakAreas(
  attempts: Attempt[],
  questions: Question[]
): Array<{ questionIndex: number; difficulty: number; successRate: number }> {
  const weakAreas: Array<{ questionIndex: number; difficulty: number; successRate: number }> = [];

  questions.forEach((_, index) => {
    const analytics = analyzeQuestion(questions[index], index, attempts);

    // Mark as weak if success rate < 50% or difficulty > 75
    if (analytics.successRate < 50 || analytics.difficulty > 75) {
      weakAreas.push({
        questionIndex: index,
        difficulty: analytics.difficulty,
        successRate: analytics.successRate,
      });
    }
  });

  return weakAreas.sort((a, b) => b.difficulty - a.difficulty);
}
