/**
 * BUG-6 (QA revision) — the Search tab only ran full-text search (FTS5),
 * which treats ":" as column-filter syntax: typing a reference like
 * "Juan 3:16" or "John 3:16" silently returned zero results with no way to
 * jump straight to the verse. This adds a synchronous, additive "go to
 * reference" row (built on the already-battle-tested parseReference()) that
 * appears the instant a typed query parses as a reference, independent of
 * the debounced FTS search — without removing or replacing the normal
 * text-search results below it.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import SearchScreen from '../app/(tabs)/search';
import type {BibleVerse} from '../src/types/bible';

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockRouterPush}),
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

// Both of these mount a react-native Animated loop with useNativeDriver on
// the loading/empty states this screen renders. That loop can't attach to a
// real native view under react-test-renderer ("Unable to locate attached
// view in the native tree") — a pre-existing environment limitation of these
// shared decorative components, unrelated to the go-to-reference feature
// under test here. Stubbed to null so the FTS loading/empty-state paths
// these tests exercise don't trip over it; the "no results" assertion below
// reads the resultsHeader label instead, which renders independently of
// this empty-state illustration.
jest.mock('@components/SkeletonLoader', () => ({VerseSkeleton: () => null}));
jest.mock('@components/IllustratedEmptyState', () => ({
  IllustratedEmptyState: () => null,
}));

// The 500ms debounce is orthogonal to what these tests cover (the go-to-
// reference row is explicitly synchronous/independent of it) — collapsing
// it to a direct call keeps the FTS-still-works assertions simple and
// avoids fake-timer bookkeeping.
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

// Mutable per test — reassigned before render() in the ES/EN cases below.
let mockLanguage: 'es' | 'en' = 'es';
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: require('../src/i18n/translations').translations[mockLanguage],
  }),
}));

// Mutable per test — the go-to-reference label picks the book name by
// selectedVersion.language, independently of the UI language above.
let mockSelectedVersion = {
  id: 'RVR1960',
  language: 'es',
  abbreviation: 'RVR1960',
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: mockSelectedVersion}),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

const mockSearchVerses = jest.fn(async (): Promise<BibleVerse[]> => []);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    searchVerses: (...args: unknown[]) =>
      (mockSearchVerses as (...a: unknown[]) => unknown)(...args),
    searchByBook: jest.fn(async () => []),
  },
}));

describe('Search — go-to-reference row (BUG-6)', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockSearchVerses.mockClear();
    mockSearchVerses.mockResolvedValue([]);
    mockLanguage = 'es';
    mockSelectedVersion = {
      id: 'RVR1960',
      language: 'es',
      abbreviation: 'RVR1960',
    };
  });

  it('renders "Ir a Juan 3:16" for a valid ES reference with an ES-language version', async () => {
    const {getByPlaceholderText, findByLabelText} = render(<SearchScreen />);
    fireEvent.changeText(
      getByPlaceholderText('Buscar en la Biblia...'),
      'Juan 3:16',
    );
    expect(await findByLabelText('Ir a Juan 3:16')).toBeTruthy();
  });

  it('renders "Go to John 3:16" for a valid EN reference with an EN-language version', async () => {
    mockLanguage = 'en';
    mockSelectedVersion = {id: 'KJV', language: 'en', abbreviation: 'KJV'};
    const {getByPlaceholderText, findByLabelText} = render(<SearchScreen />);
    fireEvent.changeText(
      getByPlaceholderText('Search the Bible...'),
      'John 3:16',
    );
    expect(await findByLabelText('Go to John 3:16')).toBeTruthy();
  });

  it('tapping the row navigates to /verse/Juan/3?verse=16 (canonical Spanish book name)', async () => {
    const {getByPlaceholderText, findByLabelText} = render(<SearchScreen />);
    fireEvent.changeText(
      getByPlaceholderText('Buscar en la Biblia...'),
      'Juan 3:16',
    );
    const row = await findByLabelText('Ir a Juan 3:16');
    fireEvent.press(row);
    expect(mockRouterPush).toHaveBeenCalledWith('/verse/Juan/3?verse=16');
  });

  it('a chapter-only reference ("Juan 3") navigates without a ?verse= param', async () => {
    const {getByPlaceholderText, findByLabelText} = render(<SearchScreen />);
    fireEvent.changeText(
      getByPlaceholderText('Buscar en la Biblia...'),
      'Juan 3',
    );
    const row = await findByLabelText('Ir a Juan 3');
    fireEvent.press(row);
    expect(mockRouterPush).toHaveBeenCalledWith('/verse/Juan/3');
  });

  it('a plain non-reference query does NOT render the row, and normal FTS results still render', async () => {
    const fakeResult: BibleVerse = {
      id: 1,
      book: 'Juan',
      bookNumber: 43,
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera amó Dios al mundo...',
      version: 'RVR1960',
    };
    mockSearchVerses.mockResolvedValue([fakeResult]);

    const {getByPlaceholderText, findByText, queryByLabelText} = render(
      <SearchScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText('Buscar en la Biblia...'),
      'amor',
    );

    // Normal FTS results still work as before.
    expect(await findByText('Juan 3:16')).toBeTruthy();
    expect(mockSearchVerses).toHaveBeenCalledWith('amor', 'RVR1960', 200);
    // No reference row for a non-reference query.
    expect(queryByLabelText(/^Ir a /)).toBeNull();
  });

  it('a plain non-reference EN query does NOT render the row either', async () => {
    mockLanguage = 'en';
    mockSelectedVersion = {id: 'KJV', language: 'en', abbreviation: 'KJV'};
    const {getByPlaceholderText, queryByLabelText, findAllByText} = render(
      <SearchScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('Search the Bible...'), 'faith');
    await waitFor(() => expect(mockSearchVerses).toHaveBeenCalled());
    expect(queryByLabelText(/^Go to /)).toBeNull();
    // Sanity: the search actually ran (no results configured here, so the
    // screen settles on the "no results" state rather than throwing) — both
    // the header subtitle and the results-count row show this label.
    expect((await findAllByText('No results found')).length).toBeGreaterThan(0);
  });
});
