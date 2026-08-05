/**
 * 🕓 exploreRecency — "which category did the reader last visit from
 * Explorar todo", used to pick the screen's featured/hero category.
 *
 * Purely local (AsyncStorage), same shape as [[factFavorites]] /
 * [[prophecyFavorites]]: best-effort persistence, no Firestore, nothing to
 * sync across devices — this is UI personalization for a single device, not
 * app state a reader would expect to follow them (standing rule: minimize
 * Firestore sync; this feature adds none).
 *
 * `resolveFeaturedCategoryId` is kept pure/exported separately from the
 * AsyncStorage read/write so the selection logic (including the first-run
 * fallback) is unit-testable without touching storage at all.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_FEATURED_CATEGORY_ID} from './exploreCategories';

const STORAGE_KEY = '@explore_last_visited_category_v1';

export {DEFAULT_FEATURED_CATEGORY_ID};

/**
 * The last category id the reader navigated into FROM this screen, or
 * `null` if they've never done so (fresh install, or never opened Explorar
 * todo before). Defensive on a corrupt/missing value → null, never throws.
 */
export async function getLastVisitedCategoryId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Records that the reader just navigated into `categoryId` FROM this screen
 * (never on scroll/hover — only on an actual tap-through). Fire-and-forget:
 * a failed write should never block navigation, so callers don't need to
 * await this.
 */
export async function recordCategoryVisit(categoryId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, categoryId);
  } catch {
    // Best-effort personalization only — never worth surfacing to the reader.
  }
}

/**
 * Pure selection logic for the featured/hero category: the most recently
 * visited category wins, but only if it's still a real category (defends
 * against a stale id left over from a category that no longer exists after
 * a future catalogue change). Falls back to a fixed default — never `null`,
 * so the hero card always has something sensible to show rather than
 * nothing/crashing, matching the first-run case (no visit history yet).
 */
export function resolveFeaturedCategoryId(
  lastVisitedId: string | null,
  validCategoryIds: readonly string[],
): string {
  if (lastVisitedId && validCategoryIds.includes(lastVisitedId)) {
    return lastVisitedId;
  }
  return DEFAULT_FEATURED_CATEGORY_ID;
}
