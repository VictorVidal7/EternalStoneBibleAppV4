/**
 * Sprint 84 — the Home devotion-streak card. Pins the honest gate (nothing
 * shown before the first devotion), the active vs lapsed headline, and the
 * "today done/pending" sub-line, all driven by the pure streak summary.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {DevotionStreakCard} from '../src/components/DevotionStreakCard';
import {translations} from '../src/i18n/translations';
import type {DevotionStreakSummary} from '../src/features/study/devotionLog';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
};

let mockSummary: {loaded: boolean; summary: DevotionStreakSummary};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
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

jest.mock('../src/hooks/useDevotionStreak', () => ({
  useDevotionStreak: () => mockSummary,
}));

const td = translations.es.devotion;

describe('DevotionStreakCard (Sprint 84)', () => {
  it('renders nothing until the first devotion is completed', () => {
    mockSummary = {
      loaded: true,
      summary: {current: 0, longest: 0, totalDays: 0, todayDone: false},
    };
    const {toJSON} = render(<DevotionStreakCard onPress={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('shows the active streak headline and "today done" sub-line', () => {
    mockSummary = {
      loaded: true,
      summary: {current: 3, longest: 7, totalDays: 12, todayDone: true},
    };
    const {getByText} = render(<DevotionStreakCard onPress={jest.fn()} />);
    expect(getByText(td.streakDays.replace('{{n}}', '3'))).toBeTruthy();
    expect(
      getByText(
        `${td.streakBest.replace('{{n}}', '7')} · ${td.streakTodayDone}`,
      ),
    ).toBeTruthy();
  });

  it('invites the reader back gently when the streak has lapsed', () => {
    mockSummary = {
      loaded: true,
      summary: {current: 0, longest: 5, totalDays: 5, todayDone: false},
    };
    const {getByText, queryByText} = render(
      <DevotionStreakCard onPress={jest.fn()} />,
    );
    expect(getByText(td.streakLapsed)).toBeTruthy();
    // No "today" status while lapsed — just the best run.
    expect(getByText(td.streakBest.replace('{{n}}', '5'))).toBeTruthy();
    expect(queryByText(td.streakTodayPending)).toBeNull();
  });
});
