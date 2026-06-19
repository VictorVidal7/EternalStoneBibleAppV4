/**
 * Sprint 95 — reading-plan integrity.
 *
 * Plans drive real navigation (each day's readings become tappable chapters
 * and an audio queue), so a typo'd book name or an out-of-range chapter would
 * surface a dead "book not found" row on some day. This validates every plan's
 * structure, resolves every reading to a canonical book within its chapter
 * range, and asserts each plan's i18n name/description exist in both locales.
 */

import {
  READING_PLANS,
  getReadingPlanById,
  getLocalizedPlan,
} from '../src/constants/reading-plans';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

describe('READING_PLANS integrity', () => {
  it('ships the expected catalogue with unique ids', () => {
    expect(READING_PLANS.length).toBeGreaterThanOrEqual(9);
    const ids = READING_PLANS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each plan is internally consistent (duration === days, 1..N)', () => {
    for (const plan of READING_PLANS) {
      expect(plan.duration).toBe(plan.days.length);
      plan.days.forEach((d, i) => expect(d.day).toBe(i + 1));
      for (const day of plan.days) {
        expect(day.readings.length).toBeGreaterThan(0);
      }
    }
  });

  it('every reading resolves to a canonical book within its chapter range', () => {
    const bad: string[] = [];
    for (const plan of READING_PLANS) {
      for (const day of plan.days) {
        for (const r of day.readings) {
          const book = getBookByName(r.book);
          if (!book) {
            bad.push(`${plan.id} d${day.day}: unknown book "${r.book}"`);
            continue;
          }
          if (r.chapter < 1 || r.chapter > book.chapters) {
            bad.push(
              `${plan.id} d${day.day}: ${book.nameEn} ch ${r.chapter} out of range (1-${book.chapters})`,
            );
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every plan has a localized name + description in both locales', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const plan of READING_PLANS) {
        const localized = getLocalizedPlan(plan, translations[lang]);
        expect(localized.name).toBeTruthy();
        expect(localized.description).toBeTruthy();
        // i18n entry (not just the Spanish fallback) must exist for the key.
        const entry = translations[lang].readingPlans[plan.i18nKey];
        expect(entry?.name).toBeTruthy();
        expect(entry?.description).toBeTruthy();
      }
    }
  });

  it('topical plans carry one per-day context line per day in both locales', () => {
    // Plans that opt into a `context` array (the "I am" sayings, parables,
    // miracles, names of God) must cover every day, so getPlanDayContext never
    // returns undefined mid-plan and the two locales stay in lockstep.
    const topical = [
      'iam',
      'parables',
      'miracles',
      'namesOfGod',
      'fruitOfSpirit',
    ] as const;
    for (const plan of READING_PLANS) {
      if (!topical.includes(plan.i18nKey as (typeof topical)[number])) continue;
      for (const lang of ['es', 'en'] as const) {
        const entry = translations[lang].readingPlans[plan.i18nKey] as {
          context?: readonly string[];
        };
        expect(entry.context).toBeDefined();
        expect(entry.context!.length).toBe(plan.duration);
        entry.context!.forEach(line =>
          expect(line.trim().length).toBeGreaterThan(0),
        );
      }
    }
  });

  it('getReadingPlanById finds plans and misses gracefully', () => {
    expect(getReadingPlanById(READING_PLANS[0].id)?.id).toBe(
      READING_PLANS[0].id,
    );
    expect(getReadingPlanById('nope')).toBeUndefined();
  });

  describe('Bible in a year (generated)', () => {
    const plan = getReadingPlanById('bible-year');

    it('exists and covers all 1189 chapters with no loss or repeat', () => {
      expect(plan).toBeDefined();
      expect(plan!.duration).toBe(365);
      const flat = plan!.days.flatMap(d => d.readings);
      expect(flat.length).toBe(1189);
      // First reading is Genesis 1, last is Revelation 22.
      expect(flat[0]).toEqual({book: 'Génesis', chapter: 1});
      expect(flat[flat.length - 1]).toEqual({
        book: 'Apocalipsis',
        chapter: 22,
      });
      // Every day carries 3-4 chapters (even distribution).
      for (const day of plan!.days) {
        expect(day.readings.length).toBeGreaterThanOrEqual(3);
        expect(day.readings.length).toBeLessThanOrEqual(4);
      }
    });
  });
});
