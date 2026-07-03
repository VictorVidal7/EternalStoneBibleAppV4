/**
 * Sprint 93 — the Home prayer card. Pins the streak headline (active /
 * lapsed / never-streaked) and the "N praying · M answered" sub-line.
 *
 * The original "honest gate" (render nothing until the reader has prayed or
 * kept a request) was removed per Victor's real-device feedback: it meant a
 * brand-new user could never discover the prayer journal (and "Orar la
 * Escritura" inside it) from Home at all. The card now always renders once
 * its data has loaded, with its own inviting copy for the true first-time
 * case.
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
  it('renders nothing while streak/journal data is still loading', () => {
    mockStreak = {
      loaded: false,
      summary: {current: 0, longest: 0, totalDays: 0, todayDone: false},
    };
    mockJournal = {loaded: false, requests: []};
    expect(render(<PrayerCard onPress={jest.fn()} />).toJSON()).toBeNull();
  });

  it('shows an inviting first-time state for a brand-new reader (never prayed, no requests)', () => {
    mockStreak = {
      loaded: true,
      summary: {current: 0, longest: 0, totalDays: 0, todayDone: false},
    };
    mockJournal = {loaded: true, requests: []};
    const {getByText} = render(<PrayerCard onPress={jest.fn()} />);
    expect(getByText(tp.cardSubtitleEmpty)).toBeTruthy();
    expect(getByText(tp.cardSubtitleNew)).toBeTruthy();
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
