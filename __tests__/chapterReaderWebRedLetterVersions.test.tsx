/**
 * The web chapter reader must render red letters for EVERY version that has
 * red-letter data — not just WEB.
 *
 * Until 2026-09-15 this screen gated on `selectedVersion.id === 'WEB'` and
 * redLetterText.web.ts fetched a single pack, so "Palabras de Cristo" did
 * nothing at all for anyone reading in Spanish on the web, even though the
 * preferences sheet offered the switch and native had had RVR1960 spans since
 * 2026-08-18. Switching the UI language to Spanish switches the reading
 * version (useBibleVersion.tsx), so RVR1960 on web is a completely ordinary
 * path, not a corner case.
 *
 * This is the CONSEQUENCE test — what the reader actually paints. The
 * mechanism (which pack each version fetches, and that the two maps never
 * answer for each other) lives in redLetterTextWeb.test.ts, in its own file
 * on purpose: chained into one body, a revert would trip the first assertion
 * and the rest would prove nothing.
 *
 * The real redLetterText.web module is used here — only `fetch` is faked —
 * because a stubbed module is exactly what hid the original bug.
 */
import {render, waitFor} from '@testing-library/react-native';

// eslint-disable-next-line no-var
var mockVersion = {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'};
// Which version the verses currently in state came from, and one entry per
// span lookup pairing "offsets asked for" with "text on screen" (R9-69).
// eslint-disable-next-line no-var
var mockVersesFrom: string | null = null;
// eslint-disable-next-line no-var
var mockSpanPairs: Array<{offsetsFor: string; textFrom: string | null}> = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), replace: jest.fn()}),
  useLocalSearchParams: () => ({book: 'Juan', chapter: '3'}),
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));
jest.mock('@context/PremiumContext', () =>
  require('../src/context/PremiumContext.web'),
);
jest.mock('@context/OfferingSheetContext', () =>
  require('../src/context/OfferingSheetContext.web'),
);
// Metro resolves the BARE specifier to the .web file when bundling for web;
// jest's native preset resolves it to the native one. Redirect it so the
// preferences sheet this screen renders sees the same module the browser
// would (see R9-15 / webNativeModuleParity.test.ts).
jest.mock('@lib/reading/redLetterText', () =>
  require('@lib/reading/redLetterText.web'),
);
// R9-69: the real module, with getRedLetterSpans wrapped so the test can see
// WHICH version's offsets each render asked for, and which version's text was
// on screen when it asked. `act()` flushes effects before anything can be
// read back off the tree, so the rendered output cannot show the one-frame
// mispairing — the lookup itself is the observable.
jest.mock('@lib/reading/redLetterText.web', () => {
  const actual = jest.requireActual('@lib/reading/redLetterText.web');
  return {
    ...actual,
    getRedLetterSpans: (versionId: string, ...rest: unknown[]) => {
      mockSpanPairs.push({offsetsFor: versionId, textFrom: mockVersesFrom});
      return (
        actual as {getRedLetterSpans: (...a: unknown[]) => unknown}
      ).getRedLetterSpans(versionId, ...rest);
    },
  };
});

// RVR1960 John 3:16 — the span is the whole verse (Jesus speaking), and its
// end offset is 145 here vs 130 in WEB. Those numbers are not
// interchangeable: they are character offsets into different translations,
// which is why a per-version map is not a nicety.
const RVR_JOHN_316 =
  'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, ' +
  'para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.';
const RVR_SPAN_END = RVR_JOHN_316.length;

