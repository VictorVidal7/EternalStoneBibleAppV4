/**
 * Sprint 87 — the PeriodRecapModal. Pins the year title, the scope toggle, and
 * that a today-dated activity surfaces as a period stat row (the modal builds
 * the recap internally from the injected sources for the current clock).
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PeriodRecapModal} from '../src/components/insights/PeriodRecapModal';
import type {PeriodInput} from '../src/features/journey/periodRecap';
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
  captureRef: jest.fn(() => Promise.resolve('file://period.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const tp = translations.es.periodRecap;

// A reading day dated TODAY (local) falls in both this year and this quarter.
const now = new Date();
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
  2,
  '0',
)}-${String(now.getDate()).padStart(2, '0')}`;

const input: PeriodInput = {
  readingLog: [{date: todayKey, versesRead: 42, timeSpent: 600}],
  reviewEvents: [],
  cards: [],
  favorites: [{book: 'John', createdAt: Date.now()}],
};

describe('PeriodRecapModal (Sprint 87)', () => {
  it('renders the year recap with the scope toggle and a period stat row', () => {
    const {getByText} = render(
      <PeriodRecapModal visible input={input} onClose={jest.fn()} />,
    );
    // Header + card title default to "this year".
    expect(getByText(tp.scopeYear)).toBeTruthy();
    expect(getByText(tp.scopeQuarter)).toBeTruthy();
    // The today-dated reading day surfaces as a verses-read stat.
    expect(getByText(tp.versesRead.replace('{{n}}', '42'))).toBeTruthy();
    expect(getByText(tp.favorites.replace('{{n}}', '1'))).toBeTruthy();
  });

  it('labels the share button with the share verb, not the period title', () => {
    // S89 audit: the share button must announce "Compartir" (not the modal
    // title, which is shown separately in the header) like every sibling
    // share modal.
    const {getByLabelText} = render(
      <PeriodRecapModal visible input={input} onClose={jest.fn()} />,
    );
    const shareButton = getByLabelText(translations.es.share);
    expect(shareButton.props.accessibilityRole).toBe('button');
  });

  it('switches to the quarter scope on toggle', () => {
    const {getByText, getAllByText} = render(
      <PeriodRecapModal visible input={input} onClose={jest.fn()} />,
    );
    fireEvent.press(getByText(tp.scopeQuarter));
    // Still shows the verses-read row (today is also in this quarter).
    expect(getByText(tp.versesRead.replace('{{n}}', '42'))).toBeTruthy();
    // Quarter title appears (header + card).
    expect(getAllByText(tp.quarterTitle).length).toBeGreaterThan(0);
  });
});
