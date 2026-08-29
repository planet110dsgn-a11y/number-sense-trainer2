# データセンスアプリ2（number-sense-trainer2）仕様書

千円 / 百万円 / M 表示の金額を、瞬時に「◯◯億円・◯◯万円」に変換できる感覚を鍛えるための出題アプリ。

- **プロジェクト名**: `number-sense-trainer2`（v1 の `number-sense-trainer` とは別リポジトリ。既存には手を入れない）
- **利用シーン**: 通勤電車内、スマホ縦持ち・片手操作
- **公開**: GitHub → Vercel（URL をブラウザで開くだけで使える）

---

## 1. スコープ

### 背景
社内資料では「千円」「百万円」「M」の3表記が混在して使われる。どの表記で書かれていても、
瞬時に「◯◯億円・◯◯万円」の実感に落とせるようにすることが本アプリの目的。

### やること
- 千円表示 / 百万円表示 / M 表示 のいずれかで金額を出題
- 回答は「数値の自由入力」＋「単位プルダウン（億円 / 万円）」
- 1 セット 10 問、タイム計測、記録の保存と比較

### やらないこと（v2 では対象外）
- ログイン、サーバーサイド DB、ランキング共有
- 円 → 千円 のような逆方向の出題（将来拡張として構造だけ残す）

---

## 2. 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 15（App Router）/ React 19 |
| 言語 | TypeScript（strict） |
| スタイル | Tailwind CSS v4 |
| 状態管理 | React の useState / useReducer のみ（外部ライブラリ不要） |
| 永続化 | `localStorage` |
| テスト | Vitest（出題生成・判定ロジックの単体テスト） |
| デプロイ | Vercel（GitHub 連携で push→自動デプロイ） |

- 全画面クライアントコンポーネント。API ルート・サーバーアクションは使わない。
- `localStorage` アクセスは必ず `try/catch` で包み、読めない場合も動作すること。
- PWA 対応（`manifest.json` ＋ アイコン）。ホーム画面追加でフルスクリーン起動できると望ましい（必須ではない）。

---

## 3. 出題範囲（元表の定義）

出題対象は下表の ● のセルのみ。「実額の桁」ごとに出題対象の表示形式が決まる。

| 実額の桁 | 実額（円） | M表示 | 百万円表示 | 千円表示 |
|---|---|:-:|:-:|:-:|
| 1千円 | 1,000 | − | − | − |
| 1万円 | 10,000 | − | − | ● |
| 10万円 | 100,000 | − | − | ● |
| 100万円 | 1,000,000 | − | − | ● |
| 1,000万円 | 10,000,000 | ● | ● | ● |
| 1億円 | 100,000,000 | ● | ● | ● |
| 10億円 | 1,000,000,000 | ● | ● | ● |
| 100億円 | 10,000,000,000 | ● | ● | ● |
| 1,000億円 | 100,000,000,000 | ● | ● | ● |

まとめると:

- **千円表示**: 実額 1e4 〜 1e11 の 8 桁分
- **百万円表示 / M表示**: 実額 1e7 〜 1e11 の 5 桁分
- M表示と百万円表示は**同じ数値**（M = 百万円）。表示ラベルだけが異なる。
- M表示を別形式として持つ理由は、**社内資料で「千円」「百万円」「M」が混在して使われる**ため。
  どの表記で来ても同じ桁感で読めるようにするのが本アプリの狙いなので、**1セット10問の中で3表記を必ず混ぜる**こと（4.3 参照）。
  書式は `3,750M` 固定。`JPY 3,750M` のような英文レポート書式には**しない**。

### 表示書式

| 形式 | 例（実額 3,750,000,000 円 = 37.5億円） |
|---|---|
| 千円表示 | `3,750,000 千円` |
| 百万円表示 | `3,750 百万円` |
| M表示 | `3,750M` |

- 3 桁カンマ区切り必須（桁感を掴む訓練なので、カンマがないと意味がない）。
- 出題の数値部分は大きく（36〜48px 相当）、単位は一回り小さく表示する。