const WEB_JOHN_316 =
  'For God so loved the world, that he gave his only born Son, that whoever ' +
  'believes in him should not perish, but have eternal life.';

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getChapter: jest.fn(
      async (_book: number, _ch: number, versionId: string) => {
        mockVersesFrom = versionId;
        return [
          {
            book: 'Juan',
            chapter: 3,
            verse: 16,
            text:
              versionId === 'RVR1960'
                ? 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'
                : 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.',
          },
        ];
      },
    ),
  },
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceVariant: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      textTertiary: '#94a3b8',
      primary: '#1d4ed8',
      border: '#cbd5e1',
      glassBorder: '#e2e8f0',
      error: '#dc2626',
    },
    isDark: false,
    mode: 'light',
    setThemeMode: jest.fn(),
  }),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: mockVersion}),
  useBibleVersionOptional: () => ({selectedVersion: mockVersion}),
}));
jest.mock('@context/ReaderPreferencesContext', () => {
  const actual = jest.requireActual('../src/context/ReaderPreferencesContext');
  return {
    ...actual,
    useReaderPreferences: () => ({
      ...actual.DEFAULT_READER_PREFERENCES,
      preferences: {
        ...actual.DEFAULT_READER_PREFERENCES,
        redLetterWords: true,
      },
      hydrated: true,
      setFontFamily: jest.fn(),
      setFontSize: jest.fn(),
      setLineHeightMultiplier: jest.fn(),
      setTextAlign: jest.fn(),
      setMargin: jest.fn(),
      setTheme: jest.fn(),
      setAutoImmersiveOnListen: jest.fn(),
      setSwipeChapterNavigation: jest.fn(),
      setRedLetterWords: jest.fn(),
      reset: jest.fn(),
    }),
  };
});

import ChapterReaderWeb from '../app/(tabs)/verse/[book]/[chapter].web';
import {PremiumProvider} from '@context/PremiumContext';
import {OfferingSheetProvider} from '@context/OfferingSheetContext';
import {
  LEGACY_RED_LETTER_LIGHT,
  LEGACY_RED_LETTER_DARK,
} from '../src/styles/readerThemes';
import {loadRedLetterSpans} from '@lib/reading/redLetterText.web';

// The two providers the screen genuinely needs, resolved through the SAME
// mocked specifiers above — i.e. these ARE the real .web stubs Metro would
// substitute, not test doubles. ReaderPreferences needs no provider here
// because useReaderPreferences itself is mocked.
function renderScreen() {
  return render(
    <PremiumProvider>
      <OfferingSheetProvider>
        <ChapterReaderWeb />
      </OfferingSheetProvider>
    </PremiumProvider>,
  );
}

/** Flattens the rendered verse into [text, color] pairs, one per run. */
function verseRuns(node: {props: {children: unknown[]}}) {
  // children[0] is the verse-number <Text>; the rest are the red-letter runs
  // (or a bare string when the screen decided not to split at all).
  const rest = node.props.children.slice(1).flat();
  return rest.map((child: unknown) =>
    typeof child === 'string'
      ? [child, null]
      : [
          (child as {props: {children: string}}).props.children,
          (child as {props: {style: {color: string}}}).props.style.color,
        ],
  );
}

