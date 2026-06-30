/**
 * 🔖 prophecyFavorites — device-local "favorite" marks for the Hilo profético.
 *
 * Lets the reader star prophecies they want to return to, and filter the index
 * to just those. Purely local (AsyncStorage), never synced — a quiet aid, the
 * same shape as [[prophecyProgress]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@prophecy_favorites_v1';

/** Load the set of favorited prophecy ids. Defensive → empty set. */
export async function getFavoriteProphecies(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((x): x is string => typeof x === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Toggle a prophecy id's favorite state and persist. Returns the updated set so
 * the caller can update state without a re-read. Best-effort persistence.
 */
export async function toggleProphecyFavorite(id: string): Promise<Set<string>> {
  const favorites = await getFavoriteProphecies();
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Persisting favorites is best-effort; never block the reader.
  }
  return favorites;
}
