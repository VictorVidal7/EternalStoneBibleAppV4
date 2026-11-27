/**
 * R9-476 — «Palabras clave» (and «Comparar versiones») showed another
 * passage's answer:
 *
 *  - the reload at the end of a pack download called the `loadOriginalWords`
 *    of the render where «Descargar» was tapped, so moving the range or
 *    changing the passage while it downloaded ended with the words of the
 *    passage of the tap under the new label;
 *  - neither load discarded an old answer: a read for 3:16-17 landing after
 *    the one for 3:16 painted verse 17's words (and comparison row) under
 *    «Juan 3:16».
 *
 * The real Mesa under the real PremiumProvider; the database, the download and
 * the comparison service are stubbed with gates to build each order.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import {translations} from '../src/i18n/translations';

const mockPurchases = Purchases as unknown as {__reset: () => void};

let mockRouteParams: Record<string, string> = {};
const mockRouter = {push: jest.fn(), back: jest.fn(), setParams: jest.fn()};
jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => mockRouter,
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
const mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));
const mockSheet = {open: jest.fn()};
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => mockSheet,
}));

// One distinct Strong's number per verse, so the list says which verses it
// was built from: John 3:16 → G25, John 3:17 → G2889, Romans 5:8 → G26.
function word(strongs: string, w: string) {
  return {
    position: 1,
    lang: 'G',
    word: w,
    translit: w,
    gloss_en: w,
    gloss_es: w,
    strongs,
    grammar: 'V-AAI-3S',
  };
}
const WORDS: Record<string, ReturnType<typeof word>[]> = {
  '43/16': [word('G25', 'ἠγάπησεν')],
  '43/17': [word('G2889', 'κόσμον')],
  '45/8': [word('G26', 'ἀγάπην')],
};

let mockInstalled = false;
// A gate per verse read; `null` lets the read through at once.
let mockWordsGate: ((key: string) => Promise<void> | null) | null = null;
const mockGetOriginalWords = jest.fn(
  async (bookId: number, _chapter: number, verse: number) => {
    const key = `${bookId}/${verse}`;
    const gate = mockWordsGate?.(key);
    if (gate) await gate;
    return WORDS[key] ?? [];
  },
);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
    originalsInstalled: jest.fn(async () => mockInstalled),
    getOriginalWords: (...args: unknown[]) =>
      (mockGetOriginalWords as (...a: unknown[]) => unknown)(...args),
  },
}));

let releaseDownload: () => void = () => undefined;
const mockDownload = jest.fn(
  () =>
    new Promise<void>(resolve => {
      releaseDownload = () => {
        mockInstalled = true;
        resolve();
      };
    }),
);
jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: (...args: unknown[]) =>
    (mockDownload as (...a: unknown[]) => unknown)(...args),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));

const RVR = {id: 'rvr1960', abbreviation: 'RVR1960', language: 'es'};
const KJV = {id: 'kjv', abbreviation: 'KJV', language: 'en'};
let mockAvailableVersions: unknown[] = [];
let mockCompareGate: ((end: number) => Promise<void> | null) | null = null;
const mockCompareVerseRange = jest.fn(
  async (
    book: string,
    chapter: number,
    start: number,
    end: number,
    ids: string[],
  ) => {
    const gate = mockCompareGate?.(end);
    if (gate) await gate;
    const versions = [RVR, KJV].filter(v => ids.includes(v.id));
    const rows = [];
    for (let v = start; v <= end; v++) {
      rows.push({
        book,
        chapter,
        verseNumber: v,
        versions: versions.map(ver => ({
          versionId: ver.id,
          versionName: ver.abbreviation,
          versionAbbr: ver.abbreviation,
          text: `${ver.abbreviation} texto v${v}`,
          wordCount: 3,
        })),
      });
    }
    return rows;
  },
);
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => mockAvailableVersions),
    compareVerseRange: (...args: unknown[]) =>
      (mockCompareVerseRange as (...a: unknown[]) => unknown)(...args),
  },
}));

const p = translations.es.prepTable;
const INCREASE_END = `${p.increase} ${p.rangeEndLabel}`;
const DECREASE_END = `${p.decrease} ${p.rangeEndLabel}`;

function screenTree() {
  return (
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>
  );
}

async function settle() {
  await act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });
}

beforeEach(async () => {
  __resetForTests();
  mockPurchases.__reset();
  mockInstalled = false;
  mockWordsGate = null;
  mockCompareGate = null;
  mockAvailableVersions = [];
  mockGetOriginalWords.mockClear();
  mockDownload.mockClear();
  mockCompareVerseRange.mockClear();
  mockRouteParams = {
    book: 'John',
    chapter: '3',
    startVerse: '16',
    version: 'RVR1960',
  };
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
});

afterEach(async () => {
  await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
});

describe('Mesa — the download reloads the passage on screen when it ends (R9-476)', () => {
  async function startDownload() {
    const screen = render(screenTree());
    await screen.findByText('Juan 3:16');
    const download = await screen.findByText(
      translations.es.originals.download,
    );
    await act(async () => {
      fireEvent.press(download);
    });
    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1));
    return screen;
  }

  it('range widened during the download: the words of 3:16 AND 3:17', async () => {
    const screen = await startDownload();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(INCREASE_END));
    });
    await screen.findByText('Juan 3:16-17');
    await settle();

    await act(async () => {
      releaseDownload();
    });
    await screen.findByText('G25');
    // Pre-fix: the reload read the table of the tap (3:16 only).
    await waitFor(() => expect(screen.queryByText('G2889')).toBeTruthy());
  });

  it('passage changed during the download: the words of the new passage only', async () => {
    const screen = await startDownload();
    mockRouteParams = {
      book: 'Romans',
      chapter: '5',
      startVerse: '8',
      version: 'RVR1960',
    };
    screen.rerender(screenTree());
    await screen.findByText('Romanos 5:8');
    await settle();

    await act(async () => {
      releaseDownload();
    });
    await screen.findByText('G26');
    // Pre-fix: John 3:16's word under «Romanos 5:8».
    expect(screen.queryByText('G25')).toBeNull();
  });

  it('control: the range moved AFTER the download shows both verses too', async () => {
    const screen = await startDownload();
    await act(async () => {
      releaseDownload();
    });
    await screen.findByText('G25');
    await act(async () => {
      fireEvent.press(screen.getByLabelText(INCREASE_END));
    });
    await screen.findByText('G2889');
    expect(screen.getByText('G25')).toBeTruthy();
  });
});

describe('Mesa — an old answer never lands over the current range (R9-476)', () => {
  it('originals: the held read of 3:16-17 landing after 3:16 does not add verse 17', async () => {
    mockInstalled = true;
    mockRouteParams = {...mockRouteParams, endVerse: '17'};
    let release17!: () => void;
    const held17 = new Promise<void>(r => {
      release17 = r;
    });
    // Only the first read of verse 17 is held: the 3:16-17 load.
    let heldOnce = false;
    mockWordsGate = key => {
      if (key === '43/17' && !heldOnce) {
        heldOnce = true;
        return held17;
      }
      return null;
    };

    const screen = render(screenTree());
    await screen.findByText('Juan 3:16-17');
    await waitFor(() => expect(heldOnce).toBe(true));

    await act(async () => {
      fireEvent.press(screen.getByLabelText(DECREASE_END));
    });
    await screen.findByText('Juan 3:16');
    await screen.findByText('G25');
    expect(screen.queryByText('G2889')).toBeNull();

    await act(async () => {
      release17();
    });
    await settle();
    // Pre-fix: verse 17's word appears under «Juan 3:16».
    expect(screen.queryByText('G2889')).toBeNull();
    expect(screen.getByText('G25')).toBeTruthy();
  });

  it('comparison: the held rows of 3:16-17 landing after 3:16 do not add verse 17', async () => {
    mockAvailableVersions = [RVR, KJV];
    mockRouteParams = {...mockRouteParams, endVerse: '17'};
    let release!: () => void;
    const held = new Promise<void>(r => {
      release = r;
    });
    let heldOnce = false;
    mockCompareGate = end => {
      if (end === 17 && !heldOnce) {
        heldOnce = true;
        return held;
      }
      return null;
    };

    const screen = render(screenTree());
    await screen.findByText('Juan 3:16-17');
    await waitFor(() => expect(heldOnce).toBe(true));

    await act(async () => {
      fireEvent.press(screen.getByLabelText(DECREASE_END));
    });
    await screen.findByText('Juan 3:16');
    await screen.findByText('RVR1960 texto v16');
    expect(screen.queryByText('RVR1960 texto v17')).toBeNull();

    await act(async () => {
      release();
    });
    await settle();
    // Pre-fix: verse 17's row appears under «Juan 3:16».
    expect(screen.queryByText('RVR1960 texto v17')).toBeNull();
    expect(screen.getByText('RVR1960 texto v16')).toBeTruthy();
  });
});
