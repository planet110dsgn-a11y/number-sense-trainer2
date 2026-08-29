'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDuration } from '@/lib/format';
import { readRecords } from '@/lib/storage';

export default function ResultPage() {
  const initialRecord = (() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const session = JSON.parse(window.sessionStorage.getItem('nst2:session') ?? 'null');
    const records = readRecords();
    return session ?? records[0] ?? null;
  })();

  const [record] = useState(initialRecord);

  if (!record) {
    return <div className="flex min-h-screen items-center justify-center text-lg">結果がありません</div>;
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-6 text-slate-900 dark:bg-[#111827] dark:text-slate-50">
      <div className="mx-auto flex h-[667px] max-w-[420px] flex-col rounded-[28px] bg-white p-4 shadow-xl dark:bg-slate-900">
        <div className="text-center text-2xl font-black">結果</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-slate-500">総タイム</div><div className="mt-1 text-lg font-bold">{formatDuration(record.totalMs)}</div></div>
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-slate-500">正答数</div><div className="mt-1 text-lg font-bold">{record.correctCount} / 10</div></div>
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-slate-500">平均</div><div className="mt-1 text-lg font-bold">{formatDuration(Math.round(record.totalMs / 10))}</div></div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-2 py-2">出題</th>
                <th className="px-2 py-2">自分の回答</th>
                <th className="px-2 py-2">正解</th>
                <th className="px-2 py-2">時間</th>
                <th className="px-2 py-2">判定</th>
              </tr>
            </thead>
            <tbody>
              {record.questions.map((question: { id: string; shown: number; yen: number }, index: number) => {
                const attempt = record.attempts[index];
                const correct = attempt?.correct ?? false;
                return (
                  <tr key={question.id} className={correct ? 'bg-white dark:bg-slate-900' : 'bg-red-50 dark:bg-red-950/30'}>
                    <td className="px-2 py-2">{question.shown}</td>
                    <td className="px-2 py-2">{attempt ? `${attempt.inputValue ?? ''} ${attempt.unit ?? ''}` : '-'}</td>
                    <td className="px-2 py-2">{question.yen / 1e8 >= 1 ? `${(question.yen / 1e8).toFixed(2)} 億円` : `${(question.yen / 1e4).toFixed(2)} 万円`}</td>
                    <td className="px-2 py-2">{formatDuration(attempt?.elapsedMs ?? 0)}</td>
                    <td className="px-2 py-2 font-bold text-green-600 dark:text-green-400">{correct ? '○' : '×'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3">
          <Link href="/quiz" className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center font-bold text-white">もう一度</Link>
          <Link href="/" className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center font-bold">トップへ</Link>
        </div>
        <div className="mt-3 text-center text-xs text-slate-500">フィードバック表示時間もタイムに含まれます</div>
      </div>
    </main>
  );
}
