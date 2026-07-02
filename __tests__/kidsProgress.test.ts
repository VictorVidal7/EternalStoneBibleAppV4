/**
 * Device-local progress for "Biblia para niños" — scenes seen, quiz best
 * score, and completed stories, keyed by profile (multi-profile-ready).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getKidsProgress,
  markKidsSceneSeen,
  recordKidsQuizScore,
  markKidsStoryCompleted,
  DEFAULT_KIDS_PROFILE,
} from '../src/features/kids/kidsProgress';

const STORAGE_KEY = '@kids_progress_v1';

describe('kidsProgress', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns empty defaults when nothing is persisted', async () => {
    await expect(getKidsProgress()).resolves.toEqual({
      storiesCompleted: [],
      scenesSeen: {},
      quizBest: {},
    });
  });

  it('persists under the documented storage key', async () => {
    await markKidsSceneSeen('creation', 2);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toHaveProperty(DEFAULT_KIDS_PROFILE);
  });

  it('markKidsSceneSeen keeps the highest scene index reached', async () => {
    await markKidsSceneSeen('creation', 2);
    await markKidsSceneSeen('creation', 1); // going backward shouldn't regress
    const progress = await markKidsSceneSeen('creation', 4);
    expect(progress.scenesSeen.creation).toBe(4);
  });

  it('recordKidsQuizScore keeps the best score across attempts', async () => {
    await recordKidsQuizScore('noah', 1);
    await recordKidsQuizScore('noah', 3);
    const progress = await recordKidsQuizScore('noah', 2);
    expect(progress.quizBest.noah).toBe(3);
  });

  it('markKidsStoryCompleted is idempotent', async () => {
    await markKidsStoryCompleted('jonah');
    const progress = await markKidsStoryCompleted('jonah');
    expect(progress.storiesCompleted).toEqual(['jonah']);
  });

  it('a corrupt stored value falls back to empty defaults without throwing', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{not valid json');
    await expect(getKidsProgress()).resolves.toEqual({
      storiesCompleted: [],
      scenesSeen: {},
      quizBest: {},
    });
  });

  it('a malformed profile shape is dropped, not trusted', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({[DEFAULT_KIDS_PROFILE]: {storiesCompleted: 'nope'}}),
    );
    await expect(getKidsProgress()).resolves.toEqual({
      storiesCompleted: [],
      scenesSeen: {},
      quizBest: {},
    });
  });

  it('writing to the default profile does not clobber another profile', async () => {
    await markKidsStoryCompleted('creation', 'other-child');
    await markKidsStoryCompleted('noah', DEFAULT_KIDS_PROFILE);

    const other = await getKidsProgress('other-child');
    const mine = await getKidsProgress(DEFAULT_KIDS_PROFILE);
    expect(other.storiesCompleted).toEqual(['creation']);
    expect(mine.storiesCompleted).toEqual(['noah']);
  });
});
