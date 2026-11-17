/**
 * R9-30 — the study marks (`@fact_favorites_v1`, `@journey_favorites_v1`,
 * `@journey_progress_v1`) may travel verbatim in `payload.local` only if
 * nothing mounted rewrites them from memory after a restore.
 *
 * Their only writers are the three stores below, and each one re-reads the
 * disk before it writes: the screens (`app/features/facts/index.tsx`,
 * `app/features/journeys/[routeId].tsx`) keep a Set only to draw it and hand
 * the store an id, never the Set. So a screen that loaded the marks BEFORE a
 * restore and is tapped AFTER it must keep what the restore wrote. This
 * pins that down with the real stores: a store that ever caches the set in
 * memory (and writes the cache back) fails here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFavoriteFacts,
  toggleFactFavorite,
} from '../src/features/study/factFavorites';
import {
  getFavoriteJourneyStops,
  toggleJourneyStopFavorite,
} from '../src/features/study/journeyFavorites';
import {
  getVisitedJourneyStops,
  markJourneyStopVisited,
} from '../src/features/study/journeyProgress';

const CASES = [
  {
    key: '@fact_favorites_v1',
    load: getFavoriteFacts,
    write: toggleFactFavorite,
  },
  {
    key: '@journey_favorites_v1',
    load: getFavoriteJourneyStops,
    write: toggleJourneyStopFavorite,
  },
  {
    key: '@journey_progress_v1',
    load: getVisitedJourneyStops,
    write: markJourneyStopVisited,
  },
];

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('R9-30 — a restore under a mounted screen is not overwritten', () => {
  it.each(CASES)(
    '$key: a write after the restore keeps the restored marks',
    async ({key, load, write}) => {
      // The device had "old"; the screen loaded it and keeps it in state.
      await AsyncStorage.setItem(key, JSON.stringify(['old']));
      const onScreen = await load();
      expect([...onScreen]).toEqual(['old']);

      // The restore writes the backup's value under the open screen.
      await AsyncStorage.setItem(key, JSON.stringify(['b', 'c']));

      // The user taps a new id on that same screen.
      const next = await write('d');

      expect([...next].sort()).toEqual(['b', 'c', 'd']);
      expect(JSON.parse((await AsyncStorage.getItem(key)) ?? '[]')).toEqual([
        'b',
        'c',
        'd',
      ]);
    },
  );
});
