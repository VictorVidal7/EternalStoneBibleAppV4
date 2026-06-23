/**
 * ✦ constellation — pure geometry for the cross-reference constellation map.
 *
 * The constellation (RUMBO #3, VISUAL) renders a verse's connection web as an
 * interactive star map: the focus verse at the centre, its merged
 * cross-references (curated + the broad bundled web, see [[crossReferences]])
 * orbiting it on concentric rings. The strongest links (the curated parallels
 * and the most-voted web links, which arrive FIRST from
 * `getMergedStudyConnections`) sit on the inner ring and draw as the largest
 * stars; weaker links fade outward and shrink.
 *
 * Everything here is PURE (no React, no RN, no SVG, no DB): it turns the
 * canonical "EnglishBook/Chapter/Verse" keys of [[studyConnections]] into
 * placed `{x, y, r}` nodes for a square canvas, so the layout, weighting, and
 * key parsing all unit-test deterministically. The screen layers Skia/SVG +
 * the theme palette + verse-text fetching on top.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {RefKey, StudyConnections} from './studyConnections';

/** Whether a connection is one the focus points TO (out) or one pointing AT it (in). */
export type ConnectionDirection = 'out' | 'in';

/** A parsed connection key tagged with its direction relative to the focus. */
export interface ConstellationConnection {
  key: RefKey;
  /** English book name (as carried by the canonical RefKey). */
  book: string;
  chapter: number;
  verse: number;
  direction: ConnectionDirection;
}

/** A connection placed on the canvas as a star. */
export interface ConstellationNode extends ConstellationConnection {
  /** Centre x of the node, in canvas px. */
  x: number;
  /** Centre y of the node, in canvas px. */
  y: number;
  /** Node (star) radius in px — scales with strength. */
  r: number;
  /** Angle from the centre in radians (for drawing the connecting edge). */
  angle: number;
  /** Zero-based ring index (0 = innermost = strongest). */
  ring: number;
  /** Normalised strength 0..1 (1 = strongest), from rank order. */
  weight: number;
}

/** A fully laid-out constellation for a square canvas of side `size`. */
export interface ConstellationLayout {
  size: number;
  center: {x: number; y: number; r: number};
  nodes: ConstellationNode[];
}

export interface ConstellationLayoutOptions {
  /** Side length of the (square) canvas in px. */
  size: number;
  /** Edge inset so the outermost stars stay on-canvas. */
  padding?: number;
  /** Radius of the central focus star. */
  centerRadius?: number;
  /** Smallest orbiting star radius (weakest link). */
  nodeMin?: number;
  /** Largest orbiting star radius (strongest link). */
  nodeMax?: number;
  /** Maximum stars placed on a single ring before opening another. */
  maxPerRing?: number;
}

const DEFAULTS = {
  padding: 28,
  centerRadius: 34,
  nodeMin: 9,
  nodeMax: 22,
  maxPerRing: 8,
} as const;

/**
 * Parse a canonical "EnglishBook/Chapter/Verse" key (e.g. "1 Corinthians/13/4")
 * back into its parts. The book name may contain spaces but never a slash, so
 * the chapter and verse are always the last two segments. Returns null for a
 * malformed or non-numeric key.
 */
export function parseRefKey(
  key: RefKey,
): {book: string; chapter: number; verse: number} | null {
  if (!key) return null;
  const parts = key.split('/');
  if (parts.length < 3) return null;
  const verse = Number(parts[parts.length - 1]);
  const chapter = Number(parts[parts.length - 2]);
  const book = parts
    .slice(0, parts.length - 2)
    .join('/')
    .trim();
  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return null;
  }
  return {book, chapter, verse};
}

/**
 * Flatten a {@link StudyConnections} web into a single ordered list of parsed
 * connections — outgoing references first (strongest curated/voted links lead),
 * then the verses that reference it — tagging each with its direction and
 * dropping anything unparsable. The focus itself is never included.
 */
export function buildConnections(
  connections: StudyConnections,
): ConstellationConnection[] {
  const out: ConstellationConnection[] = [];
  const pushAll = (keys: RefKey[], direction: ConnectionDirection) => {
    for (const key of keys) {
      if (key === connections.focus) continue;
      const parsed = parseRefKey(key);
      if (!parsed) continue;
      out.push({key, ...parsed, direction});
    }
  };
  pushAll(connections.references, 'out');
  pushAll(connections.referencedBy, 'in');
  return out;
}

/**
 * Place connections as stars orbiting the centre. Rank order is taken as the
 * strength order (the merge facade already sorts curated-first, then by votes),
 * so the first connection is the largest star on the innermost ring and weight
 * decreases outward. Pure and deterministic for a given input + options.
 */
export function layoutConstellation(
  connections: ConstellationConnection[],
  options: ConstellationLayoutOptions,
): ConstellationLayout {
  const size = options.size;
  const padding = options.padding ?? DEFAULTS.padding;
  const centerR = options.centerRadius ?? DEFAULTS.centerRadius;
  const nodeMin = options.nodeMin ?? DEFAULTS.nodeMin;
  const nodeMax = options.nodeMax ?? DEFAULTS.nodeMax;
  const maxPerRing = Math.max(1, options.maxPerRing ?? DEFAULTS.maxPerRing);

  const cx = size / 2;
  const cy = size / 2;
  const center = {x: cx, y: cy, r: centerR};

  const total = connections.length;
  if (total === 0) return {size, center, nodes: []};

  // The first ring clears the centre star; the last ring keeps the biggest
  // stars fully on-canvas.
  const innerRadius = centerR + nodeMax + 14;
  const outerRadius = size / 2 - padding - nodeMax;
  const usableSpan = Math.max(0, outerRadius - innerRadius);

  const ringCount = Math.max(1, Math.ceil(total / maxPerRing));
  const ringStep = ringCount > 1 ? usableSpan / (ringCount - 1) : 0;

  const nodes: ConstellationNode[] = [];
  let index = 0;
  for (let ring = 0; ring < ringCount; ring++) {
    const radius = innerRadius + ring * ringStep;
    const remaining = total - index;
    const onThisRing = Math.min(maxPerRing, remaining);
    // Offset alternate rings by half a step so stars don't line up radially.
    const ringOffset = (ring % 2) * (Math.PI / onThisRing);
    for (let j = 0; j < onThisRing; j++, index++) {
      const conn = connections[index];
      // Start at the top (-90°) and sweep clockwise.
      const angle =
        -Math.PI / 2 + ringOffset + j * ((2 * Math.PI) / onThisRing);
      const weight = total > 1 ? 1 - index / (total - 1) : 1;
      const r = nodeMin + weight * (nodeMax - nodeMin);
      nodes.push({
        ...conn,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        r,
        angle,
        ring,
        weight,
      });
    }
  }
  return {size, center, nodes};
}
