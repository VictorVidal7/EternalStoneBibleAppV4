/**
 * pack-catalog — pure parsing/validation of the downloadable-version catalog
 * (versions.json), translation packs phase 4.
 */
import {
  formatBytes,
  isAllowedPackUrl,
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
      url: 'https://eternalstonebible.github.io/packs/bsb.sqlite',
      sha256: 'abc',
      bytes: 100,
    });
    expect(v).not.toBeNull();
    expect(v!.name).toBe('BSB');
    expect(v!.language).toBe('en');
    expect(v!.verseCount).toBe(0);
  });

  // Security hardening — a catalog entry's `url` is untrusted third-party
  // data once fetched (see isAllowedPackUrl's doc comment); it must be on the
  // allow-listed GitHub Pages host or the whole entry is dropped, not just
  // trusted verbatim and handed to the downloader.
  it('rejects an entry whose url points off the allow-listed host', () => {
    expect(
      parsePackVersion({...valid, url: 'https://evil.example.com/kjv.sqlite'}),
    ).toBeNull();
  });

  it('rejects a lookalike host that merely contains the allowed host as a substring', () => {
    expect(
      parsePackVersion({
        ...valid,
        url: 'https://eternalstonebible.github.io.evil.com/kjv.sqlite',
      }),
    ).toBeNull();
  });

  it('rejects the allow-listed host downgraded to plain http', () => {
    expect(
      parsePackVersion({
        ...valid,
        url: 'http://eternalstonebible.github.io/packs/kjv.sqlite',
      }),
    ).toBeNull();
  });
});

describe('isAllowedPackUrl', () => {
  it('allows the real pack host (translation packs and the originals pack alike)', () => {
    expect(
      isAllowedPackUrl('https://eternalstonebible.github.io/packs/kjv.sqlite'),
    ).toBe(true);
    expect(
      isAllowedPackUrl(
        'https://eternalstonebible.github.io/packs/originals.db',
      ),
    ).toBe(true);
  });

  it('rejects a different host entirely', () => {
    expect(isAllowedPackUrl('https://evil.example.com/kjv.sqlite')).toBe(false);
  });

  it('rejects userinfo tricks (host@evil.com-style prefixes)', () => {
    expect(
      isAllowedPackUrl(
        'https://eternalstonebible.github.io@evil.com/packs/kjv.sqlite',
      ),
    ).toBe(false);
  });

  it('rejects a bare host with no trailing slash (would bypass a naive prefix check)', () => {
    expect(isAllowedPackUrl('https://eternalstonebible.github.io')).toBe(false);
  });

  it('rejects garbage / empty strings without throwing', () => {
    expect(isAllowedPackUrl('')).toBe(false);
    expect(isAllowedPackUrl('not a url at all')).toBe(false);
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

describe('formatBytes', () => {
  it('formats MB and KB, and guards junk', () => {
    expect(formatBytes(4968448)).toBe('4.7 MB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(0)).toBe('—');
    expect(formatBytes(-5)).toBe('—');
    expect(formatBytes(NaN)).toBe('—');
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
