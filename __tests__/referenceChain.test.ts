/**
 * Sprint 86 — the pure reference-chain trail logic. Pins advance (append /
 * no-op on the current / cycle-safe retrace), retreat (never below the seed),
 * and the breadcrumb truncation.
 */
import {
  advanceChain,
  chainDepth,
  chainStepKey,
  currentStep,
  isInChain,
  retreatChain,
  stepsEqual,
  truncateChainTo,
  type ChainStep,
} from '../src/lib/references/referenceChain';

const s = (book: string, chapter: number, verse: number): ChainStep => ({
  book,
  chapter,
  verse,
});

const john316 = s('John', 3, 16);
const rom828 = s('Romans', 8, 28);
const ps23 = s('Psalms', 23, 1);

describe('reference-chain helpers', () => {
  it('keys and equality match on book/chapter/verse', () => {
    expect(chainStepKey(john316)).toBe('John/3/16');
    expect(stepsEqual(john316, s('John', 3, 16))).toBe(true);
    expect(stepsEqual(john316, rom828)).toBe(false);
  });

  it('reports current step and depth', () => {
    expect(currentStep([])).toBeNull();
    const trail = [john316, rom828];
    expect(currentStep(trail)).toEqual(rom828);
    expect(chainDepth(trail)).toBe(2);
  });
});

describe('advanceChain', () => {
  it('seeds an empty trail', () => {
    expect(advanceChain([], john316)).toEqual([john316]);
  });

  it('appends a new verse', () => {
    expect(advanceChain([john316], rom828)).toEqual([john316, rom828]);
  });

  it('is a no-op when advancing onto the current verse', () => {
    const trail = [john316, rom828];
    expect(advanceChain(trail, rom828)).toEqual(trail);
  });

  it('retraces (truncates) when revisiting an earlier verse — cycle-safe', () => {
    const trail = [john316, rom828, ps23];
    // Going back to John 3:16 truncates rather than growing the trail.
    expect(advanceChain(trail, john316)).toEqual([john316]);
    expect(isInChain(trail, ps23)).toBe(true);
  });
});

describe('retreatChain', () => {
  it('pops the head but never empties below the seed', () => {
    expect(retreatChain([john316, rom828])).toEqual([john316]);
    expect(retreatChain([john316])).toEqual([john316]);
    expect(retreatChain([])).toEqual([]);
  });
});

describe('truncateChainTo', () => {
  it('jumps to a breadcrumb index, dropping everything after', () => {
    const trail = [john316, rom828, ps23];
    expect(truncateChainTo(trail, 0)).toEqual([john316]);
    expect(truncateChainTo(trail, 1)).toEqual([john316, rom828]);
    expect(truncateChainTo(trail, 9)).toEqual(trail);
    expect(truncateChainTo(trail, -1)).toEqual([]);
  });
});
