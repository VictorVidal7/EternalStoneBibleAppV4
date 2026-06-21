/**
 * pack-catalog — pure parsing/validation of the downloadable-version catalog
 * (versions.json), translation packs phase 4.
 */
import {
  parsePackVersion,
  parseVersionCatalog,
  PackDownloadError,
} from '@/lib/database/pack-catalog';

const valid = {
  id: 'KJV',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'en',
  year: '1611',
  license: 'Public Domain',
  url: 'https://eternalstonebible.github.io/packs/kjv.sqlite',
  bytes: 4968448,
  sha256: '11D0A2FD46EC111CC3878A4B037ADA4ADD6E27F0CF0C880C2D46C04A38A886AB',
  verseCount: 31102,
};

describe('parsePackVersion', () => {
  it('accepts a well-formed entry and lowercases the hash', () => {
    const v = parsePackVersion(valid);
    expect(v).not.toBeNull();
    expect(v!.id).toBe('KJV');
    expect(v!.sha256).toBe(valid.sha256.toLowerCase());
    expect(v!.bytes).toBe(4968448);
  });

  it('rejects entries missing required fields', () => {
    expect(parsePackVersion(null)).toBeNull();
    expect(parsePackVersion({...valid, id: ''})).toBeNull();
    expect(parsePackVersion({...valid, url: undefined})).toBeNull();
    expect(parsePackVersion({...valid, sha256: ''})).toBeNull();
    expect(parsePackVersion({...valid, bytes: 0})).toBeNull();
    expect(parsePackVersion({...valid, bytes: -1})).toBeNull();
    expect(parsePackVersion({...valid, bytes: 'big'})).toBeNull();
  });

  it('fills sensible defaults for optional fields', () => {
    const v = parsePackVersion({
      id: 'BSB',
      url: 'https://x/bsb.sqlite',
      sha256: 'abc',
      bytes: 100,
    });
    expect(v).not.toBeNull();
    expect(v!.name).toBe('BSB');
    expect(v!.language).toBe('en');
    expect(v!.verseCount).toBe(0);
  });
});

describe('parseVersionCatalog', () => {
  it('parses a string or object payload', () => {
    const payload = {schema: 1, versions: [valid]};
    expect(parseVersionCatalog(payload)).toHaveLength(1);
    expect(parseVersionCatalog(JSON.stringify(payload))).toHaveLength(1);
  });

  it('skips malformed entries but keeps valid ones', () => {
    const list = parseVersionCatalog({
      versions: [valid, {id: ''}, null, {...valid, id: 'BSB'}],
    });
    expect(list.map(v => v.id)).toEqual(['KJV', 'BSB']);
  });

  it('returns [] for junk / missing versions array', () => {
    expect(parseVersionCatalog(null)).toEqual([]);
    expect(parseVersionCatalog('not json')).toEqual([]);
    expect(parseVersionCatalog({})).toEqual([]);
    expect(parseVersionCatalog({versions: 'nope'})).toEqual([]);
  });
});

describe('PackDownloadError', () => {
  it('carries a typed code', () => {
    const e = new PackDownloadError('checksum-mismatch', 'boom');
    expect(e.code).toBe('checksum-mismatch');
    expect(e.message).toBe('boom');
    expect(e).toBeInstanceOf(Error);
  });
});
