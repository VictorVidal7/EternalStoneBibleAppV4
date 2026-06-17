import {verseTextRightSlack} from '@/styles/designTokens';

/**
 * The right-edge anti-clip slack for scripture quotes (Sprint 94). It exists so
 * italic serif verse text doesn't clip its last glyph on some Android OEMs; the
 * contract is a small, font-scaled, always-positive gutter shared by every
 * fixed-size scripture surface (daily verse, mood verse, feelings, lectio…).
 */
describe('verseTextRightSlack', () => {
  it('never returns less than the 10px floor, even at tiny sizes', () => {
    // Sprint 98 — widened the floor (8→10) and multiplier (0.5→0.6) to match
    // the reader's gutter, after a repeated report of occasional OEM right clip.
    expect(verseTextRightSlack(0)).toBe(10);
    expect(verseTextRightSlack(10)).toBe(10);
    expect(verseTextRightSlack(14)).toBe(10); // round(8.4) -> 8, floored to 10
    expect(verseTextRightSlack(16)).toBe(10); // round(9.6) -> 10
  });

  it('grows with the font size past the floor', () => {
    expect(verseTextRightSlack(18)).toBe(11);
    expect(verseTextRightSlack(20)).toBe(12);
    expect(verseTextRightSlack(24)).toBe(14);
    expect(verseTextRightSlack(28)).toBe(17);
  });

  it('is monotonic non-decreasing across the reader/card range', () => {
    let prev = -1;
    for (let fs = 8; fs <= 48; fs += 1) {
      const slack = verseTextRightSlack(fs);
      expect(slack).toBeGreaterThanOrEqual(prev);
      expect(slack).toBeGreaterThanOrEqual(10);
      prev = slack;
    }
  });
});
