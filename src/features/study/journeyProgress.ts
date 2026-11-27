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
    return await readStrict();
  } catch {
    return new Set();
  }
}

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

/**
 * Mark a journey stop id visited and persist. Returns the updated set so the
 * caller can update state without a re-read. No-op-safe if already present.
 */
export async function markJourneyStopVisited(id: string): Promise<Set<string>> {
  let visited: Set<string>;
  try {
    visited = await readStrict();
  } catch {
    // Could not read what is saved: writing now would replace it with only
    // this mark (R9-601). Skip the write; the caller keeps what it shows.
    return new Set();
  }
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
