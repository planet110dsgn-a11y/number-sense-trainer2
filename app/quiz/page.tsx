'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { advanceCountdown } from '@/lib/countdown';
import { formatDuration } from '@/lib/format';
import { correctAnswer, evaluateAttempt, normalize, type Unit } from '@/lib/judge';
import { buildQuestionSet, type Question } from '@/lib/question';
import { readSettings, type Attempt, type SessionRecord } from '@/lib/storage';

const COUNTDOWN_SECONDS = 3;

export default function QuizPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const questionStartedRef = useRef<number>(0);
  const startTimerRef = useRef<number | null>(null);
  const initialSettings = readSettings();
  const [settings] = useState(initialSettings);
  const [questions] = useState<Question[]>(() => buildQuestionSet(Math.random, initialSettings.capAt100Oku));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [input, setInput] = useState('');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'wrong'; text: string } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!questions.length) {
      return;
    }

    if (!isCountingDown) {
      if (!inputRef.current) {
        return;
      }

      inputRef.current.focus();
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => {
        const result = advanceCountdown(prev);

        if (result.shouldStartQuestion) {
          setIsCountingDown(false);
          questionStartedRef.current = performance.now();
          return 0;
        }

        return result.next;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [questions, isCountingDown, currentIndex, countdown]);

  useEffect(() => {
    if (isCountingDown || !questions.length) {
      return;
    }

    if (startTimerRef.current === null) {
      startTimerRef.current = performance.now();
    }

    const tick = () => {
      setElapsedMs(performance.now() - (startTimerRef.current ?? performance.now()));
    };

    const frameId = window.setInterval(tick, 50);
    return () => window.clearInterval(frameId);
  }, [isCountingDown, questions.length]);

  const currentQuestion = questions[currentIndex];

  const finishQuiz = (finalAttempts: Attempt[]) => {
    const totalMs = elapsedMs;
    const correctCount = finalAttempts.filter((attempt) => attempt.correct).length;
    const session: SessionRecord = {
      id: `session-${Date.now()}`,
      playedAt: new Date().toISOString(),
      totalMs,
      correctCount,
      questions,
      attempts: finalAttempts,
      settings: { capAt100Oku: settings.capAt100Oku },
    };
    const existing = JSON.parse(window.sessionStorage.getItem('nst2:session') ?? 'null') as SessionRecord | null;
    if (existing) {
      window.sessionStorage.removeItem('nst2:session');
    }
    window.sessionStorage.setItem('nst2:session', JSON.stringify(session));

    const records = JSON.parse(window.localStorage.getItem('nst2:records') ?? '[]') as SessionRecord[];
    const nextRecords = [session, ...records].slice(0, 20);
    window.localStorage.setItem('nst2:records', JSON.stringify(nextRecords));
    router.push('/result');
  };

  const submitAnswer = () => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    const value = normalize(input);
    const evaluated = evaluateAttempt(currentQuestion.yen, value, unit);
    const answer = correctAnswer(currentQuestion.yen);
    const currentAttempt: Attempt = {
      questionId: currentQuestion.id,
      inputRaw: input,
      inputValue: value,
      unit,
      correct: evaluated.correct,
      unitMismatchOnly: evaluated.unitMismatchOnly,
      elapsedMs: performance.now() - questionStartedRef.current,
    };

    const nextAttempts = [...attempts, currentAttempt];
    setAttempts(nextAttempts);
    setIsSubmitting(true);

    if (evaluated.correct) {
      setFeedback({ kind: 'correct', text: '○' });
    } else {
      const detail = evaluated.unitMismatchOnly ? '単位が違います' : `正解 ${answer.value} ${answer.unit}`;
      setFeedback({ kind: 'wrong', text: `× ${detail}` });
    }

    const isLastQuestion = currentIndex === questions.length - 1;
    window.setTimeout(() => {
      if (isLastQuestion) {
        finishQuiz(nextAttempts);
        return;
      }

      setCurrentIndex((prev) => prev + 1);
      setInput('');
      setUnit(null);
      setFeedback(null);
      setIsSubmitting(false);
      questionStartedRef.current = performance.now();
    }, evaluated.correct ? 600 : 1500);
  };

  useEffect(() => {
    if (!isCountingDown && questions.length > 0 && !feedback) {
      questionStartedRef.current = performance.now();
    }
  }, [currentIndex, feedback, isCountingDown, questions.length]);

  if (!currentQuestion) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-slate-700">読み込み中...</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const thisAnswer = correctAnswer(currentQuestion.yen);

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-3 text-slate-900 dark:bg-[#111827] dark:text-slate-50">
      <div className="mx-auto flex h-[667px] max-w-[420px] flex-col overflow-hidden rounded-[28px] bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between p-4">
          <button type="button" onClick={() => router.push('/')} className="text-2xl font-bold text-slate-500">×</button>
          <div className="text-sm text-slate-500">{currentIndex + 1} / {questions.length}</div>
        </div>

        <div className="px-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="px-4 pt-3">
          {settings.showElapsedTime && (
            <div className="text-right text-[13px] font-medium text-slate-500 dark:text-slate-300">経過時間 {formatDuration(elapsedMs)}</div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
          {isCountingDown ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-[72px] font-black tracking-tight text-slate-900 dark:text-white">{countdown}</div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <div className="flex items-end justify-center gap-2">
                  <div className="text-[42px] font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('en-US').format(currentQuestion.shown)}
                  </div>
                  <div className="pb-1 text-xl font-bold text-slate-600 dark:text-slate-300">
                    {currentQuestion.type === 'M' ? 'M' : currentQuestion.type === 'mil' ? '百万円' : '千円'}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-lg font-semibold text-slate-600 dark:text-slate-300">＝ いくら？</div>

              <div className="mt-4 space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitAnswer();
                    }
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-lg text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  placeholder="数字を入力"
                  autoComplete="off"
                  aria-label="金額入力"
                />

                <select
                  value={unit ?? ''}
                  onChange={(event) => setUnit(event.target.value === '' ? null : (event.target.value as Unit))}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-lg text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  aria-label="単位選択"
                >
                  <option value="">単位を選択</option>
                  <option value="億円">億円</option>
                  <option value="万円">万円</option>
                </select>

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={isSubmitting || input.trim() === '' || unit === null}
                  className="h-14 w-full rounded-xl bg-emerald-500 text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                >
                  回答
                </button>
              </div>

              <div className="mt-4 flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-2xl dark:border-slate-700 dark:bg-slate-800/80">
                {feedback ? (
                  <div className={`font-black ${feedback.kind === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {feedback.text}
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>

              {feedback && (
                <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-300">
                  正解: {thisAnswer.value} {thisAnswer.unit}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
