/**
 * `formatRelativeDate` (memory deck screen) — same day-key bug class already
 * fixed for reading/devotion/mood/prayer streaks via `localDayKey`. It used
 * to diff a RAW millisecond gap (`due - now`) and round it to a day count.
 *
 * `computeDueDate` (src/lib/memory/srs.ts) preserves the time-of-day of the
 * review that scheduled a card rather than normalizing to midnight, so a
 * card's `dueAt` clock-time can sit anywhere in the day. Whenever that
 * clock-time doesn't match the clock-time the deck happens to be VIEWED at,
 * a raw `(due - now) / dayMs` round can land on the wrong calendar day —
 * mislabeling a card due tomorrow as "hoy"/"today" (rounds down) or one due
 * today as "mañana"/"tomorrow" (rounds up), purely because of what time it
 * is when the user opens the deck. Diffing midnight-normalized LOCAL
 * calendar days (via the shared `localDayKey`) removes the clock-time
 * mismatch entirely, mirroring the fix already applied to
 * `AchievementService.ts` / `useConstancyRings.ts` / `devotionLog.ts` /
 * `feelingsLog.ts` / `prayerLog.ts`.
 *
 * Note: this does NOT touch card scheduling — only the human-readable label.
 */
import {formatRelativeDate} from '../app/features/memory';

describe('formatRelativeDate — midnight-normalized day diff', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('says "mañana"/"tomorrow" for a card due 20h after an 11pm review, checked minutes after that review (same calendar day as the review)', () => {
    // Reviewed 11pm Jan 1 local time; due 20h later = 7pm Jan 2.
    const dueIso = new Date(2026, 0, 2, 19, 0, 0).toISOString();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 0, 1, 23, 5, 0).getTime());

    expect(formatRelativeDate(dueIso, 'es')).toBe('mañana');
    expect(formatRelativeDate(dueIso, 'en')).toBe('tomorrow');
  });

  it('says "hoy"/"today" for that SAME due card once checked after midnight has rolled into its own due day', () => {
    // Same card as above (due 7pm Jan 2), but now the deck is opened at
    // 00:30 Jan 2 — already on the card's own calendar day, just hours
    // before its evening due time. The old raw-ms code rounded this ~18.5h
    // gap up to a full day and wrongly said "mañana"/"tomorrow".
    const dueIso = new Date(2026, 0, 2, 19, 0, 0).toISOString();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 0, 2, 0, 30, 0).getTime());

    expect(formatRelativeDate(dueIso, 'es')).toBe('hoy');
    expect(formatRelativeDate(dueIso, 'en')).toBe('today');
  });

  it('says "mañana"/"tomorrow" for a card due just after midnight, even when checked minutes before that midnight', () => {
    // Due 1am Jan 2 (e.g. reviewed 1am Jan 1, +1 day interval). Checked at
    // 23:50 Jan 1 — due is only ~1h10m away in raw ms, which the old code
    // rounded DOWN to 0 days ("hoy"/"today"), even though the due date
    // actually falls on the next calendar day.
    const dueIso = new Date(2026, 0, 2, 1, 0, 0).toISOString();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 0, 1, 23, 50, 0).getTime());

    expect(formatRelativeDate(dueIso, 'es')).toBe('mañana');
    expect(formatRelativeDate(dueIso, 'en')).toBe('tomorrow');
  });

  it('still says "hoy"/"today" for a card overdue by hours within the same calendar day', () => {
    const dueIso = new Date(2026, 0, 1, 8, 0, 0).toISOString();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 0, 1, 23, 0, 0).getTime());

    expect(formatRelativeDate(dueIso, 'es')).toBe('hoy');
    expect(formatRelativeDate(dueIso, 'en')).toBe('today');
  });

  it('counts the correct whole number of calendar days out for a multi-day-away card', () => {
    // Due Jan 4, 06:00; checked Jan 1, 22:00 — 3 calendar days away, even
    // though the raw ms gap (~56h) is under 3 full 24h periods and the old
    // code rounded it down to "en 2 días"/"in 2 days".
    const dueIso = new Date(2026, 0, 4, 6, 0, 0).toISOString();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 0, 1, 22, 0, 0).getTime());

    expect(formatRelativeDate(dueIso, 'es')).toBe('en 3 días');
    expect(formatRelativeDate(dueIso, 'en')).toBe('in 3 days');
  });
});
