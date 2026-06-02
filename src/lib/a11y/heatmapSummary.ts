/**
 * ♿ heatmapSummary — turn a contribution-heatmap grid into screen-reader facts.
 *
 * The {@link ContributionHeatmap} primitive renders a GitHub-style grid of
 * day-cells. Visually it tells a story at a glance, but to a screen reader it
 * was an opaque `accessibilityRole="image"` node with NO label — TalkBack just
 * said "image" and moved on. This module derives a small, meaningful summary of
 * exactly the cells being drawn so a caller can announce the grid as one
 * sentence ("3 active days, busiest day 90, 1422 total this window").
 *
 * It summarises the SAME cell array the heatmap renders, so the announced
 * numbers always match the picture (rather than mixing in lifetime totals from
 * elsewhere). PURE (React-/RN-free), defensive, never throws.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {HeatmapCell} from '@lib/memory/history';

const MS_PER_DAY = 86_400_000;

export interface HeatmapSummary {
  /** Days in the window with any activity (count > 0). */
  activeDays: number;
  /** Sum of counts across the whole window. */
  totalCount: number;
  /** Highest single-day count in the window (0 when empty). */
  busiestCount: number;
  /** `dateMs` of the busiest day, or null when there is no activity. */
  busiestDateMs: number | null;
  /** Whole week-columns the grid spans (ceil of cells / 7). */
  weeks: number;
}

/** A coerced, finite, non-negative count for a cell (malformed → 0). */
function safeCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Summarise a heatmap cell array (oldest-first, the shape the heatmap renders).
 * Tolerates an empty/malformed array.
 */
export function summarizeHeatmapCells(
  cells: readonly HeatmapCell[] | null | undefined,
): HeatmapSummary {
  const list = Array.isArray(cells) ? cells : [];
  let activeDays = 0;
  let totalCount = 0;
  let busiestCount = 0;
  let busiestDateMs: number | null = null;

  for (const cell of list) {
    const count = safeCount(cell?.count);
    if (count <= 0) continue;
    activeDays += 1;
    totalCount += count;
    if (count > busiestCount) {
      busiestCount = count;
      busiestDateMs =
        typeof cell?.dateMs === 'number' && Number.isFinite(cell.dateMs)
          ? cell.dateMs
          : null;
    }
  }

  return {
    activeDays,
    totalCount,
    busiestCount,
    busiestDateMs,
    weeks: Math.ceil(list.length / 7),
  };
}

/**
 * Assemble a localized accessibility label for a heatmap from its summary and
 * the caller's already-localized words. Number-then-noun phrasing sidesteps the
 * singular/plural trap (Sprint 36); zero-clauses are omitted. The caller owns
 * the words so es/en (and "verses" vs "reviews") stay in the i18n layer.
 *
 * e.g. buildHeatmapA11yLabel({title:'Reading activity', activeDays:3,
 *      daysWord:'active days', total:1422, totalWord:'verses'})
 *   → "Reading activity: 1422 verses, 3 active days"
 */
export function buildHeatmapA11yLabel(parts: {
  title: string;
  activeDays: number;
  daysWord: string;
  total?: number;
  totalWord?: string;
}): string {
  const clauses: string[] = [];
  if (parts.total != null && parts.total > 0 && parts.totalWord) {
    clauses.push(`${parts.total} ${parts.totalWord}`);
  }
  clauses.push(`${Math.max(0, parts.activeDays)} ${parts.daysWord}`);
  return `${parts.title}: ${clauses.join(', ')}`;
}

/** Convenience: `dateMs` (UTC midnight) for a day-number, for tests. */
export function dayMs(dayNumber: number): number {
  return dayNumber * MS_PER_DAY;
}
