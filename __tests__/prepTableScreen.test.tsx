/**
 * Sprint 103 — "Mesa de preparación" screen.
 *
 * Renders the prep table for a real passage and asserts it lays out the full
 * evangelical study scaffold (every outline section), surfaces the gathered
 * helps (a cross-reference parallel), and shows the pastoral guardrail.
 */
import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {translations} from '../src/i18n/translations';

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({
    book: 'John',
    chapter: '3',
    startVerse: '16',
    version: 'RVR1960',
  }),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
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

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
  },
}));

const p = translations.es.prepTable;

describe('Mesa de preparación — screen', () => {
  it('assembles the full outline scaffold, helps and guardrail for John 3:16', async () => {
    const {findByText, getByText} = render(<PrepTableScreen />);

    // Header shows the localized passage label.
    expect(await findByText('Juan 3:16')).toBeTruthy();

    // Every outline section is laid out.
    expect(getByText(p.sections.context.label)).toBeTruthy();
    expect(getByText(p.sections.observation.label)).toBeTruthy();
    expect(getByText(p.sections.interpretation.label)).toBeTruthy();
    expect(getByText(p.sections.bigIdea.label)).toBeTruthy();
    expect(getByText(p.sections.christ.label)).toBeTruthy();
    expect(getByText(p.sections.application.label)).toBeTruthy();
    expect(getByText(p.sections.questions.label)).toBeTruthy();

    // A gathered cross-reference parallel surfaces (John 3:16 → Romans 5:8).
    await waitFor(() => expect(getByText('Romanos 5:8')).toBeTruthy());

    // The pastoral guardrail is present.
    expect(getByText(p.guardrail)).toBeTruthy();

    // The export (copy outline) action is offered.
    expect(getByText(p.exportLabel)).toBeTruthy();
  });
});
