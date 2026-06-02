import type {HeatmapCell, HeatmapLevel} from '../src/lib/memory/history';
import {
  summarizeHeatmapCells,
  buildHeatmapA11yLabel,
} from '../src/lib/a11y/heatmapSummary';

const DAY = 86_400_000;

function cell(dayNumber: number, count: number): HeatmapCell {
  const level: HeatmapLevel =
    count <= 0 ? 0 : count <= 1 ? 1 : count <= 5 ? 2 : count <= 20 ? 3 : 4;
  return {dateMs: dayNumber * DAY, count, level};
}

describe('heatmapSummary', () => {
  describe('summarizeHeatmapCells', () => {
    it('counts active days, total, and the busiest day', () => {
      const cells = [cell(10, 0), cell(11, 5), cell(12, 90), cell(13, 7)];
      const s = summarizeHeatmapCells(cells);
      expect(s.activeDays).toBe(3);
      expect(s.totalCount).toBe(102);
      expect(s.busiestCount).toBe(90);
      expect(s.busiestDateMs).toBe(12 * DAY);
    });

    it('reports weeks as ceil(cells / 7)', () => {
      expect(
        summarizeHeatmapCells(Array.from({length: 14}, (_, i) => cell(i, 0)))
          .weeks,
      ).toBe(2);
      expect(
        summarizeHeatmapCells(Array.from({length: 15}, (_, i) => cell(i, 0)))
          .weeks,
      ).toBe(3);
    });

    it('returns an all-zero summary for an empty grid', () => {
      const s = summarizeHeatmapCells([]);
      expect(s).toEqual({
        activeDays: 0,
        totalCount: 0,
        busiestCount: 0,
        busiestDateMs: null,
        weeks: 0,
      });
    });

    it('is defensive against null/malformed input and cells', () => {
      expect(summarizeHeatmapCells(null).activeDays).toBe(0);
      expect(summarizeHeatmapCells(undefined).totalCount).toBe(0);
      const s = summarizeHeatmapCells([
        {dateMs: NaN, count: -3, level: 0},
        {dateMs: 5 * DAY, count: Number('x'), level: 0},
        {dateMs: 6 * DAY, count: 4, level: 2},
      ] as unknown as HeatmapCell[]);
      expect(s.activeDays).toBe(1);
      expect(s.totalCount).toBe(4);
      expect(s.busiestDateMs).toBe(6 * DAY);
    });

    it('keeps the FIRST day when two days tie for busiest', () => {
      const s = summarizeHeatmapCells([cell(1, 9), cell(2, 9)]);
      expect(s.busiestCount).toBe(9);
      expect(s.busiestDateMs).toBe(1 * DAY);
    });
  });

  describe('buildHeatmapA11yLabel', () => {
    it('builds a number-then-noun label with title, total and days', () => {
      expect(
        buildHeatmapA11yLabel({
          title: 'Reading activity',
          activeDays: 3,
          daysWord: 'active days',
          total: 1422,
          totalWord: 'verses',
        }),
      ).toBe('Reading activity: 1422 verses, 3 active days');
    });

    it('omits the total clause when total is zero or missing', () => {
      expect(
        buildHeatmapA11yLabel({
          title: 'Review activity',
          activeDays: 0,
          daysWord: 'active days',
        }),
      ).toBe('Review activity: 0 active days');
      expect(
        buildHeatmapA11yLabel({
          title: 'Review activity',
          activeDays: 2,
          daysWord: 'active days',
          total: 0,
          totalWord: 'reviews',
        }),
      ).toBe('Review activity: 2 active days');
    });
  });
});
