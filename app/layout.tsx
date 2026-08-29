import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'データセンスアプリ 2',
  description: '千円 / 百万円 / M 表示の金額を瞬時に億円・万円へ落とす練習アプリ',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#f3f4f6] text-slate-900 antialiased dark:bg-[#111827] dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
