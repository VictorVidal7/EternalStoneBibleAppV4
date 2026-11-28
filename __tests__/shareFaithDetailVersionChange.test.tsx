/**
 * R9-525 (familia de R9-430), the twins without audio — the detail of a
 * share-faith method and of an objection follow the reading version while the
 * screen stays mounted.
 *
 * Both read `@bible_version` once, in the mount `load`, with nothing tied to
 * the version: with it changed in the reader (a verse opens it, the detail
 * stays mounted under it), they kept the old version until reopened. The real
 * screens; `useBibleVersion` is swapped and the screen re-rendered, as the
 * provider does when the reader changes it (and `@bible_version` with it).
 */
import {render, waitFor, act} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MethodDetailScreen from '../app/features/share-faith/methods/[id]';
import ObjectionDetailScreen from '../app/features/share-faith/objections/[id]';

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
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
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

const settle = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 50));
  });

beforeEach(async () => {
  mockVer = mockRVR;
  mockHold.version = null;
  mockHold.gate = null;
  await AsyncStorage.setItem('@bible_version', 'RVR1960');
});

const cases = [
  {name: 'a method', Screen: MethodDetailScreen, params: {id: 'romans-road'}},
  {
    name: 'an objection',
    Screen: ObjectionDetailScreen,
    params: {id: 'god-exists'},
  },
];

describe.each(cases)(
  'R9-525 — the detail of $name follows the reading version',
  ({Screen, params}) => {
    it('its rows are resolved again in the new version', async () => {
      mockParams = params;
      const u = render(<Screen />);
      await waitFor(() =>
        expect(u.queryAllByText(/RVR1960\|/).length).toBeGreaterThan(0),
      );
      // The reader changed the version (the provider and the disk), back here.
      await AsyncStorage.setItem('@bible_version', 'KJV');
      mockVer = mockKJV;
      u.rerender(<Screen />);
      await settle();
      const old = u.queryAllByText(/RVR1960\|/).length;
      const fresh = u.queryAllByText(/KJV\|/).length;
      // eslint-disable-next-line no-console
      console.log('R9-525 twin ' + JSON.stringify({params, old, fresh}));
      expect(old).toBe(0);
      expect(fresh).toBeGreaterThan(0);
    });

    it('a mount load still in flight when the version changes does not land', async () => {
      mockParams = params;
      let release: () => void = () => undefined;
      mockHold.version = 'RVR1960';
      mockHold.gate = new Promise<void>(r => {
        release = r;
      });
      const u = render(<Screen />);
      await settle();
      await AsyncStorage.setItem('@bible_version', 'KJV');
      mockVer = mockKJV;
      u.rerender(<Screen />);
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

    it('control: mounted in KJV, its rows are in KJV', async () => {
      mockParams = params;
      await AsyncStorage.setItem('@bible_version', 'KJV');
      mockVer = mockKJV;
      const u = render(<Screen />);
      await waitFor(() =>
        expect(u.queryAllByText(/KJV\|/).length).toBeGreaterThan(0),
      );
      expect(u.queryAllByText(/RVR1960\|/).length).toBe(0);
    });
  },
);
