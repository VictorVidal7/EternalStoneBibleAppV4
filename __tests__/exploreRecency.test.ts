/**
 * exploreRecency — the "which category did the reader last visit from
 * Explorar todo" tracker backing the screen's featured/hero card
 * (`app/features/explore-all/index.tsx`).
 *
 * Two things are pinned here:
 *  1. `resolveFeaturedCategoryId` — the pure selection logic, including the
 *     first-run fallback (no visit history yet) and the defensive fallback
 *     for a stale/unknown id (e.g. a category removed in a future catalogue
 *     change).
 *  2. The AsyncStorage round trip (`recordCategoryVisit` /
 *     `getLastVisitedCategoryId`) — purely local, no Firestore, same shape
 *     as `factFavorites`/`prophecyFavorites`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_FEATURED_CATEGORY_ID,
  getLastVisitedCategoryId,
  recordCategoryVisit,
  resolveFeaturedCategoryId,
} from '../src/features/explore/exploreRecency';
import {getExploreCategoryIds} from '../src/features/explore/exploreCategories';

const VALID_IDS = getExploreCategoryIds();

describe('resolveFeaturedCategoryId (pure)', () => {
  it('first run / no visit history yet (null) falls back to the fixed default', () => {
    expect(resolveFeaturedCategoryId(null, VALID_IDS)).toBe(
      DEFAULT_FEATURED_CATEGORY_ID,
    );
  });

  it('an empty-string id (defensive) also falls back to the default', () => {
    expect(resolveFeaturedCategoryId('', VALID_IDS)).toBe(
      DEFAULT_FEATURED_CATEGORY_ID,
    );
  });

  it('a valid, recently-visited category id wins over the default', () => {
    expect(resolveFeaturedCategoryId('quiz', VALID_IDS)).toBe('quiz');
    expect(resolveFeaturedCategoryId('journeys', VALID_IDS)).toBe('journeys');
  });

  it('a stale id no longer in the catalogue falls back to the default rather than crashing', () => {
    expect(resolveFeaturedCategoryId('some-retired-category', VALID_IDS)).toBe(
      DEFAULT_FEATURED_CATEGORY_ID,
    );
  });

  it('the default id is itself a real category (sanity check)', () => {
    expect(VALID_IDS).toContain(DEFAULT_FEATURED_CATEGORY_ID);
  });
});

describe('getLastVisitedCategoryId / recordCategoryVisit (AsyncStorage round trip)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null before anything has ever been recorded', async () => {
    expect(await getLastVisitedCategoryId()).toBeNull();
  });

  it('persists a visited category id across the round trip', async () => {
    await recordCategoryVisit('dictionary');
    expect(await getLastVisitedCategoryId()).toBe('dictionary');
  });

  it('a later visit overwrites the earlier one (only the MOST recent wins)', async () => {
    await recordCategoryVisit('dictionary');
    await recordCategoryVisit('quiz');
    expect(await getLastVisitedCategoryId()).toBe('quiz');
  });

  it('a corrupt/unexpected stored value is handled defensively, not thrown', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(getLastVisitedCategoryId()).resolves.toBeNull();
  });

  it('a failed write never throws (best-effort persistence)', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(recordCategoryVisit('quiz')).resolves.toBeUndefined();
  });

  it('end-to-end: a recorded visit resolves as the featured category on the next read', async () => {
    await recordCategoryVisit('journeys');
    const lastVisited = await getLastVisitedCategoryId();
    expect(resolveFeaturedCategoryId(lastVisited, VALID_IDS)).toBe('journeys');
  });
});
