/**
 * Sprint 85 — the ConstancyRings card body. Pins the header summary line, the
 * habit legend, and the all-closed celebration, all driven by the pure summary.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {ConstancyRings} from '../src/components/ConstancyRings';
import {
  buildConstancySummary,
  HABIT_ORDER,
  type HabitProgress,
} from '../src/lib/home/constancyRings';
import {translations} from '../src/i18n/translations';

const mockColors = {
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#6366f1',
  surface: '#ffffff',
  border: '#e2e8f0',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: false, colors: mockColors}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const tc = translations.es.constancy;

const ring = (over: Partial<HabitProgress> & {key: HabitProgress['key']}) => ({
  done: false,
  fraction: 0,
  streak: 0,
  ...over,
});

describe('ConstancyRings', () => {
  it('shows the title, the closed/total summary, and every habit label', () => {
    const summary = buildConstancySummary([
      ring({key: 'reading', done: true, fraction: 1, streak: 7}),
      ring({key: 'memory', fraction: 0.5, streak: 3}),
    ]);
    const {getByText} = render(<ConstancyRings summary={summary} />);

    expect(getByText(tc.title)).toBeTruthy();
    expect(getByText('1 de 4 hoy')).toBeTruthy();
    expect(getByText(tc.habitReading)).toBeTruthy();
    expect(getByText(tc.habitMemory)).toBeTruthy();
    expect(getByText(tc.habitDevotion)).toBeTruthy();
    expect(getByText(tc.habitMood)).toBeTruthy();
    // Encouraging caption while rings are still open.
    expect(getByText(tc.caption)).toBeTruthy();
  });

  it('celebrates when all four rings are closed', () => {
    const summary = buildConstancySummary(
      HABIT_ORDER.map(key => ring({key, done: true, fraction: 1})),
    );
    const {getByText, queryByText} = render(
      <ConstancyRings summary={summary} />,
    );
    expect(getByText('4 de 4 hoy')).toBeTruthy();
    expect(getByText(tc.allClosed)).toBeTruthy();
    expect(queryByText(tc.caption)).toBeNull();
  });
});