---

## 4. 出題生成ロジック

### 4.1 方針
「端数あり（有効数字 2〜3 桁）」の実務的な数値を出す。ただし**画面に表示される数値は必ず整数**にする（`37.5千円` のような不自然な表示を出さない）。

### 4.2 アルゴリズム

```ts
type DisplayType = 'sen' | 'mil' | 'M';   // 千円 / 百万円 / M

const CONFIG: Record<DisplayType, { divisor: number; decades: number[] }> = {
  sen: { divisor: 1e3, decades: [1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11] },
  mil: { divisor: 1e6, decades: [1e7, 1e8, 1e9, 1e10, 1e11] },
  M:   { divisor: 1e6, decades: [1e7, 1e8, 1e9, 1e10, 1e11] },
};

function generateQuestion(type: DisplayType, rng = Math.random): Question {
  const { divisor, decades } = CONFIG[type];
  const decade = pick(decades, rng);

  // 有効数字は 2 桁 or 3 桁。ただし表示値が整数にならない場合は 2 桁に落とす
  let sig = rng() < 0.5 ? 2 : 3;
  if (decade < Math.pow(10, sig - 1) * divisor) sig = 2;

  // 仮数：2桁なら 10〜99、3桁なら 100〜999
  const lo = Math.pow(10, sig - 1);
  const hi = Math.pow(10, sig) - 1;
  const mantissa = lo + Math.floor(rng() * (hi - lo + 1));

  const yen = (mantissa * decade) / Math.pow(10, sig - 1); // 実額（円）
  const shown = yen / divisor;                             // 画面に出す数値（必ず整数）

  return { type, yen, shown, decade, sig };
}
```

### 4.3 出題セットの組み立て（10問）
- 表示形式は毎問ランダム。ただし **10 問の中に 千円 / 百万円 / M が最低 1 問ずつ**含まれるようにする（シャッフルして配置）。
- **同一の実額が同一セット内で重複しない**こと。
- 出題順は固定せずセットごとにシャッフル。

### 4.4 上限の解釈（注意点）
表の最上段 `1,000億円` は「1,000億円**台**」と解釈し、1,000億円〜9,990億円を出題する（decade = 1e11）。
桁が大きすぎると感じた場合に備え、設定で **上限を「100億円台まで」に切り下げられるトグル**を用意しておく（デフォルトは 1,000億円台まで ON）。

### 4.5 生成される値のサンプル

| 表示 | 実額 | 正解 |
|---|---|---|
| `37 千円` | 37,000 | 3.7 万円 |
| `344 千円` | 344,000 | 34.4 万円 |
| `2,250 千円` | 2,250,000 | 225 万円 |
| `99,900 千円` | 99,900,000 | 9,990 万円 |
| `105,000 千円` | 105,000,000 | 1.05 億円 |
| `32 百万円` | 32,000,000 | 3,200 万円 |
| `580 百万円` | 580,000,000 | 5.8 億円 |
| `3,750 百万円` | 3,750,000,000 | 37.5 億円 |
| `86,000M` | 86,000,000,000 | 860 億円 |
| `310,000M` | 310,000,000,000 | 3,100 億円 |

---

## 5. 回答 UI と判定ルール

### 5.1 入力
- **数値入力**: `<input type="text" inputMode="decimal">`（スマホで数字キーパッドが出ること。`type="number"` はスピナーやカンマ非対応のため使わない）
  - 出題表示直後に `autoFocus`
  - 全角数字・カンマ・空白・全角ピリオドを許容し、正規化してからパースする
- **単位選択**: `<select>` で `億円` / `万円`
  - 初期値は空（`単位を選択`）。未選択のままでは回答確定できない
  - タップ領域は最小 44px 四方
- **確定**: 「回答」ボタン ＋ ソフトキーボードの Enter でも確定

### 5.2 入力の正規化

```ts
function normalize(input: string): number | null {
  const s = input
    .replace(/[０-９．，]/g, c => '0123456789.,'['０１２３４５６７８９．，'.indexOf(c)])
    .replace(/[,\s]/g, '')
    .trim();
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}
```

