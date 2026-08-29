export type DisplayType = 'sen' | 'mil' | 'M';

export interface Question {
  id: string;
  type: DisplayType;
  yen: number;
  shown: number;
  decade: number;
  sig: 2 | 3;
}

const CONFIG: Record<DisplayType, { divisor: number; decades: number[] }> = {
  sen: { divisor: 1e3, decades: [1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11] },
  mil: { divisor: 1e6, decades: [1e7, 1e8, 1e9, 1e10, 1e11] },
  M: { divisor: 1e6, decades: [1e7, 1e8, 1e9, 1e10, 1e11] },
};

const randomFrom = <T,>(items: T[], rng: () => number): T => {
  const index = Math.floor(rng() * items.length);
  return items[index];
};

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function generateQuestion(type: DisplayType, rng: () => number = Math.random): Question {
  const { divisor, decades } = CONFIG[type];

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const decade = randomFrom(decades, rng);
    let sig: 2 | 3 = rng() < 0.5 ? 2 : 3;

    if (decade < 10 ** (sig - 1) * divisor) {
      sig = 2;
    }

    const lo = 10 ** (sig - 1);
    const hi = 10 ** sig - 1;
    const mantissa = lo + Math.floor(rng() * (hi - lo + 1));
    const yen = (mantissa * decade) / 10 ** (sig - 1);
    const shown = yen / divisor;

    if (Number.isInteger(shown)) {
      return {
        id: `${type}-${yen.toFixed(6)}-${attempt}`,
        type,
        yen,
        shown,
        decade,
        sig,
      };
    }
  }

  throw new Error(`Unable to generate a valid integer question for ${type}`);
}

export function buildQuestionSet(
  rng: () => number = Math.random,
  capAt100Oku = false,
): Question[] {
  const types: DisplayType[] = ['sen', 'mil', 'M'];
  const questions: Question[] = [];
  const seenYen = new Set<number>();

  for (const type of shuffle([...types], rng)) {
    let candidate: Question | null = null;
    let attempts = 0;
    const allowed = capAt100Oku ? CONFIG[type].decades.filter((value) => value <= 1e10) : CONFIG[type].decades;

    while (!candidate && attempts < 600) {
      const next = generateQuestion(type, () => {
        const raw = rng();
        return (raw + attempts * 0.17 + 0.13) % 1;
      });
      if (allowed.includes(next.decade) && !seenYen.has(next.yen)) {
        candidate = next;
        seenYen.add(next.yen);
      }
      attempts += 1;
    }

    if (!candidate) {
      throw new Error(`Unable to generate a unique question for type ${type}`);
    }

    questions.push(candidate);
  }

  while (questions.length < 10) {
    const type = randomFrom(types, rng);
    const allowed = capAt100Oku ? CONFIG[type].decades.filter((value) => value <= 1e10) : CONFIG[type].decades;
    let candidate: Question | null = null;
    let attempts = 0;

    while (!candidate && attempts < 500) {
      const next = generateQuestion(type, () => {
        const raw = rng();
        return (raw + attempts * 0.19 + 0.07) % 1;
      });

      if (!allowed.includes(next.decade) || seenYen.has(next.yen)) {
        attempts += 1;
        continue;
      }

      candidate = next;
      seenYen.add(next.yen);
      questions.push(next);
      break;
    }

    if (!candidate) {
      break;
    }
  }

  return shuffle(questions, rng);
}
