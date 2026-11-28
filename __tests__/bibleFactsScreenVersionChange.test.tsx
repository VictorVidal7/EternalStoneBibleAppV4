/**
 * R9-521 (familia de R9-430) — a fact already opened in «Datos bíblicos»
 * follows the reading version while the screen stays mounted.
 *
 * Only the daily fact followed a version change: a fact opened before it kept
 * the old version's text, and its chip the old book name, with the version
 * changed in the reader (the chip opens it, the hub stays mounted under it).
 * The real screen; `useBibleVersion` is swapped and the screen re-rendered,
 * as the provider does when the reader changes it.
 */
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import BibleFactsScreen from '../app/features/facts/index';
import {getDailyFact} from '@/features/study/bibleFacts';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush, back: jest.fn()}),
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
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
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
const mockRVR = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
const mockKJV = {
  selectedVersion: {id: 'KJV', language: 'en', abbreviation: 'KJV'},
};
let mockVer: typeof mockRVR = mockRVR;
jest.mock('@hooks/useBibleVersion', () => ({useBibleVersion: () => mockVer}));
// Each version answers with its own text; `mockHold`, when set, keeps the
// answer for that version until released.
const mockHold: {version: string | null; release: (() => void) | null} = {
  version: null,
  release: null,
};
const mockGetVerse = jest.fn(
  async (b: number, c: number, v: number, ver: string) => {
    if (mockHold.version === ver) {
      await new Promise<void>(resolve => {
        mockHold.release = resolve;
      });
    }
    return {text: `${ver}|${b}:${c}:${v}`};
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

const tf = require('../src/i18n/translations').translations.es.bibleFacts;
const daily = getDailyFact();
// A fact that is NOT the daily one (the daily one already followed the
// version).
const FACT = daily.id === 'unleavened-bread' ? 'dead-sea' : 'unleavened-bread';
const REF =
  FACT === 'unleavened-bread'
    ? {es: 'Éxodo 12:39', en: 'Exodus 12:39', k: '2:12:39'}
    : {es: 'Génesis 14:3', en: 'Genesis 14:3', k: '1:14:3'};

beforeEach(() => {
  mockVer = mockRVR;
  mockGetVerse.mockClear();
  mockPush.mockClear();
  mockHold.version = null;
  mockHold.release = null;
});

describe('R9-521 — an opened fact follows the reading version', () => {
  it('the opened fact is resolved again in the new version, text and chip', async () => {
    const u = render(<BibleFactsScreen />);
    fireEvent.press(u.getByLabelText(tf.items[FACT].label));
    await u.findByText(`“RVR1960|${REF.k}”`);
    expect(u.queryByText(REF.es)).not.toBeNull();

    // The chip opened the reader, the version changed there, back here.
    mockVer = mockKJV;
    u.rerender(<BibleFactsScreen />);
    await u.findByText(`“KJV|${REF.k}”`);
    expect(u.queryByText(`“RVR1960|${REF.k}”`)).toBeNull();
    expect(u.queryByText(REF.en)).not.toBeNull();
    expect(u.queryByText(REF.es)).toBeNull();
    // The chip now opens the reader with the new version's book name.
    fireEvent.press(u.getByLabelText(`${tf.openInReader}: ${REF.en}`));
    expect(String(mockPush.mock.calls[0][0])).toContain(REF.en.split(' ')[0]);
  });

  it('an old-version answer landing after the change is dropped', async () => {
    const u = render(<BibleFactsScreen />);
    await waitFor(() => expect(mockGetVerse).toHaveBeenCalled());
    mockHold.version = 'RVR1960';
    fireEvent.press(u.getByLabelText(tf.items[FACT].label));
    await waitFor(() => expect(mockHold.release).not.toBeNull());
    mockVer = mockKJV;
    u.rerender(<BibleFactsScreen />);
    await u.findByText(`“KJV|${REF.k}”`);
    // The RVR1960 read, still in flight, lands now.
    await act(async () => {
      mockHold.release?.();
      await new Promise(r => setTimeout(r, 20));
    });
    expect(u.queryByText(`“RVR1960|${REF.k}”`)).toBeNull();
    expect(u.getByText(`“KJV|${REF.k}”`)).toBeTruthy();
  });
});
