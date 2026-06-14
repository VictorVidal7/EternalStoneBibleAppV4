import {
  READER_TYPEFACES,
  READER_FONT_FAMILY_ORDER,
  resolveTypeface,
  resolveTypefaceBold,
  isReaderFontFamily,
  immersiveLineHeight,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  type ReaderFontFamily,
} from '../src/lib/reader/typefaces';

describe('reader typefaces catalog', () => {
  it('orders every catalog entry and nothing else', () => {
    expect([...READER_FONT_FAMILY_ORDER].sort()).toEqual(
      Object.keys(READER_TYPEFACES).sort(),
    );
    expect(READER_FONT_FAMILY_ORDER[0]).toBe('sans');
  });

  it('each spec carries a label key, sample, and both weights', () => {
    for (const id of READER_FONT_FAMILY_ORDER) {
      const spec = READER_TYPEFACES[id];
      expect(spec.id).toBe(id);
      expect(spec.labelKey).toMatch(/^font/);
      expect(spec.sample.length).toBeGreaterThan(0);
      expect(spec.family).toBe(resolveTypeface(id));
      expect(spec.familyBold).toBe(resolveTypefaceBold(id));
    }
  });

  describe('resolveTypeface (Sprint 82 — bundled faces)', () => {
    it('maps every id to its bundled regular family', () => {
      // Device-independent: the same family name on iOS and Android.
      expect(resolveTypeface('sans')).toBe('Inter_400Regular');
      expect(resolveTypeface('serif')).toBe('Lora_400Regular');
      expect(resolveTypeface('condensed')).toBe('ArchivoNarrow_400Regular');
      expect(resolveTypeface('mono')).toBe('JetBrainsMono_400Regular');
    });

    it('maps every id to its bundled bold (700) family', () => {
      expect(resolveTypefaceBold('sans')).toBe('Inter_700Bold');
      expect(resolveTypefaceBold('serif')).toBe('Lora_700Bold');
      expect(resolveTypefaceBold('condensed')).toBe('ArchivoNarrow_700Bold');
      expect(resolveTypefaceBold('mono')).toBe('JetBrainsMono_700Bold');
    });

    it('regular and bold are different families for every face', () => {
      // RN cannot fake-bold a static asset family, so they MUST differ.
      for (const id of READER_FONT_FAMILY_ORDER) {
        expect(resolveTypeface(id)).not.toBe(resolveTypefaceBold(id));
      }
    });

    it('every face resolves to a DISTINCT family (the whole point)', () => {
      const regulars = READER_FONT_FAMILY_ORDER.map(id => resolveTypeface(id));
      expect(new Set(regulars).size).toBe(regulars.length);
    });

    it('never returns an empty string (would break RN Text)', () => {
      for (const id of READER_FONT_FAMILY_ORDER) {
        expect(resolveTypeface(id).length).toBeGreaterThan(0);
        expect(resolveTypefaceBold(id).length).toBeGreaterThan(0);
      }
    });

    it('falls back to the default sans face for an unknown id', () => {
      expect(resolveTypeface('garbage' as ReaderFontFamily)).toBe(
        'Inter_400Regular',
      );
      expect(resolveTypefaceBold('garbage' as ReaderFontFamily)).toBe(
        'Inter_700Bold',
      );
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

  describe('immersiveLineHeight (Sprint 81)', () => {
    it('keeps the old default look at the default size (22 → ~36)', () => {
      expect(immersiveLineHeight(22)).toBe(35);
    });

    it('scales with the user-chosen size across the 16–32 range', () => {
      for (const size of [16, 18, 20, 22, 24, 26, 28, 30, 32]) {
        const lh = immersiveLineHeight(size);
        expect(lh).toBe(Math.round(size * IMMERSIVE_LINE_HEIGHT_RATIO));
        // Never below the font size — the old fixed 36 collapsed to ~1.1×
        // at size 32 and clipped descenders.
        expect(lh).toBeGreaterThanOrEqual(Math.round(size * 1.5));
      }
    });
  });
});
