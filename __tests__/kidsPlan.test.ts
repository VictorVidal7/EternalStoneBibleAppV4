/**
 * The kids "Plan de 10 días" pacing model — one story per day, reusing the
 * generic adult [[planPace]] policy with no chapter-specific coupling.
 */
import {
  KIDS_PLAN_DURATION,
  kidsPlanDayStory,
  kidsStoryPlanDay,
  kidsCompletedPlanDays,
  kidsPlanPace,
} from '../src/features/kids/kidsPlan';
import {KIDS_STORY_ORDER} from '../src/features/kids/kidsStories';

describe('kidsPlan — day/story mapping', () => {
  it('has exactly one plan day per story', () => {
    expect(KIDS_PLAN_DURATION).toBe(KIDS_STORY_ORDER.length);
  });

  it('maps every day 1..N to the canonical story order', () => {
    for (let day = 1; day <= KIDS_PLAN_DURATION; day++) {
      expect(kidsPlanDayStory(day)).toBe(KIDS_STORY_ORDER[day - 1]);
    }
  });

  it('returns null for an out-of-range day', () => {
    expect(kidsPlanDayStory(0)).toBeNull();
    expect(kidsPlanDayStory(KIDS_PLAN_DURATION + 1)).toBeNull();
  });

  it('kidsStoryPlanDay is the inverse of kidsPlanDayStory for every story', () => {
    for (const id of KIDS_STORY_ORDER) {
      const day = kidsStoryPlanDay(id);
      expect(kidsPlanDayStory(day)).toBe(id);
    }
  });
});

describe('kidsCompletedPlanDays', () => {
  it('maps completed story ids to sorted day numbers', () => {
    const third = KIDS_STORY_ORDER[2];
    const first = KIDS_STORY_ORDER[0];
    expect(kidsCompletedPlanDays([third, first])).toEqual([1, 3]);
  });

  it('ignores unknown story ids', () => {
    expect(kidsCompletedPlanDays(['not-a-real-story'])).toEqual([]);
  });

  it('is empty for no completions', () => {
    expect(kidsCompletedPlanDays([])).toEqual([]);
  });
});

describe('kidsPlanPace', () => {
  const now = new Date(2026, 5, 11, 12); // 2026-06-11 local noon

  it('reports notStarted when the plan clock has not started', () => {
    const pace = kidsPlanPace(null, [], now);
    expect(pace.status).toBe('notStarted');
    expect(pace.nextDay).toBe(1);
  });

  it('reports onTrack the same day the plan starts', () => {
    const startedAt = new Date(2026, 5, 11, 9).toISOString();
    const pace = kidsPlanPace(startedAt, [], now);
    expect(pace.status).toBe('onTrack');
    expect(pace.scheduledDay).toBe(1);
  });

  it('reports ahead when completions outrun the calendar', () => {
    const startedAt = new Date(2026, 5, 11, 9).toISOString();
    const pace = kidsPlanPace(
      startedAt,
      [KIDS_STORY_ORDER[0], KIDS_STORY_ORDER[1], KIDS_STORY_ORDER[2]],
      now,
    );
    expect(pace.status).toBe('ahead');
    expect(pace.daysAhead).toBe(2);
  });

  it('reports behind, gracefully, when days pass without completions', () => {
    const startedAt = new Date(2026, 5, 8, 9).toISOString(); // 3 days ago
    const pace = kidsPlanPace(startedAt, [], now);
    expect(pace.status).toBe('behind');
    expect(pace.daysBehind).toBeGreaterThan(0);
  });

  it('reports complete once all 10 stories are done, regardless of calendar pace', () => {
    const startedAt = new Date(2026, 5, 1, 9).toISOString();
    const pace = kidsPlanPace(startedAt, [...KIDS_STORY_ORDER], now);
    expect(pace.status).toBe('complete');
    expect(pace.percent).toBe(100);
    expect(pace.nextDay).toBeNull();
  });
});
