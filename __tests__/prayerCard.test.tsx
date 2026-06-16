/**
 * Sprint 93 — the Home prayer card. Pins the honest gate (nothing shown before
 * the reader has prayed or kept a request), the streak headline (active /
 * lapsed / never-streaked), and the "N praying · M answered" sub-line.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {PrayerCard} from '../src/components/PrayerCard';
import {translations} from '../src/i18n/translations';
import type {PrayerStreakSummary} from '../src/features/prayer/prayerLog';
import type {PrayerRequest} from '../src/features/prayer/prayer';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
};

let mockStreak: {loaded: boolean; summary: PrayerStreakSummary};
let mockJournal: {loaded: boolean; requests: PrayerRequest[]};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/lib/haptics', () => ({haptics: {tap: jest.fn()}}));
jest.mock('../src/hooks/usePrayerStreak', () => ({
  usePrayerStreak: () => mockStreak,
}));
jest.mock('../src/hooks/usePrayerJournal', () => ({
  usePrayerJournal: () => mockJournal,
}));

const tp = translations.es.prayer;
const req = (over: Partial<PrayerRequest> = {}): PrayerRequest => ({
  id: 'a',
  title: 'x',
  category: 'supplication',
  createdAt: 1,
  answered: false,
  ...over,
});

describe('PrayerCard (Sprint 93)', () => {
  it('renders nothing until the reader has prayed or kept a request', () => {
    mockStreak = {
      loaded: true,
      summary: {current: 0, longest: 0, totalDays: 0, todayDone: false},
    };
    mockJournal = {loaded: true, requests: []};
    expect(render(<PrayerCard onPress={jest.fn()} />).toJSON()).toBeNull();
  });

  it('shows the active streak headline + praying/answered counts', () => {
    mockStreak = {
      loaded: true,
      summary: {current: 4, longest: 9, totalDays: 20, todayDone: true},
    };
    mockJournal = {
      loaded: true,
      requests: [req(), req({id: 'b', answered: true})],
    };
    const {getByText} = render(<PrayerCard onPress={jest.fn()} />);
    expect(getByText(tp.streakDays.replace('{{n}}', '4'))).toBeTruthy();
    expect(
      getByText(
        tp.cardSubtitlePraying.replace('{{n}}', '1').replace('{{a}}', '1'),
      ),
    ).toBeTruthy();
  });

  it('invites gently when the streak has lapsed but a request remains', () => {
    mockStreak = {
      loaded: true,
      summary: {current: 0, longest: 3, totalDays: 3, todayDone: false},
    };
    mockJournal = {loaded: true, requests: [req()]};
    const {getByText} = render(<PrayerCard onPress={jest.fn()} />);
    expect(getByText(tp.streakLapsed)).toBeTruthy();
  });

  it('shows the empty-streak nudge when only a request exists (never prayed)', () => {
    mockStreak = {
      loaded: true,
      summary: {current: 0, longest: 0, totalDays: 0, todayDone: false},
    };
    mockJournal = {loaded: true, requests: [req()]};
    const {getByText} = render(<PrayerCard onPress={jest.fn()} />);
    expect(getByText(tp.cardSubtitleEmpty)).toBeTruthy();
  });
});
