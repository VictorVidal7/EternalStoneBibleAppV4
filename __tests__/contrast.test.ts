import {
  contrastRatio,
  meetsAA,
  meetsAAA,
  parseHexColor,
  relativeLuminance,
} from '../src/lib/a11y/contrast';

describe('contrast — WCAG luminance & ratio math', () => {
  describe('parseHexColor', () => {
    it('parses #RRGGBB', () => {
      expect(parseHexColor('#FFFFFF')).toEqual({r: 255, g: 255, b: 255});
      expect(parseHexColor('#000000')).toEqual({r: 0, g: 0, b: 0});
      expect(parseHexColor('#4A90E2')).toEqual({r: 74, g: 144, b: 226});
    });

    it('parses shorthand #RGB', () => {
      expect(parseHexColor('#fff')).toEqual({r: 255, g: 255, b: 255});
      expect(parseHexColor('#0a0')).toEqual({r: 0, g: 170, b: 0});
    });

    it('throws on an unsupported color (e.g. rgba)', () => {
      expect(() => parseHexColor('rgba(0,0,0,0.5)')).toThrow();
      expect(() => parseHexColor('#12')).toThrow();
    });
  });

  describe('relativeLuminance', () => {
    it('is 0 for black and 1 for white', () => {
      expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
      expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    });
  });

  describe('contrastRatio', () => {
    it('is 21:1 for black vs white (the maximum)', () => {
      expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    });

    it('is 1:1 for identical colors', () => {
      expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    });

    it('is order-independent', () => {
      expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(
        contrastRatio('#FFFFFF', '#000000'),
        5,
      );
    });

    it('matches a known reference pair (#777 on white ≈ 4.48:1)', () => {
      expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
    });
  });

  describe('meetsAA / meetsAAA', () => {
    it('applies the right thresholds for normal text', () => {
      expect(meetsAA(4.5)).toBe(true);
      expect(meetsAA(4.49)).toBe(false);
      expect(meetsAAA(7)).toBe(true);
      expect(meetsAAA(6.99)).toBe(false);
    });

    it('applies the relaxed thresholds for large text', () => {
      expect(meetsAA(3, true)).toBe(true);
      expect(meetsAA(2.99, true)).toBe(false);
      expect(meetsAAA(4.5, true)).toBe(true);
      expect(meetsAAA(4.49, true)).toBe(false);
    });
  });
});
