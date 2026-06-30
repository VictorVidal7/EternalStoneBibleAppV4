/**
 * 🕸️ prophecyMap — pure geometry for the "mapa del hilo" (the prophetic web).
 *
 * Lays out the whole Hilo profético as the famous two-rail diagram: every Old
 * Testament prophecy/type on the LEFT rail (ordered by OT canonical order) and
 * its New Testament fulfillment on the RIGHT rail (ordered by NT canonical
 * order), joined by a thread coloured by its movement — so the eye sees the
 * whole of Scripture converging on Christ (Lucas 24:27). Because the two
 * orderings differ, the threads cross into a web, exactly like the infographic.
 *
 * PURE (no React/RN/SVG): turns the canonical refs into placed `{leftY, rightY}`
 * endpoints + per-book labels for a canvas of the given size, so the layout
 * unit-tests deterministically. The screen draws SVG curves + tap targets on top.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookByName} from '@/constants/bible';
import {parseChristRef} from './christConnections';
import {MESSIANIC_PROPHECIES, type ProphecyGroup} from './messianicProphecies';

/** One prophecy placed on both rails. */
export interface ThreadMapNode {
  id: string;
  /** Index into MESSIANIC_PROPHECIES (for jumping to that step). */
  index: number;
  group: ProphecyGroup;
  leftY: number;
  rightY: number;
}

/** A book label anchored at the y of its first ref on a rail. */
export interface ThreadBookLabel {
  nameEs: string;
  nameEn: string;
  abbrEs: string;
  abbrEn: string;
  y: number;
}

export interface ThreadMap {
  width: number;
  height: number;
  leftX: number;
  rightX: number;
  nodes: ThreadMapNode[];
  otLabels: ThreadBookLabel[];
  ntLabels: ThreadBookLabel[];
}

export interface ThreadMapOptions {
  width: number;
  /** Vertical inset so the top/bottom rows + labels stay on-canvas. */
  paddingY?: number;
  /** Horizontal inset of each rail from the canvas edge. */
  railInset?: number;
  /** Vertical pixels per row — drives the (computed) canvas height. */
  rowHeight?: number;
}

const sortKey = (book: number, chapter: number, verse: number): number =>
  book * 1_000_000 + chapter * 1_000 + verse;

/**
 * Build the two-rail layout. Canvas height is derived from the row count so the
 * rails never crowd. Entries whose refs don't resolve are dropped (never throws).
 */
export function buildThreadMap(options: ThreadMapOptions): ThreadMap {
  const width = options.width;
  const paddingY = options.paddingY ?? 40;
  const railInset = options.railInset ?? 76;
  const rowHeight = options.rowHeight ?? 22;

  const resolved = MESSIANIC_PROPHECIES.map((p, index) => {
    const ot = parseChristRef(p.prophecy);
    const nt = parseChristRef(p.fulfillment);
    const otBook = ot ? getBookByName(ot.book) : undefined;
    const ntBook = nt ? getBookByName(nt.book) : undefined;
    return {p, index, ot, nt, otBook, ntBook};
  }).filter(
    (
      r,
    ): r is typeof r & {
      ot: NonNullable<typeof r.ot>;
      nt: NonNullable<typeof r.nt>;
      otBook: NonNullable<typeof r.otBook>;
      ntBook: NonNullable<typeof r.ntBook>;
    } => Boolean(r.ot && r.nt && r.otBook && r.ntBook),
  );

  const n = resolved.length;
  const height = paddingY * 2 + Math.max(1, n - 1) * rowHeight;
  const usable = height - paddingY * 2;
  const yAt = (i: number) => paddingY + (n > 1 ? (i / (n - 1)) * usable : 0);

  const leftOrder = [...resolved].sort(
    (a, b) =>
      sortKey(a.otBook.id, a.ot.chapter, a.ot.verse) -
      sortKey(b.otBook.id, b.ot.chapter, b.ot.verse),
  );
  const rightOrder = [...resolved].sort(
    (a, b) =>
      sortKey(a.ntBook.id, a.nt.chapter, a.nt.verse) -
      sortKey(b.ntBook.id, b.nt.chapter, b.nt.verse),
  );

  const leftY = new Map<number, number>();
  leftOrder.forEach((r, i) => leftY.set(r.index, yAt(i)));
  const rightY = new Map<number, number>();
  rightOrder.forEach((r, i) => rightY.set(r.index, yAt(i)));

  const nodes: ThreadMapNode[] = resolved.map(r => ({
    id: r.p.id,
    index: r.index,
    group: r.p.group,
    leftY: leftY.get(r.index) ?? 0,
    rightY: rightY.get(r.index) ?? 0,
  }));

  // One label per book, at the y of its first ref on that rail.
  const labelsFor = (
    order: typeof resolved,
    yMap: Map<number, number>,
    bookOf: (r: (typeof resolved)[number]) => {
      name: string;
      nameEn: string;
      abbr: string;
      abbrEn: string;
      id: number;
    },
  ): ThreadBookLabel[] => {
    const seen = new Set<number>();
    const out: ThreadBookLabel[] = [];
    for (const r of order) {
      const book = bookOf(r);
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      out.push({
        nameEs: book.name,
        nameEn: book.nameEn,
        abbrEs: book.abbr,
        abbrEn: book.abbrEn,
        y: yMap.get(r.index) ?? 0,
      });
    }
    return out;
  };

  return {
    width,
    height,
    leftX: railInset,
    rightX: width - railInset,
    nodes,
    otLabels: labelsFor(leftOrder, leftY, r => r.otBook),
    ntLabels: labelsFor(rightOrder, rightY, r => r.ntBook),
  };
}
