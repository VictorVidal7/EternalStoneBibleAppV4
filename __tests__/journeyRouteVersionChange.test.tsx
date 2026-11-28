/**
 * R9-486 (familia de R9-430) — the verse preview of a Journeys stop follows the
 * reading version while the route screen stays mounted.
 *
 * The previews used to be cached per stop (`previewText`), not per version:
 * the stop's chip opens the reader (the route stays mounted under it), the
 * version changes there, and back on the route the open card still showed the
 * old version's text under the chip in the new one; closing and reopening it
 * did not fetch again. The real screen; `useBibleVersion` is swapped and the
 * screen re-rendered, as the provider does when the reader changes it.
 */
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => true,
};
const mockParams = {routeId: 'exodus'};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
});
jest.mock('react-native-view-shot', () => ({captureRef: jest.fn()}));
jest.mock('@/features/share/shareOrDownloadImage', () => ({
  shareOrDownloadImage: jest.fn(),
}));
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    press: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));
const mockTheme = {
  colors: {
    background: '#000000',
    card: '#111111',
    border: '#222222',
    primary: '#6366f1',
    primaryDark: '#4338ca',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    warning: '#f59e0b',
  },
  gradient: {
    colors: ['#000', '#000', '#000'],
    headerColors: ['#000', '#000', '#000'],
    accentGlow: '#FFD60A',
  },
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const RVR = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
const WEB = {selectedVersion: {id: 'WEB', language: 'en', abbreviation: 'WEB'}};
const mockVersionRef: {current: typeof RVR} = {current: RVR};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersionRef.current,
}));
const mockWalk = {speaking: false, walkthroughActive: false, toggle: jest.fn()};
jest.mock('@hooks/useNarratedWalkthrough', () => ({
  useNarratedWalkthrough: () => mockWalk,
}));
// Each version answers with its own text; `mockHold`, when set, keeps the
// answer for that version until released.
const mockHold: {version: string | null; release: (() => void) | null} = {
  version: null,
  release: null,
};
const mockGetVerse = jest.fn(
  async (_b: number, _c: number, _v: number, ver: string) => {
    if (mockHold.version === ver) {
      await new Promise<void>(resolve => {
        mockHold.release = resolve;
      });
    }
    return {text: 'TEXTO-' + ver};
  },
);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: (...a: unknown[]) =>
      (mockGetVerse as unknown as (...x: unknown[]) => unknown)(...a),
  },
}));
jest.mock('@lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));
const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockServices = {achievementService: null, notifyAchievements: jest.fn()};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockMarkVisited = jest.fn(async (id: string) => new Set([id]));
jest.mock('@/features/study/journeyProgress', () => ({
  getVisitedJourneyStops: jest.fn(async () => new Set<string>()),
  markJourneyStopVisited: (id: string) => mockMarkVisited(id),
}));

import JourneyRouteScreen from '../app/features/journeys/[routeId]';

const tj = require('../src/i18n/translations').translations.es.journeys;
const label = tj.items['exodus-red-sea'].label as string; // «El Mar Rojo»

const pressStop = (u: ReturnType<typeof render>) =>
  fireEvent.press(u.getAllByLabelText(label).slice(-1)[0]);

const settle = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 20));
  });

afterEach(() => {
  mockGetVerse.mockClear();
  mockMarkVisited.mockClear();
  mockVersionRef.current = RVR;
  mockHold.version = null;
  mockHold.release = null;
});

describe('R9-486 — a Journeys stop preview follows the reading version', () => {
  it('the open card is fetched again in the new version, with no tap', async () => {
    const u = render(<JourneyRouteScreen />);
    pressStop(u);
    await waitFor(() => expect(u.getByText('TEXTO-RVR1960')).toBeTruthy());
    expect(u.queryByText('Éxodo 14:22')).not.toBeNull();
    expect(mockMarkVisited).toHaveBeenCalledTimes(1);

    // The chip opened the reader, the version changed there, back here.
    mockVersionRef.current = WEB;
    u.rerender(<JourneyRouteScreen />);
    await waitFor(() => expect(u.getByText('TEXTO-WEB')).toBeTruthy());
    expect(u.queryByText('TEXTO-RVR1960')).toBeNull();
    expect(u.queryByText('Exodus 14:22')).not.toBeNull();
    // Silent: it counts as no visit (no tap) and the card stays open.
    expect(mockMarkVisited).toHaveBeenCalledTimes(1);
    expect(mockGetVerse.mock.calls.map(c => c[3])).toEqual(['RVR1960', 'WEB']);
  });

  it('a card closed before the change is fetched in the new version when reopened', async () => {
    const u = render(<JourneyRouteScreen />);
    pressStop(u);
    await waitFor(() => expect(u.getByText('TEXTO-RVR1960')).toBeTruthy());
    pressStop(u); // close it
    mockVersionRef.current = WEB;
    u.rerender(<JourneyRouteScreen />);
    await settle();
    pressStop(u); // reopen it
    await waitFor(() => expect(u.getByText('TEXTO-WEB')).toBeTruthy());
    expect(u.queryByText('TEXTO-RVR1960')).toBeNull();
    expect(mockGetVerse.mock.calls.map(c => c[3])).toEqual(['RVR1960', 'WEB']);
  });

  it('an old-version answer landing after the change is dropped', async () => {
    mockHold.version = 'RVR1960';
    const u = render(<JourneyRouteScreen />);
    pressStop(u);
    await waitFor(() => expect(mockHold.release).not.toBeNull());
    mockVersionRef.current = WEB;
    u.rerender(<JourneyRouteScreen />);
    await waitFor(() => expect(u.getByText('TEXTO-WEB')).toBeTruthy());
    // The RVR1960 read, still in flight, lands now.
    await act(async () => {
      mockHold.release?.();
      await new Promise(r => setTimeout(r, 20));
    });
    expect(u.queryByText('TEXTO-RVR1960')).toBeNull();
    expect(u.getByText('TEXTO-WEB')).toBeTruthy();
  });
});
