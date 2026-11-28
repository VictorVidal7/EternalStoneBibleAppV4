/**
 * R9-493 (fused into R9-435) — in a kids story, «Ver versículo» looks the
 * scene's verse up in the Bible DB. If «Siguiente» comes before the lookup
 * lands, the late answer used to be written into the NEXT scene, and that
 * scene never looked its own verse up (`verseText !== undefined`).
 *
 * The real story screen; the Bible DB's `getVerse` is gated so the test
 * decides when it answers.
 */
import React from 'react';
import {render, fireEvent, act, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetVerse = jest.fn();
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: async () => undefined,
    getVerse: (...a: unknown[]) => mockGetVerse(...a),
  },
}));
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => true,
};
const mockParams = {storyId: 'creation'};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
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
  haptics: {
    tap: jest.fn(),
    press: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    light: jest.fn(),
  },
}));
const mockColors = new Proxy({}, {get: () => '#000000'});
const mockTheme = {
  colors: mockColors,
  gradient: {headerColors: ['#000000', '#111111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockVersion = {selectedVersion: {id: 'rvr1960', language: 'es'}};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockServices = {achievementService: null, notifyAchievements: jest.fn()};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockToast = {info: jest.fn(), success: jest.fn(), error: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockNarr = {
  speaking: false,
  walkthroughActive: false,
  toggle: jest.fn(),
  speakOnce: jest.fn(),
  stop: jest.fn(),
};
jest.mock('@hooks/useNarratedWalkthrough', () => ({
  useNarratedWalkthrough: () => mockNarr,
}));
jest.mock('@/lib/speech/narration', () => ({
  resolveSpeechLanguage: () => 'es-ES',
}));
jest.mock('@components/kids/KidsSceneCanvas', () => ({
  KidsSceneCanvas: () => null,
}));

const KidsStoryScreen = require('../app/features/kids/[storyId]').default;
const tk = mockLang.t.kids;

const flush = (ms = 30) =>
  act(async () => {
    await new Promise(r => setTimeout(r, ms));
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  // the one-time «Escuchar todo» hint stays out of the way
  await AsyncStorage.setItem('@kids_listen_all_hint_v1', '1');
  mockGetVerse.mockReset();
  mockGetVerse.mockImplementation((_b: number, c: number, v: number) =>
    Promise.resolve({text: 'TEXTO ' + c + ':' + v}),
  );
});

it('control: the verse lands before «Siguiente»; scene 2 looks its own up', async () => {
  render(<KidsStoryScreen />);
  await flush();
  fireEvent.press(screen.getByLabelText(tk.showVerse));
  await flush();
  expect(screen.getByText('TEXTO 1:3')).toBeTruthy();
  fireEvent.press(screen.getByLabelText(tk.next));
  await flush();
  fireEvent.press(screen.getByLabelText(tk.showVerse));
  await flush();
  expect(screen.queryByText('TEXTO 1:6')).toBeTruthy();
});

it('the verse of scene 1 that lands after «Siguiente» does not show under scene 2', async () => {
  let resolveFirst: (v: unknown) => void = () => undefined;
  mockGetVerse.mockImplementationOnce(
    () =>
      new Promise(r => {
        resolveFirst = r;
      }),
  );
  render(<KidsStoryScreen />);
  await flush();
  fireEvent.press(screen.getByLabelText(tk.showVerse));
  await flush(5);
  fireEvent.press(screen.getByLabelText(tk.next));
  await flush(5);
  await act(async () => {
    resolveFirst({text: 'TEXTO 1:3'});
  });
  await flush();
  fireEvent.press(screen.getByLabelText(tk.showVerse));
  await flush();
  expect(screen.queryByText('TEXTO 1:3')).toBeNull();
  expect(screen.queryByText('TEXTO 1:6')).toBeTruthy();
  expect(mockGetVerse.mock.calls.map(c => c.slice(0, 3))).toEqual([
    [1, 1, 3],
    [1, 1, 6],
  ]);
});
