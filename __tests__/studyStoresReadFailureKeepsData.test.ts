/**
 * R9-601: a failed storage READ must never end in a WRITE that replaces what is
 * saved. Real stores, real (jest) AsyncStorage; only `getItem` fails, once.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {toggleFactFavorite} from '../src/features/study/factFavorites';
import {toggleJourneyStopFavorite} from '../src/features/study/journeyFavorites';
import {markJourneyStopVisited} from '../src/features/study/journeyProgress';
import {toggleProphecyFavorite} from '../src/features/study/prophecyFavorites';
import {
  markKidsSceneSeen,
  markKidsStoryCompleted,
  recordKidsQuizScore,
} from '../src/features/kids/kidsProgress';

const saved = ['a', 'b'];
const kidsSaved = {
  default: {
    storiesCompleted: ['noah'],
    scenesSeen: {noah: 3},
    quizBest: {noah: 2},
    planStartedAt: '2026-01-01T00:00:00.000Z',
  },
};

const setCases: [string, string, () => Promise<unknown>][] = [
  ['factFavorites', '@fact_favorites_v1', () => toggleFactFavorite('d')],
  [
    'journeyFavorites',
    '@journey_favorites_v1',
    () => toggleJourneyStopFavorite('d'),
  ],
  [
    'journeyProgress',
    '@journey_progress_v1',
    () => markJourneyStopVisited('d'),
  ],
  [
    'prophecyFavorites',
    '@prophecy_favorites_v1',
    () => toggleProphecyFavorite('d'),
  ],
];

const kidsCases: [string, () => Promise<unknown>][] = [
  ['kidsProgress.markKidsSceneSeen', () => markKidsSceneSeen('jonah', 1)],
  ['kidsProgress.recordKidsQuizScore', () => recordKidsQuizScore('jonah', 3)],
  [
    'kidsProgress.markKidsStoryCompleted',
    () => markKidsStoryCompleted('jonah'),
  ],
];

function failNextRead() {
  jest
    .spyOn(AsyncStorage, 'getItem')
    .mockRejectedValueOnce(new Error('disk read failed'));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('R9-601: a failed read never overwrites saved data', () => {
  it.each(setCases)('%s', async (_name, key, write) => {
    await AsyncStorage.setItem(key, JSON.stringify(saved));
    failNextRead();
    await expect(write()).resolves.toBeDefined();
    expect(JSON.parse((await AsyncStorage.getItem(key))!)).toEqual(saved);
  });

  it.each(kidsCases)('%s', async (_name, write) => {
    const key = '@kids_progress_v1';
    await AsyncStorage.setItem(key, JSON.stringify(kidsSaved));
    failNextRead();
    await expect(write()).resolves.toBeDefined();
    expect(JSON.parse((await AsyncStorage.getItem(key))!)).toEqual(kidsSaved);
  });

  it('a later write, with the read working, still saves normally', async () => {
    await AsyncStorage.setItem('@fact_favorites_v1', JSON.stringify(saved));
    failNextRead();
    await toggleFactFavorite('d');
    await toggleFactFavorite('d');
    expect(
      JSON.parse((await AsyncStorage.getItem('@fact_favorites_v1'))!),
    ).toEqual(['a', 'b', 'd']);
  });
});
