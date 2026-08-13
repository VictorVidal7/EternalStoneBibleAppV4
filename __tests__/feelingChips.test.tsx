/**
 * Sprint 79 — FeelingChips: the Home emotional check-in row.
 *
 * Pins the row's contract: every curated feeling renders as a chip (Spanish
 * names from i18n), tapping a chip reports its feeling id, and the trailing
 * "Ver todos" chip opens the browse grid.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {FeelingChips} from '../src/components/FeelingChips';
import {FEELINGS} from '../src/features/study/feelings';
import {translations} from '../src/i18n/translations';
import {FEELING_CHIP_WIDTH} from '../src/styles/designTokens';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
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
      text: '#ffffff',
      textSecondary: '#9ca3af',
      border: '#374151',
    },
  }),
}));

describe('FeelingChips', () => {
  it('renders the prompt and one chip per curated feeling', () => {
    const {getByText} = render(
      <FeelingChips onOpenFeeling={jest.fn()} onOpenAll={jest.fn()} />,
    );
    expect(getByText('¿Cómo te sientes hoy?')).toBeTruthy();
    const list = translations.es.feelings.list as Record<
      string,
      {name: string}
    >;
    for (const feeling of FEELINGS) {
      expect(getByText(list[feeling.id].name)).toBeTruthy();
    }
  });

  it('reports the feeling id when a chip is tapped', () => {
    const onOpenFeeling = jest.fn();
    const {getByText} = render(
      <FeelingChips onOpenFeeling={onOpenFeeling} onOpenAll={jest.fn()} />,
    );
    fireEvent.press(getByText('Ansioso'));
    expect(onOpenFeeling).toHaveBeenCalledWith('anxious');
    fireEvent.press(getByText('Agradecido'));
    expect(onOpenFeeling).toHaveBeenCalledWith('grateful');
  });

  it('opens the browse grid from the trailing "Ver todos" chip', () => {
    const onOpenAll = jest.fn();
    const {getByText} = render(
      <FeelingChips onOpenFeeling={jest.fn()} onOpenAll={onOpenAll} />,
    );
    fireEvent.press(getByText('Ver todos'));
    expect(onOpenAll).toHaveBeenCalledTimes(1);
  });

  it('gives every chip the SAME fixed width, short label or long', () => {
    // "Solo" (lonely) is one of the shortest labels; "Esperando en Dios"
    // (waiting) is the longest of the 18 feelings.list entries. A `minWidth`
    // floor would let the long one grow past the short one's box — this
    // pins the fixed-`width` fix instead.
    const {getByLabelText} = render(
      <FeelingChips onOpenFeeling={jest.fn()} onOpenAll={jest.fn()} />,
    );
    const shortChip = StyleSheet.flatten(getByLabelText('Solo').props.style);
    const longChip = StyleSheet.flatten(
      getByLabelText('Esperando en Dios').props.style,
    );
    expect(shortChip.width).toBe(FEELING_CHIP_WIDTH);
    expect(longChip.width).toBe(FEELING_CHIP_WIDTH);
    expect(shortChip.width).toBe(longChip.width);
    // minWidth's floor is gone — width is the sole sizing contract now.
    expect(shortChip.minWidth).toBeUndefined();
  });

  it('gives the trailing "Ver todos" chip the same fixed width as a feeling chip', () => {
    const {getByLabelText} = render(
      <FeelingChips onOpenFeeling={jest.fn()} onOpenAll={jest.fn()} />,
    );
    const feelingChip = StyleSheet.flatten(getByLabelText('Solo').props.style);
    const seeAllChip = StyleSheet.flatten(
      getByLabelText('Ver todos').props.style,
    );
    expect(seeAllChip.width).toBe(feelingChip.width);
  });
});
