/**
 * 🎨 COMPACT SHARE STYLE PRESETS (pure) — Tanda M3 foundation
 *
 * The reduced sibling of `stylePresets.ts` for the 12 non-verse "share as
 * image" screens (Achievement, Challenge, Testimony, Constancy, Highlights,
 * Mood, Timeline, WeeklyRecap, PeriodRecap, Note, Collection, Compare).
 * Those cards show charts/rings/bars/stat rows with no verse text to
 * typeset, so a saved "look" there is only a template + texture pair — no
 * `fontSize`/`textAlign`/`fontFamilyId`/`aspect` fields.
 *
 * Deliberately a SEPARATE type/module from `stylePresets.ts` (never
 * imported by it, never imports it) so the flagship verse composer's own
 * preset list carries zero regression risk from this work.
 *
 * Pure module — no React/AsyncStorage here (see the sibling
 * [[compactStylePresetsStore]] for I/O) — so the list/cap/naming logic is
 * unit-tested in isolation, mirroring [[stylePresets]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ShareTexture} from './textures';

export interface CompactStylePreset {
  id: string;
  /**
   * Auto-numbered ordinal (e.g. "3") — no naming UI needed to keep this
   * simple. Plain digits so callers can localize the "Style N" wording via
   * i18n (see `t.verse.imageStyleA11y`) instead of baking a language in.
   */
  name: string;
  templateId: string;
  texture: ShareTexture;
}

/** Hard cap so the picker row stays scannable and storage stays tiny. */
export const MAX_COMPACT_STYLE_PRESETS = 6;

export type NewCompactStylePreset = Omit<CompactStylePreset, 'id' | 'name'>;

/**
 * Append a new preset (auto-named by position, e.g. "3"), oldest dropped
 * once the cap is reached. `id`/`now` are injectable for deterministic tests.
 */
export function addCompactStylePreset(
  presets: CompactStylePreset[],
  preset: NewCompactStylePreset,
  now: number = Date.now(),
): CompactStylePreset[] {
  const next = [
    ...presets,
    {...preset, id: `preset_${now}`, name: String(presets.length + 1)},
  ];
  return next.length > MAX_COMPACT_STYLE_PRESETS
    ? next.slice(next.length - MAX_COMPACT_STYLE_PRESETS)
    : next;
}

/** Remove one preset by id (no-op if not found). */
export function removeCompactStylePreset(
  presets: CompactStylePreset[],
  id: string,
): CompactStylePreset[] {
  return presets.filter(p => p.id !== id);
}

/** Coerce an unknown value into a clean preset list, dropping malformed rows. */
export function parseCompactStylePresets(
  raw: string | null | undefined,
): CompactStylePreset[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: CompactStylePreset[] = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as CompactStylePreset).id === 'string' &&
      typeof (item as CompactStylePreset).name === 'string' &&
      typeof (item as CompactStylePreset).templateId === 'string' &&
      typeof (item as CompactStylePreset).texture === 'string'
    ) {
      out.push(item as CompactStylePreset);
    }
  }
  return out.slice(0, MAX_COMPACT_STYLE_PRESETS);
}

/** Serialize the list for storage. */
export function serializeCompactStylePresets(
  presets: CompactStylePreset[],
): string {
  return JSON.stringify(presets);
}
