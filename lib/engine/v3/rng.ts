export interface SeededRng {
  seed: string;
  next: () => number;
  int: (min: number, max: number) => number;
  bool: (probability?: number) => boolean;
  pick: <T>(values: T[]) => T;
  shuffle: <T>(values: T[]) => T[];
  fork: (tag: string) => SeededRng;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextXorshift(state: number): number {
  let x = state >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function createSeededRng(seed: string | number): SeededRng {
  const seedStr = typeof seed === "number" ? `n:${seed}` : seed;
  let state = hashSeed(seedStr) || 1;

  const next = (): number => {
    state = nextXorshift(state);
    return state / 0xffffffff;
  };

  const rng: SeededRng = {
    seed: seedStr,
    next,
    int(min: number, max: number) {
      if (max < min) {
        throw new Error(`Invalid rng.int bounds: ${min}..${max}`);
      }
      return Math.floor(next() * (max - min + 1)) + min;
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
    pick<T>(values: T[]) {
      if (values.length === 0) {
        throw new Error("Cannot pick from an empty array");
      }
      return values[rng.int(0, values.length - 1)];
    },
    shuffle<T>(values: T[]) {
      const cloned = [...values];
      for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = rng.int(0, i);
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
      }
      return cloned;
    },
    fork(tag: string) {
      return createSeededRng(`${seedStr}::${tag}`);
    },
  };

  return rng;
}
