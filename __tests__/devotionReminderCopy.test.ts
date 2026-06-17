/**
 * Sprint 97 — the gentle "time in the Word" devotion-reminder copy.
 *
 * Pins the day-rotation contract (deterministic per day, cycles across days)
 * and that every line is a complete, warm invitation in both locales — and,
 * as a guard on the pastoral tone, that none of the copy reads as a scold.
 */

import {
  DEVOTION_REMINDER_COPY,
  pickDevotionReminderCopy,
} from '../src/lib/notifications/devotionReminderCopy';

describe('devotion reminder copy', () => {
  it('ships a set of complete lines in both locales', () => {
    for (const lang of ['es', 'en'] as const) {
      const lines = DEVOTION_REMINDER_COPY[lang];
      expect(lines.length).toBeGreaterThanOrEqual(5);
      for (const line of lines) {
        expect(line.title).toBeTruthy();
        expect(line.body.length).toBeGreaterThan(10);
        expect(line.title.startsWith('📖')).toBe(true);
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
      for (const line of DEVOTION_REMINDER_COPY[lang]) {
        const text = `${line.title} ${line.body}`;
        for (const pattern of forbidden) {
          expect(text).not.toMatch(pattern);
        }
      }
    }
  });

  it('is deterministic for the same day', () => {
    const a = pickDevotionReminderCopy('es', new Date(2026, 5, 17));
    const b = pickDevotionReminderCopy('es', new Date(2026, 5, 17));
    expect(a).toEqual(b);
    expect(DEVOTION_REMINDER_COPY.es).toContainEqual(a);
  });

  it('rotates across a span of days', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 12; d++) {
      seen.add(pickDevotionReminderCopy('en', new Date(2026, 0, d)).body);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('falls back to English for an unknown language', () => {
    // @ts-expect-error — exercising the defensive fallback path
    const line = pickDevotionReminderCopy('fr', new Date(2026, 0, 1));
    expect(DEVOTION_REMINDER_COPY.en).toContainEqual(line);
  });
});
