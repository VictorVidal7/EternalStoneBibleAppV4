/**
 * The "emparejar profecía↔cumplimiento" matching quiz — pure round selection.
 */
import {
  shuffle,
  pickQuizRound,
  QUIZ_ROUND_SIZE,
} from '../src/features/study/propheticQuiz';
import {MESSIANIC_PROPHECIES} from '../src/features/study/messianicProphecies';

/** Deterministic RNG for reproducible tests: cycles through a fixed sequence. */
function seededRng(seed: number[]): () => number {
  let i = 0;
  return () => seed[i++ % seed.length];
}

describe('shuffle', () => {
  it('returns every input element exactly once', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seededRng([0.9, 0.1, 0.5, 0.2, 0.7]));
    expect(out.slice().sort()).toEqual(input.slice().sort());
    expect(out.length).toBe(input.length);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    const copy = input.slice();
    shuffle(input, seededRng([0.1, 0.9]));
    expect(input).toEqual(copy);
  });

  it('is deterministic for a fixed rng', () => {
    const input = ['a', 'b', 'c', 'd'];
    const rngSeq = [0.9, 0.1, 0.5];
    const a = shuffle(input, seededRng(rngSeq));
    const b = shuffle(input, seededRng(rngSeq));
    expect(a).toEqual(b);
  });
});

describe('pickQuizRound', () => {
  it('picks the requested number of distinct prophecies', () => {
    const round = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), Math.random);
    expect(round.length).toBe(QUIZ_ROUND_SIZE);
    expect(new Set(round.map(p => p.id)).size).toBe(QUIZ_ROUND_SIZE);
  });

  it('prefers entries not in the exclude set when enough remain unseen', () => {
    const exclude = new Set(
      MESSIANIC_PROPHECIES.slice(0, MESSIANIC_PROPHECIES.length - 3).map(
        p => p.id,
      ),
    );
    const round = pickQuizRound(3, exclude, Math.random);
    expect(round.length).toBe(3);
    for (const p of round) {
      expect(exclude.has(p.id)).toBe(false);
    }
  });

  it('falls back to the full catalog once the exclude set leaves too few', () => {
    const exclude = new Set(MESSIANIC_PROPHECIES.map(p => p.id));
    const round = pickQuizRound(QUIZ_ROUND_SIZE, exclude, Math.random);
    expect(round.length).toBe(QUIZ_ROUND_SIZE);
    expect(new Set(round.map(p => p.id)).size).toBe(QUIZ_ROUND_SIZE);
  });

  it('never exceeds the catalog size', () => {
    const round = pickQuizRound(
      MESSIANIC_PROPHECIES.length + 50,
      new Set(),
      Math.random,
    );
    expect(round.length).toBe(MESSIANIC_PROPHECIES.length);
  });

  it('is deterministic for a fixed rng', () => {
    const rngSeq = [0.9, 0.1, 0.5, 0.2, 0.7, 0.3, 0.6];
    const a = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), seededRng(rngSeq));
    const b = pickQuizRound(QUIZ_ROUND_SIZE, new Set(), seededRng(rngSeq));
    expect(a.map(p => p.id)).toEqual(b.map(p => p.id));
  });
});
