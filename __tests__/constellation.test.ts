import {
  parseRefKey,
  buildConnections,
  layoutConstellation,
  type ConstellationConnection,
} from '../src/features/study/constellation';
import type {StudyConnections} from '../src/features/study/studyConnections';

describe('constellation — cross-reference star-map geometry', () => {
  describe('parseRefKey', () => {
    it('parses a simple canonical key', () => {
      expect(parseRefKey('John/3/16')).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16,
      });
    });

    it('keeps a multi-word book name intact (chapter/verse are the last two)', () => {
      expect(parseRefKey('1 Corinthians/13/4')).toEqual({
        book: '1 Corinthians',
        chapter: 13,
        verse: 4,
      });
    });

    it('returns null for malformed or non-numeric keys', () => {
      expect(parseRefKey('John/3')).toBeNull();
      expect(parseRefKey('John/three/16')).toBeNull();
      expect(parseRefKey('')).toBeNull();
    });
  });

  describe('buildConnections', () => {
    const web: StudyConnections = {
      focus: 'John/3/16',
      references: ['Romans/5/8', 'John/3/36'],
      referencedBy: ['1 John/4/9'],
      totalConnections: 3,
    };

    it('flattens outgoing then incoming, tagging direction', () => {
      const conns = buildConnections(web);
      expect(conns.map(c => c.key)).toEqual([
        'Romans/5/8',
        'John/3/36',
        '1 John/4/9',
      ]);
      expect(conns.map(c => c.direction)).toEqual(['out', 'out', 'in']);
    });

    it('parses book/chapter/verse onto each connection', () => {
      const conns = buildConnections(web);
      expect(conns[2]).toMatchObject({
        book: '1 John',
        chapter: 4,
        verse: 9,
        direction: 'in',
      });
    });

    it('drops the focus key and any unparsable keys', () => {
      const conns = buildConnections({
        focus: 'John/3/16',
        references: ['John/3/16', 'bogus', 'Romans/5/8'],
        referencedBy: [],
        totalConnections: 1,
      });
      expect(conns.map(c => c.key)).toEqual(['Romans/5/8']);
    });
  });

  describe('layoutConstellation', () => {
    const make = (n: number): ConstellationConnection[] =>
      Array.from({length: n}, (_, i) => ({
        key: `John/3/${i + 1}`,
        book: 'John',
        chapter: 3,
        verse: i + 1,
        direction: 'out' as const,
      }));

    it('places every connection and centres the focus', () => {
      const layout = layoutConstellation(make(5), {size: 320});
      expect(layout.nodes).toHaveLength(5);
      expect(layout.center).toMatchObject({x: 160, y: 160});
    });

    it('returns no nodes for an empty web', () => {
      const layout = layoutConstellation([], {size: 320});
      expect(layout.nodes).toHaveLength(0);
    });

    it('weights and sizes decrease with rank (strongest first)', () => {
      const layout = layoutConstellation(make(6), {size: 320});
      expect(layout.nodes[0].weight).toBeCloseTo(1);
      expect(layout.nodes[5].weight).toBeCloseTo(0);
      expect(layout.nodes[0].r).toBeGreaterThan(layout.nodes[5].r);
    });

    it('keeps stars clear of the centre and inside the canvas', () => {
      const size = 320;
      const padding = 28;
      const nodeMax = 22;
      const layout = layoutConstellation(make(20), {size, padding, nodeMax});
      const {x: cx, y: cy} = layout.center;
      for (const node of layout.nodes) {
        const dist = Math.hypot(node.x - cx, node.y - cy);
        // Clear of the central star.
        expect(dist).toBeGreaterThan(layout.center.r);
        // Star edge stays within the padded canvas.
        expect(node.x - node.r).toBeGreaterThanOrEqual(padding - 1);
        expect(node.x + node.r).toBeLessThanOrEqual(size - padding + 1);
        expect(node.y - node.r).toBeGreaterThanOrEqual(padding - 1);
        expect(node.y + node.r).toBeLessThanOrEqual(size - padding + 1);
      }
    });

    it('opens additional rings past maxPerRing', () => {
      const layout = layoutConstellation(make(20), {size: 320, maxPerRing: 8});
      const rings = new Set(layout.nodes.map(n => n.ring));
      expect(rings.size).toBe(3); // ceil(20 / 8)
    });

    it('is deterministic for the same input', () => {
      const a = layoutConstellation(make(7), {size: 300});
      const b = layoutConstellation(make(7), {size: 300});
      expect(a).toEqual(b);
    });
  });
});
