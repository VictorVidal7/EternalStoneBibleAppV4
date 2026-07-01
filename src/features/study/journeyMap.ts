/**
 * 🛤️ journeyMap — pure geometry for a Bible journey route's rail map.
 *
 * Unlike [[prophecyMap]]'s two-rail crossing web (which fits a set of OT→NT
 * PAIRS with two different orderings), a journey route is a single ORDERED
 * path — so the layout is a simple vertical rail with one evenly-spaced node
 * per stop, in walk order. The screen draws the rail + dots in SVG and places
 * each stop's label/note beside its node.
 *
 * PURE (no React/RN/SVG): turns a stop count into placed `{y}` node positions
 * for a canvas of the given width, so the layout unit-tests deterministically.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface JourneyMapNode {
  id: string;
  /** Position within the route (0-based). */
  index: number;
  y: number;
}

export interface JourneyMapLayout {
  width: number;
  height: number;
  /** X position of the vertical rail (stop labels render to its right). */
  railX: number;
  nodes: JourneyMapNode[];
}

export interface JourneyMapOptions {
  width: number;
  /** Vertical inset so the first/last node stay on-canvas. */
  paddingY?: number;
  /** Horizontal inset of the rail from the canvas's left edge. */
  railInset?: number;
  /** Vertical pixels between consecutive stops. */
  rowHeight?: number;
}

/**
 * Build the single-rail layout for a route's stop ids, in walk order. Canvas
 * height is derived from the stop count so rows never crowd.
 */
export function buildJourneyMap(
  stopIds: readonly string[],
  options: JourneyMapOptions,
): JourneyMapLayout {
  const width = options.width;
  const paddingY = options.paddingY ?? 32;
  const railInset = options.railInset ?? 28;
  const rowHeight = options.rowHeight ?? 88;

  const n = stopIds.length;
  const height = paddingY * 2 + Math.max(0, n - 1) * rowHeight;

  const nodes: JourneyMapNode[] = stopIds.map((id, index) => ({
    id,
    index,
    y: paddingY + index * rowHeight,
  }));

  return {width, height, railX: railInset, nodes};
}
