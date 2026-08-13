/**
 * Sprint 79 — the "¿Cómo te sientes?" browse grid (`app/features/feelings`).
 *
 * Victor asked for every option in this 2-column grid to occupy the SAME
 * amount of space. `feelingCard`'s equal `flexBasis`/`flexGrow` already gives
 * every card the same WIDTH, but each card's HEIGHT used to track its own
 * description's length: a short description (eg. "guilty", ~26 chars, 1
 * line) reserved half the vertical space a long one (eg. "seeking", ~40
 * chars, 2 lines) did, so cards ended up visibly uneven sizes even though
 * their widths matched. This test pins the fix: the description block always
 * renders (never conditionally omitted) with a fixed `minHeight` reserving
 * the full 2-line allowance, so short and long descriptions occupy identical
 * space.
 */
import {render} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import FeelingsBrowseScreen from '../app/features/feelings/index';
import {FEELINGS} from '../src/features/study/feelings';
import {translations} from '../src/i18n/translations';

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  Stack: {Screen: () => null},
}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
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
    highContrast: false,
    gradient: {headerColors: ['#000000', '#000000']},
    colors: {
      background: '#000000',
      card: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
  }),
}));

describe('FeelingsBrowseScreen — equal card space', () => {
  it('renders all 18 curated feelings as cards', () => {
    const {getByText} = render(<FeelingsBrowseScreen />);
    const list = translations.es.feelings.list as Record<
      string,
      {name: string}
    >;
    for (const feeling of FEELINGS) {
      expect(getByText(list[feeling.id].name)).toBeTruthy();
    }
  });

  it('gives every description block the SAME reserved height, short or long text', () => {
    // "guilty" ("Culpable" -> "Cuando el pasado te acusa") is one of the
    // shortest descriptions (1 line); "seeking" ("Buscando a Dios" ->
    // "Cuando buscas a Dios con todo tu corazón") is one of the longest
    // (2 lines). Both must reserve identical vertical space.
    const {getByText} = render(<FeelingsBrowseScreen />);
    const shortDesc = getByText('Cuando el pasado te acusa');
    const longDesc = getByText('Cuando buscas a Dios con todo tu corazón');

    const shortStyle = StyleSheet.flatten(shortDesc.props.style);
    const longStyle = StyleSheet.flatten(longDesc.props.style);

    expect(shortStyle.minHeight).toBeTruthy();
    expect(shortStyle.minHeight).toBe(longStyle.minHeight);
  });

  it('gives every feeling card the same width contract (equal flexBasis + flexGrow)', () => {
    const {getByLabelText} = render(<FeelingsBrowseScreen />);
    const list = translations.es.feelings.list as Record<
      string,
      {name: string}
    >;
    const shortCard = StyleSheet.flatten(
      getByLabelText(list.guilty.name).props.style,
    );
    const longCard = StyleSheet.flatten(
      getByLabelText(list.seeking.name).props.style,
    );
    expect(shortCard.flexBasis).toBe(longCard.flexBasis);
    expect(shortCard.flexGrow).toBe(longCard.flexGrow);
  });
});
