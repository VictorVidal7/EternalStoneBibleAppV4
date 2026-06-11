/**
 * Sprint 78 — VerseOfDayCard history row ("versos de días anteriores").
 *
 * Pins the card-side contract: the row only renders when historyEnabled,
 * the caption reads "Hoy" at the present and the provided label in the
 * past, the chevrons fire/disable per the handlers, and the "Hoy" pill
 * appears only while browsing the past.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import VerseOfDayCard from '../src/components/celestial/VerseOfDayCard';

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      info: '#0ea5e9',
      text: '#ffffff',
    },
  }),
}));

const baseProps = {
  verseText: 'Lámpara es a mis pies tu palabra…',
  reference: 'Salmos 119:105',
  isDark: true,
};

describe('VerseOfDayCard — history row', () => {
  it('stays hidden without historyEnabled', () => {
    const {queryByLabelText} = render(<VerseOfDayCard {...baseProps} />);
    expect(queryByLabelText('Ver el verso del día anterior')).toBeNull();
  });

  it('shows "Hoy" at the present with only the back chevron live', () => {
    const onPrevDay = jest.fn();
    const {getByText, getByLabelText, queryByLabelText} = render(
      <VerseOfDayCard {...baseProps} historyEnabled onPrevDay={onPrevDay} />,
    );
    expect(getByText('Hoy')).toBeTruthy();
    expect(queryByLabelText('Volver a hoy')).toBeNull();
    fireEvent.press(getByLabelText('Ver el verso del día anterior'));
    expect(onPrevDay).toHaveBeenCalledTimes(1);
  });

  it('shows the day label + forward chevron + Hoy pill while in the past', () => {
    const onNextDay = jest.fn();
    const onToday = jest.fn();
    const {getByText, getByLabelText} = render(
      <VerseOfDayCard
        {...baseProps}
        historyEnabled
        historyLabel="Ayer"
        onNextDay={onNextDay}
        onToday={onToday}
      />,
    );
    expect(getByText('Ayer')).toBeTruthy();
    fireEvent.press(getByLabelText('Ver el día siguiente'));
    expect(onNextDay).toHaveBeenCalledTimes(1);
    fireEvent.press(getByLabelText('Volver a hoy'));
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it('marks the back chevron disabled at the window edge', () => {
    const {getByLabelText} = render(
      <VerseOfDayCard
        {...baseProps}
        historyEnabled
        historyLabel="hace 6 días"
        onNextDay={jest.fn()}
        onToday={jest.fn()}
      />,
    );
    const back = getByLabelText('Ver el verso del día anterior');
    expect(back.props.accessibilityState?.disabled).toBe(true);
  });
});
