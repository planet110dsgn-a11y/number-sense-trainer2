'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getBestRecord, readRecords, readSettings, writeSettings } from '@/lib/storage';

export default function HomePage() {
  const initialBest = (() => {
    const record = getBestRecord(readRecords());
    return record ? { correctCount: record.correctCount, totalMs: record.totalMs } : null;
  })();

  const [best, setBest] = useState<{ correctCount: number; totalMs: number } | null>(initialBest);
  const [settings, setSettings] = useState(() => readSettings());

  const handleToggle = (key: 'capAt100Oku' | 'showElapsedTime') => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setBest((current) => current);
    writeSettings(next);
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-6 text-slate-900 dark:bg-[#111827] dark:text-slate-50">
      <div className="mx-auto flex h-[667px] max-w-[420px] flex-col justify-between rounded-[28px] bg-white px-5 py-6 shadow-xl dark:bg-slate-900">
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Number Sense Trainer 2</p>
            <h1 className="mt-4 text-3xl font-black leading-tight">データセンスアプリ 2</h1>
          </div>

          <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-300">ベスト記録</div>
            {best ? (
              <div className="mt-1 text-xl font-bold">{best.correctCount} / 10 · {best.totalMs / 1000}s</div>
            ) : (
              <div className="mt-1 text-xl font-bold">未記録</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-3 text-base font-bold">設定</div>
            <div className="space-y-3 text-sm">
              <button type="button" onClick={() => handleToggle('capAt100Oku')} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>100億円台まで</span>
                <span className={`h-6 w-11 rounded-full p-1 ${settings.capAt100Oku ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${settings.capAt100Oku ? 'translate-x-5' : ''}`} />
                </span>
              </button>
              <button type="button" onClick={() => handleToggle('showElapsedTime')} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>経過タイム表示</span>
                <span className={`h-6 w-11 rounded-full p-1 ${settings.showElapsedTime ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${settings.showElapsedTime ? 'translate-x-5' : ''}`} />
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/quiz" className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-md">スタート</Link>
        </div>
      </div>
    </main>
  );
}
