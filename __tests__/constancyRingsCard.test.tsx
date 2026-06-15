/**
 * Sprint 85 — the Home ConstancyRingsCard wrapper. Pins the honest gate
 * (hidden until loaded + any habit history) and the press → onPress wiring.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ConstancyRingsCard} from '../src/components/ConstancyRingsCard';
import {
  buildConstancySummary,
  type ConstancySummary,
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

let mockState: {
  loaded: boolean;
  summary: ConstancySummary;
  hasHistory: boolean;
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

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

jest.mock('../src/hooks/useConstancyRings', () => ({
  useConstancyRings: () => mockState,
}));

// The card nests ConstancyImageModal, which pulls these in even while hidden.
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file://constancy.png')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const tc = translations.es.constancy;

const someSummary = buildConstancySummary([
  {key: 'reading', done: true, fraction: 1, streak: 4},
  {key: 'memory', done: false, fraction: 0.3, streak: 2},
]);

describe('ConstancyRingsCard', () => {
  it('renders nothing until loaded', () => {
    mockState = {loaded: false, summary: someSummary, hasHistory: true};
    const {queryByText} = render(<ConstancyRingsCard onPress={jest.fn()} />);
    expect(queryByText(tc.title)).toBeNull();
  });

  it('renders nothing without any habit history', () => {
    mockState = {loaded: true, summary: someSummary, hasHistory: false};
    const {queryByText} = render(<ConstancyRingsCard onPress={jest.fn()} />);
    expect(queryByText(tc.title)).toBeNull();
  });

  it('shows the rings and fires onPress when tapped', () => {
    mockState = {loaded: true, summary: someSummary, hasHistory: true};
    const onPress = jest.fn();
    const {getByText, getByLabelText} = render(
      <ConstancyRingsCard onPress={onPress} />,
    );
    expect(getByText(tc.title)).toBeTruthy();
    expect(getByText('1 de 4 hoy')).toBeTruthy();
    // The card's own button (the share icon is a separate nested button).
    fireEvent.press(getByLabelText(`${tc.title}: 1 de 4 hoy`));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
