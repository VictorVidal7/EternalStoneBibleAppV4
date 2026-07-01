/**
 * 🔖 factFavorites — device-local "favorite" marks for "¿Sabías qué?".
 *
 * Lets the reader star facts they want to return to, and filter the index to
 * just those. Purely local (AsyncStorage), never synced — the same shape as
 * [[prophecyFavorites]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fact_favorites_v1';

/** Load the set of favorited fact ids. Defensive → empty set. */
export async function getFavoriteFacts(): Promise<Set<string>> {
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
 * Toggle a fact id's favorite state and persist. Returns the updated set so
 * the caller can update state without a re-read. Best-effort persistence.
 */
export async function toggleFactFavorite(id: string): Promise<Set<string>> {
  const favorites = await getFavoriteFacts();
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Persisting favorites is best-effort; never block the reader.
  }
  return favorites;
}