### 5.3 正解判定 — 「自然な単位のみ正解」

```ts
function correctAnswer(yen: number): { unit: '億円' | '万円'; value: number } {
  return yen >= 1e8
    ? { unit: '億円', value: yen / 1e8 }
    : { unit: '万円', value: yen / 1e4 };
}

function judge(yen: number, input: number | null, unit: '億円' | '万円' | null): boolean {
  if (input === null || unit === null) return false;
  const c = correctAnswer(yen);
  if (unit !== c.unit) return false;
  return Math.abs(input - c.value) < Math.max(1e-9, c.value * 1e-9);  // 浮動小数対策
}
```

- **1億円未満は「万円」、1億円以上は「億円」のみ正解。**
  - 例: `1,000万円` の問題に `0.1 + 億円` は **不正解**
  - 例: `1.05億円` の問題に `10500 + 万円` は **不正解**
- 数値が合っていて単位だけ違う場合は、フィードバックで「単位が違います」と明示する（丸ごと×より学習効果が高い）。

### 5.4 フィードバック
- 回答確定 → 即座に判定を表示し、自動で次の問題へ
  - 正解: ○ を **0.6 秒** 表示
  - 不正解: × ＋ 正解（例: `正解 37.5 億円`）を **1.5 秒** 表示
- **フィードバック中もタイマーは止めない**（記録の一貫性のため）。この仕様は結果画面に注記する。

---

## 6. 画面構成

### 6.1 スタート画面 `/`
- タイトル「データセンスアプリ 2」
- 「スタート」ボタン（大きく、親指が届く下寄り）
- ベスト記録の表示（正答数 / タイム）
- 設定（折りたたみ）
  - 上限を 100億円台までにする（トグル、デフォルト OFF）
  - 経過タイムを画面に表示する（トグル、デフォルト ON）
- 遷移時に **3-2-1 のカウントダウン**を挟んでからタイマー開始（読み込み待ちがタイムに乗らないように）

### 6.2 出題画面 `/quiz`
上から順に:
1. 進捗 `3 / 10` ＋ 進捗バー
2. 経過タイム `00:12.4`（設定で非表示可）
3. 出題カード: 数値を特大表示 ＋ 単位ラベル
4. 「＝ いくら？」
5. 数値入力欄
6. 単位プルダウン（億円 / 万円）
7. 「回答」ボタン（全幅・高さ 56px）
8. フィードバック領域（○ / × ＋ 正解）

- 縦 1 画面に収め、スクロールなしで完結させること（iPhone SE 相当 375×667 で検証）。
- 途中終了ボタン（× アイコン）を右上に置き、確認ダイアログなしでスタート画面に戻す（記録は保存しない）。

### 6.3 結果画面 `/result`
- 総タイム（0.1 秒表示）／ 正答数 `8 / 10` ／ 1問平均タイム
- ベスト更新時はバッジ表示
- 全 10 問の一覧（表形式）
  - 出題 / 自分の回答 / 正解 / 所要時間 / ○×
  - 不正解の行はハイライト
- 「もう一度」ボタン、「トップへ」ボタン
- 「フィードバック表示時間もタイムに含まれます」の注記

---

## 7. タイム計測

- `performance.now()` を使用（`Date.now()` は使わない）。
- 計測開始: カウントダウン終了時（第1問表示と同時）
- 計測終了: 第10問の回答確定時（10問目のフィードバックは計測外）
- 問題ごとの所要時間も記録（表示から回答確定まで）
- 表示形式: `mm:ss.s`（例 `01:23.4`）

---

## 8. データ構造と永続化

