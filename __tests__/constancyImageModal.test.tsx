/**
 * Sprint 85 — "Comparte tu constancia": the rings share card composes the same
 * ConstancyRingsGraphic the Home card shows over a gradient template, plus a
 * per-habit legend. Pins the card title, the habit labels, and the streak
 * status line.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {ConstancyImageModal} from '../src/components/insights/ConstancyImageModal';
import {buildConstancySummary} from '../src/lib/home/constancyRings';
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
  captureRef: jest.fn(() => Promise.resolve('file://constancy.png')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const tc = translations.es.constancy;

const summary = buildConstancySummary([
  {key: 'reading', done: true, fraction: 1, streak: 7},
  {key: 'memory', done: false, fraction: 0.4, streak: 0},
  {key: 'devotion', done: true, fraction: 1, streak: 3},
]);

describe('ConstancyImageModal (Sprint 85)', () => {
  it('renders the share card: title, subtitle and every habit label', () => {
    const {getByText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    expect(getByText(tc.shareCardTitle)).toBeTruthy();
    expect(getByText(tc.shareCardSubtitle)).toBeTruthy();
    expect(getByText(tc.habitReading)).toBeTruthy();
    expect(getByText(tc.habitMemory)).toBeTruthy();
    expect(getByText(tc.habitDevotion)).toBeTruthy();
    expect(getByText(tc.habitMood)).toBeTruthy();
  });

  it('shows a streak status for a habit with a run, today for a done one', () => {
    const {getByText, getAllByText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    // Reading streak 7 → "7 días".
    expect(getByText(tc.shareStreakDays.replace('{{n}}', '7'))).toBeTruthy();
    // Memory (no streak, not done) and mood (no activity) both show the dot.
    expect(getAllByText('·').length).toBeGreaterThan(0);
  });

  it('uses the singular day form for a one-day streak', () => {
    const oneDay = buildConstancySummary([
      {key: 'reading', done: false, fraction: 0.2, streak: 1},
    ]);
    const {getByText, queryByText} = render(
      <ConstancyImageModal visible summary={oneDay} onClose={jest.fn()} />,
    );
    expect(getByText(tc.shareStreakDay)).toBeTruthy();
    expect(queryByText(tc.shareStreakDays.replace('{{n}}', '1'))).toBeNull();
  });
});
