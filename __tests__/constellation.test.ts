import {
  parseRefKey,
  buildConnections,
  layoutConstellation,
  expandNode,
  collapseNode,
  hasExpandedChildren,
  type ConstellationConnection,
  type ConstellationLayout,
} from '../src/features/study/constellation';
import type {StudyConnections} from '../src/features/study/studyConnections';

// Shared fixtures for the expand/collapse describes below: a single-word
// canonical connection factory and a small base layout to expand/collapse
// against, mirroring the `make` helpers already used per-describe above.
const child = (
  key: string,
  book: string,
  chapter: number,
  verse: number,
): ConstellationConnection => ({key, book, chapter, verse, direction: 'out'});

const baseLayout = (n: number, size = 320): ConstellationLayout =>
  layoutConstellation(
    Array.from({length: n}, (_, i) => ({
      key: `John/3/${i + 1}`,
      book: 'John',
      chapter: 3,
      verse: i + 1,
      direction: 'out' as const,
    })),
    {size},
  );

const manyChildren = (n: number): ConstellationConnection[] =>
  Array.from({length: n}, (_, i) =>
    child(`Romans/5/${i + 1}`, 'Romans', 5, i + 1),
  );

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

describe('expandNode — "Expandir vecinos" satellite placement', () => {
  const size = 320;

  it('places satellites orbiting the PARENT star, not the true centre', () => {
    const layout = baseLayout(5, size);
    const parent = layout.nodes[0];
    const result = expandNode(layout, parent, manyChildren(3), {size});
    expect(result.added).toHaveLength(3);
    for (const sat of result.added) {
      // Unclamped here (parent sits well clear of the canvas edge at this
      // size), so this is the raw orbit-around-the-parent geometry, not a
      // coincidence of the canvas clamp.
      const distFromParent = Math.hypot(sat.x - parent.x, sat.y - parent.y);
      expect(distFromParent).toBeCloseTo(46); // default satelliteRadius
      expect(sat.parentKey).toBe(parent.key);
    }
  });

  it('is pure — the input layout is untouched, a new one is returned', () => {
    const layout = baseLayout(5, size);
    const parent = layout.nodes[0];
    const result = expandNode(layout, parent, manyChildren(3), {size});
    expect(layout.nodes).toHaveLength(5);
    expect(result.layout.nodes).toHaveLength(8);
    expect(result.layout).not.toBe(layout);
  });

  it('caps satellites per expansion via maxSatellites, reporting the rest as cappedOut', () => {
    const layout = baseLayout(5, size);
    const parent = layout.nodes[0];
    const result = expandNode(layout, parent, manyChildren(10), {
      size,
      maxSatellites: 6,
    });
    expect(result.added).toHaveLength(6);
    expect(result.cappedOut).toBe(4);
    expect(result.deduped).toBe(0);
  });

  it('caps by the TOTAL node budget across the whole map, not just this expansion', () => {
    const layout = baseLayout(5, size); // 5 nodes already on screen
    const parent = layout.nodes[0];
    const result = expandNode(layout, parent, manyChildren(6), {
      size,
      maxSatellites: 6,
      maxTotalNodes: 8, // room for only 3 more (8 - 5 already on screen)
    });
    expect(result.added).toHaveLength(3);
    expect(result.cappedOut).toBe(3);
  });

  it('never exceeds maxTotalNodes even when already at/over the cap', () => {
    const layout = baseLayout(5, size);
    const parent = layout.nodes[0];
    const result = expandNode(layout, parent, manyChildren(4), {
      size,
      maxTotalNodes: 5, // already at the cap
    });
    expect(result.added).toHaveLength(0);
    expect(result.cappedOut).toBe(4);
    expect(result.layout.nodes).toHaveLength(5);
  });

  it('deduplicates: drops the true focus, the parent itself, and any already-shown node', () => {
    const layout = baseLayout(3, size); // John/3/1, John/3/2, John/3/3
    const parent = layout.nodes[0]; // John/3/1
    const alreadyShown = layout.nodes[1]; // John/3/2, already on the 1st ring
    const candidates: ConstellationConnection[] = [
      child('John/1/1', 'John', 1, 1), // the TRUE focus of the map
      child(parent.key, parent.book, parent.chapter, parent.verse), // self-loop
      child(
        alreadyShown.key,
        alreadyShown.book,
        alreadyShown.chapter,
        alreadyShown.verse,
      ),
      child('Romans/5/8', 'Romans', 5, 8), // genuinely new
    ];
    const result = expandNode(layout, parent, candidates, {
      size,
      excludeKeys: ['John/1/1'],
    });
    expect(result.added.map(n => n.key)).toEqual(['Romans/5/8']);
    expect(result.deduped).toBe(3);
  });

  it('does not redraw a node already shown from a DIFFERENT expansion (cyclic web: A cites B, B cites A)', () => {
    const layout = baseLayout(3, size);
    const starA = layout.nodes[0];
    const starB = layout.nodes[1];
    const afterA = expandNode(
      layout,
      starA,
      [child('Romans/5/8', 'Romans', 5, 8)],
      {
        size,
      },
    );
    const satC = afterA.added[0];
    // B's own web cites the SAME verse A's expansion already placed, plus a
    // genuinely new one.
    const afterB = expandNode(
      afterA.layout,
      starB,
      [
        child(satC.key, satC.book, satC.chapter, satC.verse),
        child('Acts/2/1', 'Acts', 2, 1),
      ],
      {size},
    );
    expect(afterB.added.map(n => n.key)).toEqual(['Acts/2/1']);
    expect(afterB.deduped).toBe(1);
    // No duplicate node keys anywhere on the final map — a real invariant,
    // since duplicate keys would collide as React keys / hit targets.
    const keys = afterB.layout.nodes.map(n => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps every satellite fully on-canvas even when the parent sits on the outermost ring', () => {
    const padding = 28;
    const layout = layoutConstellation(
      Array.from({length: 20}, (_, i) =>
        child(`John/3/${i + 1}`, 'John', 3, i + 1),
      ),
      {size, padding, maxPerRing: 8},
    );
    const parent = layout.nodes[layout.nodes.length - 1]; // outermost ring
    const result = expandNode(layout, parent, manyChildren(6), {size, padding});
    expect(result.added.length).toBeGreaterThan(0);
    for (const sat of result.added) {
      // Mirrors constellationZoom.ts's constellationHitBox margin so the
      // Pressable hit-target, not just the visible circle, is asserted
      // on-canvas too.
      const margin = Math.max(sat.r + 12, 22);
      expect(sat.x).toBeGreaterThanOrEqual(padding + margin - 1);
      expect(sat.x).toBeLessThanOrEqual(size - padding - margin + 1);
      expect(sat.y).toBeGreaterThanOrEqual(padding + margin - 1);
      expect(sat.y).toBeLessThanOrEqual(size - padding - margin + 1);
    }
  });

  it('adds nothing for an empty children list', () => {
    const layout = baseLayout(3, size);
    const result = expandNode(layout, layout.nodes[0], [], {size});
    expect(result.added).toEqual([]);
    expect(result.layout.nodes).toHaveLength(3);
    expect(result.cappedOut).toBe(0);
    expect(result.deduped).toBe(0);
  });

  it('is deterministic for the same input', () => {
    const layout = baseLayout(4, size);
    const parent = layout.nodes[0];
    const a = expandNode(layout, parent, manyChildren(3), {size});
    const b = expandNode(layout, parent, manyChildren(3), {size});
    expect(a).toEqual(b);
  });
});

describe('collapseNode — "Colapsar vecinos"', () => {
  const size = 320;

  it("removes a star's own satellite children but keeps the star itself", () => {
    const layout = baseLayout(3, size);
    const parent = layout.nodes[0];
    const {layout: expanded} = expandNode(layout, parent, manyChildren(2), {
      size,
    });
    expect(expanded.nodes).toHaveLength(5);
    const collapsed = collapseNode(expanded, parent);
    expect(collapsed.nodes.map(n => n.key)).toEqual(
      layout.nodes.map(n => n.key),
    );
    expect(collapsed.nodes.find(n => n.key === parent.key)).toBeDefined();
  });

  it('transitively removes a whole expansion chain, including grandchildren', () => {
    const layout = baseLayout(2, size);
    const starA = layout.nodes[0];
    const afterA = expandNode(
      layout,
      starA,
      [child('Romans/5/8', 'Romans', 5, 8)],
      {
        size,
      },
    );
    const satB = afterA.added[0];
    const afterB = expandNode(
      afterA.layout,
      satB,
      [child('Acts/2/1', 'Acts', 2, 1)],
      {
        size,
      },
    );
    expect(afterB.layout.nodes).toHaveLength(4); // 2 base + B + C

    const collapsed = collapseNode(afterB.layout, starA);
    expect(collapsed.nodes.map(n => n.key).sort()).toEqual(
      layout.nodes.map(n => n.key).sort(),
    );
  });

  it('is a no-op that returns the SAME layout instance when the star has no children', () => {
    const layout = baseLayout(3, size);
    const result = collapseNode(layout, layout.nodes[0]);
    expect(result).toBe(layout);
  });

  it("does not collapse a DIFFERENT star's own expanded children (independent expansions)", () => {
    const layout = baseLayout(2, size);
    const starA = layout.nodes[0];
    const starB = layout.nodes[1];
    const afterA = expandNode(
      layout,
      starA,
      [child('Romans/5/8', 'Romans', 5, 8)],
      {
        size,
      },
    );
    const afterB = expandNode(
      afterA.layout,
      starB,
      [child('Acts/2/1', 'Acts', 2, 1)],
      {
        size,
      },
    );
    const collapsed = collapseNode(afterB.layout, starA);
    expect(collapsed.nodes.some(n => n.key === 'Romans/5/8')).toBe(false);
    expect(collapsed.nodes.some(n => n.key === 'Acts/2/1')).toBe(true);
  });
});

describe('hasExpandedChildren', () => {
  const size = 320;

  it('is false before expansion and true after', () => {
    const layout = layoutConstellation([child('John/3/1', 'John', 3, 1)], {
      size,
    });
    const parent = layout.nodes[0];
    expect(hasExpandedChildren(layout, parent.key)).toBe(false);
    const {layout: expanded} = expandNode(
      layout,
      parent,
      [child('Romans/5/8', 'Romans', 5, 8)],
      {size},
    );
    expect(hasExpandedChildren(expanded, parent.key)).toBe(true);
  });

  it('is false again after collapsing', () => {
    const layout = layoutConstellation([child('John/3/1', 'John', 3, 1)], {
      size,
    });
    const parent = layout.nodes[0];
    const {layout: expanded} = expandNode(
      layout,
      parent,
      [child('Romans/5/8', 'Romans', 5, 8)],
      {size},
    );
    const collapsed = collapseNode(expanded, parent);
    expect(hasExpandedChildren(collapsed, parent.key)).toBe(false);
  });
});
