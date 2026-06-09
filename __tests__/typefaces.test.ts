import {
  READER_TYPEFACES,
  READER_FONT_FAMILY_ORDER,
  resolveTypeface,
  isReaderFontFamily,
  type ReaderFontFamily,
} from '../src/lib/reader/typefaces';

describe('reader typefaces catalog', () => {
  it('orders every catalog entry and nothing else', () => {
    expect([...READER_FONT_FAMILY_ORDER].sort()).toEqual(
      Object.keys(READER_TYPEFACES).sort(),
    );
    expect(READER_FONT_FAMILY_ORDER[0]).toBe('sans');
  });

  it('each spec carries a label key and sample', () => {
    for (const id of READER_FONT_FAMILY_ORDER) {
      const spec = READER_TYPEFACES[id];
      expect(spec.id).toBe(id);
      expect(spec.labelKey).toMatch(/^font/);
      expect(spec.sample.length).toBeGreaterThan(0);
    }
  });

  describe('resolveTypeface', () => {
    it('keeps the original sans/serif resolution (back-compat)', () => {
      // sans → platform default (undefined) on both.
      expect(resolveTypeface('sans', 'ios')).toBeUndefined();
      expect(resolveTypeface('sans', 'android')).toBeUndefined();
      // serif was Georgia (iOS) / 'serif' (Android) before the sprint.
      expect(resolveTypeface('serif', 'ios')).toBe('Georgia');
      expect(resolveTypeface('serif', 'android')).toBe('serif');
    });

    it('maps the new faces to system-guaranteed families per platform', () => {
      expect(resolveTypeface('condensed', 'ios')).toBe('Avenir Next Condensed');
      expect(resolveTypeface('condensed', 'android')).toBe(
        'sans-serif-condensed',
      );
      expect(resolveTypeface('mono', 'ios')).toBe('Courier New');
      expect(resolveTypeface('mono', 'android')).toBe('monospace');
    });

    it('never returns an empty string (would break RN Text)', () => {
      for (const id of READER_FONT_FAMILY_ORDER) {
        for (const p of ['ios', 'android'] as const) {
          const f = resolveTypeface(id, p);
          expect(f === undefined || f.length > 0).toBe(true);
        }
      }
    });

    it('falls back to default for an unknown id', () => {
      expect(
        resolveTypeface('garbage' as ReaderFontFamily, 'android'),
      ).toBeUndefined();
    });
  });

  describe('isReaderFontFamily', () => {
    it('accepts every catalog id', () => {
      for (const id of READER_FONT_FAMILY_ORDER) {
        expect(isReaderFontFamily(id)).toBe(true);
      }
    });

    it('rejects foreign/corrupt values', () => {
      expect(isReaderFontFamily('comic')).toBe(false);
      expect(isReaderFontFamily(undefined)).toBe(false);
      expect(isReaderFontFamily(3)).toBe(false);
    });
  });
});
