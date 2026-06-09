import {
  buildVersionList,
  type VersionMetaRow,
} from '../src/lib/comparison/versionList';
import {sameLanguage} from '../src/lib/comparison/wordContrast';

// The seeded `bible_versions` rows, mirroring insertDefaultVersions().
const ALL_META: VersionMetaRow[] = [
  {
    id: 'rvr1960',
    name: 'Reina-Valera 1960',
    abbreviation: 'RVR1960',
    language: 'es',
    description: 'es',
    year: 1960,
    is_premium: 0,
  },
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    description: 'en',
    year: 1611,
    is_premium: 0,
  },
  {
    id: 'web',
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'en',
    description: 'en',
    year: 2000,
    is_premium: 0,
  },
];

describe('buildVersionList', () => {
  it('resolves each present version to its true metadata (id match)', () => {
    const list = buildVersionList(['rvr1960', 'kjv', 'web'], ALL_META, 'es');
    expect(list.map(v => v.id).sort()).toEqual(['kjv', 'rvr1960', 'web']);
    const kjv = list.find(v => v.id === 'kjv')!;
    expect(kjv.name).toBe('King James Version');
    expect(kjv.language).toBe('en');
  });

  it('resolves case-insensitively and by abbreviation', () => {
    const list = buildVersionList(['KJV', 'RVR1960'], ALL_META, 'es');
    expect(list.find(v => v.id === 'kjv')?.language).toBe('en');
    expect(list.find(v => v.id === 'rvr1960')?.language).toBe('es');
  });

  it('keeps English versions at language "en" — the regression guard', () => {
    // The bug: filtering metadata to Spanish dropped KJV/WEB rows, so they fell
    // to the generic fallback stamped with the UI language ('es'). With the FULL
    // table, KJV stays 'en' and an RVR1960+KJV pair is NOT same-language.
    const list = buildVersionList(['rvr1960', 'kjv'], ALL_META, 'es');
    const langs = list.map(v => v.language);
    expect(langs.sort()).toEqual(['en', 'es']);
    expect(sameLanguage(langs)).toBe(false);
  });

  it('reports same-language TRUE for an all-English pair (KJV + WEB)', () => {
    const list = buildVersionList(['kjv', 'web'], ALL_META, 'es');
    expect(sameLanguage(list.map(v => v.language))).toBe(true);
  });

  it('falls back to the fallback language only for versions with no metadata', () => {
    const list = buildVersionList(['rvr1960', 'mystery'], ALL_META, 'es');
    const mystery = list.find(v => v.id === 'mystery')!;
    expect(mystery.language).toBe('es');
    expect(mystery.name).toBe('mystery');
    expect(mystery.isPremium).toBe(false);
  });

  it('de-duplicates a version present under both id and abbreviation', () => {
    const list = buildVersionList(['kjv', 'KJV'], ALL_META, 'es');
    expect(list.filter(v => v.id === 'kjv')).toHaveLength(1);
  });

  it('maps is_premium 1 → isPremium true', () => {
    const premiumMeta: VersionMetaRow[] = [{...ALL_META[1], is_premium: 1}];
    const list = buildVersionList(['kjv'], premiumMeta, 'es');
    expect(list[0].isPremium).toBe(true);
  });

  it('sorts by name', () => {
    const list = buildVersionList(['web', 'kjv', 'rvr1960'], ALL_META, 'es');
    expect(list.map(v => v.name)).toEqual([
      'King James Version',
      'Reina-Valera 1960',
      'World English Bible',
    ]);
  });
});
