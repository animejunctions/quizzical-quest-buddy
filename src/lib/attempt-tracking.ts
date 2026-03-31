/**
 * Attempt Tracking System
 * Prevents re-attempts from the same device using device fingerprinting
 */

import { generateDeviceFingerprint } from './anti-cheat';
import { checkExistingAttempt } from './supabase-service';

// Local cache for quick checks
const localAttemptCache = new Map<string, { testId: string; timestamp: number }>();

/**
 * Check if this device has already attempted the test
 */
export async function hasAttemptedTest(testId: string): Promise<{
  hasAttempted: boolean;
  attempt?: any;
  blockedMessage?: string;
}> {
  try {
    // Step 1: Check local session storage (fast path)
    const sessionKey = `quizlab_attempt_${testId}`;
    const sessionAttempt = sessionStorage.getItem(sessionKey);

    if (sessionAttempt) {
      return {
        hasAttempted: true,
        blockedMessage: 'You have already attempted this test in this browser session.',
      };
    }

    // Step 2: Check local cache
    if (localAttemptCache.has(testId)) {
      const cached = localAttemptCache.get(testId)!;
      if (Date.now() - cached.timestamp < 3600000) {
        // Cache valid for 1 hour
        return {
          hasAttempted: true,
          blockedMessage: 'You have already attempted this test. Results recorded.',
        };
      } else {
        localAttemptCache.delete(testId);
      }
    }

    // Step 3: Check localStorage (browser-wide)
    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;

    if (storedAttempts[testId]) {
      const attemptTime = storedAttempts[testId];
      // Allow re-attempt after 24 hours
      if (Date.now() - attemptTime < 24 * 60 * 60 * 1000) {
        return {
          hasAttempted: true,
          blockedMessage: 'You have already attempted this test. Please wait 24 hours before retrying.',
        };
      }
    }

    // Step 4: Check server (device fingerprint based)
    const fingerprint = await generateDeviceFingerprint();
    const existingAttempt = await checkExistingAttempt(testId, fingerprint);

    if (existingAttempt) {
      // Store in local cache for future checks
      localAttemptCache.set(testId, { testId, timestamp: Date.now() });

      // Store in localStorage
      storedAttempts[testId] = Date.now();
      localStorage.setItem('quizlab_device_attempts', JSON.stringify(storedAttempts));

      return {
        hasAttempted: true,
        attempt: existingAttempt,
        blockedMessage: `You have already attempted this test (Score: ${existingAttempt.score}/${existingAttempt.totalQuestions}). One attempt per device is allowed.`,
      };
    }

    return { hasAttempted: false };
  } catch (error) {
    console.error('Error checking attempt:', error);
    // On error, allow attempt but log warning
    return { hasAttempted: false };
  }
}

/**
 * Record that this device has attempted the test
 */
export async function recordAttempt(testId: string, attemptId: string): Promise<void> {
  try {
    // Store in session storage (immediate)
    sessionStorage.setItem(`quizlab_attempt_${testId}`, attemptId);

    // Store in localStorage (persistent)
    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;
    storedAttempts[testId] = Date.now();
    localStorage.setItem('quizlab_device_attempts', JSON.stringify(storedAttempts));

    // Store in local cache
    localAttemptCache.set(testId, { testId, timestamp: Date.now() });

    // Store full attempt details in localStorage for reference
    const attemptDetails = JSON.parse(
      localStorage.getItem('quizlab_attempted_details') || '{}'
    ) as Record<string, any>;
    attemptDetails[testId] = {
      attemptId,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('quizlab_attempted_details', JSON.stringify(attemptDetails));
  } catch (error) {
    console.error('Error recording attempt:', error);
  }
}

/**
 * Get details of previous attempt
 */
export function getPreviousAttemptDetails(testId: string): {
  attemptId: string;
  timestamp: string;
} | null {
  try {
    const details = JSON.parse(
      localStorage.getItem('quizlab_attempted_details') || '{}'
    ) as Record<string, any>;

    return details[testId] || null;
  } catch (error) {
    console.error('Error getting attempt details:', error);
    return null;
  }
}

/**
 * Clear attempt history (admin only)
 */
export function clearAttemptHistory(testId?: string): void {
  if (testId) {
    // Clear specific test
    sessionStorage.removeItem(`quizlab_attempt_${testId}`);

    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;
    delete storedAttempts[testId];
    localStorage.setItem('quizlab_device_attempts', JSON.stringify(storedAttempts));

    const details = JSON.parse(
      localStorage.getItem('quizlab_attempted_details') || '{}'
    ) as Record<string, any>;
    delete details[testId];
    localStorage.setItem('quizlab_attempted_details', JSON.stringify(details));

    localAttemptCache.delete(testId);
  } else {
    // Clear all attempts
    const keys = Array.from(sessionStorage.keys());
    keys.forEach(key => {
      if (key.startsWith('quizlab_attempt_')) {
        sessionStorage.removeItem(key);
      }
    });
    localStorage.removeItem('quizlab_device_attempts');
    localStorage.removeItem('quizlab_attempted_details');
    localAttemptCache.clear();
  }
}

/**
 * Get all attempted tests
 */
export function getAllAttemptedTests(): string[] {
  try {
    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;

    return Object.keys(storedAttempts);
  } catch (error) {
    console.error('Error getting attempted tests:', error);
    return [];
  }
}

/**
 * Check if can retry (24 hours passed)
 */
export function canRetryTest(testId: string): boolean {
  try {
    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;

    if (!storedAttempts[testId]) {
      return true;
    }

    const timeSinceAttempt = Date.now() - storedAttempts[testId];
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return timeSinceAttempt >= twentyFourHours;
  } catch (error) {
    console.error('Error checking retry eligibility:', error);
    return true;
  }
}

/**
 * Get time until can retry (in milliseconds)
 */
export function getTimeUntilRetry(testId: string): number {
  try {
    const storedAttempts = JSON.parse(
      localStorage.getItem('quizlab_device_attempts') || '{}'
    ) as Record<string, number>;

    if (!storedAttempts[testId]) {
      return 0;
    }

    const timeSinceAttempt = Date.now() - storedAttempts[testId];
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceAttempt >= twentyFourHours) {
      return 0;
    }

    return twentyFourHours - timeSinceAttempt;
  } catch (error) {
    console.error('Error calculating retry time:', error);
    return 0;
  }
}

/**
 * Format remaining time until retry
 */
export function formatRetryTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
