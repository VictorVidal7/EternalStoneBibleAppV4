/**
 * S89 audit — singular/plural correctness for the streak strings a reader
 * sees at exactly 1 day. The plural keys carry a count placeholder; the
 * singular siblings must read "1 día"/"1 day" (never "1 días"/"1 days") and
 * must NOT carry a placeholder. Locks the convention so a future edit can't
 * regress the day-one grammar (cf. the S85 "1 days" bug).
 */
import {translations} from '../src/i18n/translations';

const es = translations.es;
const en = translations.en;

describe('i18n singular streak strings (day-one grammar)', () => {
  it('Home streak nudge: plural has a placeholder, singular is fixed "1 day"', () => {
    expect(es.home.nudgeStreak).toContain('{{days}}');
    expect(en.home.nudgeStreak).toContain('{{days}}');
    expect(es.home.nudgeStreakOne).not.toMatch(/\{\{/);
    expect(en.home.nudgeStreakOne).not.toMatch(/\{\{/);
    expect(es.home.nudgeStreakOne).toContain('1 día');
    expect(es.home.nudgeStreakOne).not.toContain('1 días');
    expect(en.home.nudgeStreakOne).toContain('1-day');
  });

  it('Daily light streak: plural has a placeholder, singular is fixed "1 day"', () => {
    expect(es.dailyLight.streak).toContain('{{n}}');
    expect(en.dailyLight.streak).toContain('{{n}}');
    expect(es.dailyLight.streakOne).not.toMatch(/\{\{/);
    expect(en.dailyLight.streakOne).not.toMatch(/\{\{/);
    expect(es.dailyLight.streakOne).toContain('1 día');
    expect(es.dailyLight.streakOne).not.toContain('1 días');
    expect(en.dailyLight.streakOne).toContain('1-day');
  });

  it('devotion streak already distinguishes the one-day case', () => {
    expect(es.devotion.streakDays).toContain('{{n}}');
    expect(es.devotion.streakOneDay).not.toMatch(/\{\{/);
    expect(es.devotion.streakOneDay).not.toContain('1 días');
    expect(en.devotion.streakOneDay).not.toContain('1 days');
  });
});
