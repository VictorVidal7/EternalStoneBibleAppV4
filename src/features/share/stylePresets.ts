/**
 * 🎨 SHARE STYLE PRESETS (pure) — T8.2, offering-unlocked
 *
 * Lets a user save their current share-card configuration (template,
 * texture, aspect, font size/family, alignment) as a named preset, so
 * composing a favorite look again is one tap instead of re-picking every
 * control. Device-local only — no sync, no server, mirrors the
 * [[prepNotes]] / [[prepNotesStore]] pure-model-plus-storage split.
 *
 * Pure module — no React/AsyncStorage here (see the sibling
 * [[stylePresetsStore]] for I/O) — so the list/cap/naming logic is
 * unit-tested in isolation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ShareAspect} from './imageTemplates';
import type {ShareTexture} from './textures';
import type {ReaderFontFamily} from '@lib/reader/typefaces';

export interface SharedStylePreset {
  id: string;
  /** Auto-numbered "Estilo N" — no naming UI needed to keep this simple. */
  name: string;
  templateId: string;
  texture: ShareTexture;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  fontFamilyId: ReaderFontFamily;
  aspect: ShareAspect;
}

/** Hard cap so the picker row stays scannable and storage stays tiny. */
export const MAX_STYLE_PRESETS = 6;

export type NewStylePreset = Omit<SharedStylePreset, 'id' | 'name'>;

/**
 * Append a new preset (auto-named "Estilo N" by position), oldest dropped
 * once the cap is reached. `id`/`now` are injectable for deterministic tests.
 */
export function addStylePreset(
  presets: SharedStylePreset[],
  preset: NewStylePreset,
  now: number = Date.now(),
): SharedStylePreset[] {
  const next = [
    ...presets,
    {...preset, id: `preset_${now}`, name: `Estilo ${presets.length + 1}`},
  ];
  return next.length > MAX_STYLE_PRESETS
    ? next.slice(next.length - MAX_STYLE_PRESETS)
    : next;
}

/** Remove one preset by id (no-op if not found). */
export function removeStylePreset(
  presets: SharedStylePreset[],
  id: string,
): SharedStylePreset[] {
  return presets.filter(p => p.id !== id);
}

/** Coerce an unknown value into a clean preset list, dropping malformed rows. */
export function parseStylePresets(
  raw: string | null | undefined,
): SharedStylePreset[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: SharedStylePreset[] = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as SharedStylePreset).id === 'string' &&
      typeof (item as SharedStylePreset).name === 'string' &&
      typeof (item as SharedStylePreset).templateId === 'string' &&
      typeof (item as SharedStylePreset).texture === 'string' &&
      typeof (item as SharedStylePreset).fontSize === 'number' &&
      typeof (item as SharedStylePreset).textAlign === 'string' &&
      typeof (item as SharedStylePreset).fontFamilyId === 'string' &&
      typeof (item as SharedStylePreset).aspect === 'string'
    ) {
      out.push(item as SharedStylePreset);
    }
  }
  return out.slice(0, MAX_STYLE_PRESETS);
}

/** Serialize the list for storage. */
export function serializeStylePresets(presets: SharedStylePreset[]): string {
  return JSON.stringify(presets);
}