```ts
type DisplayType = 'sen' | 'mil' | 'M';
type Unit = '億円' | '万円';

interface Question {
  id: string;
  type: DisplayType;
  yen: number;      // 実額（円）
  shown: number;    // 画面に出す整数
  decade: number;
  sig: 2 | 3;
}

interface Attempt {
  questionId: string;
  inputRaw: string;
  inputValue: number | null;
  unit: Unit | null;
  correct: boolean;
  unitMismatchOnly: boolean;  // 数値は合っていて単位だけ違った
  elapsedMs: number;
}

interface SessionRecord {
  id: string;
  playedAt: string;      // ISO8601
  totalMs: number;
  correctCount: number;  // 0-10
  questions: Question[];
  attempts: Attempt[];
  settings: { capAt100Oku: boolean };
}
```

- localStorage キー: `nst2:records`（`SessionRecord[]`、**直近 20 件**のみ保持）
- ベストの定義: **正答数 降順 → totalMs 昇順** の第 1 位
- 保存・読み込みは try/catch。JSON パース失敗時は空配列にフォールバックし、壊れたデータは捨てる。
- `nst2:settings` に設定を保存。

---

## 9. デザイン

- **モバイルファースト**。max-width 480px で中央寄せ。
- ダークモード対応（`prefers-color-scheme`）。電車内・夜間の利用を想定し、ダークをやや優先して調整。
- 数値は等幅系フォント（`font-variant-numeric: tabular-nums`）で桁ズレを防ぐ。
- 正解 = グリーン、不正解 = レッド。色だけに頼らず ○ / × のアイコンも併記。
- アニメーションは控えめ（フィードバックのフェードのみ）。`prefers-reduced-motion` を尊重。

---

## 10. テスト（Vitest）

最低限これだけは書くこと:

1. `generateQuestion` を各表示形式 × 各 decade で 10,000 回実行し、
   - `shown` が**常に整数**であること
   - `yen` が定義された出題範囲内であること
   - 有効数字が 2〜3 桁であること
2. `correctAnswer` の境界テスト
   - `99,900,000` → `9990 万円`
   - `100,000,000` → `1 億円`
   - `105,000,000` → `1.05 億円`
   - `10,000` → `1 万円`
3. `judge` のテスト
   - 単位違い（`1,000万円` に `0.1 億円`）が **false** になること
   - 全角入力 `３７．５` ＋ `億円` が true になること
   - カンマ入り `3,700` が正しくパースされること
   - 空入力・不正文字列が false になること
4. 10問セット生成で、3 種類の表示形式が最低 1 問ずつ含まれ、実額の重複がないこと

---

## 11. 受け入れ基準

- [ ] スマホの Safari / Chrome で、URL を開いて 3 タップ以内に 1 問目が出る
- [ ] 数値入力欄をタップすると数字キーパッドが出る
- [ ] 10 問終わると自動で結果画面に遷移し、タイムと正誤が表示される
- [ ] リロードしてもベスト記録が残っている
- [ ] 出題画面が 375×667 でスクロールなしに収まる
- [ ] `npm run build` が型エラー・lint エラーなしで通る
- [ ] Vitest が全て green

---

## 12. リポジトリ構成（推奨）

```
number-sense-trainer2/
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # スタート
│   ├── quiz/page.tsx       # 出題
│   └── result/page.tsx     # 結果
├── components/
│   ├── QuestionCard.tsx
│   ├── AnswerInput.tsx
│   ├── Feedback.tsx
│   ├── Timer.tsx
│   └── ResultTable.tsx
├── lib/
│   ├── question.ts         # 出題生成
│   ├── judge.ts            # 正規化・判定
│   ├── format.ts           # カンマ・タイム整形
│   └── storage.ts          # localStorage
├── lib/__tests__/
│   ├── question.test.ts
│   └── judge.test.ts
├── public/                 # manifest.json, icons
└── docs/SPEC.md            # 本ファイル
```

---

## 13. デプロイ手順

```bash
npx create-next-app@latest number-sense-trainer2 --ts --tailwind --app --eslint
cd number-sense-trainer2
# 実装
npm run build            # ローカルで通ることを確認
git init && git add -A && git commit -m "feat: データセンスアプリ2"
gh repo create number-sense-trainer2 --public --source=. --push
```

Vercel 側は GitHub リポジトリを Import するだけ（設定変更不要）。以降は `git push` で自動デプロイ。
