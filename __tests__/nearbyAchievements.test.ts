/**
 * Sprint 81 — nearby: the pure "almost there" ranking behind the
 * achievements screen strip.
 */

import {
  nearestAchievements,
  NEARBY_DEFAULT_COUNT,
} from '../src/lib/achievements/nearby';
import {
  AchievementCategory,
  AchievementTier,
  type Achievement,
} from '../src/lib/achievements/types';

function make(over: Partial<Achievement> & {id: string}): Achievement {
  return {
    name: over.id,
    description: '',
    icon: '🏆',
    category: AchievementCategory.READING,
    requirement: 100,
    currentProgress: 0,
    isUnlocked: false,
    points: 10,
    tier: AchievementTier.BRONZE,
    ...over,
  };
}

describe('nearestAchievements', () => {
  it('ranks locked achievements by progress ratio, best first', () => {
    const picks = nearestAchievements([
      make({id: 'far', requirement: 100, currentProgress: 10}),
      make({id: 'close', requirement: 100, currentProgress: 90}),
      make({id: 'mid', requirement: 100, currentProgress: 50}),
    ]);
    expect(picks.map(a => a.id)).toEqual(['close', 'mid', 'far']);
  });

  it('excludes unlocked, zero-progress and at-target achievements', () => {
    const picks = nearestAchievements([
      make({id: 'done', currentProgress: 80, isUnlocked: true}),
      make({id: 'untouched', currentProgress: 0}),
      make({id: 'at-target', currentProgress: 100, requirement: 100}),
      make({id: 'walking', currentProgress: 1}),
    ]);
    expect(picks.map(a => a.id)).toEqual(['walking']);
  });

  it('never surfaces event-driven SPECIAL badges (progress stays 0)', () => {
    const picks = nearestAchievements([
      make({
        id: 'early_bird',
        category: AchievementCategory.SPECIAL,
        requirement: 1,
        currentProgress: 0,
      }),
    ]);
    expect(picks).toEqual([]);
  });

  it('breaks ratio ties toward the smaller requirement', () => {
    const picks = nearestAchievements([
      make({id: 'big', requirement: 1000, currentProgress: 500}),
      make({id: 'small', requirement: 10, currentProgress: 5}),
    ]);
    expect(picks.map(a => a.id)).toEqual(['small', 'big']);
  });

  it('caps at the requested count (default 3) and tolerates bad input', () => {
    const many = [
      make({id: 'a', currentProgress: 10}),
      make({id: 'b', currentProgress: 20}),
      make({id: 'c', currentProgress: 30}),
      make({id: 'd', currentProgress: 40}),
      make({id: 'broken', requirement: 0, currentProgress: 5}),
    ];
    expect(nearestAchievements(many)).toHaveLength(NEARBY_DEFAULT_COUNT);
    expect(nearestAchievements(many, 1).map(a => a.id)).toEqual(['d']);
    expect(nearestAchievements(many, -2)).toEqual([]);
  });
});
