/**
 * Sprint 84 — "Compartir mi ánimo": the mood share card composes the two pure
 * summaries the Mi-lectura screen already computes (the rolling-30-day month +
 * the month-vs-month trend) into ONE shareable image. This pins that the card
 * renders the dominant feeling + days line, and that the gentle trend line
 * appears ONLY when both windows carry a check-in (hasComparison) — so an empty
 * prior month never invents a comparison on the shared image.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {MoodImageModal} from '../src/components/insights/MoodImageModal';
import {translations} from '../src/i18n/translations';
import type {
  MoodMonthSummary,
  MoodTrendSummary,
} from '../src/features/study/feelingsLog';

const mockColors = {
  background: '#0f172a',
  card: '#111827',
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
  captureRef: jest.fn(() => Promise.resolve('file://mood.png')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const month: MoodMonthSummary = {
  windowDays: 30,
  daysLogged: 18,
  counts: [
    {feelingId: 'grateful', count: 9},
    {feelingId: 'joyful', count: 5},
    {feelingId: 'tired', count: 4},
  ],
  dominant: 'grateful',
};

const liftingTrend: MoodTrendSummary = {
  windowDays: 30,
  current: month,
  daysLoggedCurrent: 18,
  daysLoggedPrevious: 12,
  hasComparison: true,
  rising: [{feelingId: 'grateful', current: 9, previous: 3, delta: 6}],
  easing: [{feelingId: 'anxious', current: 1, previous: 6, delta: -5}],
  direction: 'lighter',
};

describe('MoodImageModal (Sprint 84)', () => {
  const es = translations.es;

  it('renders the month card: title, dominant feeling, and days line', () => {
    const {getByText, getAllByText} = render(
      <MoodImageModal
        visible
        month={month}
        trend={liftingTrend}
        onClose={jest.fn()}
      />,
    );
    expect(getByText(es.readingInsights.moodCardTitle)).toBeTruthy();
    // Dominant feeling resolves to the localized name (hero + its own bar).
    expect(getAllByText(es.feelings.list.grateful.name).length).toBeGreaterThan(
      0,
    );
    // Days line: "18 de 30 días registrados".
    const daysLine = es.readingInsights.moodMonthDays
      .replace('{{n}}', '18')
      .replace('{{total}}', '30');
    expect(getByText(daysLine)).toBeTruthy();
  });

  it('shows the trend line only when both windows carry a check-in', () => {
    const {getByText} = render(
      <MoodImageModal
        visible
        month={month}
        trend={liftingTrend}
        onClose={jest.fn()}
      />,
    );
    expect(getByText(es.readingInsights.moodTrendLighter)).toBeTruthy();
  });

  it('hides the trend line when there is no honest comparison', () => {
    const noComparison: MoodTrendSummary = {
      ...liftingTrend,
      hasComparison: false,
      daysLoggedPrevious: 0,
      direction: 'steady',
    };
    const {queryByText} = render(
      <MoodImageModal
        visible
        month={month}
        trend={noComparison}
        onClose={jest.fn()}
      />,
    );
    expect(queryByText(es.readingInsights.moodTrendLighter)).toBeNull();
    expect(queryByText(es.readingInsights.moodTrendSteady)).toBeNull();
    // The month card itself still renders.
    expect(queryByText(es.readingInsights.moodCardTitle)).toBeTruthy();
  });

  it('hides the trend line entirely when no trend is supplied', () => {
    const {queryByText} = render(
      <MoodImageModal visible month={month} trend={null} onClose={jest.fn()} />,
    );
    expect(queryByText(es.readingInsights.moodTrendLighter)).toBeNull();
    expect(queryByText(es.readingInsights.moodTrendSteady)).toBeNull();
  });
});
