/**
 * Sprint 86 — the pure highlight gallery: diacritic-insensitive search,
 * group-by-color in the fixed rainbow order, and the per-color distribution.
 */
import {
  HIGHLIGHT_COLOR_ORDER,
  groupHighlightsByColor,
  highlightGalleryStats,
  searchHighlights,
} from '../src/lib/highlights/highlightGallery';
import {HighlightColor} from '../src/lib/highlights';

interface Row {
  color: HighlightColor;
  haystack: string;
}

const rows: Row[] = [
  {color: HighlightColor.BLUE, haystack: 'Juan 3:16 De tal manera amó Dios'},
  {color: HighlightColor.YELLOW, haystack: 'Salmos 23:1 El Señor es mi pastor'},
  {color: HighlightColor.BLUE, haystack: 'Romanos 8:28 todas las cosas'},
  {color: HighlightColor.GREEN, haystack: 'Génesis 1:1 En el principio'},
];

describe('searchHighlights', () => {
  it('returns a copy of the whole list for an empty query', () => {
    const out = searchHighlights(rows, '   ', r => r.haystack);
    expect(out).toHaveLength(rows.length);
    expect(out).not.toBe(rows);
  });

  it('matches every word, substring and diacritic-insensitive', () => {
    // "senor" finds "Señor".
    expect(searchHighlights(rows, 'senor', r => r.haystack)).toHaveLength(1);
    // Two words must both appear.
    expect(searchHighlights(rows, 'dios amo', r => r.haystack)).toHaveLength(1);
    expect(searchHighlights(rows, 'nope', r => r.haystack)).toHaveLength(0);
  });
});

describe('groupHighlightsByColor', () => {
  it('groups present colors in the fixed rainbow order, newest within preserved', () => {
    const groups = groupHighlightsByColor(rows);
    expect(groups.map(g => g.color)).toEqual([
      HighlightColor.YELLOW,
      HighlightColor.BLUE,
      HighlightColor.GREEN,
    ]);
    const blue = groups.find(g => g.color === HighlightColor.BLUE)!;
    expect(blue.count).toBe(2);
    // Input order preserved within the group.
    expect(blue.items[0].haystack).toContain('Juan');
    expect(blue.items[1].haystack).toContain('Romanos');
  });

  it('drops colors with no highlights and never mutates the input', () => {
    const copy = [...rows];
    const groups = groupHighlightsByColor(rows);
    expect(groups.every(g => g.count > 0)).toBe(true);
    expect(groups.length).toBeLessThan(HIGHLIGHT_COLOR_ORDER.length);
    expect(rows).toEqual(copy);
  });
});

describe('highlightGalleryStats', () => {
  it('reports the total and ordered per-color counts', () => {
    const stats = highlightGalleryStats(rows);
    expect(stats.total).toBe(4);
    expect(stats.byColor).toEqual([
      {color: HighlightColor.YELLOW, count: 1},
      {color: HighlightColor.BLUE, count: 2},
      {color: HighlightColor.GREEN, count: 1},
    ]);
  });
});
