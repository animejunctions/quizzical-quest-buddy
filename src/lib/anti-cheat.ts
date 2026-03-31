/**
 * Anti-cheat protection utilities
 * Implements device fingerprinting, strict validation, and cheat detection
 */

// Generate device fingerprint using multiple signals
export async function generateDeviceFingerprint(): Promise<string> {
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency?.toString() || 'unknown',
    navigator.deviceMemory?.toString() || 'unknown',
    navigator.maxTouchPoints?.toString() || 'unknown',
    screen.width + 'x' + screen.height,
    screen.colorDepth?.toString() || 'unknown',
    screen.pixelDepth?.toString() || 'unknown',
    new Date().getTimezoneOffset().toString(),
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getPluginsFingerprint(),
    getLocalStorageSize(),
    getSessionStorageSize(),
  ];

  const fingerprint = signals.join('|');
  return hashString(fingerprint);
}

// Canvas fingerprinting - extracts canvas context hash
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas_unavailable';

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);

    return canvas.toDataURL().substring(0, 50);
  } catch {
    return 'canvas_error';
  }
}

// WebGL fingerprinting
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl_unavailable';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'webgl_debug_unavailable';

    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}_${renderer}`.substring(0, 50);
  } catch {
    return 'webgl_error';
  }
}

// Browser plugins fingerprinting
function getPluginsFingerprint(): string {
  try {
    const plugins = navigator.plugins;
    let pluginStr = '';
    for (let i = 0; i < plugins.length; i++) {
      pluginStr += plugins[i].name + '|';
    }
    return pluginStr.substring(0, 50) || 'no_plugins';
  } catch {
    return 'plugins_error';
  }
}

// Storage size estimation
function getLocalStorageSize(): string {
  try {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size.toString();
  } catch {
    return 'storage_error';
  }
}

function getSessionStorageSize(): string {
  try {
    let size = 0;
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        size += sessionStorage[key].length + key.length;
      }
    }
    return size.toString();
  } catch {
    return 'storage_error';
  }
}

// Simple string hash function
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Strict validation checks
export interface CheatCheckResult {
  isPassing: boolean;
  violations: string[];
  warningLevel: 'low' | 'medium' | 'high';
  details: Record<string, any>;
}

export function performStrictValidation(
  answers: (number | null)[],
  totalQuestions: number,
  timeElapsed: number,
  timeLimit: number,
  warningCount: number
): CheatCheckResult {
  const violations: string[] = [];
  let warningLevel: 'low' | 'medium' | 'high' = 'low';
  const details: Record<string, any> = {};

  // Check 1: Impossible completion time (faster than 3 seconds per question)
  const minTime = totalQuestions * 3; // seconds
  if (timeElapsed < minTime) {
    violations.push('Completion too fast');
    details.timeAnomaly = { actual: timeElapsed, minimum: minTime };
  }

  // Check 2: Perfect score with suspiciously fast time
  const answered = answers.filter(a => a !== null).length;
  if (answered === totalQuestions && timeElapsed < totalQuestions * 10) {
    violations.push('Perfect score with insufficient time');
    details.scoreTimeAnomaly = { answered, timeElapsed };
  }

  // Check 3: Zero answered questions
  if (answered === 0) {
    violations.push('No questions answered');
    warningLevel = 'high';
  }

  // Check 4: All same answer selected (possible automation)
  if (answered > 0 && new Set(answers.filter(a => a !== null)).size === 1) {
    violations.push('All answers are identical');
    details.answerPattern = 'uniform';
  }

  // Check 5: Warning count threshold
  if (warningCount >= 3) {
    violations.push('Multiple anti-cheat violations detected');
    warningLevel = 'high';
    details.warningCount = warningCount;
  }

  // Check 6: Suspicious answer pattern (repeating patterns)
  const answerStr = answers.filter(a => a !== null).join('');
  if (answerStr.length > 10) {
    const hasPattern = /(.)\1{3,}|([0-3]){4,}/.test(answerStr);
    if (hasPattern) {
      violations.push('Suspicious answer pattern detected');
      details.answerPattern = 'repetitive';
    }
  }

  // Determine warning level based on violations
  if (violations.length === 0) {
    warningLevel = 'low';
  } else if (violations.length <= 2) {
    warningLevel = 'medium';
  } else {
    warningLevel = 'high';
  }

  return {
    isPassing: violations.length === 0 && warningLevel !== 'high',
    violations,
    warningLevel,
    details,
  };
}

// Rate limiting per device
const attemptTimestamps: Map<string, number[]> = new Map();
const MAX_ATTEMPTS_PER_HOUR = 3;
const MAX_ATTEMPTS_PER_DAY = 10;

export function checkRateLimit(deviceFingerprint: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  if (!attemptTimestamps.has(deviceFingerprint)) {
    attemptTimestamps.set(deviceFingerprint, [now]);
    return { allowed: true };
  }

  const timestamps = attemptTimestamps.get(deviceFingerprint)!;
  const recentHour = timestamps.filter(t => t > oneHourAgo);
  const recentDay = timestamps.filter(t => t > oneDayAgo);

  if (recentHour.length >= MAX_ATTEMPTS_PER_HOUR) {
    return { allowed: false, reason: `Maximum ${MAX_ATTEMPTS_PER_HOUR} attempts per hour exceeded` };
  }

  if (recentDay.length >= MAX_ATTEMPTS_PER_DAY) {
    return { allowed: false, reason: `Maximum ${MAX_ATTEMPTS_PER_DAY} attempts per day exceeded` };
  }

  timestamps.push(now);
  attemptTimestamps.set(deviceFingerprint, timestamps);

  return { allowed: true };
}

// Check for VPN/Proxy usage (basic)
export async function checkForVPN(): Promise<boolean> {
  try {
    // This is a basic check - in production, use a real VPN detection API
    const isPrivateNetwork =
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname.startsWith('192.168.') ||
      location.hostname.startsWith('10.');

    return isPrivateNetwork;
  } catch {
    return false;
  }
}

// Validate test integrity
export function validateTestIntegrity(
  originalQuestions: any[],
  currentQuestions: any[]
): { isValid: boolean; tamperedQuestions: string[] } {
  const tamperedQuestions: string[] = [];

  if (originalQuestions.length !== currentQuestions.length) {
    return { isValid: false, tamperedQuestions: ['Question count mismatch'] };
  }

  for (let i = 0; i < originalQuestions.length; i++) {
    const orig = originalQuestions[i];
    const curr = currentQuestions[i];

    // Verify question text hasn't been modified
    if (orig.question !== curr.question) {
      tamperedQuestions.push(`Q${i + 1}: Question text mismatch`);
    }

    // Verify correct answer hasn't been changed
    if (orig.correctAnswer !== curr.correctAnswer) {
      tamperedQuestions.push(`Q${i + 1}: Correct answer changed`);
    }

    // Verify options count matches
    if (orig.options.length !== curr.options.length) {
      tamperedQuestions.push(`Q${i + 1}: Option count mismatch`);
    }
  }

  return {
    isValid: tamperedQuestions.length === 0,
    tamperedQuestions,
  };
}
