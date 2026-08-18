/**
 * T8.4.3 — "Mesa de preparación" premium addition: "Comparar versiones", 2-3
 * ALREADY-INSTALLED Bible translations of the current passage range, side by
 * side. Reuses `versionComparisonService` (the same service behind the
 * standalone Version Comparison screen) rather than re-deriving verse
 * lookups here — this file stubs that service directly so it never touches
 * the real SQLite-backed implementation.
 *
 * Scoped to what's NEW in this tanda; the screen's pre-existing free
 * behaviour is covered by prepTableScreen.test.tsx, and the T8.4.2 additions
 * (expanded cross-refs, original-language keywords) by
 * prepTableScreenPremium.test.tsx — both stub this section out too.
 */
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import {translations} from '../src/i18n/translations';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

// Mutable route params — reassigned per-test (range test needs an explicit
// endVerse). Read at CALL time by the closure below, so reassigning before a
// render (not before the whole file loads) is enough.
let mockRouteParams: Record<string, string> = {
  book: 'John',
  chapter: '3',
  startVerse: '16',
  version: 'RVR1960',
};
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockRouterPush, back: jest.fn()}),
    useLocalSearchParams: () => mockRouteParams,
    // Tanda 4 — the screen now uses this for a narrow notes-only refresh on
    // refocus; a dependency-aware stand-in (mirrors prepSeriesListScreen's
    // own mock) is enough for these tests, which don't exercise refocus.
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});

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

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    show: jest.fn(),
  }),
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

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
    originalsInstalled: jest.fn(async () => false),
    getOriginalWords: jest.fn(async () => []),
  },
}));

jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));

// The service under test for this tanda — stubbed directly rather than
// exercising the real SQLite-backed implementation (that's VersionComparison's
// own unit-test territory).
const mockGetAvailableVersions = jest.fn();
const mockCompareVerseRange = jest.fn();
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: (...args: unknown[]) =>
      (mockGetAvailableVersions as (...a: unknown[]) => unknown)(...args),
    compareVerseRange: (...args: unknown[]) =>
      (mockCompareVerseRange as (...a: unknown[]) => unknown)(...args),
  },
}));

const p = translations.es.prepTable;
const tv = translations.es.versionComparison;

const RVR = {
  id: 'rvr1960',
  name: 'Reina-Valera 1960',
  abbreviation: 'RVR1960',
  language: 'es',
  description: '',
  year: 1960,
  isPremium: false,
};
const KJV = {
  id: 'kjv',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'en',
  description: '',
  year: 1611,
  isPremium: false,
};
const WEB = {
  id: 'web',
  name: 'World English Bible',
  abbreviation: 'WEB',
  language: 'en',
  description: '',
  year: 2000,
  isPremium: false,
};
const NVI = {
  id: 'nvi',
  name: 'Nueva Versión Internacional',
  abbreviation: 'NVI',
  language: 'es',
  description: '',
  year: 1999,
  isPremium: true,
};

interface FakeVersion {
  id: string;
  abbreviation: string;
}

