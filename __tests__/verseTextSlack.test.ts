import {verseTextRightSlack} from '@/styles/designTokens';

/**
 * The right-edge anti-clip slack for scripture quotes (Sprint 94). It exists so
 * italic serif verse text doesn't clip its last glyph on some Android OEMs; the
 * contract is a small, font-scaled, always-positive gutter shared by every
 * fixed-size scripture surface (daily verse, mood verse, feelings, lectio…).
 */
describe('verseTextRightSlack', () => {
  it('never returns less than the 8px floor, even at tiny sizes', () => {
    expect(verseTextRightSlack(0)).toBe(8);
    expect(verseTextRightSlack(10)).toBe(8);
    expect(verseTextRightSlack(14)).toBe(8); // round(7) -> 7, floored to 8
    expect(verseTextRightSlack(16)).toBe(8);
  });

  it('grows with the font size past the floor', () => {
    expect(verseTextRightSlack(18)).toBe(9);
    expect(verseTextRightSlack(20)).toBe(10);
    expect(verseTextRightSlack(24)).toBe(12);
    expect(verseTextRightSlack(28)).toBe(14);
  });

  it('is monotonic non-decreasing across the reader/card range', () => {
    let prev = -1;
    for (let fs = 8; fs <= 48; fs += 1) {
      const slack = verseTextRightSlack(fs);
      expect(slack).toBeGreaterThanOrEqual(prev);
      expect(slack).toBeGreaterThanOrEqual(8);
      prev = slack;
    }
  });
});
