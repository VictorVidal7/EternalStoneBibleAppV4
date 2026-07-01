/**
 * 📈 journeyProgress — device-local "explored" marks for the Bible routes.
 *
 * Remembers which journey stops the reader has visited (tapped, in the map or
 * the list), so a route can show "{{n}} de {{total}} recorridas". Purely
 * local (AsyncStorage), never synced — the same shape as [[prophecyProgress]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@journey_progress_v1';

/** Load the set of journey stop ids the reader has visited. Defensive → empty set. */
export async function getVisitedJourneyStops(): Promise<Set<string>> {
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
 * Mark a journey stop id visited and persist. Returns the updated set so the
 * caller can update state without a re-read. No-op-safe if already present.
 */
export async function markJourneyStopVisited(id: string): Promise<Set<string>> {
  const visited = await getVisitedJourneyStops();
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
