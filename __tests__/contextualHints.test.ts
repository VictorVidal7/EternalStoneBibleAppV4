/**
 * contextualHints — persistence + trigger logic behind the contextual-hints
 * onboarding layer (a SEPARATE system from the first-run wizard's
 * `@onboarding_completed` flag — see the module's own doc comment for the
 * full design rationale).
 *
 * Pinned here:
 *  1. `computeHintsEligible` — the pure gating rule (pure, no storage).
 *  2. Dismissal is PER-HINT: dismissing one hint id never marks another
 *     dismissed (the judgment call this module documents — per-hint over
 *     one global "seen a hint" flag).
 *  3. The session counter increments AT MOST ONCE per (simulated) app run,
 *     no matter how many callers race to read it, and persists across
 *     separate calls within that run.
 *  4. `resetAllHints` forgets both the dismissed map and the session
 *     counter (mirrors `useOnboarding().reset()`).
 *  5. Defensive behavior: a corrupt dismissed-map value never throws, and
 *     a failed write is swallowed (best-effort persistence, same
 *     survivable-loss contract as the rest of this codebase's local
 *     stores).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CONTEXTUAL_HINT_IDS,
  HINT_ELIGIBLE_AFTER_SESSIONS,
  computeHintsEligible,
  dismissHint,
  getOrIncrementSessionCount,
  isHintDismissed,
  resetAllHints,
  __resetSessionCacheForTests,
} from '../src/lib/onboarding/contextualHints';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetSessionCacheForTests();
});

describe('computeHintsEligible (pure)', () => {
  it('is never eligible before onboarding completes, regardless of session count', () => {
    expect(computeHintsEligible(0, false)).toBe(false);
    expect(computeHintsEligible(HINT_ELIGIBLE_AFTER_SESSIONS, false)).toBe(
      false,
    );
    expect(computeHintsEligible(99, false)).toBe(false);
  });

  it('is not eligible in the session onboarding completes in (session 1)', () => {
    expect(computeHintsEligible(1, true)).toBe(false);
  });

  it('becomes eligible from HINT_ELIGIBLE_AFTER_SESSIONS onward', () => {
    expect(computeHintsEligible(HINT_ELIGIBLE_AFTER_SESSIONS, true)).toBe(true);
    expect(computeHintsEligible(HINT_ELIGIBLE_AFTER_SESSIONS + 5, true)).toBe(
      true,
    );
  });

  it('a session count of 0 (never counted) is not eligible even if onboarding is done', () => {
    expect(computeHintsEligible(0, true)).toBe(false);
  });
});

describe('isHintDismissed / dismissHint (per-hint granularity)', () => {
  it('every hint starts undismissed', async () => {
    for (const id of CONTEXTUAL_HINT_IDS) {
      expect(await isHintDismissed(id)).toBe(false);
    }
  });

  it('dismissing one hint marks only that hint as dismissed', async () => {
    await dismissHint('homeExploreAll');

    expect(await isHintDismissed('homeExploreAll')).toBe(true);
    expect(await isHintDismissed('exploreFeaturedCard')).toBe(false);
    expect(await isHintDismissed('readerFocusMode')).toBe(false);
    expect(await isHintDismissed('prepHeaderActions')).toBe(false);
  });

  it('dismissing a second hint preserves the first (accumulates, does not overwrite)', async () => {
    await dismissHint('homeExploreAll');
    await dismissHint('readerFocusMode');

    expect(await isHintDismissed('homeExploreAll')).toBe(true);
    expect(await isHintDismissed('readerFocusMode')).toBe(true);
    expect(await isHintDismissed('exploreFeaturedCard')).toBe(false);
    expect(await isHintDismissed('prepHeaderActions')).toBe(false);
  });

  it('dismissing the same hint twice is idempotent', async () => {
    await dismissHint('prepHeaderActions');
    await dismissHint('prepHeaderActions');
    expect(await isHintDismissed('prepHeaderActions')).toBe(true);
  });

  it('a corrupt stored value is handled defensively, not thrown (treated as nothing dismissed)', async () => {
    await AsyncStorage.setItem('@contextual_hints_dismissed_v1', 'not json{');
    await expect(isHintDismissed('homeExploreAll')).resolves.toBe(false);
  });

  it('a failed write never throws (best-effort persistence)', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(dismissHint('homeExploreAll')).resolves.toBeUndefined();
  });
});

describe('getOrIncrementSessionCount (once-per-run session counter)', () => {
  it('starts at 1 on the very first call of a fresh run', async () => {
    expect(await getOrIncrementSessionCount()).toBe(1);
  });

  it('repeated calls within the same run return the SAME value (increments once)', async () => {
    const first = await getOrIncrementSessionCount();
    const second = await getOrIncrementSessionCount();
    const third = await getOrIncrementSessionCount();
    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(third).toBe(1);
  });

  it('concurrent callers in the same run never double-increment (in-flight promise is shared)', async () => {
    const [a, b, c] = await Promise.all([
      getOrIncrementSessionCount(),
      getOrIncrementSessionCount(),
      getOrIncrementSessionCount(),
    ]);
    expect([a, b, c]).toEqual([1, 1, 1]);
  });

  it('persists across simulated runs (module cache reset, storage kept)', async () => {
    expect(await getOrIncrementSessionCount()).toBe(1);

    __resetSessionCacheForTests(); // simulates a fresh cold start
    expect(await getOrIncrementSessionCount()).toBe(2);

    __resetSessionCacheForTests();
    expect(await getOrIncrementSessionCount()).toBe(3);
  });

  it('a storage failure falls back to 0 (conservative — never eligible that run)', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('boom'));
    expect(await getOrIncrementSessionCount()).toBe(0);
  });
});

describe('resetAllHints', () => {
  it('clears every hint back to undismissed', async () => {
    await dismissHint('homeExploreAll');
    await dismissHint('readerFocusMode');

    await resetAllHints();

    for (const id of CONTEXTUAL_HINT_IDS) {
      expect(await isHintDismissed(id)).toBe(false);
    }
  });

  it('does NOT reset the session counter — a reset on a warmed-up install stays eligible immediately', async () => {
    await getOrIncrementSessionCount();
    __resetSessionCacheForTests();
    await getOrIncrementSessionCount(); // now at 2, persisted

    await resetAllHints();
    __resetSessionCacheForTests(); // simulate the tester relaunching once

    // Still >= HINT_ELIGIBLE_AFTER_SESSIONS — no extra relaunches needed
    // just because the dismissed hints were forgotten.
    const count = await getOrIncrementSessionCount();
    expect(count).toBeGreaterThanOrEqual(HINT_ELIGIBLE_AFTER_SESSIONS);
  });

  it('never throws even if the underlying storage call fails', async () => {
    jest
      .spyOn(AsyncStorage, 'removeItem')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(resetAllHints()).resolves.toBeUndefined();
  });
});

describe('end-to-end: a hint is eligible once fully warmed up, and only once', () => {
  it('reaches visible-eligible state after 2 sessions, then stays suppressed post-dismiss', async () => {
    // Session 1 — the session onboarding completes in.
    let sessionCount = await getOrIncrementSessionCount();
    expect(computeHintsEligible(sessionCount, true)).toBe(false);

    // Session 2 — eligible now.
    __resetSessionCacheForTests();
    sessionCount = await getOrIncrementSessionCount();
    expect(computeHintsEligible(sessionCount, true)).toBe(true);
    expect(await isHintDismissed('homeExploreAll')).toBe(false);

    // The hint is shown and dismissed.
    await dismissHint('homeExploreAll');

    // Session 3 — still eligible, but now dismissed, so it must not show again.
    __resetSessionCacheForTests();
    sessionCount = await getOrIncrementSessionCount();
    expect(computeHintsEligible(sessionCount, true)).toBe(true);
    expect(await isHintDismissed('homeExploreAll')).toBe(true);
  });
});
