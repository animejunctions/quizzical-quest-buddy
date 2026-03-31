/**
 * Question and Option Shuffling Utilities
 * Provides deterministic shuffling based on attempt ID for reproducible results
 */

import { Question } from './store';

// Fisher-Yates shuffle algorithm with seed for reproducibility
function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = hashStrToNumber(seed);

  for (let i = arr.length - 1; i > 0; i--) {
    // Use seeded random instead of Math.random()
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.floor((hash / 233280) * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

// Convert string to deterministic number
function hashStrToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export interface ShuffledQuestion extends Question {
  originalCorrectAnswerIndex: number; // Track original correct answer position
}

/**
 * Shuffle questions and their options based on attempt ID
 * Returns both shuffled questions and a mapping for answer validation
 */
export function shuffleQuestionsAndOptions(
  questions: Question[],
  attemptId: string,
  shuffleQuestions: boolean = true,
  shuffleOptions: boolean = true
): { shuffled: ShuffledQuestion[]; answerMap: Map<number, number> } {
  // Shuffle questions order if enabled
  let questionsToUse = questions;
  if (shuffleQuestions) {
    questionsToUse = shuffleWithSeed(questions, `questions_${attemptId}`);
  }

  // Shuffle options for each question if enabled
  const answerMap = new Map<number, number>(); // Maps displayed position to original position
  const shuffled: ShuffledQuestion[] = questionsToUse.map((question, qIndex) => {
    if (!shuffleOptions) {
      answerMap.set(qIndex, question.correctAnswer);
      return {
        ...question,
        originalCorrectAnswerIndex: question.correctAnswer,
      };
    }

    // Create array of option indices to shuffle
    const optionIndices = Array.from({ length: question.options.length }, (_, i) => i);
    const shuffledIndices = shuffleWithSeed(optionIndices, `options_${attemptId}_${qIndex}`);

    // Find where the correct answer ended up
    const originalCorrectIndex = question.correctAnswer;
    const newCorrectIndex = shuffledIndices.indexOf(originalCorrectIndex);

    // Reorder options based on shuffled indices
    const shuffledOptions = shuffledIndices.map(i => question.options[i]);

    // Store the mapping for later validation
    answerMap.set(qIndex, newCorrectIndex);

    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: newCorrectIndex,
      originalCorrectAnswerIndex: originalCorrectIndex,
    };
  });

  return { shuffled, answerMap };
}

/**
 * Validate answers by mapping them back to original positions
 * Used when checking answers against the original test definition
 */
export function validateAnswers(
  submittedAnswers: (number | null)[],
  shuffledQuestions: ShuffledQuestion[],
  answerMap: Map<number, number>
): (number | null)[] {
  return submittedAnswers.map((answer, qIndex) => {
    if (answer === null) return null;

    // Get the shuffled question to find original position
    const question = shuffledQuestions[qIndex];
    if (!question) return null;

    // The answer refers to the shuffled position
    // We need to map it back to the original position
    const optionIndices = Array.from({ length: question.options.length }, (_, i) => i);
    const seed = `options_${getAttemptIdFromStorage()}_${qIndex}`;
    const shuffledIndices = shuffleWithSeed(optionIndices, seed);

    // Map the displayed answer back to original index
    if (answer >= 0 && answer < shuffledIndices.length) {
      return shuffledIndices[answer];
    }

    return null;
  });
}

/**
 * Get original attempt ID from session storage
 */
function getAttemptIdFromStorage(): string {
  return sessionStorage.getItem('quizlab_attempt_id') || '';
}

/**
 * Store attempt ID for reproducible shuffling during the exam
 */
export function storeAttemptId(attemptId: string): void {
  sessionStorage.setItem('quizlab_attempt_id', attemptId);
}

/**
 * Calculate difficulty score based on performance
 * Returns a number 0-100 where 100 is hardest
 */
export function calculateDifficultyScore(
  averageTimePerQuestion: number,
  correctAnswerPercentage: number
): number {
  // Higher time per question suggests harder content
  const timeScore = Math.min(averageTimePerQuestion / 60, 1) * 100; // Max 60 seconds per question

  // Lower percentage suggests harder content
  const accuracyScore = (1 - correctAnswerPercentage / 100) * 100;

  // Weighted average
  return Math.round(timeScore * 0.4 + accuracyScore * 0.6);
}

/**
 * Check if question order is suspicious (potential tampering)
 */
export function checkQuestionOrderIntegrity(
  questions: Question[],
  attemptId: string,
  expectedShuffle: boolean
): boolean {
  // This would verify that questions are in the expected shuffled order
  // Implementation depends on storing the original order server-side
  // For now, return true as a basic check
  return true;
}
