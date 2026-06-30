/**
 * The prophetic-web layout — pure geometry for the "mapa del hilo".
 */
import {buildThreadMap} from '../src/features/study/prophecyMap';
import {MESSIANIC_PROPHECIES} from '../src/features/study/messianicProphecies';

describe('buildThreadMap', () => {
  const map = buildThreadMap({width: 380});

  it('places every (resolvable) prophecy on both rails', () => {
    expect(map.nodes.length).toBe(MESSIANIC_PROPHECIES.length);
    for (const node of map.nodes) {
      expect(node.leftY).toBeGreaterThanOrEqual(0);
      expect(node.leftY).toBeLessThanOrEqual(map.height);
      expect(node.rightY).toBeGreaterThanOrEqual(0);
      expect(node.rightY).toBeLessThanOrEqual(map.height);
    }
  });

  it('derives a canvas tall enough for the rows', () => {
    expect(map.height).toBeGreaterThan(map.nodes.length * 10);
    expect(map.leftX).toBeLessThan(map.rightX);
    expect(map.rightX).toBeLessThanOrEqual(380);
  });

  it('gives unique, on-canvas book labels for both testaments', () => {
    expect(map.otLabels.length).toBeGreaterThan(0);
    expect(map.ntLabels.length).toBeGreaterThan(0);
    expect(new Set(map.otLabels.map(l => l.nameEn)).size).toBe(
      map.otLabels.length,
    );
    expect(new Set(map.ntLabels.map(l => l.nameEn)).size).toBe(
      map.ntLabels.length,
    );
    for (const label of [...map.otLabels, ...map.ntLabels]) {
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeLessThanOrEqual(map.height);
    }
  });

  it('orders the left rail by OT canon and the right rail by NT canon', () => {
    // The first OT label should be an Old-Testament book; the first NT label a
    // Gospel/Acts — i.e. the two rails really are sorted by their own canon.
    expect(map.otLabels[0].nameEn).toBe('Genesis');
    expect(['Matthew', 'Mark', 'Luke', 'John', 'Acts']).toContain(
      map.ntLabels[0].nameEn,
    );
  });
});
