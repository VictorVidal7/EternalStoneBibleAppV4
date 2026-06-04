/**
 * 🌅 dailyLight — PURE selection for the "Daily Light" devotional (Sprint 67).
 *
 * Composes one calendar day's devotional out of things the app already keeps:
 * a curated verse (DAILY_VERSE_REFS), a topical theme (the S63 taxonomy) and a
 * reflection prompt. The pick is DETERMINISTIC by day-of-year — every reader
 * sees the same Light on the same day, and it never changes mid-day — and the
 * three rotate on different salts so the verse, theme and prompt don't all
 * advance in lockstep.
 *
 * Kept pure (no React / SQLite / Date.now) so it's unit-testable and the screen
 * just resolves the chosen indices into text/theme.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** 0-based day index within the date's (local) year: Jan 1 → 0. */
export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86_400_000);
}

/**
 * A stable index into a list of `length`, rotating once per day. `salt` offsets
 * the rotation so parallel lists don't advance together. Defensive: a non-
 * positive length yields 0.
 */
export function dailyIndex(length: number, date: Date, salt = 0): number {
  if (length <= 0) return 0;
  const i = (dayOfYear(date) + salt) % length;
  return i < 0 ? i + length : i;
}

export interface DailyLightSelection {
  verseIndex: number;
  themeIndex: number;
  promptIndex: number;
}

/**
 * Today's devotional selection: indices into the verse, theme and prompt lists.
 * Distinct salts keep the three from rotating in lockstep.
 */
export function buildDailyLight(
  date: Date,
  verseCount: number,
  themeCount: number,
  promptCount: number,
): DailyLightSelection {
  return {
    verseIndex: dailyIndex(verseCount, date),
    themeIndex: dailyIndex(themeCount, date, 7),
    promptIndex: dailyIndex(promptCount, date, 13),
  };
}
