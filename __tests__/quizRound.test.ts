/**
 * The Quiz bíblico round-selection + option-shuffling logic — pure display
 * order, mirrors `kidsQuiz.test.ts`'s pattern for `prepareKidsQuiz`.
 */
import {
  pickQuizRound,
  prepareQuizQuestion,
  prepareQuizRound,
  QUIZ_ROUND_SIZE,
  QUIZ_OPTION_COUNT,
} from '../src/features/quiz/quizRound';
import {QUIZ_BANK, QUIZ_CATEGORIES} from '../src/features/quiz/quizBank';

/** Deterministic RNG for reproducible tests: cycles through a fixed sequence. */
function seededRng(seed: number[]): () => number {
  let i = 0;
  return () => seed[i++ % seed.length];
}

describe('pickQuizRound', () => {
  it('returns QUIZ_ROUND_SIZE distinct questions by default', () => {
    const round = pickQuizRound(undefined, new Set(), Math.random);
    expect(round.length).toBe(QUIZ_ROUND_SIZE);
    expect(new Set(round.map(q => q.id)).size).toBe(QUIZ_ROUND_SIZE);
  });

  it('prefers questions not in `exclude`', () => {
    const excluded = new Set(
      QUIZ_BANK.slice(0, QUIZ_BANK.length - 3).map(q => q.id),
    );
    const round = pickQuizRound(3, excluded, Math.random);
    expect(round.every(q => !excluded.has(q.id))).toBe(true);
  });

  it('falls back to the full bank once fewer than `size` remain unseen', () => {
    const excluded = new Set(QUIZ_BANK.map(q => q.id));
    const round = pickQuizRound(QUIZ_ROUND_SIZE, excluded, Math.random);
    expect(round.length).toBe(QUIZ_ROUND_SIZE);
  });

  it('never asks for more than the bank has', () => {
    const round = pickQuizRound(9999, new Set(), Math.random);
    expect(round.length).toBe(QUIZ_BANK.length);
  });

  it('is deterministic for a fixed rng', () => {
    const rngSeq = [0.9, 0.1, 0.5, 0.2, 0.7, 0.3, 0.4, 0.6];
    const a = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), seededRng(rngSeq));
    const b = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), seededRng(rngSeq));
    expect(a).toEqual(b);
  });
});

describe('pickQuizRound — category filter (T18b "mazos por libro")', () => {
  it('returns only questions of the requested category, for every category', () => {
    for (const category of QUIZ_CATEGORIES) {
      const round = pickQuizRound(
        QUIZ_ROUND_SIZE,
        new Set(),
        Math.random,
        category,
      );
      expect(round.length).toBeGreaterThan(0);
      expect(round.every(q => q.category === category)).toBe(true);
    }
  });

  it('caps a round at the deck size when the deck is smaller than QUIZ_ROUND_SIZE', () => {
    // `historicos` has exactly ONE question (order-04, "2 Samuel"). A round for
    // it must be length 1 — which only holds if the category filter runs BEFORE
    // `Math.min(size, bank.length)`, not after a full-bank pick.
    const historicos = QUIZ_BANK.filter(q => q.category === 'historicos');
    expect(historicos.length).toBe(1);
    const round = pickQuizRound(
      QUIZ_ROUND_SIZE,
      new Set(),
      Math.random,
      'historicos',
    );
    expect(round.length).toBe(1);
    expect(round[0].category).toBe('historicos');
  });

  it('fallback stays within the category even when exclude empties the deck', () => {
    const deck = QUIZ_BANK.filter(q => q.category === 'evangelios');
    const excludeAll = new Set(deck.map(q => q.id));
    const round = pickQuizRound(
      QUIZ_ROUND_SIZE,
      excludeAll,
      Math.random,
      'evangelios',
    );
    expect(round.every(q => q.category === 'evangelios')).toBe(true);
    expect(round.length).toBe(Math.min(QUIZ_ROUND_SIZE, deck.length));
  });
});

describe('pickQuizRound — omitting category is unchanged behavior', () => {
  it('no category equals passing undefined (byte-identical for a fixed rng)', () => {
    const seq = [0.9, 0.1, 0.5, 0.2, 0.7, 0.3, 0.4, 0.6];
    const a = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), seededRng(seq));
    const b = pickQuizRound(
      QUIZ_ROUND_SIZE,
      new Set(),
      seededRng(seq),
      undefined,
    );
    expect(a).toEqual(b);
  });

  it('the default pick still returns a full-size, all-distinct round', () => {
    const round = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), Math.random);
    expect(round.length).toBe(QUIZ_ROUND_SIZE);
    expect(new Set(round.map(q => q.id)).size).toBe(QUIZ_ROUND_SIZE);
  });
});

describe('prepareQuizQuestion', () => {
  const spec = QUIZ_BANK[0];

  it('order is a full permutation of 0..QUIZ_OPTION_COUNT-1', () => {
    const prepared = prepareQuizQuestion(spec, Math.random);
    expect(prepared.order.slice().sort()).toEqual(
      Array.from({length: QUIZ_OPTION_COUNT}, (_, i) => i),
    );
  });

  it('correctPosition points back at the authored correctIndex', () => {
    const prepared = prepareQuizQuestion(spec, Math.random);
    expect(prepared.order[prepared.correctPosition]).toBe(spec.correctIndex);
  });

  it('is deterministic for a fixed rng', () => {
    const rngSeq = [0.9, 0.1, 0.5, 0.2];
    const a = prepareQuizQuestion(spec, seededRng(rngSeq));
    const b = prepareQuizQuestion(spec, seededRng(rngSeq));
    expect(a).toEqual(b);
  });

  it('never throws for any question in the bank', () => {
    for (const s of QUIZ_BANK) {
      expect(() => prepareQuizQuestion(s, Math.random)).not.toThrow();
    }
  });
});

describe('prepareQuizRound', () => {
  it('returns one prepared question per spec, in the given order', () => {
    const round = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), Math.random);
    const prepared = prepareQuizRound(round, Math.random);
    expect(prepared.map(p => p.id)).toEqual(round.map(q => q.id));
  });

  it('every prepared question resolves correctPosition back to the authored answer', () => {
    const prepared = prepareQuizRound(QUIZ_BANK, Math.random);
    for (let i = 0; i < prepared.length; i++) {
      expect(prepared[i].order[prepared[i].correctPosition]).toBe(
        QUIZ_BANK[i].correctIndex,
      );
    }
  });
});
