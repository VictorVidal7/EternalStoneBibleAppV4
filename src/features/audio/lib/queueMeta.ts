/**
 * queueMeta (Sprint 76) — verse counts + an HONEST duration estimate for the
 * listening-queue rows.
 *
 * The estimate derives from the user's OWN listening history (the Sprint 75
 * `listeningStats` buckets): total voiced ms / total voiced verses = this
 * device's real TTS pace at the user's chosen rate. No history → no estimate
 * (the row shows just the verse count) — we never invent a number.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import type {ListeningSummary} from './listeningStats';

/** Floor for a non-empty estimate so short chapters read "~1 min", not "~0". */
const MIN_ESTIMATE_MINUTES = 1;

/**
 * Average voiced milliseconds per verse across the user's whole listening
 * history, or null when there is no (meaningful) history to derive it from.
 */
export function averageMsPerVerse(summary: ListeningSummary): number | null {
  if (summary.totalVerses <= 0 || summary.totalMs <= 0) return null;
  return summary.totalMs / summary.totalVerses;
}

/** What a queue row knows about its chapter's size. */
export interface QueueRowMeta {
  /** Real verse count from the DB. */
  verses: number;
  /** Whole-minute listening estimate, or null without listening history. */
  minutes: number | null;
}

/**
 * Build a row's meta from its (possibly still-loading) verse count and the
 * derived per-verse pace. Returns null while the count hasn't landed (or the
 * chapter is missing from the version) so the row can keep its reserved,
 * empty meta line without flashing a bogus value.
 */
export function queueRowMeta(
  verseCount: number | undefined,
  msPerVerse: number | null,
): QueueRowMeta | null {
  if (verseCount === undefined || verseCount <= 0) return null;
  const minutes =
    msPerVerse !== null && msPerVerse > 0
      ? Math.max(
          MIN_ESTIMATE_MINUTES,
          Math.round((verseCount * msPerVerse) / 60000),
        )
      : null;
  return {verses: verseCount, minutes};
}

/**
 * Localize a row meta into its display line: "176 versículos · ~9 min", or
 * just "176 versículos" when there is no honest estimate to show.
 */
export function formatQueueRowMeta(
  meta: QueueRowMeta,
  versesTemplate: string,
  minutesTemplate: string,
): string {
  const verses = versesTemplate.replace('{{n}}', String(meta.verses));
  if (meta.minutes === null) return verses;
  return `${verses} · ${minutesTemplate.replace('{{m}}', String(meta.minutes))}`;
}
