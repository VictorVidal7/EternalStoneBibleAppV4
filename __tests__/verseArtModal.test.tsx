/**
 * Sprint 87 — the verse-art composer. Pins that the card renders the verse +
 * reference, the typeface section, and one swatch per bundled reading face.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {VerseArtModal} from '../src/components/insights/VerseArtModal';
import {READER_FONT_FAMILY_ORDER} from '../src/lib/reader/typefaces';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  surface: '#111827',
  border: '#374151',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file://art.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const va = translations.es.verseArt;

describe('VerseArtModal (Sprint 87)', () => {
  it('renders the verse, the reference and the typeface picker', () => {
    const {getByText, getAllByText} = render(
      <VerseArtModal
        visible
        verseText="Lámpara es a mis pies tu palabra"
        reference="Salmos 119:105"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Lámpara es a mis pies tu palabra')).toBeTruthy();
    expect(getByText('Salmos 119:105')).toBeTruthy();
    expect(getByText(va.typeface)).toBeTruthy();
    // One "Aa" sample swatch per bundled face.
    expect(getAllByText('Aa').length).toBe(READER_FONT_FAMILY_ORDER.length);
  });
});
