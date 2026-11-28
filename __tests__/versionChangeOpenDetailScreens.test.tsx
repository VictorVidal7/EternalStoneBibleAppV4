/**
 * R9-525 (familia de R9-430) — the detail of a theme and of a feeling, and the
 * Daily Light, follow the reading version while the screen stays mounted.
 *
 * They read `@bible_version` once, in the mount `load`, with nothing tied to
 * the version. With it changed in the reader (a verse opens it, the screen
 * stays mounted under it), the rows stayed in the old version, and «Escuchar»
 * queued that text, which the engine narrates in the language of the version
 * now live: RVR1960's text in the English voice. The real screens inside the
 * REAL `AudioPlayerProvider` (`expo-speech` spied, as the S130 probe did);
 * `useBibleVersion` is swapped and the screen re-rendered, as the provider
 * does when the reader changes it (and `@bible_version` with it).
 */
import type {ComponentType} from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import {AudioPlayerProvider} from '../src/features/audio/context/AudioPlayerContext';
import ThemeDetailScreen from '../app/features/themes/[theme]';
import FeelingDetailScreen from '../app/features/feelings/[feeling]';
import DailyLightScreen from '../app/features/daily-light/index';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {Light: 'light', Medium: 'medium', Heavy: 'heavy'},
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn(), replace: jest.fn()}),
  useLocalSearchParams: () => mockParams,
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
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
  },
}));
const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  onPrimary: '#ffffff',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  divider: '#333333',
};
const mockTheme = {
  colors: mockColors,
  gradient: {headerColors: ['#000000', '#000000']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const TR = require('../src/i18n/translations').translations;
const mockLang = {language: 'es', t: TR.es};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockAddCard = jest.fn();
const mockDeck = {hasCard: () => false, addCard: mockAddCard};
jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => mockDeck,
}));
const mockServices = {achievementService: null};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockRVR = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
const mockKJV = {
  selectedVersion: {id: 'KJV', language: 'en', abbreviation: 'KJV'},
};
let mockVer: typeof mockRVR = mockRVR;
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVer,
  useBibleVersionOptional: () => mockVer,
}));
// Each version answers with its own text; `mockHold`, when set, keeps the
// answers for that version until released.
const mockHold: {version: string | null; gate: Promise<void> | null} = {
  version: null,
  gate: null,
};
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async (b: number, c: number, v: number, ver: string) => {
      if (mockHold.version === ver && mockHold.gate) await mockHold.gate;
      return {text: `${ver}|${b}:${c}:${v}`};
    }),
  },
}));

const spoken = () =>
  (Speech.speak as jest.Mock).mock.calls.map(c => ({
    text: String(c[0]),
    language: String(c[1]?.language),
  }));

const settle = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 50));
  });

async function changeToKJV(rerender: () => void) {
  await AsyncStorage.setItem('@bible_version', 'KJV');
  mockVer = mockKJV;
  rerender();
  await settle();
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockVer = mockRVR;
  mockHold.version = null;
  mockHold.gate = null;
  await AsyncStorage.setItem('@bible_version', 'RVR1960');
});

const listenCases: {
  name: string;
  Screen: ComponentType;
  params: Record<string, string>;
  listen: string;
}[] = [
  {
    name: 'a theme («Paz»)',
    Screen: ThemeDetailScreen,
    params: {theme: 'peace'},
    listen: TR.es.themes.listenAll as string,
  },
  {
    name: 'a feeling («Ansioso»)',
    Screen: FeelingDetailScreen,
    params: {feeling: 'anxious'},
    listen: TR.es.feelings.listenAll as string,
  },
];

describe.each(listenCases)(
  'R9-525 — the detail of $name follows the reading version',
  ({Screen, params, listen}) => {
    const tree = () => (
      <AudioPlayerProvider>
        <Screen />
      </AudioPlayerProvider>
    );

    it('its rows, and what «Escuchar» reads, move to the new version', async () => {
      mockParams = params;
      const u = render(tree());
      await waitFor(() =>
        expect(u.queryAllByText(/RVR1960\|/).length).toBeGreaterThan(0),
      );
      await changeToKJV(() => u.rerender(tree()));
      expect(u.queryAllByText(/RVR1960\|/).length).toBe(0);
      expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0);

      fireEvent.press(u.getByLabelText(listen));
      await waitFor(
        () =>
          expect((Speech.speak as jest.Mock).mock.calls.length).toBeGreaterThan(
            0,
          ),
        {timeout: 3000},
      );
      const said = spoken();
      // The KJV text, in the English voice; never RVR1960's text.
      expect(said.some(s => s.text.includes('KJV|'))).toBe(true);
      expect(said.every(s => !s.text.includes('RVR1960|'))).toBe(true);
      expect(said.every(s => s.language.startsWith('en'))).toBe(true);
    });

    it('a mount load still in flight when the version changes does not land', async () => {
      mockParams = params;
      let release: () => void = () => undefined;
      mockHold.version = 'RVR1960';
      mockHold.gate = new Promise<void>(r => {
        release = r;
      });
      const u = render(tree());
      await settle();
      await changeToKJV(() => u.rerender(tree()));
      await waitFor(() =>
        expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0),
      );
      // The RVR1960 reads of the mount load land now.
      await act(async () => {
        release();
        await new Promise(r => setTimeout(r, 50));
      });
      expect(u.queryAllByText(/RVR1960\|/).length).toBe(0);
      expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0);
    });
  },
);

describe('R9-525 — the Daily Light follows the reading version', () => {
  it('the verse moves to the new version, and «Memorizar» files it in that one', async () => {
    const u = render(<DailyLightScreen />);
    await waitFor(() =>
      expect(u.queryAllByText(/RVR1960\|/).length).toBeGreaterThan(0),
    );
    // Spanish, the language of RVR1960.
    expect(u.queryByLabelText(TR.es.dailyLight.memorize)).not.toBeNull();

    await changeToKJV(() => u.rerender(<DailyLightScreen />));
    await waitFor(() =>
      expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0),
    );
    expect(u.queryAllByText(/RVR1960\|/).length).toBe(0);
    // The devotional now reads in English, the language of KJV.
    const memorize = u.getByLabelText(TR.en.dailyLight.memorize);
    fireEvent.press(memorize);
    await settle();
    expect(mockAddCard).toHaveBeenCalledTimes(1);
    expect(mockAddCard.mock.calls[0][0]).toEqual(
      expect.objectContaining({version: 'KJV'}),
    );
    expect(String(mockAddCard.mock.calls[0][0].text)).toContain('KJV|');
  });

  it('«Memorizar» files the version of the text on screen, not the one on disk', async () => {
    // The provider shows KJV while the disk still says RVR1960 (its
    // not-persisted fallback, or a pick whose write has not landed yet).
    mockVer = mockKJV;
    const u = render(<DailyLightScreen />);
    await waitFor(() =>
      expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0),
    );
    fireEvent.press(u.getByLabelText(TR.en.dailyLight.memorize));
    await settle();
    expect(mockAddCard).toHaveBeenCalledTimes(1);
    expect(mockAddCard.mock.calls[0][0]).toEqual(
      expect.objectContaining({version: 'KJV'}),
    );
  });
});
