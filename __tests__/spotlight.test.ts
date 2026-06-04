import {
  spotlightOpacity,
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
