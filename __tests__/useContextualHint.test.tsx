/**
 * useContextualHint — the trigger hook wiring a single contextual hint's
 * `visible`/`dismiss` to the real `useOnboarding` wizard-completion flag
 * and the contextualHints persistence module (src/lib/onboarding/
 * contextualHints.ts). Exercised against REAL AsyncStorage (same
 * philosophy as exploreRecency.test.ts / quizStatsStore.test.ts) rather
 * than mocking useOnboarding, so this also pins the coexistence contract:
 * a hint must never resolve to visible while the wizard is pending, and
 * not in the very session the wizard just completed in either.
 */
import {renderHook, waitFor, act} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useContextualHint} from '../src/hooks/useContextualHint';
import {
  dismissHint,
  getOrIncrementSessionCount,
  isHintDismissed,
  __resetSessionCacheForTests,
} from '../src/lib/onboarding/contextualHints';

// Mirrors useOnboarding.tsx's own STORAGE_KEY/'1' contract exactly — that
// module keeps the key private, so this reproduces what complete() writes
// rather than importing an internal.
const ONBOARDING_KEY = '@onboarding_completed';

async function markOnboardingCompleted() {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

/** Advances the module's session counter to `count` sessions, the same way
 * separate cold starts would (increment, then simulate a fresh JS run by
 * clearing the in-memory cache) — see contextualHints.test.ts for the
 * counter's own dedicated coverage. */
async function fastForwardToSession(count: number) {
  for (let i = 0; i < count; i++) {
    await getOrIncrementSessionCount();
    __resetSessionCacheForTests();
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetSessionCacheForTests();
});

describe('useContextualHint — wizard coexistence', () => {
  it('never becomes visible while onboarding is still pending (flag unset)', async () => {
    await fastForwardToSession(3); // plenty of sessions — only the wizard flag is missing

    const {result} = renderHook(() => useContextualHint('homeExploreAll'));

    // Give any pending microtasks a chance to run, then confirm it never flipped.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.visible).toBe(false);
  });

  it('does not become visible in the same session onboarding completes in', async () => {
    await markOnboardingCompleted();
    // No fastForwardToSession call — this hook's own first mount is session 1.

    const {result} = renderHook(() => useContextualHint('readerFocusMode'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.visible).toBe(false);
  });
});

describe('useContextualHint — becomes visible once eligible', () => {
  it('resolves visible=true once onboarding is done and the session delay has elapsed', async () => {
    await markOnboardingCompleted();
    await fastForwardToSession(1); // this hook's mount will be session 2

    const {result} = renderHook(() => useContextualHint('exploreFeaturedCard'));

    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  it('a previously-dismissed hint stays hidden even when otherwise eligible', async () => {
    await markOnboardingCompleted();
    await fastForwardToSession(1);
    await dismissHint('prepHeaderActions');

    const {result} = renderHook(() => useContextualHint('prepHeaderActions'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.visible).toBe(false);
  });

  it('different hint ids are independent — one eligible, one already dismissed', async () => {
    await markOnboardingCompleted();
    await fastForwardToSession(1);
    await dismissHint('homeExploreAll');

    const dismissed = renderHook(() => useContextualHint('homeExploreAll'));
    const fresh = renderHook(() => useContextualHint('readerFocusMode'));

    await waitFor(() => expect(fresh.result.current.visible).toBe(true));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(dismissed.result.current.visible).toBe(false);
  });
});

describe('useContextualHint — dismiss()', () => {
  it('flips visible to false immediately and persists the dismissal', async () => {
    await markOnboardingCompleted();
    await fastForwardToSession(1);

    const {result} = renderHook(() => useContextualHint('homeExploreAll'));
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => result.current.dismiss());
    expect(result.current.visible).toBe(false);

    await waitFor(async () =>
      expect(await isHintDismissed('homeExploreAll')).toBe(true),
    );
  });

  it('a hint left un-dismissed (component unmounted early) can still show on the next mount', async () => {
    await markOnboardingCompleted();
    await fastForwardToSession(1);

    const first = renderHook(() => useContextualHint('exploreFeaturedCard'));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    first.unmount(); // never called dismiss()

    expect(await isHintDismissed('exploreFeaturedCard')).toBe(false);

    const second = renderHook(() => useContextualHint('exploreFeaturedCard'));
    await waitFor(() => expect(second.result.current.visible).toBe(true));
  });
});
