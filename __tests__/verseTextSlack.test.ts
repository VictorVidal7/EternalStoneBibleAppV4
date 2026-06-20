import {verseTextRightSlack} from '@/styles/designTokens';

/**
 * The right-edge anti-clip slack for scripture quotes (Sprint 94). It exists so
 * italic serif verse text doesn't clip its last glyph on some Android OEMs; the
 * contract is a small, font-scaled, always-positive gutter shared by every
 * fixed-size scripture surface (daily verse, mood verse, feelings, lectio…).
 */
describe('verseTextRightSlack', () => {
  it('never returns less than the 20px floor, even at tiny sizes', () => {
    // Floor/slope history: S98 8→10/0.5→0.6; S100 10→12/0.6→0.65; S102
    // 12→16/0.65→0.7; S106 16→20/0.7→0.75 (8th user report of a faint clip on
    // their real phone — the floor is the lever at the common card sizes).
    expect(verseTextRightSlack(0)).toBe(20);
    expect(verseTextRightSlack(10)).toBe(20);
    expect(verseTextRightSlack(14)).toBe(20); // round(10.5) -> 11, floored to 20
    expect(verseTextRightSlack(20)).toBe(20); // round(15) -> 15, floored to 20
  });

  it('grows with the font size past the floor', () => {
    expect(verseTextRightSlack(24)).toBe(20); // round(18) -> 18, floored to 20
    expect(verseTextRightSlack(27)).toBe(20); // round(20.25) -> 20
    expect(verseTextRightSlack(28)).toBe(21); // round(21) -> 21
    expect(verseTextRightSlack(32)).toBe(24); // round(24) -> 24
  });

  it('is monotonic non-decreasing across the reader/card range', () => {
    let prev = -1;
    for (let fs = 8; fs <= 48; fs += 1) {
      const slack = verseTextRightSlack(fs);
      expect(slack).toBeGreaterThanOrEqual(prev);
      expect(slack).toBeGreaterThanOrEqual(20);
      prev = slack;
    }
  });
});
