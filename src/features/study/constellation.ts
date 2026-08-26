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
  /**
   * Key of the star this one orbits, when it's a satellite placed by
   * {@link expandNode} ("Expandir vecinos") — undefined for a 1st-ring
   * node, which orbits the true focus (drawn separately as `layout.center`,
   * never itself a node). Always a PARENT NODE'S key, never the true
   * focus's, so a chain of expansions (star → its own satellite → THAT
   * satellite's own satellite) is representable without any extra tree
   * structure — see {@link expandNode} / {@link collapseNode}.
   */
  parentKey?: RefKey;
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

/**
 * ── "Expandir vecinos" (expand neighbors) ──────────────────────────────
 *
 * A star's OWN cross-reference web, placed as a small satellite cluster
 * orbiting THAT star (not the true focus) — so exploring the map can go one
 * (or several) hops deeper than the 1st ring without ever replacing it, the
 * way "Centrar aquí" does. See expandNode/collapseNode below; the screen
 * wires them to a 3rd action on the selected-star panel.
 */

/** Clamp a coordinate so a circle of the given margin stays fully on-canvas. */
function clampToCanvas(
  value: number,
  size: number,
  padding: number,
  margin: number,
): number {
  const lo = padding + margin;
  const hi = size - padding - margin;
  // Canvas too small for even one star at this margin — center it rather
  // than hand back an inverted (lo > hi) range.
  if (lo > hi) return size / 2;
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

export interface ExpandNodeOptions {
  /** Side length of the (square) canvas — the SAME one the parent star already lives on. */
  size: number;
  /** Edge inset, matching whatever the base layout used. */
  padding?: number;
  /** Max satellite children placed by a SINGLE expandNode call. */
  maxSatellites?: number;
  /** Max TOTAL nodes allowed on the whole map (1st ring + every expansion combined). */
  maxTotalNodes?: number;
  /** Orbit radius (px) of a satellite ring around its parent star. */
  satelliteRadius?: number;
  /** Smallest satellite star radius (weakest local link). */
  nodeMin?: number;
  /** Largest satellite star radius (strongest local link). */
  nodeMax?: number;
  /**
   * Keys that must never become a new node even if `children` offers them —
   * always pass the TRUE focus's key here: it's drawn as the centre star,
   * not a node, so a cross-reference back to it would otherwise draw a
   * confusing duplicate. The parent itself and every key already present in
   * `layout.nodes` (1st ring or any earlier expansion) are excluded
   * automatically — a real cross-reference web has cycles (A cites B, B
   * cites A), so that WILL happen in practice.
   */
  excludeKeys?: Iterable<RefKey>;
}

export interface ExpandNodeResult {
  /** The new layout with the parent's satellite nodes appended. */
  layout: ConstellationLayout;
  /** Just the newly added satellite nodes (already included in `layout.nodes`). */
  added: ConstellationNode[];
  /** Candidates dropped as duplicates (true focus / parent / an already-shown node). */
  deduped: number;
  /** Otherwise-valid candidates dropped purely by the `maxSatellites`/`maxTotalNodes` caps. */
  cappedOut: number;
}

const EXPAND_DEFAULTS = {
  maxSatellites: 6,
  maxTotalNodes: 40,
  satelliteRadius: 46,
  // Deliberately smaller than the 1st ring's nodeMin/nodeMax (9/22): a
  // satellite's `weight` is only its LOCAL rank among its own siblings (see
  // expandNode below), not a global rank comparable to the 1st ring's, so a
  // top-ranked satellite would otherwise render as large as a top-ranked
  // 1st-ring star despite being a strictly secondary/deeper connection.
  // Shrinking the whole size range is what actually signals "deeper layer"
  // — JUDGMENT CALL, flagging it rather than leaving the reason implicit.
  nodeMin: 6,
  nodeMax: 13,
  // 120° fan, biased back toward the map centre (see expandNode) rather
  // than a full 360° ring.
  arc: (2 * Math.PI) / 3,
} as const;

/**
 * Fetch-and-place a star's OWN connections as a small satellite cluster
 * orbiting that star's `(x, y)` — NOT the true focus — linked to it via
 * `parentKey`. Pure: `children` is whatever the caller already resolved for
 * the parent verse (e.g. `buildConnections(await getMergedStudyConnections(...))`).
 *
 * JUDGMENT CALL — orbit geometry: satellites fan out in a ~120° arc CENTRED
 * on the bearing back toward the true centre (`parent.angle + Math.PI`),
 * rather than a full ring. A parent star usually sits near the canvas's
 * outer edge (see layoutConstellation), so a full-ring placement would
 * routinely push satellites past the edge (and under `canvasWrap`'s
 * `overflow: 'hidden'` in the screen, i.e. invisible AND untappable) —
 * biasing inward uses the open space that's actually there. The explicit
 * clampToCanvas() call below is the hard guarantee on top of that bias, so
 * satellites stay fully on-canvas (hit-target included, see the margin
 * comment inline) even for a parent sitting right at the edge.
 */
export function expandNode(
  layout: ConstellationLayout,
  parent: ConstellationNode,
  children: ConstellationConnection[],
  options: ExpandNodeOptions,
): ExpandNodeResult {
  const size = options.size;
  const padding = options.padding ?? DEFAULTS.padding;
  const maxSatellites = Math.max(
    0,
    options.maxSatellites ?? EXPAND_DEFAULTS.maxSatellites,
  );
  const maxTotalNodes = Math.max(
    0,
    options.maxTotalNodes ?? EXPAND_DEFAULTS.maxTotalNodes,
  );
  const satelliteRadius =
    options.satelliteRadius ?? EXPAND_DEFAULTS.satelliteRadius;
  const nodeMin = options.nodeMin ?? EXPAND_DEFAULTS.nodeMin;
  const nodeMax = options.nodeMax ?? EXPAND_DEFAULTS.nodeMax;

  const exclude = new Set<RefKey>(options.excludeKeys ?? []);
  exclude.add(parent.key);
  for (const existing of layout.nodes) exclude.add(existing.key);

  const seen = new Set<RefKey>();
  const candidates: ConstellationConnection[] = [];
  let deduped = 0;
  for (const child of children) {
    if (exclude.has(child.key) || seen.has(child.key)) {
      deduped++;
      continue;
    }
    seen.add(child.key);
    candidates.push(child);
  }

  // JUDGMENT CALL — two caps, two different reasons: `maxSatellites` keeps
  // any SINGLE expansion legible (a verse with 40 cross-refs shouldn't dump
  // 40 satellites on one star); `maxTotalNodes` keeps the WHOLE map legible
  // and fast to render/hit-test across repeated expansions. Both are
  // reported back via `cappedOut` (never silently dropped) so the caller can
  // surface it — this app's standing "no silent caps" convention.
  const roomLeft = Math.max(0, maxTotalNodes - layout.nodes.length);
  const take = Math.min(maxSatellites, candidates.length, roomLeft);
  const cappedOut = candidates.length - take;

  const centreAngle = parent.angle + Math.PI;
  const arc = EXPAND_DEFAULTS.arc;
  const added: ConstellationNode[] = [];
  for (let i = 0; i < take; i++) {
    const child = candidates[i];
    // Local rank among just THIS parent's own children — see the nodeMin/Max
    // comment above for why that's fine despite not being globally
    // comparable to the 1st ring's weight.
    const weight = take > 1 ? 1 - i / (take - 1) : 1;
    const r = nodeMin + weight * (nodeMax - nodeMin);
    const angle =
      take > 1 ? centreAngle - arc / 2 + i * (arc / (take - 1)) : centreAngle;
    const rawX = parent.x + satelliteRadius * Math.cos(angle);
    const rawY = parent.y + satelliteRadius * Math.sin(angle);
    // Margin mirrors constellationZoom.ts's constellationHitBox (r + 12,
    // floored at 22 = 44/2) so the PRESSABLE hit-target — not just the
    // visible circle — stays fully on-canvas too. Duplicated rather than
    // imported: constellationZoom.ts already imports types FROM this file,
    // and this module stays free of that (gesture-adjacent) module by
    // design (see the file header — pure geometry only).
    const margin = Math.max(r + 12, 22);
    added.push({
      ...child,
      x: clampToCanvas(rawX, size, padding, margin),
      y: clampToCanvas(rawY, size, padding, margin),
      r,
      angle,
      ring: parent.ring + 1,
      weight,
      parentKey: parent.key,
    });
  }

  return {
    layout: {...layout, nodes: [...layout.nodes, ...added]},
    added,
    deduped,
    cappedOut,
  };
}

/**
 * Remove a star's own expanded satellite children — the "Colapsar vecinos"
 * affordance — including any stars expanded FROM those children in turn (a
 * fixed-point sweep over `parentKey` chains, so a depth-3+ expansion
 * collapses in one call without needing an explicit tree structure). The
 * star itself is never removed, only its descendants.
 *
 * Returns the SAME `layout` instance when there's nothing to remove, so a
 * caller that skips work on referential equality (this screen's `baseSvg`
 * memo) doesn't pay for a no-op collapse.
 */
export function collapseNode(
  layout: ConstellationLayout,
  parent: ConstellationNode,
): ConstellationLayout {
  const toRemove = new Set<RefKey>([parent.key]); // sentinel; deleted below
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of layout.nodes) {
      if (
        node.parentKey &&
        toRemove.has(node.parentKey) &&
        !toRemove.has(node.key)
      ) {
        toRemove.add(node.key);
        changed = true;
      }
    }
  }
  toRemove.delete(parent.key);
  if (toRemove.size === 0) return layout;
  return {
    ...layout,
    nodes: layout.nodes.filter(node => !toRemove.has(node.key)),
  };
}

/** Whether a star already has expanded satellite children on the map. */
export function hasExpandedChildren(
  layout: ConstellationLayout,
  key: RefKey,
): boolean {
  return layout.nodes.some(node => node.parentKey === key);
}