beforeEach(() => {
  // Deliberately NO jest.resetModules(): it would hand this file a second
  // copy of React and every render would die in useReducer. The module state
  // under test is keyed BY VERSION, and each test below uses a different
  // version id, so there is nothing to reset anyway.
  mockVersion = {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'};
  mockVersesFrom = null;
  mockSpanPairs = [];
  global.fetch = jest.fn();
});

describe('web reader — red letters by version', () => {
  it('paints the words of Jesus red in RVR1960, fetching the SPANISH pack', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, RVR_SPAN_END]]},
      ],
    });

    const {findByTestId} = renderScreen();
    const verse = await findByTestId('web-verse-text-16');

    await waitFor(() => {
      expect(verseRuns(verse as never)).toEqual([
        [RVR_JOHN_316, LEGACY_RED_LETTER_LIGHT],
      ]);
    });

    // The screen must ask for RVR1960's own pack. Fetching web-red-letter.json
    // here would still "pass" the color assertion above with this fixture,
    // which is precisely why this is asserted separately.
    const urls = (global.fetch as jest.Mock).mock.calls.map(
      c => c[0] as string,
    );
    expect(urls.some(u => u.includes('rvr1960-red-letter.json'))).toBe(true);
    expect(urls.some(u => u.includes('web-red-letter.json'))).toBe(false);
  });

  it('still paints them red in WEB, fetching the English pack', async () => {
    mockVersion = {id: 'WEB', language: 'en', abbreviation: 'WEB'};
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, WEB_JOHN_316.length]]},
      ],
    });

    const {findByTestId} = renderScreen();
    const verse = await findByTestId('web-verse-text-16');

    await waitFor(() => {
      expect(verseRuns(verse as never)).toEqual([
        [WEB_JOHN_316, LEGACY_RED_LETTER_LIGHT],
      ]);
    });

    const urls = (global.fetch as jest.Mock).mock.calls.map(
      c => c[0] as string,
    );
    expect(urls.some(u => u.includes('web-red-letter.json'))).toBe(true);
  });

  it('leaves the verse untouched on a version with no red-letter data, without fetching', async () => {
    // The control. Without it, an implementation that painted EVERYTHING red
    // would pass both tests above.
    mockVersion = {id: 'RV1909', language: 'es', abbreviation: 'RV1909'};

    const {findByTestId} = renderScreen();
    const verse = await findByTestId('web-verse-text-16');

    await waitFor(() => {
      const runs = verseRuns(verse as never);
      expect(runs.every(([, color]) => color !== LEGACY_RED_LETTER_LIGHT)).toBe(
        true,
      );
      expect(runs.every(([, color]) => color !== LEGACY_RED_LETTER_DARK)).toBe(
        true,
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

/**
 * R9-69 — switching the reading version must never pair one translation's
 * offsets with another's text, not even for one render.
 *
 * The screen resets its "loaded" flag inside a useEffect, and an effect runs
 * AFTER the render that caused it (and, in a browser, after that render has
 * painted). So the first render that sees the NEW version id still sees the
 * OLD `verses` and the OLD flag. Keying `getRedLetterSpans` by version only
 * saves that render while the new version's pack has not been fetched yet —
 * and once the user has switched languages once, it has.
 *
 * `act()` flushes effects before the tree can be read back, so the mispainted
 * frame itself is not observable here. The LOOKUP is: if a render ever asks
 * for version X's offsets while the verses in state came from version Y, the
 * mispairing happened.
 */
describe('web reader — switching version never mixes offsets with the wrong text', () => {
  it('asks for no spans at all until the version it loaded matches the version on screen', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes('rvr1960')
          ? [{book_id: 43, chapter: 3, verse: 16, spans: [[0, RVR_SPAN_END]]}]
          : [
              {
                book_id: 43,
                chapter: 3,
                verse: 16,
                spans: [[0, WEB_JOHN_316.length]],
              },
            ],
    }));

    // A reader who has already switched languages once has BOTH packs cached.
    // That is the state in which the version-keyed map stops protecting, so
    // it is the state this test has to start from.
    await loadRedLetterSpans('WEB');
    await loadRedLetterSpans('RVR1960');

    mockVersion = {id: 'WEB', language: 'en', abbreviation: 'WEB'};
    const {findByTestId, rerender} = renderScreen();
    await findByTestId('web-verse-text-16');
    await waitFor(() => expect(mockSpanPairs.length).toBeGreaterThan(0));

    mockSpanPairs = [];
    mockVersion = {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'};
    rerender(
      <PremiumProvider>
        <OfferingSheetProvider>
          <ChapterReaderWeb />
        </OfferingSheetProvider>
      </PremiumProvider>,
    );
    await findByTestId('web-verse-text-16');

    const mismatched = mockSpanPairs.filter(p => p.offsetsFor !== p.textFrom);
    expect(mismatched).toEqual([]);

    // Control: without this the assertion above would also pass if the
    // screen simply stopped looking up spans altogether after a switch.
    expect(
      mockSpanPairs.some(
        p => p.offsetsFor === 'RVR1960' && p.textFrom === 'RVR1960',
      ),
    ).toBe(true);
  });
});
