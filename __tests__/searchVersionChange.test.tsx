/**
 * R9-430 — with a search on screen, changing the reading version (in the
 * reader; the Search tab keeps its state) searched nothing again: the list
 * stayed in the old version under the new chip, and «Cargar más» asked the
 * NEW version for page 2 with the old rows' count as the offset and appended
 * it. The screen now redoes the search on screen in the new version, and
 * drops any answer (a search or a page) that belongs to an earlier one.
 *
 * Harness from searchGoToReference.test.tsx: the real screen, the database
 * stubbed. Each version answers with its own book, so the list says which
 * version it came from: RVR1960 → «Juan 1:n», RV1909 → «Romanos 1:n»; a
 * page 2 → chapter 2.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import SearchScreen from '../app/(tabs)/search';
import type {BibleVerse} from '../src/types/bible';
import {translations} from '../src/i18n/translations';

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn()}),
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('@components/SkeletonLoader', () => ({VerseSkeleton: () => null}));
jest.mock('@components/IllustratedEmptyState', () => ({
  IllustratedEmptyState: () => null,
}));
jest.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => unknown) => fn,
}));
const mockColors = {
  background: '#000000',
  surface: '#111111',
  surfaceVariant: '#1a1a1a',
  border: '#222222',
  primary: '#6366f1',
  primaryLight: '#4338ca33',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  highlight: '#ffff0055',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false, gradient: undefined}),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
let mockSelectedVersion = {
  id: 'RVR1960',
  language: 'es',
  abbreviation: 'RVR1960',
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: mockSelectedVersion}),
}));
const mockTrackSearch = jest.fn(async () => []);
const mockServices = {
  achievementService: {trackSearch: mockTrackSearch},
  notifyAchievements: jest.fn(),
};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockSetItem = jest.fn(async () => undefined);
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: (...args: unknown[]) =>
    (mockSetItem as (...a: unknown[]) => unknown)(...args),
}));

const BOOK: Record<string, string> = {RVR1960: 'Juan', RV1909: 'Romanos'};
function rows(version: string, chapter: number, count: number): BibleVerse[] {
  return Array.from({length: count}, (_, i) => ({
    id: chapter * 1000 + i + 1,
    book: BOOK[version],
    bookNumber: version === 'RVR1960' ? 43 : 45,
    chapter,
    verse: i + 1,
    text: `amor ${version} ${chapter}:${i + 1}`,
    version,
  }));
}

// A gate per call; `null` answers at once. Page 1 is 200 rows (a full page,
// so «Cargar más» shows); page 2 is 30.
let mockGate: ((args: unknown[]) => Promise<void> | null) | null = null;
const mockSearchVerses = jest.fn(
  async (
    _query: string,
    version: string,
    _limit: number,
    offset?: number,
  ): Promise<BibleVerse[]> => {
    const gate = mockGate?.([_query, version, _limit, offset]);
    if (gate) await gate;
    return offset ? rows(version, 2, 30) : rows(version, 1, 200);
  },
);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    searchVerses: (...args: unknown[]) =>
      (mockSearchVerses as (...a: unknown[]) => unknown)(...args),
    searchByBook: jest.fn(async () => []),
  },
}));

const RVR = {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'};
const RV1909 = {id: 'RV1909', language: 'es', abbreviation: 'RV1909'};
const s = translations.es.search;

async function settle() {
  await act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });
}

async function searchAmor() {
  const screen = render(<SearchScreen />);
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText(s.placeholder), 'amor');
  });
  await screen.findByText('Juan 1:1');
  return screen;
}

async function changeVersion(
  screen: ReturnType<typeof render>,
  version: typeof RVR,
) {
  mockSelectedVersion = version;
  await act(async () => {
    screen.rerender(<SearchScreen />);
  });
}

beforeEach(() => {
  mockSelectedVersion = RVR;
  mockGate = null;
  mockSearchVerses.mockClear();
  mockTrackSearch.mockClear();
  mockSetItem.mockClear();
});

describe('Search — the list follows the reading version (R9-430)', () => {
  it('redoes the search on screen in the new version', async () => {
    const screen = await searchAmor();
    await changeVersion(screen, RV1909);

    await screen.findByText('Romanos 1:1');
    expect(screen.queryByText('Juan 1:1')).toBeNull();
    expect(mockSearchVerses).toHaveBeenLastCalledWith('amor', 'RV1909', 200);
  });

  it('«Cargar más» after the change pages the new version from ITS rows', async () => {
    const screen = await searchAmor();
    await changeVersion(screen, RV1909);
    await screen.findByText('Romanos 1:1');

    await act(async () => {
      fireEvent.press(screen.getByLabelText(s.loadMore));
    });
    await screen.findAllByText(`230 ${s.results}`);
    expect(mockSearchVerses).toHaveBeenLastCalledWith(
      'amor',
      'RV1909',
      200,
      200,
    );
    expect(screen.queryByText('Juan 1:1')).toBeNull();
  });

  it('the redone search counts as no new search (history, achievements)', async () => {
    const screen = await searchAmor();
    await waitFor(() => expect(mockTrackSearch).toHaveBeenCalledTimes(1));
    const historyWrites = mockSetItem.mock.calls.length;

    await changeVersion(screen, RV1909);
    await screen.findByText('Romanos 1:1');
    await settle();
    expect(mockTrackSearch).toHaveBeenCalledTimes(1);
    expect(mockSetItem.mock.calls.length).toBe(historyWrites);
  });

  it('control: no query on screen, nothing is searched', async () => {
    const screen = render(<SearchScreen />);
    await changeVersion(screen, RV1909);
    await settle();
    expect(mockSearchVerses).not.toHaveBeenCalled();
  });

  it('an old-version search landing after the new one is dropped', async () => {
    let releaseOld!: () => void;
    const oldHeld = new Promise<void>(r => {
      releaseOld = r;
    });
    mockGate = args => (args[1] === 'RVR1960' ? oldHeld : null);

    const screen = render(<SearchScreen />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText(s.placeholder), 'amor');
    });
    await changeVersion(screen, RV1909);
    await screen.findByText('Romanos 1:1');

    await act(async () => {
      releaseOld();
    });
    await settle();
    expect(screen.queryByText('Juan 1:1')).toBeNull();
    expect(screen.getByText('Romanos 1:1')).toBeTruthy();
  });

  it('an old-version «Cargar más» page landing after the change is dropped', async () => {
    const screen = await searchAmor();
    let releasePage!: () => void;
    const pageHeld = new Promise<void>(r => {
      releasePage = r;
    });
    mockGate = args => (args[1] === 'RVR1960' && args[3] ? pageHeld : null);

    await act(async () => {
      fireEvent.press(screen.getByLabelText(s.loadMore));
    });
    await changeVersion(screen, RV1909);
    await screen.findByText('Romanos 1:1');

    await act(async () => {
      releasePage();
    });
    await settle();
    // Pre-fix: RVR1960's page 2 appended to RV1909's page 1.
    expect(screen.getAllByText(`200+ ${s.results}`).length).toBeGreaterThan(0);
  });
});
