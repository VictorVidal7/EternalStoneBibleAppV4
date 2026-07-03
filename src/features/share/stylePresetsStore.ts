/**
 * 💾 SHARE STYLE PRESETS STORE — device-local AsyncStorage I/O (T8.2).
 *
 * Persists `stylePresets.ts`'s list under one key, mirroring
 * [[prepNotesStore]]. Device-local only, same as everything else in the
 * share-composer flow — nothing here is user content that needs sync.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  addStylePreset,
  parseStylePresets,
  removeStylePreset,
  serializeStylePresets,
  type NewStylePreset,
  type SharedStylePreset,
} from './stylePresets';

const STYLE_PRESETS_KEY = '@share_style_presets';

/** Read all saved presets (empty array if none/corrupt). */
export async function getStylePresets(): Promise<SharedStylePreset[]> {
  try {
    const raw = await AsyncStorage.getItem(STYLE_PRESETS_KEY);
    return parseStylePresets(raw);
  } catch (error) {
    logger.warn('Failed to read share style presets', {error: String(error)});
    return [];
  }
}

/** Save a new preset, returning the updated list. */
export async function saveStylePreset(
  preset: NewStylePreset,
): Promise<SharedStylePreset[]> {
  const current = await getStylePresets();
  const next = addStylePreset(current, preset);
  await AsyncStorage.setItem(STYLE_PRESETS_KEY, serializeStylePresets(next));
  return next;
}

/** Delete a preset by id, returning the updated list. */
export async function deleteStylePreset(
  id: string,
): Promise<SharedStylePreset[]> {
  const current = await getStylePresets();
  const next = removeStylePreset(current, id);
  await AsyncStorage.setItem(STYLE_PRESETS_KEY, serializeStylePresets(next));
  return next;
}
