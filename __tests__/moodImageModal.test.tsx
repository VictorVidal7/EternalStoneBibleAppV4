/**
 * Sprint 84 — "Compartir mi ánimo": the mood share card composes the two pure
 * summaries the Mi-lectura screen already computes (the rolling-30-day month +
 * the month-vs-month trend) into ONE shareable image. This pins that the card
 * renders the dominant feeling + days line, and that the gentle trend line
 * appears ONLY when both windows carry a check-in (hasComparison) — so an empty
 * prior month never invents a comparison on the shared image.
 *
 * Tanda M Phase B — wires the offering-gated `PremiumShareExtras` (premium
 * templates/textures/saved styles) into this screen, mirroring the wiring
 * `testimonyImageModal.test.tsx` exercises for its sibling. `usePremium` is
 * mocked via a `jest.fn()` (prefixed `mock*` so babel-plugin-jest-hoist
 * allows referencing it from inside the hoisted `jest.mock` factory) so
 * individual tests can flip `isPremium` without needing the real
 * `PremiumProvider` + entitlement-cache plumbing.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
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

const mockUsePremium = jest.fn(() => ({isPremium: false}));
jest.mock('@context/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
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

  beforeEach(() => {
    mockUsePremium.mockReturnValue({isPremium: false});
    mockOpenOfferingSheet.mockClear();
  });

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

describe('MoodImageModal — Tanda M Phase B (premium share extras)', () => {
  beforeEach(() => {
    mockUsePremium.mockReturnValue({isPremium: false});
    mockOpenOfferingSheet.mockClear();
  });

  function renderModal() {
    return render(
      <MoodImageModal
        visible
        month={month}
        trend={liftingTrend}
        onClose={jest.fn()}
      />,
    );
  }

  it('marks a premium template as locked for a free user and opens the offering sheet on tap', async () => {
    const {findByLabelText} = renderModal();
    // SHARE_TEMPLATES[10] is the first of the 9 premium designs appended
    // after the 10 free ones — 1-indexed as "Estilo 11" in the a11y label,
    // with the offering suffix PremiumShareExtras adds when locked.
    const lockedTemplate = await findByLabelText(/Estilo 11 · /);
    expect(lockedTemplate).toBeTruthy();

    fireEvent.press(lockedTemplate);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('renders the same premium template unlocked (no offering suffix) once isPremium is true', async () => {
    mockUsePremium.mockReturnValue({isPremium: true});
    const {findByLabelText} = renderModal();

    const unlockedTemplate = await findByLabelText('Estilo 11');
    expect(unlockedTemplate).toBeTruthy();

    fireEvent.press(unlockedTemplate);
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('routes a locked texture tap to the offering sheet when isPremium is false', async () => {
    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText(/Puntos · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });
});
