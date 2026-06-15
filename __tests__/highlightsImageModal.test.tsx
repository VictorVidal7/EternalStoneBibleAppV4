/**
 * Sprint 86 — the highlights gallery share card. Pins the card title, the
 * total hero, the count line (with singular), over a gradient template.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {HighlightsImageModal} from '../src/components/insights/HighlightsImageModal';
import type {HighlightGalleryStats} from '../src/lib/highlights/highlightGallery';
import {HighlightColor} from '../src/lib/highlights';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
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
  captureRef: jest.fn(() => Promise.resolve('file://hl.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const th = translations.es.highlights;

const stats: HighlightGalleryStats = {
  total: 4,
  byColor: [
    {color: HighlightColor.YELLOW, count: 1},
    {color: HighlightColor.BLUE, count: 2},
    {color: HighlightColor.GREEN, count: 1},
  ],
};

describe('HighlightsImageModal (Sprint 86)', () => {
  it('renders the card title and the total count line', () => {
    const {getByText} = render(
      <HighlightsImageModal visible stats={stats} onClose={jest.fn()} />,
    );
    expect(getByText(th.galleryShareCardTitle)).toBeTruthy();
    expect(getByText(th.galleryShareCount.replace('{{n}}', '4'))).toBeTruthy();
  });

  it('uses the singular count for a single highlight', () => {
    const one: HighlightGalleryStats = {
      total: 1,
      byColor: [{color: HighlightColor.RED, count: 1}],
    };
    const {getByText} = render(
      <HighlightsImageModal visible stats={one} onClose={jest.fn()} />,
    );
    expect(getByText(th.galleryShareCountOne)).toBeTruthy();
  });
});
