/**
 * installedVersions — the catalog filtered to what's usable right now
 * (bundled always + downloaded packs). Translation-packs feature, phase 2.
 */
import {BIBLE_VERSIONS, installedVersions} from '@/constants/bible';

describe('installedVersions', () => {
  it('always includes the bundled versions, even with no installed ids', () => {
    const ids = installedVersions([]).map(v => v.id);
    expect(ids).toEqual(expect.arrayContaining(['RVR1960', 'WEB']));
    // The downloadable ones are NOT offered until present (the old WEB bug).
    expect(ids).not.toContain('KJV');
    expect(ids).not.toContain('BSB');
  });

  it('adds a downloadable version once its verses are present', () => {
    const ids = installedVersions(['RVR1960', 'WEB', 'KJV']).map(v => v.id);
    expect(ids).toContain('KJV');
    expect(ids).not.toContain('BSB');
  });

  it('offers the Spanish packs only once downloaded', () => {
    // Not present by default (they are downloadable, not bundled).
    const base = installedVersions([]).map(v => v.id);
    expect(base).not.toContain('RV1909');
    expect(base).not.toContain('SSE1569');
    // Present once imported.
    const ids = installedVersions(['RVR1960', 'WEB', 'RV1909', 'SSE1569']).map(
      v => v.id,
    );
    expect(ids).toEqual(
      expect.arrayContaining(['RV1909', 'SSE1569', 'RVR1960', 'WEB']),
    );
  });

  it('matches installed ids case-insensitively', () => {
    expect(installedVersions(['web', 'bsb']).map(v => v.id)).toEqual(
      expect.arrayContaining(['WEB', 'BSB']),
    );
  });

  it('ignores unknown ids and never duplicates a bundled version', () => {
    const list = installedVersions(['KJV', 'RVR1960', 'nope']);
    expect(list.filter(v => v.id === 'KJV')).toHaveLength(1);
    expect(list.some(v => v.id === 'nope')).toBe(false);
  });

  it('preserves the catalog order', () => {
    // Install every downloadable version so the filtered list equals the
    // full catalog, then assert the order is preserved.
    const allDownloadable = BIBLE_VERSIONS.filter(v => !v.bundled).map(
      v => v.id,
    );
    expect(installedVersions(allDownloadable).map(v => v.id)).toEqual(
      BIBLE_VERSIONS.map(v => v.id),
    );
  });

  it('every catalog version declares a bundled flag', () => {
    for (const v of BIBLE_VERSIONS) expect(typeof v.bundled).toBe('boolean');
  });
});
