/**
 * Groups TTS voices by their real region instead of showing the OS's raw
 * `voice.name`/`voice.language` (often a cryptic engine identifier) and a
 * single fixed language flag for every region (T15 — #18: es-US/es-MX
 * voices were shown under Spain's 🇪🇸, indistinguishable from an es-ES
 * voice). Pure/RN-free so it's unit-testable on its own — display text is
 * never hardcoded here, callers supply localized labels (T25's i18n pass).
 */

import {VoiceInfo} from '../types/audio';

export interface RegionGroup {
  /** Stable id for the bucket (not necessarily a single BCP-47 region). */
  key: string;
  label: string;
  flag: string;
  voices: VoiceInfo[];
}

interface RegionInfo {
  key: string;
  flag: string;
}

/**
 * BCP-47 language-region prefixes (lowercased) this app's TTS ever offers
 * (see `SUPPORTED_LANGUAGES`), mapped to a display bucket. All Latin-American
 * Spanish variants collapse into one "Latinoamérica" bucket — the point of
 * #18 is that es-US/es-MX/es-AR/es-CO were being mislabeled as Spain, not
 * that each needs its own flag.
 */
const REGION_INFO: Record<string, RegionInfo> = {
  'es-es': {key: 'es-ES', flag: '🇪🇸'},
  'es-mx': {key: 'es-LATAM', flag: '🌎'},
  'es-us': {key: 'es-LATAM', flag: '🌎'},
  'es-ar': {key: 'es-LATAM', flag: '🌎'},
  'es-co': {key: 'es-LATAM', flag: '🌎'},
  'en-us': {key: 'en-US', flag: '🇺🇸'},
  'en-gb': {key: 'en-GB', flag: '🇬🇧'},
  'en-au': {key: 'en-AU', flag: '🇦🇺'},
  'en-in': {key: 'en-IN', flag: '🇮🇳'},
};

/** Stable fallback order groups appear in when the device region doesn't match any of them. */
const DEFAULT_GROUP_ORDER = [
  'es-ES',
  'es-LATAM',
  'en-US',
  'en-GB',
  'en-AU',
  'en-IN',
];

function regionInfoFor(languageCode: string): RegionInfo {
  const lower = languageCode.toLowerCase();
  const match = Object.keys(REGION_INFO).find(prefix =>
    lower.startsWith(prefix),
  );
  if (match) return REGION_INFO[match];
  // Defensive fallback for an OS-reported code outside SUPPORTED_LANGUAGES —
  // its key doubles as the display label (see `regionLabels` in
  // `groupVoicesByRegion`), showing the raw code rather than hiding the voice.
  return {key: languageCode, flag: '🌐'};
}

/**
 * Which of the ALREADY-PRESENT groups a bare device region code (e.g. "US",
 * "MX") maps to. Restricted to `presentKeys` because a region code alone is
 * ambiguous across languages (e.g. "US" suffixes both es-US and en-US) —
 * the caller only ever groups one language's voices at a time, so only that
 * language's buckets can be real candidates.
 */
function keyForDeviceRegion(
  regionCode: string,
  presentKeys: ReadonlySet<string>,
): string | undefined {
  const suffix = `-${regionCode.toLowerCase()}`;
  const match = Object.entries(REGION_INFO).find(
    ([prefix, info]) => prefix.endsWith(suffix) && presentKeys.has(info.key),
  );
  return match?.[1].key;
}

/**
 * Buckets `voices` by region, in display order, with the device's own
 * region first (falls back to the stable default order when there's no
 * match or no device region given). Voices keep their incoming relative
 * order within a group (callers already sort by quality upstream).
 *
 * `regionLabels` localizes the bucket names (keyed by `RegionGroup.key`,
 * e.g. `t.audio.voiceSelector.regions` — see `VoiceSelector.tsx`); a key
 * missing from the map (the raw-BCP-47-code fallback bucket) falls back to
 * showing that code itself, same as before this was made caller-supplied.
 */
export function groupVoicesByRegion(
  voices: VoiceInfo[],
  deviceRegionCode: string | null | undefined,
  regionLabels: Record<string, string>,
): RegionGroup[] {
  const groups = new Map<string, RegionGroup>();
  for (const voice of voices) {
    const info = regionInfoFor(voice.language);
    const existing = groups.get(info.key);
    if (existing) {
      existing.voices.push(voice);
    } else {
      groups.set(info.key, {
        key: info.key,
        flag: info.flag,
        label: regionLabels[info.key] ?? info.key,
        voices: [voice],
      });
    }
  }

  const deviceKey = deviceRegionCode
    ? keyForDeviceRegion(deviceRegionCode, new Set(groups.keys()))
    : undefined;

  const ordered = [...groups.keys()].sort((a, b) => {
    if (a === deviceKey) return -1;
    if (b === deviceKey) return 1;
    const ai = DEFAULT_GROUP_ORDER.indexOf(a);
    const bi = DEFAULT_GROUP_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return ordered.map(key => groups.get(key)!);
}

/**
 * "Latinoamérica · Voz 2" style label, hiding the raw OS name. `voiceWord`
 * is the localized word for "Voice" (e.g. `t.audio.voiceSelector.voiceWord`)
 * so this stays free of any hardcoded language.
 */
export function friendlyVoiceLabel(
  regionLabel: string,
  indexInGroup: number,
  voiceWord: string,
): string {
  return `${regionLabel} · ${voiceWord} ${indexInGroup + 1}`;
}

/**
 * The same friendly label for whichever voice in `groups` has `identifier`
 * — lets a collapsed trigger button show "Latinoamérica · Voz 2" instead of
 * the voice's own raw OS name, without recomputing the grouping twice.
 */
export function findFriendlyVoiceLabel(
  groups: RegionGroup[],
  identifier: string,
  voiceWord: string,
): string | null {
  for (const group of groups) {
    const index = group.voices.findIndex(v => v.identifier === identifier);
    if (index !== -1) return friendlyVoiceLabel(group.label, index, voiceWord);
  }
  return null;
}
