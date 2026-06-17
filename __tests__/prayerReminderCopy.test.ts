/**
 * Sprint 95 — the gentle prayer-reminder copy.
 *
 * Pins the day-rotation contract (deterministic per day, cycles across days)
 * and that every line is a complete, warm invitation in both locales — and,
 * as a guard on the pastoral tone, that none of the copy reads as a scold.
 */

import {
  PRAYER_REMINDER_COPY,
  pickPrayerReminderCopy,
} from '../src/lib/notifications/prayerReminderCopy';

describe('prayer reminder copy', () => {
  it('ships a set of complete lines in both locales', () => {
    for (const lang of ['es', 'en'] as const) {
      const lines = PRAYER_REMINDER_COPY[lang];
      expect(lines.length).toBeGreaterThanOrEqual(5);
      for (const line of lines) {
        expect(line.title).toBeTruthy();
        expect(line.body.length).toBeGreaterThan(10);
        expect(line.title.startsWith('🙏')).toBe(true);
      }
    }
  });

  it('reads as a gentle invitation, never a scold', () => {
    // Defensive tone guard: a reminder a reader may see on a hard day must not
    // shame them for missing days.
    const forbidden = [
      /no has/i,
      /olvidaste/i,
      /perdiste/i,
      /missed/i,
      /forgot/i,
      /you haven'?t/i,
      /don'?t forget/i,
    ];
    for (const lang of ['es', 'en'] as const) {
      for (const line of PRAYER_REMINDER_COPY[lang]) {
        const text = `${line.title} ${line.body}`;
        for (const pattern of forbidden) {
          expect(text).not.toMatch(pattern);
        }
      }
    }
  });

  it('is deterministic for the same day', () => {
    const a = pickPrayerReminderCopy('es', new Date(2026, 5, 16));
    const b = pickPrayerReminderCopy('es', new Date(2026, 5, 16));
    expect(a).toEqual(b);
    expect(PRAYER_REMINDER_COPY.es).toContainEqual(a);
  });

  it('rotates across a span of days', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 12; d++) {
      seen.add(pickPrayerReminderCopy('en', new Date(2026, 0, d)).body);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('falls back to English for an unknown language', () => {
    // @ts-expect-error — exercising the defensive fallback path
    const line = pickPrayerReminderCopy('fr', new Date(2026, 0, 1));
    expect(PRAYER_REMINDER_COPY.en).toContainEqual(line);
  });
});
