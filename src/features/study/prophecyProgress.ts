/**
 * 📈 prophecyProgress — device-local "explored" marks for the Hilo profético.
 *
 * Remembers which prophecies the reader has walked through, so the thread can
 * show "{{n}} de {{total}} recorridas" and tick each off in the index. Purely
 * local (AsyncStorage), never synced — a quiet aid, not an achievement.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@prophecy_progress_v1';

/** Load the set of prophecy ids the reader has visited. Defensive → empty set. */
export async function getVisitedProphecies(): Promise<Set<string>> {
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
 * Mark a prophecy id visited and persist. Returns the updated set so the caller
 * can update state without a re-read. No-op-safe if already present.
 */
export async function markPropheciesVisited(id: string): Promise<Set<string>> {
  const visited = await getVisitedProphecies();
  if (!visited.has(id)) {
    visited.add(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
    } catch {
      // Persisting progress is best-effort; never block the reader.
    }
  }
  return visited;
}
