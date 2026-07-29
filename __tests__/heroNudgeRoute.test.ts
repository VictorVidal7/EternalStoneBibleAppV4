/**
 * Home-reorg bug fix: the hero card's contextual nudge ("sigue tu racha" /
 * "continúa en {{book}}" / "tu versículo de hoy te espera") used to render
 * with NO onPress at all, despite every copy variant implying an action.
 * `heroNudgeRoute` is the pure routing decision behind the fix, exported
 * alongside the Home screen's default export so it's unit-testable without
 * rendering the whole screen (Home pulls in ~14 context hooks).
 */
import {heroNudgeRoute} from '../app/(tabs)/index';

const lastRead = {book: 'Juan', chapter: 3};
const dailyVerse = {book: 'Salmos', chapter: 23, verse: 1};

describe('heroNudgeRoute', () => {
  it('routes a streak nudge to continue reading when there is a lastRead', () => {
    expect(heroNudgeRoute('streak', lastRead, dailyVerse)).toBe(
      '/verse/Juan/3',
    );
  });

  it('routes a continue nudge to continue reading when there is a lastRead', () => {
    expect(heroNudgeRoute('continue', lastRead, dailyVerse)).toBe(
      '/verse/Juan/3',
    );
  });

  it('falls back to the daily verse for a streak nudge with no lastRead', () => {
    // Reachable in practice: homeNudge({streak: 3, hasLastRead: false}) can't
    // happen from real state (a streak implies reading history), but the
    // routing function stays defensive rather than assuming the pairing.
    expect(heroNudgeRoute('streak', null, dailyVerse)).toBe(
      '/verse/Salmos/23?verse=1',
    );
  });

  it('routes the daily nudge to the daily verse', () => {
    expect(heroNudgeRoute('daily', null, dailyVerse)).toBe(
      '/verse/Salmos/23?verse=1',
    );
  });

  it('prefers continue reading over the daily verse when both are present', () => {
    expect(heroNudgeRoute('continue', lastRead, dailyVerse)).toBe(
      '/verse/Juan/3',
    );
  });

  it('returns null when there is nothing to route to yet', () => {
    // The near-unreachable case (loading gates the render and loadHomeData
    // falls back to a random verse) — the hero simply becomes a no-op tap
    // rather than crashing.
    expect(heroNudgeRoute('daily', null, null)).toBeNull();
    expect(heroNudgeRoute('continue', null, null)).toBeNull();
  });
});
