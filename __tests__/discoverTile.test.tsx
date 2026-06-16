/**
 * Sprint 94 — the Home "Explorar" grid tile. Pins that it renders its title +
 * subtitle and fires the injected onPress (Home wraps it with haptics +
 * router.push), so the four discover surfaces share one tidy, testable tile.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {DiscoverTile} from '../src/components/home/DiscoverTile';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  primaryLight: '#7dd3fc',
  primaryDark: '#0284c7',
  secondary: '#a78bfa',
  accent: '#34d399',
  info: '#60a5fa',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));

describe('DiscoverTile', () => {
  it('renders the title and subtitle', () => {
    const {getByText} = render(
      <DiscoverTile
        icon="footsteps"
        title="Tu camino"
        subtitle="Tu año en la Palabra"
        onPress={() => {}}
      />,
    );
    expect(getByText('Tu camino')).toBeTruthy();
    expect(getByText('Tu año en la Palabra')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const {getByLabelText} = render(
      <DiscoverTile
        icon="stats-chart"
        title="Mi lectura"
        subtitle="Tus estadísticas"
        onPress={onPress}
      />,
    );
    fireEvent.press(getByLabelText('Mi lectura'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