/** Build a fake VerseComparison for one verse from a set of version ids. */
function comparisonFor(
  verse: number,
  versions: FakeVersion[],
  present: string[] = versions.map(v => v.id),
) {
  return {
    book: 'John',
    chapter: 3,
    verseNumber: verse,
    versions: versions
      .filter(v => present.includes(v.id))
      .map(v => ({
        versionId: v.id,
        versionName: v.abbreviation,
        versionAbbr: v.abbreviation,
        text: `${v.abbreviation} texto v${verse}`,
        wordCount: 3,
      })),
  };
}

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('Mesa de preparación — T8.4.3 "Comparar versiones"', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    mockRouterPush.mockClear();
    mockGetAvailableVersions.mockReset();
    mockCompareVerseRange.mockReset();
    mockRouteParams = {
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'RVR1960',
    };
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('free reader: shows a locked teaser with the Exclusivo pill, never queries installed versions', async () => {
    const {findByText, getAllByText} = renderScreen();
    expect(await findByText(p.versionCompareTitle)).toBeTruthy();
    expect(await findByText(p.versionCompareLockedBody)).toBeTruthy();
    expect(getAllByText(p.exclusiveLabel).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(mockGetAvailableVersions).not.toHaveBeenCalled(),
    );
  });

  it('free reader: tapping the locked teaser opens the offering sheet without calling the service', async () => {
    const {findByText} = renderScreen();
    fireEvent.press(await findByText(p.versionCompareLockedBody));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    expect(mockCompareVerseRange).not.toHaveBeenCalled();
  });

  it('premium reader with only ONE version installed: explains gracefully and invites to Settings', async () => {
    mockGetAvailableVersions.mockResolvedValue([RVR]);
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(p.versionCompareOnlyOneBody)).toBeTruthy();
    fireEvent.press(await findByText(p.versionCompareGoToSettings));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/settings');
    // Never asks the service for verse text with a single version.
    expect(mockCompareVerseRange).not.toHaveBeenCalled();
  });

  it('premium reader: the service failing to load versions surfaces a graceful error', async () => {
    mockGetAvailableVersions.mockRejectedValue(new Error('db down'));
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(p.versionCompareError)).toBeTruthy();
  });

  it('premium reader with several installed versions: defaults to the reading version + up to 2 more, side by side', async () => {
    mockGetAvailableVersions.mockResolvedValue([RVR, KJV, WEB, NVI]);
    mockCompareVerseRange.mockImplementation(
      async (
        _book: string,
        _chapter: number,
        start: number,
        end: number,
        ids: string[],
      ) => {
        const versions = [RVR, KJV, WEB, NVI].filter(v => ids.includes(v.id));
        const rows = [];
        for (let v = start; v <= end; v++)
          rows.push(comparisonFor(v, versions));
        return rows;
      },
    );
    await unlockPremium();
    const {findByText, queryByText} = renderScreen();

    // Default selection is the current reading version (RVR1960) + up to 2
    // more of the installed ones, in catalog order — KJV and WEB, NOT the
    // 4th (NVI), so the passage renders in exactly those 3.
    expect(await findByText('RVR1960 texto v16')).toBeTruthy();
    expect(await findByText('KJV texto v16')).toBeTruthy();
    expect(await findByText('WEB texto v16')).toBeTruthy();
    expect(queryByText('NVI texto v16')).toBeNull();
    expect(mockCompareVerseRange).toHaveBeenCalledWith('John', 3, 16, 16, [
      'rvr1960',
      'kjv',
      'web',
    ]);
  });

  it('premium reader: the selector is capped at 3 — tapping a 4th (unselected) version is a no-op', async () => {
    mockGetAvailableVersions.mockResolvedValue([RVR, KJV, WEB, NVI]);
    mockCompareVerseRange.mockImplementation(
      async (
        _book: string,
        _chapter: number,
        _start: number,
        _end: number,
        ids: string[],
      ) => {
        const versions = [RVR, KJV, WEB, NVI].filter(v => ids.includes(v.id));
        return [comparisonFor(16, versions)];
      },
    );
    await unlockPremium();
    const {findByText, findAllByText, queryByText} = renderScreen();
    await findByText('RVR1960 texto v16');
    const callsBefore = mockCompareVerseRange.mock.calls.length;

    // "NVI" only exists as a chip label at this point (it's not selected, so
    // no version card renders it yet) — the chip is the sole match.
    fireEvent.press((await findAllByText('NVI'))[0]);

    // No new comparison is requested and NVI's text never appears — the cap
    // held.
    expect(mockCompareVerseRange).toHaveBeenCalledTimes(callsBefore);
    expect(queryByText('NVI texto v16')).toBeNull();
  });

  it('premium reader: deselecting down to 2 is allowed, but not further (floor of 2)', async () => {
    mockGetAvailableVersions.mockResolvedValue([RVR, KJV, WEB]);
    mockCompareVerseRange.mockImplementation(
      async (
        _book: string,
        _chapter: number,
        _start: number,
        _end: number,
        ids: string[],
      ) => {
        const versions = [RVR, KJV, WEB].filter(v => ids.includes(v.id));
        return [comparisonFor(16, versions)];
      },
    );
    await unlockPremium();
    const {findByText, findAllByText, queryByText} = renderScreen();
    await findByText('RVR1960 texto v16');
    await findByText('KJV texto v16');
    await findByText('WEB texto v16');

    // "WEB" matches both its chip AND its version-card abbreviation while
    // selected — the chip is always the FIRST match (the selector renders
    // above the verse rows).
    fireEvent.press((await findAllByText('WEB'))[0]);
    await waitFor(() => expect(queryByText('WEB texto v16')).toBeNull());
    expect(await findByText('RVR1960 texto v16')).toBeTruthy();
    expect(await findByText('KJV texto v16')).toBeTruthy();

    const callsAtTwo = mockCompareVerseRange.mock.calls.length;

    // Try to deselect KJV too: 2 -> 1 is blocked (a "comparison" needs ≥2).
    fireEvent.press((await findAllByText('KJV'))[0]);
    expect(mockCompareVerseRange).toHaveBeenCalledTimes(callsAtTwo);
    expect(await findByText('KJV texto v16')).toBeTruthy();
  });

  it('premium reader: a version omitting this verse shows a graceful note instead of a blank', async () => {
    mockGetAvailableVersions.mockResolvedValue([RVR, KJV]);
    mockCompareVerseRange.mockResolvedValue([
      comparisonFor(16, [RVR, KJV], ['rvr1960']),
    ]);
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText('RVR1960 texto v16')).toBeTruthy();
    expect(
      await findByText(tv.verseOmitted.replace('{{version}}', 'KJV')),
    ).toBeTruthy();
  });

  it('premium reader: widening the passage range compares the WHOLE range, not just the first verse', async () => {
    mockRouteParams = {
      book: 'John',
      chapter: '3',
      startVerse: '16',
      endVerse: '18',
      version: 'RVR1960',
    };
    mockGetAvailableVersions.mockResolvedValue([RVR, KJV]);
    mockCompareVerseRange.mockImplementation(
      async (
        _book: string,
        _chapter: number,
        start: number,
        end: number,
        ids: string[],
      ) => {
        const versions = [RVR, KJV].filter(v => ids.includes(v.id));
        const rows = [];
        for (let v = start; v <= end; v++)
          rows.push(comparisonFor(v, versions));
        return rows;
      },
    );
    await unlockPremium();
    const {findByText} = renderScreen();

    expect(await findByText('RVR1960 texto v16')).toBeTruthy();
    expect(await findByText('RVR1960 texto v17')).toBeTruthy();
    expect(await findByText('RVR1960 texto v18')).toBeTruthy();
    expect(await findByText('KJV texto v18')).toBeTruthy();
    expect(mockCompareVerseRange).toHaveBeenCalledWith('John', 3, 16, 18, [
      'rvr1960',
      'kjv',
    ]);
  });
});
