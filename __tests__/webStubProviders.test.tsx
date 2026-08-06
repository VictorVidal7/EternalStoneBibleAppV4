/**
 * Web stub providers — regression coverage for the "blank web app" crash.
 *
 * `app/_layout.web.tsx` mounts a reduced provider tree (T21): originally no
 * PremiumProvider/OfferingSheetProvider/AudioPlayerProvider/MemoryDeckProvider
 * at all. But ~27+ route files under app/features/** (and a few under
 * app/(tabs)/**) call usePremium()/useOfferingSheet()/useAudioPlayer()/
 * useMemoryDeck()/useFavorites() unconditionally, with no `.web.tsx` sibling
 * and no `Platform.OS` guard. Each throwing context's hook raises "must be
 * used within a ...Provider" when its context is undefined — and since
 * `firebase.json`'s catch-all SPA rewrite makes every one of those routes
 * reachable via a direct URL/bookmark on the live deployed site, and
 * `ErrorBoundary` wraps the WHOLE Stack (not per-route) in `_layout.web.tsx`,
 * that throw took down the entire web app with no in-app recovery.
 *
 * The fix, in two tandas:
 *  1. `PremiumContext.web.tsx` / `OfferingSheetContext.web.tsx` /
 *     `AudioPlayerContext.web.tsx` — inert stub siblings (same precedent as
 *     data-loader.web.ts / redLetterText.web.ts) for three contexts with a
 *     genuine native-only dependency (RevenueCat, native audio modules).
 *  2. A follow-up audit found FIVE more routes (quiz/index.tsx, lectio.tsx,
 *     memory/insights.tsx, favorites.tsx, collections/[name].tsx) still
 *     crashing on `useMemoryDeck()`/`useFavorites()`/`useServices()`. Unlike
 *     tanda 1, these three contexts have NO native-only dependency, so each
 *     got investigated on its own merits (see app/_layout.web.tsx's header
 *     comment for the full reasoning): `MemoryDeckContext.web.tsx` is a
 *     STUB (mounting the real one would let a web visitor build an SRS deck
 *     that can never sync — a data-loss trap, not a crash risk); Favorites
 *     is mounted FOR REAL (no orphaned-data risk — no web-reachable screen
 *     ever calls `addFavorite`); Services is left UNMOUNTED entirely
 *     (`useServices()` cannot throw — its `createContext` default is a real
 *     object, not `undefined` — so there was never anything to fix there).
 *
 * Part A below exercises each context in isolation — the 4 true stub
 * modules (Premium/OfferingSheet/AudioPlayer/MemoryDeck, each imported via
 * its explicit `.web` path, the same way Metro would resolve it for a web
 * build — Jest has no platform-aware resolution for a BARE `@context/...`
 * specifier, so this file must name the `.web` file explicitly to reach
 * it), plus ServicesContext (proving `useServices()` structurally cannot
 * throw) and FavoritesContext (proving the REAL, unstubbed module is safe
 * to mount with zero ServicesProvider/SyncEngineProvider ancestors). For
 * each true stub it proves: (1) the stub Provider supplies safe, honest
 * "off/free/inert" values, (2) the hook still throws its ORIGINAL guard
 * error when rendered without any provider at all (the guard itself was not
 * weakened), and (3) every exposed function/control is callable without
 * throwing.
 *
 * Part B renders SIX real, previously-crashing route screens — the original
 * two (`dictionary/[slug].tsx`, `quiz/index.tsx`) plus the four found in the
 * follow-up audit (`lectio.tsx`, `memory/insights.tsx`, `favorites.tsx`,
 * `collections/[name].tsx`) — wrapped ONLY in the actual web provider tree
 * (stub Premium/OfferingSheet/AudioPlayer/MemoryDeck + real Favorites, per
 * screen as needed), reached via `jest.mock` redirects to the REAL `.web`
 * stub modules (not hand-rolled test doubles) for every context that has
 * one. `quiz/index.tsx`'s test in particular now proves ALL of
 * usePremium()/useOfferingSheet()/useMemoryDeck() are fixed, not just the
 * first two (a prior version of this test hand-mocked useMemoryDeck as a
 * convenience double, which meant a green result there did NOT prove the
 * real deployed web app was fixed — that gap is closed now that
 * MemoryDeckContext.web.tsx exists for real).
 *
 * NEITHER part exercises Metro's actual `.web.tsx` platform-resolution swap
 * (both reach the stub file via an explicit path or a `jest.mock` redirect,
 * which only SIMULATE what Metro does for a real web bundle). That swap was
 * separately confirmed against a real `npx expo export --platform web`
 * bundle: the stub modules' own distinguishing log strings ARE present, and
 * — more conclusively — every runtime-only string literal unique to the
 * NATIVE context files' actual logic (PremiumContext.tsx's `__DEV__`-only
 * override warning; AudioPlayerContext.tsx's "Speech started callback" /
 * "Loading new chapter for audio"; OfferingSheet.tsx's own component code)
 * is ABSENT from the bundle. One unrelated, pre-existing thing that IS in
 * the bundle: `offeringService.ts`'s RevenueCat key, reachable only via
 * `app/_layout.tsx` (the NATIVE root layout)'s own direct top-level
 * `offeringService` import — expo-router's route manifest appears to bundle
 * both `_layout.tsx` and `_layout.web.tsx` as dead code, and that native
 * file was never touched by this change. It is not `require()`d/executed at
 * runtime (the live web app has run on `_layout.web.tsx` since T21 without
 * mounting Auth/Firebase, which the native file would need), just present
 * as unreached bytes — a pre-existing bundle-hygiene nit, not a regression
 * from this fix, and not a crash risk.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';

// A SINGLE, file-wide `@lib/database` mock, shared by every describe block
// below that touches bibleDB (the FavoritesContext, dictionary/[slug],
// favorites, and collections/[name] tests) — real SQLite isn't available in
// jest, and `jest.mock('@lib/database', ...)` calls are hoisted above every
// import regardless of which describe block they're textually written in,
// so two different factories for the same specifier in one file would
// silently collide (only the textually-last one survives for the WHOLE
// file's test run, breaking whichever block's tests ran expecting the
// other's shape). Each test's own `beforeEach` resets/configures just the
// fns it cares about; fns no test configures simply resolve to their
// declared default.
const mockDbInitialize = jest.fn(async (..._args: unknown[]) => undefined);
const mockGetFavorites = jest.fn(
  async (..._args: unknown[]) => [] as unknown[],
);
const mockGetDictionaryEntry = jest.fn();
const mockGetDictionaryMultiviewSections = jest.fn(
  async (..._args: unknown[]) => [] as unknown[],
);
const mockGetAllDictionaryEntries = jest.fn(async () => [] as unknown[]);
const mockGetVerse = jest.fn(
  async (..._args: unknown[]): Promise<{text: string} | null> => null,
);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: (...args: unknown[]) => mockDbInitialize(...args),
    getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
    addFavorite: jest.fn(async () => undefined),
    removeFavorite: jest.fn(async () => undefined),
    updateFavorite: jest.fn(async () => undefined),
    getDictionaryEntry: (...args: unknown[]) => mockGetDictionaryEntry(...args),
    getDictionaryMultiviewSections: (...args: unknown[]) =>
      mockGetDictionaryMultiviewSections(...args),
    getAllDictionaryEntries: () => mockGetAllDictionaryEntries(),
    getVerse: (...args: unknown[]) => mockGetVerse(...args),
    getNoteForVerse: jest.fn(async () => null),
    addNote: jest.fn(async () => 'note-1'),
    updateNote: jest.fn(async () => undefined),
  },
}));

// ============================================================================
// Part A — each context in isolation (4 true stubs + ServicesContext +
// FavoritesContext, see the file header comment)
// ============================================================================

describe('PremiumContext.web (stub)', () => {
  const {
    PremiumProvider,
    usePremium,
    usePremiumOptional,
  } = require('../src/context/PremiumContext.web');

  function Probe() {
    const {isPremium, isLoading, setPremium} = usePremium();
    return (
      <>
        <>{`isPremium:${isPremium}`}</>
        <>{`isLoading:${isLoading}`}</>
        <>{`setPremiumType:${typeof setPremium}`}</>
      </>
    );
  }

  it('never throws when wrapped, and reports an honest free/loaded state', () => {
    expect(() =>
      render(
        <PremiumProvider>
          <Probe />
        </PremiumProvider>,
      ),
    ).not.toThrow();
  });

  it('usePremium() returns isPremium:false, isLoading:false, and a callable setPremium', () => {
    let captured: {
      isPremium: boolean;
      isLoading: boolean;
      setPremium: (v: boolean) => Promise<void>;
    } | null = null;
    function Capture() {
      captured = usePremium();
      return null;
    }
    render(
      <PremiumProvider>
        <Capture />
      </PremiumProvider>,
    );
    expect(captured).not.toBeNull();
    expect(captured!.isPremium).toBe(false);
    expect(captured!.isLoading).toBe(false);
    // Must not throw / must not crash the app when a screen calls it.
    return expect(captured!.setPremium(true)).resolves.toBeUndefined();
  });

  it('usePremiumOptional() returns undefined (not a throw) outside any provider', () => {
    let captured: unknown = 'not-called';
    function Capture() {
      captured = usePremiumOptional();
      return null;
    }
    expect(() => render(<Capture />)).not.toThrow();
    expect(captured).toBeUndefined();
  });

  it('usePremium() still throws its original guard error without a provider (guard not weakened)', () => {
    // Swallow the expected React error-boundary console.error noise for this
    // one assertion.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'usePremium must be used within a PremiumProvider',
    );
    spy.mockRestore();
  });
});

describe('OfferingSheetContext.web (stub)', () => {
  const {
    OfferingSheetProvider,
    useOfferingSheet,
  } = require('../src/context/OfferingSheetContext.web');

  it('never throws when wrapped, and open() is callable without throwing', () => {
    let captured: {open: () => void} | null = null;
    function Capture() {
      captured = useOfferingSheet();
      return null;
    }
    expect(() =>
      render(
        <OfferingSheetProvider>
          <Capture />
        </OfferingSheetProvider>,
      ),
    ).not.toThrow();
    expect(captured).not.toBeNull();
    expect(typeof captured!.open).toBe('function');
    expect(() => captured!.open()).not.toThrow();
  });

  it('still throws its original guard error without a provider (guard not weakened)', () => {
    function Probe() {
      useOfferingSheet();
      return null;
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useOfferingSheet must be used within an OfferingSheetProvider',
    );
    spy.mockRestore();
  });
});

describe('AudioPlayerContext.web (stub)', () => {
  const {
    AudioPlayerProvider,
    useAudioPlayer,
  } = require('../src/features/audio/context/AudioPlayerContext.web');

  it('never throws when wrapped, and reports fully inert playback state', () => {
    let ctx: ReturnType<typeof useAudioPlayer> | null = null;
    function Capture() {
      ctx = useAudioPlayer();
      return null;
    }
    expect(() =>
      render(
        <AudioPlayerProvider>
          <Capture />
        </AudioPlayerProvider>,
      ),
    ).not.toThrow();

    expect(ctx).not.toBeNull();
    const value = ctx!;
    expect(value.state.isPlaying).toBe(false);
    expect(value.state.isPaused).toBe(false);
    expect(value.state.isLoading).toBe(false);
    expect(value.state.totalVerses).toBe(0);
    expect(value.sleepTimer.isActive).toBe(false);
    expect(value.currentVerse).toBeNull();
    expect(value.verses).toEqual([]);
    expect(value.isVisible).toBe(false);
    expect(value.isSuppressed).toBe(false);
    expect(value.queueInfo).toEqual({mode: 'chapter', label: null});
    expect(value.queueOptions).toEqual({shuffle: false, repeat: false});
  });

  it('every exposed control is a no-op callable without throwing', () => {
    let ctx: ReturnType<typeof useAudioPlayer> | null = null;
    function Capture() {
      ctx = useAudioPlayer();
      return null;
    }
    render(
      <AudioPlayerProvider>
        <Capture />
      </AudioPlayerProvider>,
    );
    const value = ctx!;
    expect(() => value.play()).not.toThrow();
    expect(() => value.pause()).not.toThrow();
    expect(() => value.stop()).not.toThrow();
    expect(() => value.togglePlayPause()).not.toThrow();
    expect(() => value.nextVerse()).not.toThrow();
    expect(() => value.previousVerse()).not.toThrow();
    expect(() => value.goToVerse(0)).not.toThrow();
    expect(() => value.setPlaybackSpeed(1)).not.toThrow();
    expect(() =>
      value.setVoice({
        identifier: 'x',
        name: 'x',
        language: 'es',
        quality: 'Default',
      }),
    ).not.toThrow();
    expect(() => value.setLanguage('es')).not.toThrow();
    expect(() => value.setAutoAdvanceChapter(true)).not.toThrow();
    expect(() => value.setReaderFollowsAudio(true)).not.toThrow();
    expect(() => value.setRepeatVerse(true)).not.toThrow();
    expect(() => value.expand()).not.toThrow();
    expect(() => value.collapse()).not.toThrow();
    expect(() => value.toggleExpanded()).not.toThrow();
    expect(() => value.showPlayer()).not.toThrow();
    expect(() => value.hidePlayer()).not.toThrow();
    expect(() => value.setSuppressed(true)).not.toThrow();
    expect(() => value.setSleepTimer(10)).not.toThrow();
    expect(() => value.setSleepTimerEndOfChapter()).not.toThrow();
    expect(() => value.setSleepTimerEndOfBook()).not.toThrow();
    expect(() => value.cancelSleepTimer()).not.toThrow();
    expect(() => value.loadChapter([])).not.toThrow();
    expect(() => value.clearChapter()).not.toThrow();
    expect(() => value.setBottomOffset(0)).not.toThrow();
    expect(() => value.setQueueShuffle(true)).not.toThrow();
    expect(() => value.setQueueRepeat(true)).not.toThrow();
    const unsubscribe = value.subscribeToBoundary(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('still throws its original guard error without a provider (guard not weakened)', () => {
    function Probe() {
      useAudioPlayer();
      return null;
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useAudioPlayer must be used within an AudioPlayerProvider',
    );
    spy.mockRestore();
  });
});

describe('MemoryDeckContext.web (stub)', () => {
  const {
    MemoryDeckProvider,
    useMemoryDeck,
  } = require('../src/context/MemoryDeckContext.web');

  it('never throws when wrapped, and reports a permanently empty deck', () => {
    let ctx: ReturnType<typeof useMemoryDeck> | null = null;
    function Capture() {
      ctx = useMemoryDeck();
      return null;
    }
    expect(() =>
      render(
        <MemoryDeckProvider>
          <Capture />
        </MemoryDeckProvider>,
      ),
    ).not.toThrow();
    expect(ctx).not.toBeNull();
    const value = ctx!;
    expect(value.cards).toEqual([]);
    expect(value.dueCards).toEqual([]);
    expect(value.hydrated).toBe(true);
    expect(value.stats).toEqual({total: 0, due: 0, mastered: 0});
    expect(value.hasCard('Juan_3_16')).toBe(false);
  });

  it('every exposed control is a no-op callable without throwing', () => {
    let ctx: ReturnType<typeof useMemoryDeck> | null = null;
    function Capture() {
      ctx = useMemoryDeck();
      return null;
    }
    render(
      <MemoryDeckProvider>
        <Capture />
      </MemoryDeckProvider>,
    );
    const value = ctx!;
    expect(() =>
      value.addCard({
        bookName: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo...',
        version: 'RVR1960',
      }),
    ).not.toThrow();
    expect(() => value.removeCard('Juan_3_16')).not.toThrow();
    expect(() => value.reviewCard('Juan_3_16', 'good')).not.toThrow();
    expect(() => value.resetDeck()).not.toThrow();
    // No-ops actually no-op — the deck never grows.
    expect(value.cards).toEqual([]);
  });

  it('still throws its original guard error without a provider (guard not weakened)', () => {
    function Probe() {
      useMemoryDeck();
      return null;
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useMemoryDeck must be used within a MemoryDeckProvider',
    );
    spy.mockRestore();
  });
});

describe('ServicesContext (intentionally left unmounted on web)', () => {
  // app/_layout.web.tsx does NOT mount ServicesProvider (see its header
  // comment). That is safe only because useServices() is structurally
  // incapable of throwing: unlike every other context hook in this file,
  // ServicesContext's createContext() default is a real object (database:
  // null, achievementService: null, ...), not `undefined` — so
  // `useContext` always returns a truthy value and the `if (!context)
  // throw` guard can never fire, provider or no provider. This test proves
  // that directly against the real (non-.web, non-mocked) module, so a
  // future refactor that changes the default to `undefined` fails loudly
  // here instead of silently reintroducing a web crash.
  const {useServices} = require('../src/context/ServicesContext');

  it('useServices() never throws, even with zero ServicesProvider ancestors', () => {
    let captured: ReturnType<typeof useServices> | null = null;
    function Probe() {
      captured = useServices();
      return null;
    }
    expect(() => render(<Probe />)).not.toThrow();
    expect(captured).not.toBeNull();
    expect(captured!.database).toBeNull();
    expect(captured!.achievementService).toBeNull();
    expect(captured!.highlightService).toBeNull();
    expect(captured!.initialized).toBe(false);
    // notifyAchievements/clearNewAchievements must be safely callable too —
    // lectio.tsx calls `achievementService?.trackNote().then(notifyAchievements)`
    // guarded by the null achievementService, but notifyAchievements itself
    // is still reachable from the default value.
    expect(() => captured!.notifyAchievements([])).not.toThrow();
    expect(() => captured!.clearNewAchievements()).not.toThrow();
  });
});

describe('FavoritesContext (mounted for REAL on web — not stubbed)', () => {
  // Unlike MemoryDeck, FavoritesContext has no orphaned-data risk on web: no
  // web-reachable screen calls `addFavorite` (see app/_layout.web.tsx's
  // header comment), so mounting the genuine provider just reads/displays an
  // always-empty local table. This proves the real (non-.web) module itself
  // — the one Metro actually bundles for web, since there is no
  // FavoritesContext.web.tsx — never throws when mounted with no
  // ServicesProvider/SyncEngineProvider ancestor (exactly app/_layout.web.tsx's
  // tree) and bibleDB backed by a minimal mock instead of real SQLite.
  // `@lib/database` is mocked ONCE, file-wide, via the module-scope
  // `mockGetFavorites`/`mockDbInitialize`/... fns + `jest.mock('@lib/database', ...)`
  // call declared at the top of this file — jest.mock calls are hoisted
  // above every import regardless of which describe block they're written
  // in, so two different factories for the same specifier in one file would
  // silently collide (only the textually-last one survives for the WHOLE
  // file's test run). This block just configures that one shared mock's
  // fns for its own tests.
  const {
    FavoritesProvider,
    useFavorites,
  } = require('../src/context/FavoritesContext');

  beforeEach(() => {
    mockGetFavorites.mockReset().mockResolvedValue([]);
    mockDbInitialize.mockReset().mockResolvedValue(undefined);
  });

  it('never throws when wrapped with no ServicesProvider/SyncEngineProvider ancestor, and reports an empty list', async () => {
    let ctx: ReturnType<typeof useFavorites> | null = null;
    function Capture() {
      ctx = useFavorites();
      return null;
    }
    expect(() =>
      render(
        <FavoritesProvider>
          <Capture />
        </FavoritesProvider>,
      ),
    ).not.toThrow();
    await waitFor(() => expect(ctx!.loading).toBe(false));
    expect(ctx!.favorites).toEqual([]);
    expect(ctx!.isFavorite('Juan', 3, 16)).toBe(false);
  });

  it('still throws its original guard error without a provider (guard not weakened)', () => {
    function Probe() {
      useFavorites();
      return null;
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useFavorites must be used within a FavoritesProvider',
    );
    spy.mockRestore();
  });
});

// ============================================================================
// Part B — real previously-crashing routes, rendered with ONLY the web stub
// Premium/OfferingSheet providers mounted (no native providers at all).
// ============================================================================

describe('Previously-crashing web routes, with only the stub providers mounted', () => {
  // Redirects `@context/PremiumContext` / `@context/OfferingSheetContext` /
  // `@context/MemoryDeckContext` / the AudioPlayerContext module — exactly
  // what every route file under test imports — to the REAL `.web` stub
  // modules, the same substitution Metro performs automatically when
  // bundling for the web platform. Registered ONCE here (not per inner
  // describe): jest.mock calls are hoisted to module scope regardless of
  // nesting, so repeating an IDENTICAL factory per describe is redundant,
  // and this mock is harmless for the routes below that never call
  // useMemoryDeck()/useAudioPlayer() at all (dictionary/[slug]).
  jest.mock('@context/PremiumContext', () =>
    require('../src/context/PremiumContext.web'),
  );
  jest.mock('@context/OfferingSheetContext', () =>
    require('../src/context/OfferingSheetContext.web'),
  );
  jest.mock('@context/MemoryDeckContext', () =>
    require('../src/context/MemoryDeckContext.web'),
  );
  // Route files import `useAudioPlayer` either directly from this module
  // path or (favorites.tsx/lectio.tsx/collections/[name].tsx) via the
  // `@/features/audio` barrel's `export {useAudioPlayer} from
  // './context/AudioPlayerContext'` — both resolve to this SAME file, so
  // mocking it here covers both import styles; the barrel's many OTHER
  // real (unmocked) exports, e.g. `buildVersePlaylist`, are untouched.
  jest.mock('@/features/audio/context/AudioPlayerContext', () =>
    require('../src/features/audio/context/AudioPlayerContext.web'),
  );

  // Resolved through the SAME mocked specifiers the route files themselves
  // import — i.e. these ARE the real .web stub Providers, not test doubles.
  // This mirrors the tree app/_layout.web.tsx now mounts (BibleVersion >
  // Favorites > ReaderPreferences > MemoryDeck > Toast > Premium >
  // OfferingSheet > AudioPlayer); reproduced narrowly here since a full
  // _layout.web.tsx render would need to also mock Bible-data
  // initialization, fonts, etc. unrelated to what this test is proving.
  // FavoritesProvider is NOT included by default (see
  // renderWithWebProvidersAndFavorites below) — most routes under test don't
  // call useFavorites(), and mounting it needlessly would hide a missing
  // `@lib/database` mock in some future unrelated route's test.
  function renderWithWebProviders(ui: React.ReactElement) {
    const {PremiumProvider} =
      require('@context/PremiumContext') as typeof import('../src/context/PremiumContext.web');
    const {OfferingSheetProvider} =
      require('@context/OfferingSheetContext') as typeof import('../src/context/OfferingSheetContext.web');
    const {MemoryDeckProvider} =
      require('@context/MemoryDeckContext') as typeof import('../src/context/MemoryDeckContext.web');
    const {AudioPlayerProvider} =
      require('@/features/audio/context/AudioPlayerContext') as typeof import('../src/features/audio/context/AudioPlayerContext.web');
    return render(
      <PremiumProvider>
        <OfferingSheetProvider>
          <MemoryDeckProvider>
            <AudioPlayerProvider>{ui}</AudioPlayerProvider>
          </MemoryDeckProvider>
        </OfferingSheetProvider>
      </PremiumProvider>,
    );
  }

  // Same as renderWithWebProviders, plus the REAL FavoritesProvider (mounted
  // for real on web — see app/_layout.web.tsx's header comment and the
  // "FavoritesContext (mounted for REAL on web)" Part A block above) — for
  // the two screens (favorites.tsx, collections/[name].tsx) that call
  // useFavorites(). `@context/FavoritesContext` is NOT jest.mock'd anywhere
  // in this file, so this reaches the real, unmodified module — exactly what
  // Metro bundles for web (there is no FavoritesContext.web.tsx).
  function renderWithWebProvidersAndFavorites(ui: React.ReactElement) {
    const {PremiumProvider} =
      require('@context/PremiumContext') as typeof import('../src/context/PremiumContext.web');
    const {OfferingSheetProvider} =
      require('@context/OfferingSheetContext') as typeof import('../src/context/OfferingSheetContext.web');
    const {MemoryDeckProvider} =
      require('@context/MemoryDeckContext') as typeof import('../src/context/MemoryDeckContext.web');
    const {AudioPlayerProvider} =
      require('@/features/audio/context/AudioPlayerContext') as typeof import('../src/features/audio/context/AudioPlayerContext.web');
    const {FavoritesProvider} =
      require('@context/FavoritesContext') as typeof import('../src/context/FavoritesContext');
    return render(
      <PremiumProvider>
        <OfferingSheetProvider>
          <FavoritesProvider>
            <MemoryDeckProvider>
              <AudioPlayerProvider>{ui}</AudioPlayerProvider>
            </MemoryDeckProvider>
          </FavoritesProvider>
        </OfferingSheetProvider>
      </PremiumProvider>,
    );
  }

  // A single shared `expo-router` mock for the whole file: `jest.mock` calls
  // are hoisted to the top of the module (not scoped per-`describe`), so two
  // separate `jest.mock('expo-router', ...)` factories in the same file
  // would collide — only the last one survives for BOTH screens. Combining
  // every export either screen needs into one factory avoids that trap.
  // `mockSearchParams` is intentionally a loose bag (every field every
  // screen under test might read via useLocalSearchParams) rather than one
  // shape per screen, reassigned wholesale in each describe block's own
  // `beforeEach`.
  let mockSlug = 'expiacion';
  let mockSearchParams: Record<string, string | undefined> = {
    slug: mockSlug,
  };
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  jest.mock('expo-router', () => ({
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => mockSearchParams,
    useFocusEffect: (cb: () => void | (() => void)) => {
      const ReactLib = require('react');
      ReactLib.useEffect(() => cb(), []);
    },
    Stack: {Screen: () => null},
  }));

  jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
  jest.mock('expo-linear-gradient', () => {
    const {View} = require('react-native');
    return {LinearGradient: View};
  });
  jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  }));
  jest.mock('@lib/haptics', () => ({
    haptics: {
      tap: jest.fn(),
      selection: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
    },
  }));

  const mockColors = {
    background: '#000000',
    surface: '#111111',
    border: '#222222',
    primary: '#6366f1',
    primaryDark: '#4338ca',
    onPrimary: '#ffffff',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    error: '#ef4444',
  };
  jest.mock('@hooks/useTheme', () => ({
    useTheme: () => ({
      colors: mockColors,
      gradient: {headerColors: ['#000000', '#000000']},
      highContrast: false,
      isDark: false,
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

  describe('app/features/dictionary/[slug].tsx', () => {
    let mockReaderPrefs = {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeightMultiplier: 1.6,
      textAlign: 'left' as 'left' | 'justify',
      margin: 'medium',
      theme: 'system',
    };
    jest.mock('@context/ReaderPreferencesContext', () => ({
      useReaderPreferences: () => ({preferences: mockReaderPrefs}),
      READER_MARGIN_PADDING: {small: 12, medium: 24, large: 40},
    }));
    jest.mock('@components/reading/ReaderPreferencesSheet', () => {
      const {Text} = require('react-native');
      const ReactLib = require('react');
      return {
        ReaderPreferencesSheet: ({visible}: {visible: boolean}) =>
          visible
            ? ReactLib.createElement(Text, null, 'reader-prefs-sheet-open')
            : null,
        resolveFontFamily: (family: string) => `${family}-regular`,
        resolveFontFamilyBold: (family: string) => `${family}-bold`,
      };
    });

    const ANNOTATED_ENTRY = {
      slug: 'expiacion',
      headword_es: 'EXPIACIÓN',
      gloss_es: 'La expiación es la obra de Cristo.',
      article_es: 'Artículo completo sobre expiación.',
      source_tier: 'v2-doctrinal',
      treatment: 'annotated',
      updated_at: '2026-07-21',
    };

    beforeEach(() => {
      mockSlug = 'expiacion';
      mockSearchParams = {slug: mockSlug};
      mockGetDictionaryEntry.mockReset().mockResolvedValue(ANNOTATED_ENTRY);
      mockGetDictionaryMultiviewSections.mockReset().mockResolvedValue([]);
      mockGetAllDictionaryEntries.mockReset().mockResolvedValue([]);
      mockReaderPrefs = {
        fontFamily: 'sans',
        fontSize: 16,
        lineHeightMultiplier: 1.6,
        textAlign: 'left',
        margin: 'medium',
        theme: 'system',
      };
    });

    it('renders without throwing, and the free gloss is visible (confirmed crash site: usePremium()/useOfferingSheet() called unconditionally at the top of the component)', async () => {
      const DictionaryDetailScreen =
        require('../app/features/dictionary/[slug]').default;
      const {findByText} = renderWithWebProviders(<DictionaryDetailScreen />);
      expect(
        await findByText('La expiación es la obra de Cristo.'),
      ).toBeTruthy();
    });

    it('the locked premium row opens the offering sheet via the stub (does not throw)', async () => {
      const DictionaryDetailScreen =
        require('../app/features/dictionary/[slug]').default;
      const {findByText} = renderWithWebProviders(<DictionaryDetailScreen />);
      const es = require('../src/i18n/translations').translations.es;
      const lockedRow = await findByText(es.dictionary.articleLocked);
      expect(() => fireEvent.press(lockedRow)).not.toThrow();
    });
  });

  describe('app/features/quiz/index.tsx', () => {
    jest.mock('@hooks/useContentBottomInset', () => ({
      useContentBottomInset: () => 0,
    }));
    jest.mock('@context/ToastContext', () => ({
      useToast: () => ({success: jest.fn(), error: jest.fn()}),
    }));
    // `@context/MemoryDeckContext` is redirected to the REAL
    // MemoryDeckContext.web stub at the outer describe's scope above (and
    // `renderWithWebProviders` wraps its Provider) — the same substitution
    // Metro performs for any web bundle, since there IS a
    // MemoryDeckContext.web.tsx sibling now. Previously this screen's
    // useMemoryDeck() was a hand-rolled test double standing in for a
    // context that had no web variant at all (it genuinely threw on the
    // deployed web app); that gap is now closed for real.
    jest.mock('@/hooks/useQuizStats', () => ({
      useQuizStats: () => ({
        loaded: true,
        stats: {},
        summary: {},
        recordRoundResult: jest.fn(),
      }),
    }));
    jest.mock('@lib/a11y/focusTrap', () => ({focusTrapProps: () => ({})}));
    // A minimal stand-in (same idiom as quizExitConfirm.test.tsx): this test
    // is about the screen not throwing at mount, not about QuizPanel's own
    // rendering.
    jest.mock('@/components/quiz/QuizPanel', () => {
      const RN = require('react-native');
      const R = require('react');
      return {
        QuizPanel: () => R.createElement(RN.Text, null, 'quiz-panel-rendered'),
      };
    });

    it('renders without throwing (confirmed crash sites: usePremium()/useOfferingSheet()/useMemoryDeck() all called unconditionally at the top of the component — this now proves ALL THREE are fixed, not just the first two)', () => {
      const QuizScreen = require('../app/features/quiz/index').default;
      const {getByText} = renderWithWebProviders(<QuizScreen />);
      expect(getByText('quiz-panel-rendered')).toBeTruthy();
    });
  });

  describe('app/features/lectio.tsx', () => {
    jest.mock('@context/ToastContext', () => ({
      useToast: () => ({success: jest.fn(), error: jest.fn()}),
    }));
    // `@context/MemoryDeckContext` and the AudioPlayerContext module (which
    // this screen reaches via the `@/features/audio` barrel's re-export —
    // both specifiers resolve to the same file, see the outer describe's
    // comment) are already redirected to their real `.web` stubs at the
    // outer scope above, and `renderWithWebProviders` wraps both Providers.
    // `@context/ServicesContext` is deliberately NOT mocked here — the whole
    // point is proving the REAL module's useServices() default (see the
    // "ServicesContext (intentionally left unmounted on web)" Part A block)
    // is what actually keeps this screen from crashing, with no
    // ServicesProvider anywhere in the tree (matching app/_layout.web.tsx).
    jest.mock('@/features/study/devotionLogStore', () => ({
      recordTodayDevotion: jest.fn(async () => undefined),
    }));
    jest.mock('@components/reading/ImageShareModal', () => ({
      ImageShareModal: () => null,
    }));

    beforeEach(() => {
      mockSearchParams = {book: 'Juan', chapter: '3', verse: '16'};
      mockGetVerse.mockReset().mockResolvedValue({
        text: 'Porque de tal manera amó Dios al mundo...',
      });
      mockDbInitialize.mockReset().mockResolvedValue(undefined);
    });

    // A cold Babel/TS transform cache (first run after install, or CI) can
    // push this particular test — the heaviest of the six route renders,
    // with a real async bibleDB round-trip plus i18n/theme/date-format
    // module loads — well past Jest's default 5000ms timeout; every other
    // test in this file stays well under it. Bumped 15s -> 30s after a real
    // GitHub Actions failure ("Exceeded timeout of 15000 ms") under
    // `--coverage --maxWorkers=2`, which this local dev machine doesn't pay.
    it('renders without throwing and reaches the ready state (confirmed crash sites: useServices()/useMemoryDeck() called unconditionally at the top of the component)', async () => {
      const LectioScreen = require('../app/features/lectio').default;
      const {findByText} = renderWithWebProviders(<LectioScreen />);
      expect(
        await findByText('Porque de tal manera amó Dios al mundo...'),
      ).toBeTruthy();
    }, 30000);
  });

  describe('app/features/memory/insights.tsx', () => {
    // The empty-deck render path (isEmpty = cards.length === 0, which the
    // MemoryDeckContext.web stub guarantees) never reaches the SVG/chart
    // components (SVGCircularProgress, MiniBarChart, ContributionHeatmap),
    // so those need no special mocking here. `useMemoryGoal`'s only
    // non-AsyncStorage dependency is the review-event SQLite log — mocked
    // directly (bypassing bibleDB.getDatabase()) rather than pulled through
    // the shared bibleDB mock, which doesn't model that access pattern.
    jest.mock('@lib/memory/reviewEventStore', () => ({
      getAllReviewEvents: jest.fn(async () => []),
      addReviewEvent: jest.fn(async () => undefined),
      getReviewEventById: jest.fn(async () => null),
      removeReviewEvent: jest.fn(async () => undefined),
    }));

    beforeEach(() => {
      mockSearchParams = {};
    });

    it('renders without throwing and shows the empty-deck state (confirmed crash site: useMemoryDeck() called unconditionally at the top of the component)', async () => {
      const MemoryInsightsScreen =
        require('../app/features/memory/insights').default;
      const {findByText} = renderWithWebProviders(<MemoryInsightsScreen />);
      const es = require('../src/i18n/translations').translations.es;
      expect(await findByText(es.memory.insights.emptyTitle)).toBeTruthy();
    });
  });

  describe('app/(tabs)/favorites.tsx', () => {
    // Mocked away because they're unrelated to the crash under test (same
    // idiom as QuizPanel above) — AddToCollectionSheet pulls in
    // @gorhom/bottom-sheet, which needs its own dedicated test setup.
    jest.mock('@components/IllustratedEmptyState', () => ({
      IllustratedEmptyState: () => null,
    }));
    jest.mock('@components/ui/ConfirmDialog', () => ({
      ConfirmDialog: () => null,
    }));
    jest.mock('@/features/collections/AddToCollectionSheet', () => ({
      AddToCollectionSheet: () => null,
    }));
    jest.mock('@context/ToastContext', () => ({
      useToast: () => ({success: jest.fn(), error: jest.fn()}),
    }));

    beforeEach(() => {
      mockSearchParams = {};
      mockGetFavorites.mockReset().mockResolvedValue([]);
      mockDbInitialize.mockReset().mockResolvedValue(undefined);
    });

    it('renders without throwing and shows the (empty) favorites header (confirmed crash sites: useFavorites()/useMemoryDeck() called unconditionally at the top of the component)', async () => {
      const FavoritesScreen = require('../app/(tabs)/favorites').default;
      const es = require('../src/i18n/translations').translations.es;
      const {findByText} = renderWithWebProvidersAndFavorites(
        <FavoritesScreen />,
      );
      expect(await findByText(es.tabs.favorites)).toBeTruthy();
    });
  });

  describe('app/features/collections/[name].tsx', () => {
    jest.mock('@/features/collections/CollectionImageModal', () => ({
      CollectionImageModal: () => null,
    }));
    jest.mock('@context/ToastContext', () => ({
      useToast: () => ({success: jest.fn(), error: jest.fn()}),
    }));

    beforeEach(() => {
      mockSearchParams = {name: 'coleccion-de-prueba'};
      mockGetFavorites.mockReset().mockResolvedValue([]);
      mockDbInitialize.mockReset().mockResolvedValue(undefined);
    });

    it('renders without throwing and shows the (empty) collection header (confirmed crash site: useFavorites() called unconditionally at the top of the component)', async () => {
      const CollectionDetailScreen =
        require('../app/features/collections/[name]').default;
      const {findByText} = renderWithWebProvidersAndFavorites(
        <CollectionDetailScreen />,
      );
      expect(await findByText('coleccion-de-prueba')).toBeTruthy();
    });
  });
});
