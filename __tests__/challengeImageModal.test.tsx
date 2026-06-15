/**
 * Sprint 86 — the weekly-challenge share card. Pins the card title, the
 * mastered hero line, the target line, and the practice line (with singular).
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {ChallengeImageModal} from '../src/components/insights/ChallengeImageModal';
import type {WeeklyChallenge} from '../src/lib/memory/weeklyChallenge';
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
