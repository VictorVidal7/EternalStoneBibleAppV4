/**
 * ⏱️ formatReadingTime — compact human duration for reading-time stats.
 *
 * Reading time is stored in **SECONDS** throughout the app: the reader writes
 * `Math.floor((Date.now() - start) / 1000)` into both
 * `user_stats.total_reading_time` and the per-day `reading_streak_log.time_spent`.
 * Until Sprint 62 that number was tracked but never shown anywhere; "Mi lectura"
 * and "Tu camino" now surface it, so this module renders a seconds count as a
 * compact "Xh Ym" / "Ym" / "<1m" string.
 *
 * The unit words are INJECTED (defaulting to terse English glyphs) so the
 * screens supply localized labels (es: "min", "<1 min"). PURE and defensive —
 * a non-finite or negative input renders as the "less than a minute" label.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Localizable unit words for {@link formatReadingTime}. */
export interface ReadingTimeLabels {
  /** Hours suffix, e.g. "h". */
  hour: string;
  /** Minutes suffix, e.g. "m" (en) or "min" (es). */
  minute: string;
  /** Shown when the duration rounds to under one minute, e.g. "<1m". */
  lessThanMinute: string;
}

const DEFAULT_LABELS: ReadingTimeLabels = {
  hour: 'h',
  minute: 'm',
  lessThanMinute: '<1m',
};

/** Numeric breakdown of a seconds count into whole hours + minutes. */
export interface ReadingTimeParts {
  hours: number;
  minutes: number;
  /** Whole minutes total (hours * 60 + minutes); 0 when under a minute. */
  totalMinutes: number;
}

/** Split a seconds count into hours/minutes; non-finite/negative → all zero. */
export function readingTimeParts(seconds: number): ReadingTimeParts {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const totalMinutes = Math.floor(s / 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
}

/**
 * Render a seconds count as a compact duration string. Drops a zero component
 * ("2h", "45m") and collapses sub-minute durations to the `lessThanMinute`
 * label. Labels default to terse English glyphs; pass localized ones for es.
 */
export function formatReadingTime(
  seconds: number,
  labels: Partial<ReadingTimeLabels> = {},
): string {
  const l = {...DEFAULT_LABELS, ...labels};
  const {hours, minutes, totalMinutes} = readingTimeParts(seconds);
  if (totalMinutes <= 0) return l.lessThanMinute;
  if (hours <= 0) return `${minutes}${l.minute}`;
  if (minutes <= 0) return `${hours}${l.hour}`;
  return `${hours}${l.hour} ${minutes}${l.minute}`;
}
