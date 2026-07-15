/**
 * 💾 COMPACT SHARE STYLE PRESETS STORE — device-local AsyncStorage I/O
 * (Tanda M3 foundation).
 *
 * Persists `compactStylePresets.ts`'s list under its OWN key, distinct from
 * the flagship's `@share_style_presets` (see [[stylePresetsStore]]) so the
 * two lists never collide. Device-local only, same as everything else in
 * the share-composer flow — nothing here is user content that needs sync.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  addCompactStylePreset,
  parseCompactStylePresets,
  removeCompactStylePreset,
  serializeCompactStylePresets,
  type CompactStylePreset,
  type NewCompactStylePreset,
} from './compactStylePresets';

const COMPACT_STYLE_PRESETS_KEY = '@share_style_presets_compact';

/** Read all saved presets (empty array if none/corrupt). */
export async function getCompactStylePresets(): Promise<CompactStylePreset[]> {
  try {
    const raw = await AsyncStorage.getItem(COMPACT_STYLE_PRESETS_KEY);
    return parseCompactStylePresets(raw);
  } catch (error) {
    logger.warn('Failed to read compact share style presets', {
      error: String(error),
    });
    return [];
  }
}

/** Save a new preset, returning the updated list. */
export async function saveCompactStylePreset(
  preset: NewCompactStylePreset,
): Promise<CompactStylePreset[]> {
  const current = await getCompactStylePresets();
  const next = addCompactStylePreset(current, preset);
  await AsyncStorage.setItem(
    COMPACT_STYLE_PRESETS_KEY,
    serializeCompactStylePresets(next),
  );
  return next;
}

/** Delete a preset by id, returning the updated list. */
export async function deleteCompactStylePreset(
  id: string,
): Promise<CompactStylePreset[]> {
  const current = await getCompactStylePresets();
  const next = removeCompactStylePreset(current, id);
  await AsyncStorage.setItem(
    COMPACT_STYLE_PRESETS_KEY,
    serializeCompactStylePresets(next),
  );
  return next;
}
