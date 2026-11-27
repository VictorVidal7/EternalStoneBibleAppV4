/**
 * 🔖 journeyFavorites — device-local "favorite" marks for Bible route stops.
 *
 * Lets the reader star stops they want to return to. Purely local
 * (AsyncStorage), never synced — the same shape as [[prophecyFavorites]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@journey_favorites_v1';

/**
 * Reads the stored set. Rejects when the storage read itself fails (R9-601),
 * so a writer never mistakes "could not read" for "nothing saved". A corrupt
 * value still reads as empty: there is nothing to preserve in it.
 */
async function readStrict(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }
  return Array.isArray(parsed)
    ? new Set(parsed.filter((x): x is string => typeof x === 'string'))
    : new Set();
}

/** Load the set of favorited journey stop ids. Defensive → empty set. */
export async function getFavoriteJourneyStops(): Promise<Set<string>> {
  try {
    return await readStrict();
  } catch {
    return new Set();
  }
}

/**
 * Toggle a journey stop id's favorite state and persist. Returns the updated
 * set so the caller can update state without a re-read. Best-effort persist.
 */
export async function toggleJourneyStopFavorite(
  id: string,
): Promise<Set<string>> {
  let favorites: Set<string>;
  try {
    favorites = await readStrict();
  } catch {
    // Could not read what is saved: writing now would replace it with only
    // this change (R9-601). Skip the write; the caller keeps what it shows.
    return new Set();
  }
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Persisting favorites is best-effort; never block the reader.
  }
  return favorites;
}
