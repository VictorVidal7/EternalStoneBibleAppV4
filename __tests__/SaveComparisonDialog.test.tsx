/**
 * SaveComparisonDialog — regression guard for a high-contrast-mode
 * anti-pattern (Tanda K): the save button's text was hardcoded to
 * `staticColors.white`, which is fine on the normal-mode dark-enough
 * `colors.primary` but washes out illegibly against the bright amber
 * `colors.primary` used under "Alto contraste" mode. The fix reads the
 * theme-aware `colors.onPrimary` ink instead — this pins that wiring so a
 * future refactor can't silently reintroduce the hardcoded white.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {SaveComparisonDialog} from '../src/components/comparison/SaveComparisonDialog';

// Mirrors the real HIGH_CONTRAST_COLORS shape (primary = bright amber,
// onPrimary = black ink) so a component that still reads
// `staticColors.white` (#FFFFFF) instead of `colors.onPrimary` fails loudly.
const mockColors = {
  surface: '#0A0A0A',
  background: '#000000',
  text: '#FFFFFF',
  textTertiary: '#C7C7C7',
  border: 'rgba(255, 255, 255, 0.45)',
  primary: '#FFD60A',
  onPrimary: '#000000',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const colorOf = (node: {props: {style?: unknown}}): string | undefined =>
  (StyleSheet.flatten(node.props.style) as {color?: string})?.color;

describe('SaveComparisonDialog theming (Tanda K)', () => {
  it('inks the save button text with colors.onPrimary, not a hardcoded white', () => {
    const {getByText} = render(
      <SaveComparisonDialog visible onClose={jest.fn()} onSave={jest.fn()} />,
    );

    expect(colorOf(getByText('Guardar'))).toBe(mockColors.onPrimary);
  });

  it('also inks the "update" label when editing an existing comparison', () => {
    const {getByText} = render(
      <SaveComparisonDialog
        visible
        isEditing
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(colorOf(getByText('Actualizar'))).toBe(mockColors.onPrimary);
  });
});
