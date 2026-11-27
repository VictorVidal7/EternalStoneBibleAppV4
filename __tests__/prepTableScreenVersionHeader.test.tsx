/**
 * R9-478 (family of R9-430) — the Mesa's passage label read the reading
 * version on every render, while the text, the cross-references and the
 * version chip come from `load()`, which resolves `params.version` and does
 * not run again when the reader changes the version. Back from the reader in
 * KJV, «John 3:16» sat over the RVR1960 text; and a Mesa opened with an
 * explicit KJV while reading RVR1960 said «Juan 3:16» over the KJV text. The
 * label now follows the language of the version that was loaded.
 *
 * The real Mesa; the database answers each version with its own text so the
 * screen says which one it loaded.
 */
import {act, render} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';

let mockRouteParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: jest.fn(), back: jest.fn()}),
    useLocalSearchParams: () => mockRouteParams,
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
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
  },
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
let mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockSheet = {open: jest.fn()};
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => mockSheet,
}));
jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(
      async (_b: number, _c: number, v: number, version: string) => ({
        text: `Texto ${version} ${v}`,
      }),
    ),
    getChapterVerseCount: jest.fn(async () => 36),
    originalsInstalled: jest.fn(async () => false),
  },
}));
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => []),
    compareVerseRange: jest.fn(async () => []),
  },
}));

const RVR = {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'};
const KJV = {id: 'KJV', language: 'en', abbreviation: 'KJV'};

function tree() {
  return (
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>
  );
}

beforeEach(() => {
  mockVersion = {selectedVersion: RVR};
});

describe('Mesa — the passage label follows the loaded version (R9-478)', () => {
  it('the reading version changes to KJV while the Mesa (RVR1960) stays open', async () => {
    mockRouteParams = {
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'RVR1960',
    };
    const screen = render(tree());
    // Control: before the change, label and text agree.
    await screen.findByText('Juan 3:16');
    await screen.findByText(/Texto RVR1960 16/);

    mockVersion = {selectedVersion: KJV};
    await act(async () => {
      screen.rerender(tree());
    });
    // Pre-fix: «John 3:16» over the RVR1960 text.
    expect(screen.queryByText('John 3:16')).toBeNull();
    expect(screen.getByText('Juan 3:16')).toBeTruthy();
    expect(screen.getByText(/Texto RVR1960 16/)).toBeTruthy();
  });

  it('opened with an explicit KJV while reading RVR1960', async () => {
    mockRouteParams = {
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'KJV',
    };
    const screen = render(tree());
    await screen.findByText(/Texto KJV 16/);
    // Pre-fix: «Juan 3:16» over the KJV text.
    expect(await screen.findByText('John 3:16')).toBeTruthy();
    expect(screen.queryByText('Juan 3:16')).toBeNull();
  });
});
