import {reconcileSleepTimer} from '../src/features/audio/lib/sleepTimer';

/**
 * sleepTimer — wall-clock reconciliation for the timed sleep timer. JS timers
 * are throttled/suspended while the app is backgrounded, so the engine trusts
 * the stored endTime over the JS clock when it returns to the foreground. These
 * lock the arithmetic the provider acts on (fire+cancel when expired; otherwise
 * re-arm + resync the ceil'd minutes).
 */
describe('reconcileSleepTimer', () => {
  const NOW = 1_000_000_000_000;

  it('reports the remaining minutes (rounded up) while running', () => {
    const r = reconcileSleepTimer(NOW + 5 * 60_000, NOW);
    expect(r.expired).toBe(false);
    expect(r.remainingMs).toBe(5 * 60_000);
    expect(r.remainingMinutes).toBe(5);
  });

  it('rounds a partial minute UP so the UI never shows 0 while playing', () => {
    expect(reconcileSleepTimer(NOW + 90_000, NOW).remainingMinutes).toBe(2);
    expect(reconcileSleepTimer(NOW + 1_000, NOW).remainingMinutes).toBe(1);
  });

  it('is expired once endTime has passed (e.g. elapsed while backgrounded)', () => {
    const r = reconcileSleepTimer(NOW - 30_000, NOW);
    expect(r.expired).toBe(true);
    expect(r.remainingMs).toBe(0);
    expect(r.remainingMinutes).toBe(0);
  });

  it('is expired exactly at endTime (boundary)', () => {
    expect(reconcileSleepTimer(NOW, NOW).expired).toBe(true);
  });
});
