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
}

type KidsProgressState = Record<string, KidsProfileProgress>;

function emptyProfile(): KidsProfileProgress {
  return {storiesCompleted: [], scenesSeen: {}, quizBest: {}};
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
    v.quizBest !== null
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
      if (isValidProfile(profile)) state[profileId] = profile;
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

/** Mark a story's quiz completed. Idempotent. */
export async function markKidsStoryCompleted(
  storyId: string,
  profileId: string = DEFAULT_KIDS_PROFILE,
): Promise<KidsProfileProgress> {
  const state = await readState();
  const profile = state[profileId] ?? emptyProfile();
  const next: KidsProfileProgress = profile.storiesCompleted.includes(storyId)
    ? profile
    : {...profile, storiesCompleted: [...profile.storiesCompleted, storyId]};
  state[profileId] = next;
  await writeState(state);
  return next;
}
