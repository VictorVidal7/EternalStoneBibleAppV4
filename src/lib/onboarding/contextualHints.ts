/**
 * 💡 CONTEXTUAL HINTS — persistence + trigger logic
 *
 * A SEPARATE layer from the first-run wizard (`useOnboarding` /
 * `OnboardingScreen`, key `@onboarding_completed`). That wizard is a
 * one-time, full-screen setup flow shown before the tabs ever mount. This
 * module backs small, dismissible, in-place callouts
 * (`ContextualHintBanner`) that point out ONE specific feature the first
 * time a user reaches a screen that has one — never a multi-step guided
 * tour. A hard-coded step-by-step tour needs rewriting every time a
 * screen's layout changes (Home WAS reorganized 2026-07-29 — exactly the
 * kind of change that breaks a hard-coded tour); a hint attached to one
 * feature survives layout churn much better. Deliberate scope decision,
 * not an oversight — see the PR description for the fuller rationale.
 *
 * Uses its OWN AsyncStorage keys, never `@onboarding_completed` — the two
 * systems don't share state, only a read-only dependency (this module's
 * consumer, `useContextualHint`, reads `useOnboarding().completed` to
 * confirm the wizard is done, but never writes to its key).
 *
 * ── Judgment call: dismissal granularity (per-hint, not global) ──
 * Each hint id has its OWN dismissed flag, so dismissing one hint (e.g. the
 * Home "Ver todo" callout) never suppresses the others (e.g. the reader's
 * Focus-mode callout). The alternative — one global "seen a hint, never
 * show another" flag — is simpler but wrong for feature-discovery: a user
 * who dismisses a hint on their very first screen would silently lose every
 * later one, which defeats surfacing DIFFERENT non-obvious features across
 * DIFFERENT screens (the whole point of this layer). Per-hint costs
 * slightly more storage (a small JSON map instead of one boolean) for a lot
 * more discovery value.
 *
 * ── Judgment call: eligibility delay (session count, not wall-clock) ──
 * Hints must never fire during the wizard (structurally true too — the
 * screens that render a hint only ever mount once `onboardingCompleted`
 * is true, see app/_layout.tsx) and must not fire immediately after it
 * either, so the user gets a beat to look around first. This module tracks
 * that with a SESSION COUNTER (incremented at most once per cold start —
 * see the in-flight-promise guard on `getOrIncrementSessionCount`) rather
 * than a wall-clock timestamp: hints become eligible starting from the 2nd
 * app session in which the user is past onboarding, not the same session
 * onboarding just finished in. This was chosen over a time-based delay
 * (e.g. "5 minutes after completing onboarding") because it needs no clock
 * mocking to unit test, has no ambiguous behavior if the user backgrounds
 * the app mid-delay, and treats a returning user updating into this
 * feature for the first time the same way as a brand-new user (both get
 * exactly one "settle in" session before any hint can appear).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Every hint this layer currently ships. Add new ids here as the set grows. */
export const CONTEXTUAL_HINT_IDS = [
  'homeExploreAll',
  'exploreFeaturedCard',
  'readerFocusMode',
  'prepHeaderActions',
  // Expansion batch (T: contextual-hints-expansion) — see each wiring site
  // for why that particular feature was chosen.
  'favoritesCollections',
  'memoryBoxProgress',
  'wordStudyBarChart',
] as const;

export type ContextualHintId = (typeof CONTEXTUAL_HINT_IDS)[number];

/** One JSON map (not one AsyncStorage key per hint) — a single read/write
 * covers every hint's dismissed state, at the cost of a tiny JSON parse.
 * This is an implementation/storage-encoding choice, independent of the
 * per-hint VS global granularity judgment call above (that call is about
 * how many independent flags exist; this is just how they're serialized). */
const DISMISSED_KEY = '@contextual_hints_dismissed_v1';

const SESSION_COUNT_KEY = '@contextual_hints_session_count_v1';

/** Hints are suppressed in the session onboarding completes in (session 1)
 * and become eligible from this session number onward. */
