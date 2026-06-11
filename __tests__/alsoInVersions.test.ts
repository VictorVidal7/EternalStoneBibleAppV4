/**
 * Sprint 77 — alsoInVersions: pure policy for the daily verse's
 * "see it in …" chips. Locks the cross-language-first ordering and the chip
 * caption format.
 */

import {orderAlsoVersions, alsoChipLabel} from '../src/lib/home/alsoInVersions';

const RVR = {id: 'RVR1960', abbreviation: 'RVR1960', language: 'es'};
const KJV = {id: 'KJV', abbreviation: 'KJV', language: 'en'};
const WEB = {id: 'WEB', abbreviation: 'WEB', language: 'en'};
const CATALOG = [RVR, KJV, WEB];

describe('orderAlsoVersions', () => {
  it('excludes the selected version', () => {
    const ids = orderAlsoVersions(RVR, CATALOG).map(v => v.id);
    expect(ids).not.toContain('RVR1960');
    expect(ids).toHaveLength(2);
  });

  it('puts cross-language versions first for a Spanish reader', () => {
    expect(orderAlsoVersions(RVR, CATALOG).map(v => v.id)).toEqual([
      'KJV',
      'WEB',
    ]);
  });

  it('leads with the other language for an English reader', () => {
    // KJV selected: Spanish RVR first, then the same-language sibling WEB.
    expect(orderAlsoVersions(KJV, CATALOG).map(v => v.id)).toEqual([
      'RVR1960',
      'WEB',
    ]);
    expect(orderAlsoVersions(WEB, CATALOG).map(v => v.id)).toEqual([
      'RVR1960',
      'KJV',
    ]);
  });

  it('returns empty for a single-version catalog', () => {
    expect(orderAlsoVersions(RVR, [RVR])).toEqual([]);
  });

  it('preserves catalog order within each language group', () => {
    const extraEs = {id: 'NVI', abbreviation: 'NVI', language: 'es'};
    expect(
      orderAlsoVersions(KJV, [RVR, KJV, WEB, extraEs]).map(v => v.id),
    ).toEqual(['RVR1960', 'NVI', 'WEB']);
  });
});

describe('alsoChipLabel', () => {
  it('captions as LANG · ABBREVIATION', () => {
    expect(alsoChipLabel(KJV)).toBe('EN · KJV');
    expect(alsoChipLabel(RVR)).toBe('ES · RVR1960');
  });
});
