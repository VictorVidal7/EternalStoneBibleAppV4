/**
 * Tanda J — two real-device layout bugs in ReaderPreferencesSheet reported by
 * Victor:
 *
 * 1) Header title/reset button jammed together with no gap. `styles.title`
 *    had no `flexShrink` (RN defaults to 0, unlike CSS web's 1), so on
 *    narrower phones/larger font scales the title never yielded width to its
 *    `headerActions` sibling and they rendered with zero visible gap.
 *
 * 2) The live-preview text had none of the right-edge anti-clip protection
 *    that the real reader screen (app/(tabs)/verse/[book]/[chapter].tsx,
 *    Sprint 81-110) carries — an Android-OEM-only clip of the last glyph on
 *    a line. This ports that same fontSize-derived `rightSlack` gutter here.
 *
 * These are presentational fixes with no real layout engine in RNTL, so this
 * test pins the concrete style/props that make them work (mirrors
 * ConfirmDialog.test.tsx's approach) rather than trying to measure rendered
 * layout.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ReaderPreferencesSheet} from '../src/components/reading/ReaderPreferencesSheet';
import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
import {PremiumProvider} from '../src/context/PremiumContext';
import {translations} from '../src/i18n/translations';

const t = translations.es;

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  border: '#cbd5e1',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

function flattenStyle(style: unknown): Record<string, unknown> {
  const arr = Array.isArray(style) ? style : [style];
  return Object.assign({}, ...arr.filter(Boolean));
}

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <ReaderPreferencesProvider>
        <ReaderPreferencesSheet visible onClose={onClose} />
      </ReaderPreferencesProvider>
    </PremiumProvider>,
  );
}

describe('ReaderPreferencesSheet — layout fixes (Tanda J)', () => {
  beforeEach(() => {
    mockOpenOfferingSheet.mockClear();
  });

  describe('item 1 — header title/reset button gap', () => {
    it('renders the header without throwing and gives the title room to shrink', () => {
      const {getByText} = renderSheet();
      const title = getByText(t.readerPrefs.title);
      const flat = flattenStyle(title.props.style);
      // The actual fix: without flexShrink:1, RN's default (0, unlike CSS
      // web's 1) keeps the title at its intrinsic width, crowding out the
      // reset/close buttons at narrow widths or large font scales.
      expect(flat.flexShrink).toBe(1);
      // Safety net for extreme accessibility font scales: caps the title to
      // one line (ellipsized) instead of wrapping and blowing out the
      // header's height.
      expect(title.props.numberOfLines).toBe(1);
    });

    it('keeps the reset button reachable alongside the title', () => {
      const {getByText} = renderSheet();
      expect(getByText(t.readerPrefs.reset)).toBeTruthy();
    });
  });

  describe('item 2 — live-preview right-edge anti-clip gutter', () => {
    it('reserves a paddingRight gutter for the default left-aligned preview', () => {
      const {getByTestId} = renderSheet();
      const preview = getByTestId('reader-prefs-preview-text');
      const flat = flattenStyle(preview.props.style);
      // Default preferences: fontSize 16, textAlign 'left'.
      // rightSlack = max(24, round(16 * 0.7)) = 24.
      expect(flat.paddingRight).toBe(24);
      expect(flat.marginRight).toBeUndefined();
    });

    it('keeps the paddingRight gutter when justified too (Sprint 112: margin never fully prevented the clip)', () => {
      const {getByTestId, getByLabelText} = renderSheet();
      fireEvent.press(getByLabelText(t.readerPrefs.alignJustify));

      const preview = getByTestId('reader-prefs-preview-text');
      const flat = flattenStyle(preview.props.style);
      expect(flat.paddingRight).toBe(24);
      expect(flat.marginRight).toBeUndefined();
    });

    it('applies the fontSize-derived formula, whose 24px floor wins across the whole reader size range', () => {
      // rightSlack = max(24, round(fontSize * 0.7)). Within the reader's
      // actual range (READER_FONT_SIZE_MIN 14 .. READER_FONT_SIZE_MAX 26),
      // round(fontSize * 0.7) tops out at round(26 * 0.7) = 18, so the 24px
      // FLOOR always wins in practice — the same thing the real reader's own
      // Sprint 102 comment notes about this formula. This test pins that: it
      // is NOT evidence of visible scaling, just that the ported formula is
      // wired correctly (a future widened size range would start showing the
      // slope term take over instead of silently regressing to a constant).
      const {getByTestId, getByLabelText} = renderSheet();
      for (let i = 0; i < 4; i++) {
        fireEvent.press(getByLabelText(t.readerPrefs.increaseSize));
      }

      const preview = getByTestId('reader-prefs-preview-text');
      const flat = flattenStyle(preview.props.style);
      const fontSize = flat.fontSize as number;
      expect(fontSize).toBeGreaterThan(16);
      expect(flat.paddingRight).toBe(Math.max(24, Math.round(fontSize * 0.7)));
      expect(flat.paddingRight).toBe(24);
    });
  });
});
