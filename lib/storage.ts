import type { Question } from './question';

export type Unit = '億円' | '万円';

export interface Attempt {
  questionId: string;
  inputRaw: string;
  inputValue: number | null;
  unit: Unit | null;
  correct: boolean;
  unitMismatchOnly: boolean;
  elapsedMs: number;
}

export interface SessionRecord {
  id: string;
  playedAt: string;
  totalMs: number;
  correctCount: number;
  questions: Question[];
  attempts: Attempt[];
  settings: { capAt100Oku: boolean };
}

export interface QuizSettings {
  capAt100Oku: boolean;
  showElapsedTime: boolean;
}

const RECORD_KEY = 'nst2:records';
const SETTINGS_KEY = 'nst2:settings';

const defaultSettings: QuizSettings = {
  capAt100Oku: false,
  showElapsedTime: true,
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readRecords(): SessionRecord[] {
  const records = safeRead<SessionRecord[]>(RECORD_KEY, []);
  return Array.isArray(records) ? records.slice(0, 20) : [];
}

export function writeRecords(records: SessionRecord[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(records.slice(0, 20)));
  } catch {
    // ignore localStorage failures gracefully
  }
}

export function readSettings(): QuizSettings {
  const settings = safeRead<Partial<QuizSettings>>(SETTINGS_KEY, {});
  return { ...defaultSettings, ...settings };
}

export function writeSettings(settings: QuizSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore localStorage failures gracefully
  }
}

export function getBestRecord(records: SessionRecord[]): SessionRecord | null {
  if (!records.length) {
    return null;
  }

  const sorted = [...records].sort((a, b) => {
    if (b.correctCount !== a.correctCount) {
      return b.correctCount - a.correctCount;
    }
    return a.totalMs - b.totalMs;
  });

  return sorted[0] ?? null;
}
