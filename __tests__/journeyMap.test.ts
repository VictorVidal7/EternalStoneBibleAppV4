import {buildJourneyMap} from '../src/features/study/journeyMap';

describe('journeyMap — single-rail route geometry', () => {
  it('places one node per stop, in order, with strictly increasing y', () => {
    const stops = ['a', 'b', 'c', 'd'];
    const layout = buildJourneyMap(stops, {width: 400});
    expect(layout.nodes).toHaveLength(4);
    expect(layout.nodes.map(n => n.id)).toEqual(stops);
    expect(layout.nodes.map(n => n.index)).toEqual([0, 1, 2, 3]);
    for (let i = 1; i < layout.nodes.length; i++) {
      expect(layout.nodes[i].y).toBeGreaterThan(layout.nodes[i - 1].y);
    }
  });

  it('derives canvas height from the stop count (never crowds)', () => {
    const short = buildJourneyMap(['a', 'b'], {width: 400, rowHeight: 100});
    const long = buildJourneyMap(['a', 'b', 'c', 'd', 'e'], {
      width: 400,
      rowHeight: 100,
    });
    expect(long.height).toBeGreaterThan(short.height);
    expect(long.height - short.height).toBe(3 * 100);
  });

  it('handles a single stop without dividing by zero', () => {
    const layout = buildJourneyMap(['only'], {width: 400});
    expect(layout.nodes).toHaveLength(1);
    expect(Number.isFinite(layout.nodes[0].y)).toBe(true);
    expect(Number.isFinite(layout.height)).toBe(true);
  });

  it('handles zero stops', () => {
    const layout = buildJourneyMap([], {width: 400});
    expect(layout.nodes).toHaveLength(0);
    expect(Number.isFinite(layout.height)).toBe(true);
  });

  it('keeps the rail inset from the left edge, independent of width', () => {
    const layout = buildJourneyMap(['a', 'b'], {width: 800, railInset: 30});
    expect(layout.railX).toBe(30);
    expect(layout.width).toBe(800);
  });
});
