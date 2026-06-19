import {verseTextRightSlack} from '@/styles/designTokens';

/**
 * The right-edge anti-clip slack for scripture quotes (Sprint 94). It exists so
 * italic serif verse text doesn't clip its last glyph on some Android OEMs; the
 * contract is a small, font-scaled, always-positive gutter shared by every
 * fixed-size scripture surface (daily verse, mood verse, feelings, lectio…).
 */
describe('verseTextRightSlack', () => {
  it('never returns less than the 16px floor, even at tiny sizes', () => {
    // Sprint 98 widened the floor (8→10) and multiplier (0.5→0.6) to match the
    // reader's gutter; Sprint 100 nudged it again (floor 10→12, slope 0.6→0.65)
    // after the user still saw a faint residual OEM right clip in rare cases;
    // Sprint 102 raised the floor 12→16 and slope 0.65→0.7 after a few card
    // verses still clipped "un poquito" on the user's real phone (the floor is
    // the lever that moves the common card sizes).
    expect(verseTextRightSlack(0)).toBe(16);
    expect(verseTextRightSlack(10)).toBe(16);
    expect(verseTextRightSlack(14)).toBe(16); // round(9.8) -> 10, floored to 16
    expect(verseTextRightSlack(16)).toBe(16); // round(11.2) -> 11, floored to 16
  });

  it('grows with the font size past the floor', () => {
    expect(verseTextRightSlack(18)).toBe(16); // round(12.6) -> 13, floored to 16
    expect(verseTextRightSlack(20)).toBe(16); // round(14) -> 14, floored to 16
    expect(verseTextRightSlack(24)).toBe(17); // round(16.8) -> 17
    expect(verseTextRightSlack(28)).toBe(20); // round(19.6) -> 20
  });

  it('is monotonic non-decreasing across the reader/card range', () => {
    let prev = -1;
    for (let fs = 8; fs <= 48; fs += 1) {
      const slack = verseTextRightSlack(fs);
      expect(slack).toBeGreaterThanOrEqual(prev);
      expect(slack).toBeGreaterThanOrEqual(16);
      prev = slack;
    }
  });
});
