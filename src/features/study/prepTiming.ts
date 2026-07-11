/**
 * ⏱️ prepTiming — pure timing helpers for "Modo púlpito" (the presenter view
 * of the Mesa de preparación).
 *
 * Two deterministic, no-AI utilities a preacher/teacher wants at a glance:
 *   • a word count of what they've actually written, and
 *   • an estimated spoken duration = words ÷ words-per-minute.
 *
 * ~130–140 wpm is the commonly-taught pace for deliberate spoken preaching
 * (slower than the ~150 wpm of casual speech, to leave room for emphasis and
 * pauses). Because speakers vary widely, the wpm is user-configurable
 * (WPM_MIN..WPM_MAX) rather than asserting false precision — this module just
 * does the arithmetic.
 *
 * PURE (no React / RN / Date / I/O), so it's fully unit-testable; the screen
 * feeds it the preparer's saved [[prepNotes]] prose and renders the result.
 * `countWords` is a deliberate whitespace tokenizer, NOT a linguistic one
 * ("¡Cristo resucitó!" counts as 2, "Juan 3:16" as 2) — do not "fix" it into
 * an NLP tokenizer; the estimate is a rule-of-thumb, not a precise metric.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {PREP_SECTIONS, type PrepSection} from './prepTable';
import type {PrepNotes} from './prepNotes';

/** Commonly-taught deliberate preaching pace (words per minute). */
export const DEFAULT_WORDS_PER_MINUTE = 135;
export const WPM_MIN = 100;
export const WPM_MAX = 160;
export const WPM_STEP = 5;

/** Count words by whitespace. Empty / whitespace-only / nullish → 0. */
export function countWords(text: string | null | undefined): number {
  if (typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Total words the preparer has written across the outline sections (defaults to
 * all `PREP_SECTIONS`). Only their own prose is counted — never the gathered
 * helps or guiding prompts.
 */
export function countPrepNotesWords(
  notes: PrepNotes,
  sections: readonly PrepSection[] = PREP_SECTIONS,
): number {
  return sections.reduce(
    (sum, section) => sum + countWords(notes.sections[section]),
    0,
  );
}

/** Clamp a words-per-minute value into [WPM_MIN, WPM_MAX]; non-finite → default. */
export function clampWpm(wpm: number): number {
  if (!Number.isFinite(wpm)) return DEFAULT_WORDS_PER_MINUTE;
  return Math.min(WPM_MAX, Math.max(WPM_MIN, Math.round(wpm)));
}

/**
 * Estimated whole minutes for `wordCount` words at `wordsPerMinute`. Returns 0
 * for no words; otherwise floors at 1 (a short paragraph reading as "0 min"
 * would look broken). A non-positive / non-finite wpm falls back to the default.
 */
export function estimateMinutes(
  wordCount: number,
  wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE,
): number {
  if (!Number.isFinite(wordCount) || wordCount <= 0) return 0;
  const rate =
    Number.isFinite(wordsPerMinute) && wordsPerMinute > 0
      ? wordsPerMinute
      : DEFAULT_WORDS_PER_MINUTE;
  return Math.max(1, Math.round(wordCount / rate));
}

/** Localized strings for a duration label; `aboutMinutes` contains `{{n}}`. */
export interface DurationLabelStrings {
  lessThanOneMinute: string;
  aboutMinutes: string;
}

/** Format an estimated duration: 0 → "less than a minute", else "≈ N min". */
export function formatEstimatedDuration(
  minutes: number,
  strings: DurationLabelStrings,
): string {
  if (minutes <= 0) return strings.lessThanOneMinute;
  return strings.aboutMinutes.replace('{{n}}', String(minutes));
}