export const HINT_ELIGIBLE_AFTER_SESSIONS = 2;

type DismissedMap = Partial<Record<ContextualHintId, true>>;

async function readDismissedMap(): Promise<DismissedMap> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as DismissedMap) : {};
  } catch {
    return {};
  }
}

/** Has this specific hint already been shown-and-dismissed? Defensive on a
 * corrupt/missing value → false (never blocks a hint from being ELIGIBLE
 * to show just because storage hiccupped once). */
export async function isHintDismissed(
  hintId: ContextualHintId,
): Promise<boolean> {
  const map = await readDismissedMap();
  return map[hintId] === true;
}

/** Marks a single hint as permanently dismissed. Called by
 * `ContextualHintBanner` when it finishes hiding — either the user tapped
 * close, or its auto-dismiss timer elapsed — never merely on mount, so a
 * hint interrupted mid-display (screen left before it finished) gets
 * another chance on the next visit instead of being silently lost. */
export async function dismissHint(hintId: ContextualHintId): Promise<void> {
  try {
    const map = await readDismissedMap();
    if (map[hintId]) return;
    const next: DismissedMap = {...map, [hintId]: true};
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  } catch {
    // Best-effort — a failed write just means this hint may show again
    // next visit, same survivable-loss tradeoff as useOnboarding's flags.
  }
}

// In-flight-promise memoization: guarantees the session counter increments
// AT MOST ONCE per JS engine lifetime (one real cold start), even if
// several `useContextualHint` call sites mount in the same tick (e.g. two
// hints' screens both becoming reachable before either await resolves).
// A plain "already ran" boolean set synchronously BEFORE the first await
// would work too, but caching the promise itself also lets every caller
// this session share one resolved value with no extra AsyncStorage reads.
let sessionCountPromise: Promise<number> | null = null;

/** Reads the persisted session count, incrementing it exactly once for
 * this app run. Every `useContextualHint` mount calls this — the FIRST one
 * (this session) does the increment; the rest just receive the same
 * already-resolved value. */
export function getOrIncrementSessionCount(): Promise<number> {
  if (!sessionCountPromise) {
    sessionCountPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
        const current = raw ? parseInt(raw, 10) || 0 : 0;
        const next = current + 1;
        await AsyncStorage.setItem(SESSION_COUNT_KEY, String(next));
        return next;
      } catch {
        // Conservative fallback: never becomes eligible this run rather
        // than risk showing a hint before its intended delay.
        return 0;
      }
    })();
  }
  return sessionCountPromise;
}

/** Pure gating logic — given the session count already observed this run
 * and whether the first-run wizard is done, may a hint appear at all?
 * (A specific hint also needs `!isHintDismissed(id)` on top of this.) */
export function computeHintsEligible(
  sessionCount: number,
  onboardingCompleted: boolean,
): boolean {
  return onboardingCompleted && sessionCount >= HINT_ELIGIBLE_AFTER_SESSIONS;
}

/** Forgets every hint's dismissed state — the "show me the hints again"
 * testing affordance, mirroring `useOnboarding().reset()`. Not currently
 * wired to any Settings UI (there is no existing dev/settings affordance
 * for the wizard's own reset() either — see the PR description).
 *
 * Deliberately does NOT touch the session counter. An earlier version
 * cleared both keys, which meant a tester who reset the hints had to
 * relaunch the app twice more (session 1 suppressed again, eligible again
 * only from session 2) before anything reappeared — the opposite of what
 * "show me the hints again" implies. Leaving the session count alone means
 * a reset on an install that's already past its first couple of sessions
 * makes every hint eligible again on the very next screen visit. */
export async function resetAllHints(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Best-effort, same as the rest of this module.
  }
}

/** Test-only: clears the in-memory session-count cache without touching
 * AsyncStorage, so each test can control what the next
 * `getOrIncrementSessionCount()` call observes. */
export function __resetSessionCacheForTests(): void {
  sessionCountPromise = null;
}
