import {verseTextRightSlack} from '@/styles/designTokens';

/**
 * The right-edge anti-clip slack for scripture quotes (Sprint 94). It exists so
 * italic serif verse text doesn't clip its last glyph on some Android OEMs; the
 * contract is a small, font-scaled, always-positive gutter shared by every
 * fixed-size scripture surface (daily verse, mood verse, feelings, lectio…).
 */
describe('verseTextRightSlack', () => {
  it('never returns less than the 12px floor, even at tiny sizes', () => {
    // Sprint 98 widened the floor (8→10) and multiplier (0.5→0.6) to match the
    // reader's gutter; Sprint 100 nudged it again (floor 10→12, slope 0.6→0.65)
    // after the user still saw a faint residual OEM right clip in rare cases.
    expect(verseTextRightSlack(0)).toBe(12);
    expect(verseTextRightSlack(10)).toBe(12);
    expect(verseTextRightSlack(14)).toBe(12); // round(9.1) -> 9, floored to 12
    expect(verseTextRightSlack(16)).toBe(12); // round(10.4) -> 10, floored to 12
  });

  it('grows with the font size past the floor', () => {
    expect(verseTextRightSlack(18)).toBe(12); // round(11.7) -> 12
    expect(verseTextRightSlack(20)).toBe(13); // round(13) -> 13
    expect(verseTextRightSlack(24)).toBe(16); // round(15.6) -> 16
    expect(verseTextRightSlack(28)).toBe(18); // round(18.2) -> 18
  });

  it('is monotonic non-decreasing across the reader/card range', () => {
    let prev = -1;
    for (let fs = 8; fs <= 48; fs += 1) {
      const slack = verseTextRightSlack(fs);
      expect(slack).toBeGreaterThanOrEqual(prev);
      expect(slack).toBeGreaterThanOrEqual(12);
      prev = slack;
    }
  });
});
