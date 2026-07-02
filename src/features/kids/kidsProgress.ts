/**
 * 📈 kidsProgress — device-local progress for "Biblia para niños".
 *
 * Remembers, per story: the highest scene index reached (so a story can
 * resume), the best quiz score, and whether the quiz was completed. Purely
 * local (AsyncStorage), never synced — same defensive read/best-effort write
 * shape as [[journeyProgress]] / [[prophecyProgress]].
 *
 * Storage is keyed by PROFILE from day one, even though this Tanda ships
 * without a profile picker (there is only `DEFAULT_KIDS_PROFILE`) — so a
 * future "one profile per child" feature only has to add a picker, not
 * migrate this shape.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kids_progress_v1';

export const DEFAULT_KIDS_PROFILE = 'default';

export interface KidsProfileProgress {
  /** Story ids whose quiz has been completed at least once. */
  storiesCompleted: string[];
  /** storyId → highest scene index reached (0-based), for resuming. */
  scenesSeen: Record<string, number>;
  /** storyId → best quiz score (0-3). */
  quizBest: Record<string, number>;
  /**
   * ISO timestamp of the 10-day plan's first story completion; null = the
   * plan's pace clock hasn't started (Tanda 2). Mirrors the adult reading
   * plan's `toggleDay` behavior — the clock starts on the first real
   * completion, not merely on viewing the plan screen.
   */
  planStartedAt: string | null;
}

type KidsProgressState = Record<string, KidsProfileProgress>;

function emptyProfile(): KidsProfileProgress {
  return {
    storiesCompleted: [],
    scenesSeen: {},
    quizBest: {},
    planStartedAt: null,
  };
}

function isValidProfile(value: unknown): value is KidsProfileProgress {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.storiesCompleted) &&
    v.storiesCompleted.every(x => typeof x === 'string') &&
    typeof v.scenesSeen === 'object' &&
    v.scenesSeen !== null &&
    typeof v.quizBest === 'object' &&
    v.quizBest !== null &&
    (v.planStartedAt === null ||
      v.planStartedAt === undefined ||
      typeof v.planStartedAt === 'string')
  );
}

async function readState(): Promise<KidsProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const state: KidsProgressState = {};
    for (const [profileId, profile] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      // Legacy profiles predate `planStartedAt` (Tanda 2) — default it to
      // null rather than leaving it `undefined` at runtime.
      if (isValidProfile(profile)) {
        state[profileId] = {
          ...profile,
          planStartedAt: profile.planStartedAt ?? null,
        };
      }
    }
    return state;
  } catch {
    return {};
  }
}

async function writeState(state: KidsProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persisting progress is best-effort; never block the reader.
  }
}

/** Load a profile's progress. Defensive → empty defaults. */
export async function getKidsProgress(
  profileId: string = DEFAULT_KIDS_PROFILE,
): Promise<KidsProfileProgress> {
  const state = await readState();
  return state[profileId] ?? emptyProfile();
}

/** Record the highest scene index reached for a story (for resuming). */
export async function markKidsSceneSeen(
  storyId: string,
  sceneIndex: number,
  profileId: string = DEFAULT_KIDS_PROFILE,
): Promise<KidsProfileProgress> {
  const state = await readState();
  const profile = state[profileId] ?? emptyProfile();
  const current = profile.scenesSeen[storyId] ?? -1;
  const next: KidsProfileProgress = {
    ...profile,
    scenesSeen: {
      ...profile.scenesSeen,
      [storyId]: Math.max(current, sceneIndex),
    },
  };
  state[profileId] = next;
  await writeState(state);
  return next;
}

/** Record a quiz attempt's score, keeping the best result. */
export async function recordKidsQuizScore(
  storyId: string,
  correct: number,
  profileId: string = DEFAULT_KIDS_PROFILE,
): Promise<KidsProfileProgress> {
  const state = await readState();
  const profile = state[profileId] ?? emptyProfile();
  const best = Math.max(profile.quizBest[storyId] ?? 0, correct);
  const next: KidsProfileProgress = {
    ...profile,
    quizBest: {...profile.quizBest, [storyId]: best},
  };
  state[profileId] = next;
  await writeState(state);
  return next;
}

/**
 * Mark a story's quiz completed. Idempotent. Also starts the 10-day plan's
 * pace clock on the FIRST completion of any story, if it hasn't started yet
 * — the same "first real completion starts the clock" policy the adult
 * reading plans use, so merely browsing never starts the countdown.
 */
export async function markKidsStoryCompleted(
  storyId: string,
  profileId: string = DEFAULT_KIDS_PROFILE,
): Promise<KidsProfileProgress> {
  const state = await readState();
  const profile = state[profileId] ?? emptyProfile();
  const alreadyDone = profile.storiesCompleted.includes(storyId);
  const next: KidsProfileProgress = {
    ...profile,
    storiesCompleted: alreadyDone
      ? profile.storiesCompleted
      : [...profile.storiesCompleted, storyId],
    planStartedAt: profile.planStartedAt ?? new Date().toISOString(),
  };
  state[profileId] = next;
  await writeState(state);
  return next;
}

const READ_TOGETHER_HINT_KEY = '@kids_read_together_hint_v1';

/**
 * Whether the reader has already seen the one-time "Leer juntos" hint
 * (Tanda 3 follow-up) — a device-wide flag, not per-profile, since it's
 * teaching the UI itself rather than tracking a child's progress.
 */
export async function hasSeenReadTogetherHint(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(READ_TOGETHER_HINT_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Marks the "Leer juntos" hint as seen so it never shows again. */
export async function markReadTogetherHintSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(READ_TOGETHER_HINT_KEY, '1');
  } catch {
    // Best-effort; a missed write just means the hint may show once more.
  }
}
