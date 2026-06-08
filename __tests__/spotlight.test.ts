import {
  spotlightOpacity,
  focusVerseOpacity,
  focusedVerseFromOffsets,
  SPOTLIGHT_DIM,
  SPOTLIGHT_FULL,
} from '../src/lib/reader/spotlight';

describe('spotlightOpacity', () => {
  it('keeps every verse full when there is no selection', () => {
    const none = new Set<number>();
    expect(spotlightOpacity(1, none)).toBe(SPOTLIGHT_FULL);
    expect(spotlightOpacity(99, none)).toBe(SPOTLIGHT_FULL);
  });

  it('keeps a selected verse full and dims the rest', () => {
    const selected = new Set([3]);
    expect(spotlightOpacity(3, selected)).toBe(SPOTLIGHT_FULL);
    expect(spotlightOpacity(2, selected)).toBe(SPOTLIGHT_DIM);
    expect(spotlightOpacity(4, selected)).toBe(SPOTLIGHT_DIM);
  });

  it('keeps ALL selected verses full in a multi-selection', () => {
    const selected = new Set([2, 5, 6]);
    expect(spotlightOpacity(2, selected)).toBe(SPOTLIGHT_FULL);
    expect(spotlightOpacity(5, selected)).toBe(SPOTLIGHT_FULL);
    expect(spotlightOpacity(6, selected)).toBe(SPOTLIGHT_FULL);
    expect(spotlightOpacity(3, selected)).toBe(SPOTLIGHT_DIM);
  });

  it('never dims when explicitly disabled', () => {
    const selected = new Set([1]);
    expect(spotlightOpacity(9, selected, false)).toBe(SPOTLIGHT_FULL);
  });

  it('dims to a partial (but visible) opacity, not invisible', () => {
    expect(SPOTLIGHT_DIM).toBeGreaterThan(0);
    expect(SPOTLIGHT_DIM).toBeLessThan(SPOTLIGHT_FULL);
  });
});

describe('focusVerseOpacity (Focus mode)', () => {
  it('keeps the focused verse full and dims the rest', () => {
    expect(focusVerseOpacity(4, 4)).toBe(SPOTLIGHT_FULL);
    expect(focusVerseOpacity(3, 4)).toBe(SPOTLIGHT_DIM);
    expect(focusVerseOpacity(5, 4)).toBe(SPOTLIGHT_DIM);
  });

  it('keeps every verse full when there is no focused verse', () => {
    expect(focusVerseOpacity(1, null)).toBe(SPOTLIGHT_FULL);
    expect(focusVerseOpacity(42, null)).toBe(SPOTLIGHT_FULL);
  });

  it('never dims when focus mode is disabled', () => {
    expect(focusVerseOpacity(9, 4, false)).toBe(SPOTLIGHT_FULL);
  });

  it('composes with the selection spotlight via Math.min (dimmer wins)', () => {
    const selected = new Set([2]);
    // verse 5: not selected (dim) AND not focused (dim) → stays dim
    expect(
      Math.min(spotlightOpacity(5, selected), focusVerseOpacity(5, 2)),
    ).toBe(SPOTLIGHT_DIM);
    // verse 2: selected (full) but not focused (dim) → dimmer wins
    expect(
      Math.min(spotlightOpacity(2, selected), focusVerseOpacity(2, 5)),
    ).toBe(SPOTLIGHT_DIM);
  });
});

describe('focusedVerseFromOffsets', () => {
  const offsets = [
    {verse: 1, y: 0},
    {verse: 2, y: 100},
    {verse: 3, y: 250},
    {verse: 4, y: 600},
  ];

  it('returns null when there are no offsets', () => {
    expect(focusedVerseFromOffsets([], 0, 800)).toBeNull();
  });

  it('focuses the verse whose row crosses the viewport center', () => {
    // center = scrollY 0 + 800/2 = 400 → verse 3 (top 250) is the last row at
    // or above center (verse 4 starts at 600, below center).
    expect(focusedVerseFromOffsets(offsets, 0, 800)).toBe(3);
  });

  it('follows the scroll — a deeper scroll focuses a later verse', () => {
    // center = 400 + 200 = 600 → verse 4 (top 600) now sits on the center line.
    expect(focusedVerseFromOffsets(offsets, 400, 400)).toBe(4);
  });

  it('focuses the topmost verse before any row reaches center', () => {
    // tiny viewport at the very top: center = 10, no row top <= 10 except v1(0).
    expect(focusedVerseFromOffsets(offsets, 0, 20)).toBe(1);
  });
});
