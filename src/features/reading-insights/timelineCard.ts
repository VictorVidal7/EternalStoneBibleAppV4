/**
 * 🖼️ timelineCard — PURE model for the shareable "recent milestones" image.
 *
 * Sprint 81. The timeline screen can now share its most recent milestones as
 * a designer card over the Sprint 56 view-shot pipeline (the
 * [[collectionCard]] idiom: pure "pick top N + truncate" builder, screen
 * passes already-localized strings, modal only renders + captures).
 *
 * The feed arrives NEWEST-first from [[timeline]], so the card simply takes
 * the head — "lo último que Dios ha hecho en tu camino".
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {truncateVerse} from '@/features/collections/collectionCard';

/** One milestone row on the card (already localized by the screen). */
export interface TimelineCardMilestone {
  /** e.g. "Completaste el plan NT en 30 días" — truncated for the card. */
  title: string;
  /** Localized short date, e.g. "12 jun 2026". */
  dateLabel: string;
  /** Ionicons glyph name for the row's accent circle. */
  icon: string;
}

/** The render-ready card model. */
export interface TimelineCardModel {
  /** The newest milestones actually drawn (already truncated). */
  milestones: TimelineCardMilestone[];
  /** Total milestones on the full timeline (NOT the preview length). */
  totalCount: number;
}

export interface TimelineCardOptions {
  /** Max milestones drawn on the card. Default 4. */
  maxItems?: number;
  /** Max characters per title before an ellipsis. Default 64. */
  maxChars?: number;
}

const DEFAULT_MAX_ITEMS = 4;
const DEFAULT_MAX_CHARS = 64;

/**
 * Build the card model from the NEWEST-first localized milestones. Defensive:
 * blank titles drop out, options clamp to sane minimums, and an empty feed
 * yields an empty model (the screen hides the share entry point anyway —
 * honest gate for empty feeds).
 */
export function buildTimelineCard(
  milestones: ReadonlyArray<TimelineCardMilestone>,
  options: TimelineCardOptions = {},
): TimelineCardModel {
  const maxItems = Math.max(1, options.maxItems ?? DEFAULT_MAX_ITEMS);
  const maxChars = Math.max(8, options.maxChars ?? DEFAULT_MAX_CHARS);

  const usable = milestones.filter(m => m.title.trim().length > 0);
  return {
    milestones: usable.slice(0, maxItems).map(m => ({
      ...m,
      title: truncateVerse(m.title, maxChars),
    })),
    totalCount: usable.length,
  };
}
