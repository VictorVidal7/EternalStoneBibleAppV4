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

describe('groupVoicesByRegion', () => {
  it('buckets every Latin-American Spanish variant together, separate from Spain', () => {
    const groups = groupVoicesByRegion([
      voice('a', 'es-ES'),
      voice('b', 'es-MX'),
      voice('c', 'es-US'),
      voice('d', 'es-AR'),
      voice('e', 'es-CO'),
    ]);

    const spain = groups.find(g => g.key === 'es-ES');
    const latam = groups.find(g => g.key === 'es-LATAM');
    expect(spain?.voices.map(v => v.identifier)).toEqual(['a']);
    expect(latam?.voices.map(v => v.identifier)).toEqual(['b', 'c', 'd', 'e']);
    expect(spain?.flag).toBe('🇪🇸');
    expect(latam?.flag).toBe('🌎');
  });

  it('gives each English region its own correctly-flagged bucket', () => {
    const groups = groupVoicesByRegion([
      voice('a', 'en-US'),
      voice('b', 'en-GB'),
      voice('c', 'en-AU'),
      voice('d', 'en-IN'),
    ]);
    expect(groups.map(g => g.key)).toEqual([
      'en-US',
      'en-GB',
      'en-AU',
      'en-IN',
    ]);
    expect(groups.find(g => g.key === 'en-GB')?.flag).toBe('🇬🇧');
  });

  it('preserves incoming voice order within a group (upstream quality sort)', () => {
    const groups = groupVoicesByRegion([
      voice('premium', 'es-MX', 'Premium'),
      voice('default', 'es-US', 'Default'),
    ]);
    expect(
      groups.find(g => g.key === 'es-LATAM')?.voices.map(v => v.identifier),
    ).toEqual(['premium', 'default']);
  });

  it('sorts the device region first without a device region given', () => {
    const groups = groupVoicesByRegion([
      voice('a', 'es-MX'),
      voice('b', 'es-ES'),
    ]);
    expect(groups.map(g => g.key)).toEqual(['es-ES', 'es-LATAM']);
  });

  it('moves the matching device region group to the front', () => {
    const groups = groupVoicesByRegion(
      [voice('a', 'es-ES'), voice('b', 'es-MX')],
      'MX',
    );
    expect(groups.map(g => g.key)).toEqual(['es-LATAM', 'es-ES']);
  });

  it('does not let an ambiguous region code cross languages (US matches only the present language)', () => {
    const spanishOnly = groupVoicesByRegion([voice('a', 'es-US')], 'US');
    expect(spanishOnly.map(g => g.key)).toEqual(['es-LATAM']);

    const englishOnly = groupVoicesByRegion([voice('a', 'en-US')], 'US');
    expect(englishOnly.map(g => g.key)).toEqual(['en-US']);
  });

  it('falls back to a raw-code bucket for an unsupported region instead of hiding the voice', () => {
    const groups = groupVoicesByRegion([voice('a', 'fr-FR')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('fr-FR');
    expect(groups[0].flag).toBe('🌐');
  });

  it('returns nothing for an empty voice list', () => {
    expect(groupVoicesByRegion([])).toEqual([]);
  });
});

describe('friendlyVoiceLabel', () => {
  it('formats a 1-based "Voz N" suffix under the region label', () => {
    expect(friendlyVoiceLabel('Latinoamérica', 0)).toBe(
      'Latinoamérica · Voz 1',
    );
    expect(friendlyVoiceLabel('España', 2)).toBe('España · Voz 3');
  });
});

describe('findFriendlyVoiceLabel', () => {
  it('finds the friendly label for a voice by identifier across groups', () => {
    const groups = groupVoicesByRegion([
      voice('a', 'es-ES'),
      voice('b', 'es-MX'),
      voice('c', 'es-US'),
    ]);
    expect(findFriendlyVoiceLabel(groups, 'a')).toBe('España · Voz 1');
    expect(findFriendlyVoiceLabel(groups, 'c')).toBe('Latinoamérica · Voz 2');
  });

  it('returns null for an identifier not present in any group', () => {
    const groups = groupVoicesByRegion([voice('a', 'es-ES')]);
    expect(findFriendlyVoiceLabel(groups, 'missing')).toBeNull();
  });
});
