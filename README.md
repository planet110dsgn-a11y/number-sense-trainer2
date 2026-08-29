# データセンスアプリ 2

千円 / 百万円 / M 表示の金額を、瞬時に「◯◯億円・◯◯万円」に落とす感覚を鍛えるモバイル向けの出題アプリです。

## 何のアプリか
- 10問セットで「千円」「百万円」「M」の表記を混ぜて出題します
- 回答は数値入力 + 単位選択（億円 / 万円）で行います
- 片手操作を前提としたスマホ縦画面設計です
- localStorage にベスト記録を保存します

## ローカル起動方法

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いて利用します。

## Vercel へのデプロイ手順

1. GitHub にこのリポジトリを push
2. Vercel の「Add New Project」から GitHub リポジトリを選択
3. Next.js プロジェクトとしてそのままインポート
4. デフォルト設定でデプロイ

```bash
git add .
git commit -m "feat: 初期実装"
git push origin main
```

Vercel で自動デプロイされ、URL でそのまま利用できます。
