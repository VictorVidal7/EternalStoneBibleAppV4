/**
 * Pure helpers for the translation-pack importer (translation packs, phase 3).
 * The native ATTACH + INSERT (BibleDatabase.importVersionPack) is live-verified
 * on the device; these DB-free pieces are unit tested here.
 */
import {
  normalizePackPath,
  packLoadedKey,
  PACK_IMPORT_SQL,
  PACK_SCHEMA,
} from '@/lib/database/pack-import';

describe('packLoadedKey', () => {
  it('lowercases the version id', () => {
    expect(packLoadedKey('BSB')).toBe('@bible_data_loaded_bsb');
    expect(packLoadedKey('WEB')).toBe('@bible_data_loaded_web');
  });

  it('matches the legacy bundled-loader keys', () => {
    // data-loader.ts keys off these exact strings for RVR1960/KJV/WEB.
    expect(packLoadedKey('RVR1960')).toBe('@bible_data_loaded_rvr1960');
    expect(packLoadedKey('KJV')).toBe('@bible_data_loaded_kjv');
  });

  it('trims surrounding whitespace', () => {
    expect(packLoadedKey('  BSB  ')).toBe('@bible_data_loaded_bsb');
  });
});

describe('normalizePackPath', () => {
  it('strips a file:// scheme', () => {
    expect(normalizePackPath('file:///data/user/0/app/files/bsb.sqlite')).toBe(
      '/data/user/0/app/files/bsb.sqlite',
    );
  });

  it('leaves a bare filesystem path unchanged', () => {
    expect(normalizePackPath('/data/user/0/app/files/bsb.sqlite')).toBe(
      '/data/user/0/app/files/bsb.sqlite',
    );
  });

  it('percent-decodes the path', () => {
    expect(normalizePackPath('file:///a/My%20Packs/bsb.sqlite')).toBe(
      '/a/My Packs/bsb.sqlite',
    );
  });

  it('trims whitespace', () => {
    expect(normalizePackPath('  file:///a/bsb.sqlite  ')).toBe('/a/bsb.sqlite');
  });

  it('falls back to the raw path when percent-decoding is invalid', () => {
    // A lone % is not valid percent-encoding; decodeURI would throw.
    expect(normalizePackPath('file:///a/100%/bsb.sqlite')).toBe(
      '/a/100%/bsb.sqlite',
    );
  });
});

describe('PACK_IMPORT_SQL', () => {
  it('is an idempotent INSERT OR IGNORE from the attached pack', () => {
    expect(PACK_IMPORT_SQL).toContain('INSERT OR IGNORE INTO verses');
    expect(PACK_IMPORT_SQL).toContain(`FROM ${PACK_SCHEMA}.verses`);
  });

  it('supplies the version via a bound parameter, selecting the pack columns', () => {
    expect(PACK_IMPORT_SQL).toContain(
      '(book_id, book_name, chapter, verse, text, version)',
    );
    expect(PACK_IMPORT_SQL).toContain(
      'SELECT book_id, book_name, chapter, verse, text, ?',
    );
  });

  it('never touches verses_fts directly — the AFTER INSERT trigger indexes it', () => {
    expect(PACK_IMPORT_SQL).not.toContain('verses_fts');
  });
});
