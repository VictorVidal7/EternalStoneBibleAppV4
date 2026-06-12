/**
 * 🕯️ lectio — the pure model behind the guided Lectio Divina session (Sprint 79).
 *
 * Lectio Divina is the ancient four-movement way of praying Scripture:
 * LECTIO (read slowly) → MEDITATIO (ponder one word) → ORATIO (answer God in
 * your own words) → CONTEMPLATIO (rest in silence). The screen orchestrates
 * the journey; this module holds everything decidable without React:
 *
 *   - the step sequence and its bounds;
 *   - a DETERMINISTIC meditation-prompt pick (same passage + same local day =
 *     same prompt, so re-opening a session doesn't reshuffle the question;
 *     a different day or passage rotates it);
 *   - the contemplation timer's option set + mm:ss formatting;
 *   - the prayer-note composition: the written prayer is APPENDED to the
 *     verse's existing note (the notes store keeps ONE note per verse —
 *     clobbering a reflection someone already wrote would be data loss).
 *
 * Kept free of React / storage / the DB, mirroring [[feelings]] / [[planPace]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export const LECTIO_STEPS = [
  'lectio',
  'meditatio',
  'oratio',
  'contemplatio',
] as const;

export type LectioStep = (typeof LECTIO_STEPS)[number];

/** Number of curated meditation prompts each language ships (i18n lists). */
export const MEDITATION_PROMPT_COUNT = 6;

/** Contemplation timer choices, in seconds. */
export const CONTEMPLATION_OPTIONS_SEC = [60, 120, 180] as const;

/**
 * Deterministic prompt index for a passage on a given local day. A tiny
 * 31-multiplier rolling hash — stability matters here, cryptography doesn't.
 */
export function meditationPromptIndex(
  passageKey: string,
  dateKey: string,
  count: number = MEDITATION_PROMPT_COUNT,
): number {
  if (count <= 0) return 0;
  let hash = 0;
  const seed = `${passageKey}|${dateKey}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

/** "1:30" — mm:ss for the contemplation countdown; clamps below zero. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The block a finished session appends to the verse's note. `sessionLabel` is
 * the localized feature name shown as the block header (the screen passes
 * `t.lectio.title` — "Momento con Dios" / "Moment with God"); the default
 * keeps the function safe to call without UI context. Notes saved before the
 * Sprint 81 rename keep their original "Lectio Divina" header — they are the
 * user's data, never rewritten.
 */
export function buildLectioPrayerBlock(
  prayer: string,
  dateLabel: string,
  sessionLabel: string = 'Momento con Dios',
): string {
  return `🙏 ${sessionLabel} — ${dateLabel}\n${prayer.trim()}`;
}

/**
 * Compose the saved note: append to what already exists (one note per verse),
 * never clobber.
 */
export function composeNoteWithPrayer(
  existingNote: string | null | undefined,
  block: string,
): string {
  const base = existingNote?.trim();
  return base ? `${base}\n\n${block}` : block;
}
