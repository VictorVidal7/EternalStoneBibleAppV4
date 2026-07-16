/**
 * Sprint 86 — the WeeklyChallengeCard on the memory deck. Pins the honest gate
 * (hidden until loaded + a non-empty deck), the headline/progress/practice
 * lines, the focus-verse reference, and the press → onPractice wiring.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {WeeklyChallengeCard} from '../src/components/WeeklyChallengeCard';
import type {WeeklyChallenge} from '../src/lib/memory/weeklyChallenge';
import {translations} from '../src/i18n/translations';

const mockColors = {
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#6366f1',
  success: '#16a34a',
  surface: '#ffffff',
  border: '#e2e8f0',
  background: '#ffffff',
};

let mockState: {loaded: boolean; challenge: WeeklyChallenge};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: false, colors: mockColors}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

jest.mock('../src/hooks/useWeeklyChallenge', () => ({
  useWeeklyChallenge: () => mockState,
}));

// The card nests ChallengeImageModal, which pulls these in even while hidden.
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));
// Tanda M Phase B — ChallengeImageModal now also pulls in usePremium/
// useOfferingSheet (for its PremiumShareExtras wiring) even while hidden.
jest.mock('../src/context/PremiumContext', () => ({
  usePremium: () => ({isPremium: false}),
}));
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
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

const challenge = (over: Partial<WeeklyChallenge> = {}): WeeklyChallenge => ({
  target: 5,
  mastered: 3,
  remaining: 2,
  met: false,
  fraction: 0.6,
  reviewsThisWeek: 12,
  practiceStreak: 4,
  masteredVerses: [],
  focusVerses: [
    {verseKey: 'Juan/3/16', bookName: 'Juan', chapter: 3, verse: 16, box: 4},
  ],
  hasDeck: true,
  ...over,
});

describe('WeeklyChallengeCard', () => {
  it('renders nothing until loaded or when the deck is empty', () => {
    mockState = {loaded: false, challenge: challenge()};
    const {queryByText, rerender} = render(
      <WeeklyChallengeCard onPractice={jest.fn()} />,
    );
    expect(queryByText(tw.title)).toBeNull();

    mockState = {loaded: true, challenge: challenge({hasDeck: false})};
    rerender(<WeeklyChallengeCard onPractice={jest.fn()} />);
    expect(queryByText(tw.title)).toBeNull();
  });

  it('shows the target, progress, focus verse and practice streak', () => {
    mockState = {loaded: true, challenge: challenge()};
    const {getByText} = render(<WeeklyChallengeCard onPractice={jest.fn()} />);
    expect(getByText(tw.masterN.replace('{{n}}', '5'))).toBeTruthy();
    expect(getByText('3 / 5 dominados')).toBeTruthy();
    expect(getByText('Juan 3:16')).toBeTruthy();
    expect(getByText(tw.practice.replace('{{n}}', '4'))).toBeTruthy();
  });

  it('celebrates when the target is met', () => {
    mockState = {
      loaded: true,
      challenge: challenge({mastered: 5, remaining: 0, met: true, fraction: 1}),
    };
    const {getByText} = render(<WeeklyChallengeCard onPractice={jest.fn()} />);
    expect(getByText(tw.met)).toBeTruthy();
  });

  it('fires onPractice when the card is tapped', () => {
    mockState = {loaded: true, challenge: challenge()};
    const onPractice = jest.fn();
    const {getByLabelText} = render(
      <WeeklyChallengeCard onPractice={onPractice} />,
    );
    const label = `${tw.title}: ${tw.masterN.replace('{{n}}', '5')}. 3 / 5 dominados`;
    fireEvent.press(getByLabelText(label));
    expect(onPractice).toHaveBeenCalledTimes(1);
  });
});
