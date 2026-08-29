export type Unit = '億円' | '万円';

export function normalize(input: string): number | null {
  const s = input
    .replace(/[０-９．，]/g, (char) => '0123456789.,'['０１２３４５６７８９．，'.indexOf(char)])
    .replace(/[，,\s]/g, '')
    .trim();

  if (!/^\d+(\.\d+)?$/.test(s)) {
    return null;
  }

  return Number(s);
}

export function correctAnswer(yen: number): { unit: Unit; value: number } {
  if (yen >= 1e8) {
    return { unit: '億円', value: yen / 1e8 };
  }

  return { unit: '万円', value: yen / 1e4 };
}

export function judge(
  yen: number,
  input: number | null,
  unit: Unit | null,
): boolean {
  if (input === null || unit === null) {
    return false;
  }

  const answer = correctAnswer(yen);
  if (unit !== answer.unit) {
    return false;
  }

  return Math.abs(input - answer.value) < Math.max(1e-9, answer.value * 1e-9);
}

export function evaluateAttempt(
  yen: number,
  input: number | null,
  unit: Unit | null,
): { correct: boolean; unitMismatchOnly: boolean } {
  if (input === null || unit === null) {
    return { correct: false, unitMismatchOnly: false };
  }

  const answer = correctAnswer(yen);
  const numericMatches = Math.abs(input - answer.value) < Math.max(1e-9, answer.value * 1e-9);

  if (unit !== answer.unit) {
    return { correct: false, unitMismatchOnly: numericMatches };
  }

  return { correct: numericMatches, unitMismatchOnly: false };
}
