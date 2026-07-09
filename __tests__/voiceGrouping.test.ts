import {
  groupVoicesByRegion,
  friendlyVoiceLabel,
  findFriendlyVoiceLabel,
} from '../src/features/audio/lib/voiceGrouping';
import {VoiceInfo} from '../src/features/audio/types/audio';

function voice(
  identifier: string,
  language: string,
  quality: VoiceInfo['quality'] = 'Default',
): VoiceInfo {
  return {identifier, name: identifier, language, quality};
}

// Mirrors translations.ts's `audio.voiceSelector.regions` (es) — tests stay
// decoupled from the real i18n file, since the module itself is caller-supplied.
const ES_LABELS: Record<string, string> = {
  'es-ES': 'España',
  'es-LATAM': 'Latinoamérica',
  'en-US': 'Estados Unidos',
  'en-GB': 'Reino Unido',
  'en-AU': 'Australia',
  'en-IN': 'India',
};

const EN_LABELS: Record<string, string> = {
  'es-ES': 'Spain',
  'es-LATAM': 'Latin America',
  'en-US': 'United States',
  'en-GB': 'United Kingdom',
  'en-AU': 'Australia',
  'en-IN': 'India',
};

describe('groupVoicesByRegion', () => {
  it('buckets every Latin-American Spanish variant together, separate from Spain', () => {
    const groups = groupVoicesByRegion(
      [
        voice('a', 'es-ES'),
        voice('b', 'es-MX'),
        voice('c', 'es-US'),
        voice('d', 'es-AR'),
        voice('e', 'es-CO'),
      ],
      null,
      ES_LABELS,
    );

    const spain = groups.find(g => g.key === 'es-ES');
    const latam = groups.find(g => g.key === 'es-LATAM');
    expect(spain?.voices.map(v => v.identifier)).toEqual(['a']);
    expect(latam?.voices.map(v => v.identifier)).toEqual(['b', 'c', 'd', 'e']);
    expect(spain?.flag).toBe('🇪🇸');
    expect(latam?.flag).toBe('🌎');
  });

  it('gives each English region its own correctly-flagged bucket', () => {
    const groups = groupVoicesByRegion(
      [
        voice('a', 'en-US'),
        voice('b', 'en-GB'),
        voice('c', 'en-AU'),
        voice('d', 'en-IN'),
      ],
      null,
      ES_LABELS,
    );
    expect(groups.map(g => g.key)).toEqual([
      'en-US',
      'en-GB',
      'en-AU',
      'en-IN',
    ]);
    expect(groups.find(g => g.key === 'en-GB')?.flag).toBe('🇬🇧');
  });

  it('preserves incoming voice order within a group (upstream quality sort)', () => {
    const groups = groupVoicesByRegion(
      [
        voice('premium', 'es-MX', 'Premium'),
        voice('default', 'es-US', 'Default'),
      ],
      null,
      ES_LABELS,
    );
    expect(
      groups.find(g => g.key === 'es-LATAM')?.voices.map(v => v.identifier),
    ).toEqual(['premium', 'default']);
  });

  it('sorts the device region first without a device region given', () => {
    const groups = groupVoicesByRegion(
      [voice('a', 'es-MX'), voice('b', 'es-ES')],
      null,
      ES_LABELS,
    );
    expect(groups.map(g => g.key)).toEqual(['es-ES', 'es-LATAM']);
  });

  it('moves the matching device region group to the front', () => {
    const groups = groupVoicesByRegion(
      [voice('a', 'es-ES'), voice('b', 'es-MX')],
      'MX',
      ES_LABELS,
    );
    expect(groups.map(g => g.key)).toEqual(['es-LATAM', 'es-ES']);
  });

  it('does not let an ambiguous region code cross languages (US matches only the present language)', () => {
    const spanishOnly = groupVoicesByRegion(
      [voice('a', 'es-US')],
      'US',
      ES_LABELS,
    );
    expect(spanishOnly.map(g => g.key)).toEqual(['es-LATAM']);

    const englishOnly = groupVoicesByRegion(
      [voice('a', 'en-US')],
      'US',
      ES_LABELS,
    );
    expect(englishOnly.map(g => g.key)).toEqual(['en-US']);
  });

  it('falls back to a raw-code bucket for an unsupported region instead of hiding the voice', () => {
    const groups = groupVoicesByRegion([voice('a', 'fr-FR')], null, ES_LABELS);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('fr-FR');
    expect(groups[0].flag).toBe('🌐');
  });

  it('returns nothing for an empty voice list', () => {
    expect(groupVoicesByRegion([], null, ES_LABELS)).toEqual([]);
  });

  it('localizes bucket labels from the caller-supplied map (EN)', () => {
    const groups = groupVoicesByRegion(
      [voice('a', 'es-ES'), voice('b', 'es-MX')],
      null,
      EN_LABELS,
    );
    expect(groups.find(g => g.key === 'es-ES')?.label).toBe('Spain');
    expect(groups.find(g => g.key === 'es-LATAM')?.label).toBe('Latin America');
  });
});

describe('friendlyVoiceLabel', () => {
  it('formats a 1-based "Voz N" suffix under the region label', () => {
    expect(friendlyVoiceLabel('Latinoamérica', 0, 'Voz')).toBe(
      'Latinoamérica · Voz 1',
    );
    expect(friendlyVoiceLabel('España', 2, 'Voz')).toBe('España · Voz 3');
  });

  it('uses the caller-supplied word for the voice slot (EN)', () => {
    expect(friendlyVoiceLabel('Latin America', 0, 'Voice')).toBe(
      'Latin America · Voice 1',
    );
  });
});

describe('findFriendlyVoiceLabel', () => {
  it('finds the friendly label for a voice by identifier across groups', () => {
    const groups = groupVoicesByRegion(
      [voice('a', 'es-ES'), voice('b', 'es-MX'), voice('c', 'es-US')],
      null,
      ES_LABELS,
    );
    expect(findFriendlyVoiceLabel(groups, 'a', 'Voz')).toBe('España · Voz 1');
    expect(findFriendlyVoiceLabel(groups, 'c', 'Voz')).toBe(
      'Latinoamérica · Voz 2',
    );
  });

  it('returns null for an identifier not present in any group', () => {
    const groups = groupVoicesByRegion([voice('a', 'es-ES')], null, ES_LABELS);
    expect(findFriendlyVoiceLabel(groups, 'missing', 'Voz')).toBeNull();
  });
});
