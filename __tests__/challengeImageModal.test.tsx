/**
 * Sprint 86 — the weekly-challenge share card. Pins the card title, the
 * mastered hero line, the target line, and the practice line (with singular).
 *
 * Tanda M Phase B adds `PremiumShareExtras` (premium templates + textures +
 * "Mis estilos") in place of the free-only `ShareStylePicker` — the two new
 * tests below pin that a premium template renders unlocked once `isPremium`
 * is true, and that a locked tap routes to the offering sheet when it's not,
 * mirroring `premiumShareExtras.test.tsx`'s own coverage of that component.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ChallengeImageModal} from '../src/components/insights/ChallengeImageModal';
import type {WeeklyChallenge} from '../src/lib/memory/weeklyChallenge';
import {translations} from '../src/i18n/translations';

let mockIsPremium = false;
jest.mock('../src/context/PremiumContext', () => ({
  usePremium: () => ({isPremium: mockIsPremium}),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

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
  captureRef: jest.fn(() => Promise.resolve('file://challenge.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const tw = translations.es.weeklyChallenge;

const base: WeeklyChallenge = {
  target: 5,
  mastered: 3,
  remaining: 2,
  met: false,
  fraction: 0.6,
  reviewsThisWeek: 12,
  practiceStreak: 4,
  masteredVerses: [],
  focusVerses: [],
  hasDeck: true,
};

describe('ChallengeImageModal (Sprint 86)', () => {
  beforeEach(() => {
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
  });

  it('renders the card title, mastered line, target and practice', () => {
    const {getByText} = render(
      <ChallengeImageModal visible challenge={base} onClose={jest.fn()} />,
    );
    expect(getByText(tw.shareCardTitle)).toBeTruthy();
    expect(getByText(tw.shareMastered.replace('{{n}}', '3'))).toBeTruthy();
    expect(getByText(tw.shareTarget.replace('{{n}}', '5'))).toBeTruthy();
    expect(getByText(tw.sharePractice.replace('{{n}}', '4'))).toBeTruthy();
  });

  it('uses the singular practice form for a one-day streak', () => {
    const {getByText} = render(
      <ChallengeImageModal
        visible
        challenge={{...base, practiceStreak: 1, mastered: 1}}
        onClose={jest.fn()}
      />,
    );
    expect(getByText(tw.sharePracticeOne)).toBeTruthy();
    expect(getByText(tw.shareMasteredOne)).toBeTruthy();
  });
});

describe('ChallengeImageModal — Tanda M Phase B (PremiumShareExtras wiring)', () => {
  beforeEach(() => {
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
  });

  it('renders a premium template unlocked (no offering suffix) once isPremium is true', async () => {
    mockIsPremium = true;
    const {findByLabelText} = render(
      <ChallengeImageModal visible challenge={base} onClose={jest.fn()} />,
    );
    // SHARE_TEMPLATES is 10 free + 9 premium — index 10 (label "Estilo 11")
    // is the first premium template in the catalog.
    expect(await findByLabelText('Estilo 11')).toBeTruthy();
  });

  it('routes a locked premium template tap to the offering sheet when isPremium is false', async () => {
    const {findByLabelText} = render(
      <ChallengeImageModal visible challenge={base} onClose={jest.fn()} />,
    );
    fireEvent.press(await findByLabelText(/Estilo 11 · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('routes a locked texture tap to the offering sheet when isPremium is false', async () => {
    const {findByLabelText} = render(
      <ChallengeImageModal visible challenge={base} onClose={jest.fn()} />,
    );
    fireEvent.press(await findByLabelText(/Puntos · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });
});
