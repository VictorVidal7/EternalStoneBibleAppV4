/**
 * Regression — R9-424: a DOWNLOADED Bible version the user chose (KJV, RV1909…)
 * must survive a cold start.
 *
 * Bug: `BibleVersionProvider` restores the saved id with one AsyncStorage read,
 * which returns long before the DB says which versions it holds
 * (`refreshInstalledVersions`: DB init + two queries). The safety net ("the
 * selected version isn't installed → fall back to a bundled one") judged the
 * restored id against the bundled-only PLACEHOLDER list, so KJV became WEB (and
 * RV1909 became RVR1960) on every cold start; `hasExplicitChoice` was already
 * true, so nothing put it back when the DB finally answered.
 *
 * Fix: the safety net waits for the DB's first answer (`installedKnown`).
 *
 * The REAL provider; the DB and the UI language are mocked. `getDatabaseStats`
 * is held open so each test decides which read lands first.
 */
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Stats = {totalVerses: number; versions: string[]};
let mockResolveStats: ((v: Stats) => void) | null = null;
let mockRejectStats: ((e: Error) => void) | null = null;
jest.mock('../src/lib/database', () => {
  const db = {
    initialize: jest.fn(async () => {}),
    getDatabaseStats: jest.fn(
      () =>
        new Promise<Stats>((resolve, reject) => {
          mockResolveStats = resolve;
          mockRejectStats = reject;
        }),
    ),
  };
  return {__esModule: true, default: db, bibleDB: db};
});

let mockLanguage: 'en' | 'es' = 'en';
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({language: mockLanguage}),
}));

import {
  BibleVersionProvider,
  useBibleVersion,
} from '../src/hooks/useBibleVersion';

const KEY = '@bible_version';
const WITH_PACKS = ['RVR1960', 'WEB', 'KJV', 'RV1909'];
const BUNDLED_ONLY = ['RVR1960', 'WEB'];

// Every version the tree rendered with, in order.
const seen: string[] = [];
function Spy() {
  const {selectedVersion} = useBibleVersion();
  seen.push(selectedVersion.id);
  return null;
}
const last = () => seen[seen.length - 1];

async function settle(turns = 20) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function mount(): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <BibleVersionProvider>
        <Spy />
      </BibleVersionProvider>,
    );
  });
  await settle();
  return renderer as ReactTestRenderer;
}

async function dbAnswers(versions: string[]) {
  expect(mockResolveStats).not.toBeNull();
  await act(async () => {
    mockResolveStats?.({totalVerses: 93000, versions});
  });
  await settle();
}

describe('R9-424 — the chosen downloaded version survives a cold start', () => {
  beforeEach(async () => {
    seen.length = 0;
    mockResolveStats = null;
    mockRejectStats = null;
    mockLanguage = 'en';
    await AsyncStorage.clear();
  });

  it.each([
    ['en', 'KJV', 'WEB'],
    ['es', 'RV1909', 'RVR1960'],
  ] as const)(
    'saved id read BEFORE the DB answers (%s): %s is kept, never swapped for %s',
    async (language, chosen, bundledSibling) => {
      mockLanguage = language;
      await AsyncStorage.setItem(KEY, chosen);
      const renderer = await mount();

      // The saved id is back and the DB has not answered yet.
      expect(last()).toBe(chosen);

      await dbAnswers(WITH_PACKS);

      expect(last()).toBe(chosen);
      // Once restored, it never falls to the bundled version of its language.
      expect(seen.slice(seen.indexOf(chosen))).not.toContain(bundledSibling);
      expect(await AsyncStorage.getItem(KEY)).toBe(chosen);
      act(() => renderer.unmount());
    },
  );

  it('control — the DB answers BEFORE the saved id is read: KJV is kept', async () => {
    await AsyncStorage.setItem(KEY, 'KJV');
    const realGetItem = (
      AsyncStorage.getItem as jest.Mock
    ).getMockImplementation() as (k: string) => Promise<string | null>;
    let releaseGetItem: () => void = () => {};
    const held = new Promise<void>(resolve => {
      releaseGetItem = resolve;
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(
      async (k: string) => {
        if (k === KEY) await held;
        return realGetItem(k);
      },
    );
    try {
      const renderer = await mount();
      await dbAnswers(WITH_PACKS);
      expect(last()).toBe('WEB'); // no saved id yet: follows the UI language

      await act(async () => {
        releaseGetItem();
      });
      await settle();

      expect(last()).toBe('KJV');
      act(() => renderer.unmount());
    } finally {
      (AsyncStorage.getItem as jest.Mock).mockImplementation(realGetItem);
    }
  });

  it('the safety net still works: a saved version the DB does NOT hold falls back to a bundled one of its language, and the saved id is left alone', async () => {
    mockLanguage = 'es'; // UI in Spanish, saved version in English
    await AsyncStorage.setItem(KEY, 'KJV');
    const renderer = await mount();

    await dbAnswers(BUNDLED_ONLY);

    expect(last()).toBe('WEB');
    // Known cost, pinned on purpose: the fallback is not persisted.
    expect(await AsyncStorage.getItem(KEY)).toBe('KJV');
    act(() => renderer.unmount());
  });

  it('a DB that fails to answer does not leave a version without a known install selected: the net falls back', async () => {
    await AsyncStorage.setItem(KEY, 'KJV');
    const renderer = await mount();
    expect(last()).toBe('KJV');

    expect(mockRejectStats).not.toBeNull();
    await act(async () => {
      mockRejectStats?.(new Error('db closed'));
    });
    await settle();

    expect(last()).toBe('WEB');
    expect(await AsyncStorage.getItem(KEY)).toBe('KJV');
    act(() => renderer.unmount());
  });

  it('control — no saved version: it follows the UI language before and after the DB answers', async () => {
    const renderer = await mount();
    expect(last()).toBe('WEB');

    await dbAnswers(WITH_PACKS);

    expect(last()).toBe('WEB');
    expect(seen).not.toContain('KJV');
    act(() => renderer.unmount());
  });
});
