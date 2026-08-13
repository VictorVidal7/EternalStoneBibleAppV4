/**
 * Sprint 85 — the ConstancyRings card body. Pins the header summary line, the
 * habit legend, and the all-closed celebration, all driven by the pure summary.
 */
import {render, fireEvent} from '@testing-library/react-native';
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
  everDone: false,
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

  describe('T26 — legend row navigation + one status line per row', () => {
    it('shows the invitation for a habit that has NEVER been done, in place of the inactive line', () => {
      const summary = buildConstancySummary(
        HABIT_ORDER.map(key => ring({key, everDone: false})),
      );
      const {getAllByText, queryAllByText} = render(
        <ConstancyRings summary={summary} />,
      );
      // All 4 habits are untouched — 4 invitations, zero "inactive" lines.
      expect(getAllByText(tc.rowInvitation)).toHaveLength(4);
      expect(queryAllByText(tc.rowInactive)).toHaveLength(0);
    });

    it('shows "sin racha activa" (not the invitation) for a habit with lifetime history but no streak today', () => {
      // Every OTHER habit is given lifetime history too, so only the
      // assertion below is exercising the target row, not a default gap.
      const summary = buildConstancySummary(
        HABIT_ORDER.map(key => ring({key, everDone: true})),
      );
      const {getAllByText, queryByText} = render(
        <ConstancyRings summary={summary} />,
      );
      expect(getAllByText(tc.rowInactive)).toHaveLength(4);
      expect(queryByText(tc.rowInvitation)).toBeNull();
    });

    it('never shows the invitation for a habit already done today, even if never done before', () => {
      const summary = buildConstancySummary(
        HABIT_ORDER.map(key =>
          key === 'reading'
            ? ring({key, done: true, fraction: 1, everDone: false})
            : ring({key, everDone: true}),
        ),
      );
      const {getByText, queryByText} = render(
        <ConstancyRings summary={summary} />,
      );
      expect(queryByText(tc.rowInvitation)).toBeNull();
      expect(getByText(tc.rowDoneToday)).toBeTruthy();
    });

    it('shows the day count for a habit with an active streak, singular and plural', () => {
      const summary = buildConstancySummary([
        ring({key: 'reading', streak: 1, everDone: true}),
        ring({key: 'memory', streak: 5, everDone: true}),
      ]);
      const {getByText} = render(<ConstancyRings summary={summary} />);
      expect(getByText(tc.rowStreakOne)).toBeTruthy();
      expect(getByText(tc.rowStreak.replace('{{n}}', '5'))).toBeTruthy();
    });

    it('fires onHabitPress with the tapped habit key, one button per habit', () => {
      const summary = buildConstancySummary(
        HABIT_ORDER.map(key => ring({key})),
      );
      const onHabitPress = jest.fn();
      const {getByLabelText} = render(
        <ConstancyRings summary={summary} onHabitPress={onHabitPress} />,
      );
      // Every habit is untouched here, so the row's full a11y label includes
      // the invitation, not just the habit name (screen-reader users must
      // hear "Empieza hoy" too — see the T26 accessibility fix).
      fireEvent.press(
        getByLabelText(`${tc.habitDevotion}: ${tc.rowInvitation}`),
      );
      expect(onHabitPress).toHaveBeenCalledWith('devotion');
      expect(onHabitPress).toHaveBeenCalledTimes(1);
    });
  });
});
