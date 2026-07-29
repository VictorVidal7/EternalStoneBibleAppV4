/**
 * Explore-all screen (`app/features/explore-all/index.tsx`) — the standalone
 * "browse all features" catalogue that supersedes Home's trimmed 6-tile
 * Explorar grid as the one comprehensive index of all 11 discover tiles.
 *
 * Basic render smoke test, following the pattern of conflictsScreenLabels.
 * test.tsx / propheticThreadBackAndHeader.test.tsx: mock the theme/language/
 * router/native-module boundaries and assert on real `translations.es`
 * strings rather than hand-rolled fixtures, so a translation-key typo would
 * fail this test too.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import ExploreAllScreen from '../app/features/explore-all/index';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  primaryLight: '#818cf8',
  secondary: '#a78bfa',
  accent: '#34d399',
  info: '#60a5fa',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: mockColors,
    gradient: {headerColors: ['#000000', '#000000']},
    highContrast: false,
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const es = require('../src/i18n/translations').translations.es;

function renderScreen() {
  return render(<ExploreAllScreen />);
}

describe('Explore-all screen', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockCanGoBack.mockClear();
    mockReplace.mockClear();
  });

  it('renders the header title and subtitle', () => {
    const {getByText} = renderScreen();
    expect(getByText(es.exploreAll.title)).toBeTruthy();
    expect(getByText(es.exploreAll.subtitle)).toBeTruthy();
  });

  it('renders all 11 discover tiles', () => {
    const {getByText} = renderScreen();
    expect(getByText(es.dailyLight.cardTitle)).toBeTruthy();
    expect(getByText(es.themes.cardTitle)).toBeTruthy();
    expect(getByText(es.prophecies.title)).toBeTruthy();
    expect(getByText(es.bibleFacts.title)).toBeTruthy();
    expect(getByText(es.journeys.title)).toBeTruthy();
    expect(getByText(es.kids.cardTitle)).toBeTruthy();
    expect(getByText(es.quiz.cardTitle)).toBeTruthy();
    expect(getByText(es.dictionary.cardTitle)).toBeTruthy();
    expect(getByText(es.sermonNotes.cardTitle)).toBeTruthy();
    expect(getByText(es.theology.cardTitle)).toBeTruthy();
    expect(getByText(es.shareFaith.cardTitle)).toBeTruthy();
  });

  it('navigates to the right route when a tile is tapped (e.g. Quiz)', () => {
    const {getByText} = renderScreen();
    fireEvent.press(getByText(es.quiz.cardTitle));
    expect(mockPush).toHaveBeenCalledWith('/features/quiz');
  });

  it('navigates to journeys (not the personal-progress "journey" tracker) when that tile is tapped', () => {
    const {getByText} = renderScreen();
    fireEvent.press(getByText(es.journeys.title));
    expect(mockPush).toHaveBeenCalledWith('/features/journeys');
  });

  it('the back button calls router.back() when a back-stack entry exists', () => {
    mockCanGoBack.mockReturnValue(true);
    const {getByLabelText} = renderScreen();
    fireEvent.press(getByLabelText(es.bible.back));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('the back button falls back to replace("/") when there is no back-stack entry (direct deep link)', () => {
    mockCanGoBack.mockReturnValue(false);
    const {getByLabelText} = renderScreen();
    fireEvent.press(getByLabelText(es.bible.back));
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
