/**
 * Web stub providers — regression coverage for the "blank web app" crash.
 *
 * `app/_layout.web.tsx` mounts a reduced provider tree (T21): no
 * PremiumProvider/OfferingSheetProvider/AudioPlayerProvider. But ~27 route
 * files under app/features/** (and a few under app/(tabs)/**) call
 * usePremium()/useOfferingSheet()/useAudioPlayer() unconditionally, with no
 * `.web.tsx` sibling and no `Platform.OS` guard. Each native context's hook
 * throws "must be used within a ...Provider" when its context is undefined —
 * and since `firebase.json`'s catch-all SPA rewrite makes every one of those
 * routes reachable via a direct URL/bookmark on the live deployed site, and
 * `ErrorBoundary` wraps the WHOLE Stack (not per-route) in `_layout.web.tsx`,
 * that throw took down the entire web app with no in-app recovery.
 *
 * The fix: `PremiumContext.web.tsx` / `OfferingSheetContext.web.tsx` /
 * `AudioPlayerContext.web.tsx` — inert stub siblings that Metro resolves in
 * place of the native files for any web bundle (same precedent as
 * data-loader.web.ts / redLetterText.web.ts).
 *
 * Part A below exercises each stub module directly (imported via its
 * explicit `.web` path, the same way Metro would resolve it for a web
 * build — Jest has no platform-aware resolution for a BARE `@context/...`
 * specifier, so this file must name the `.web` file explicitly to reach it).
 * It proves: (1) the stub Provider supplies safe, honest "off/free/inert"
 * values, (2) the hook still throws its ORIGINAL guard error when rendered
 * without any provider at all (the guard itself was not weakened), and (3)
 * every exposed function/control is callable without throwing.
 *
 * Part B renders two REAL, previously-crashing route screens
 * (`app/features/dictionary/[slug].tsx`, `app/features/quiz/index.tsx`)
 * wrapped ONLY in the stub Premium/OfferingSheet providers — reached by
 * `jest.mock('@context/PremiumContext', () =>
 * require('../src/context/PremiumContext.web'))`, which redirects every
 * `usePremium()`/`useOfferingSheet()` call inside those screens to the REAL
 * stub module's real code (not a hand-rolled test double). This proves the
 * usePremium()/useOfferingSheet() crash site specifically is gone. It does
 * NOT prove either screen is fully web-safe end-to-end: `dictionary/[slug]`
 * is (it uses no other unmounted-context hook), but `quiz/index` also calls
 * `useMemoryDeck()`, which `app/_layout.web.tsx` still doesn't provide
 * (T21's write-feature exclusion; out of scope here) — see the note on that
 * `it(...)` block below.
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
import {render, fireEvent} from '@testing-library/react-native';

// ============================================================================
// Part A — the 3 stub modules in isolation
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

// ============================================================================
// Part B — real previously-crashing routes, rendered with ONLY the web stub
// Premium/OfferingSheet providers mounted (no native providers at all).
// ============================================================================

describe('Previously-crashing web routes, with only the stub providers mounted', () => {
  // Redirects `@context/PremiumContext` / `@context/OfferingSheetContext` —
  // exactly what every route file under test imports — to the REAL `.web`
  // stub modules, the same substitution Metro performs automatically when
  // bundling for the web platform.
  jest.mock('@context/PremiumContext', () =>
    require('../src/context/PremiumContext.web'),
  );
  jest.mock('@context/OfferingSheetContext', () =>
    require('../src/context/OfferingSheetContext.web'),
  );

  // Resolved through the SAME mocked specifiers the route files themselves
  // import — i.e. these ARE the real .web stub Providers, not test doubles.
  // This is the tree app/_layout.web.tsx now mounts (Premium > OfferingSheet
  // around ErrorBoundary/AppContent); reproduced narrowly here since a full
  // _layout.web.tsx render would need to also mock Bible-data
  // initialization, fonts, etc. unrelated to what this test is proving.
  function renderWithWebProviders(ui: React.ReactElement) {
    const {PremiumProvider} =
      require('@context/PremiumContext') as typeof import('../src/context/PremiumContext.web');
    const {OfferingSheetProvider} =
      require('@context/OfferingSheetContext') as typeof import('../src/context/OfferingSheetContext.web');
    return render(
      <PremiumProvider>
        <OfferingSheetProvider>{ui}</OfferingSheetProvider>
      </PremiumProvider>,
    );
  }

  // A single shared `expo-router` mock for the whole file: `jest.mock` calls
  // are hoisted to the top of the module (not scoped per-`describe`), so two
  // separate `jest.mock('expo-router', ...)` factories in the same file
  // would collide — only the last one survives for BOTH screens. Combining
  // every export either screen needs into one factory avoids that trap.
  let mockSlug = 'expiacion';
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  jest.mock('expo-router', () => ({
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => ({slug: mockSlug}),
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

    const mockGetDictionaryEntry = jest.fn();
    const mockGetDictionaryMultiviewSections = jest.fn();
    const mockGetAllDictionaryEntries = jest.fn(async () => []);
    jest.mock('@lib/database', () => ({
      __esModule: true,
      default: {
        initialize: jest.fn(async () => undefined),
        getDictionaryEntry: (...args: unknown[]) =>
          mockGetDictionaryEntry(...args),
        getDictionaryMultiviewSections: (...args: unknown[]) =>
          mockGetDictionaryMultiviewSections(...args),
        getAllDictionaryEntries: () => mockGetAllDictionaryEntries(),
      },
    }));

    beforeEach(() => {
      mockSlug = 'expiacion';
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
    jest.mock('@context/MemoryDeckContext', () => ({
      useMemoryDeck: () => ({
        hasCard: () => false,
        addCard: jest.fn(),
        reviewCard: jest.fn(),
      }),
    }));
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

    // NOTE (scope caveat): `@context/MemoryDeckContext` is mocked above for
    // ordinary test convenience (this screen also calls `useMemoryDeck()` for
    // "add to deck"/SRS), NOT because MemoryDeckProvider is safe on web. It
    // is NOT — `app/_layout.web.tsx` never mounts it (T21's write-feature
    // exclusion; out of scope for this fix), so on the REAL deployed web app
    // `useMemoryDeck()` still throws and this route still crashes. This test
    // only proves the usePremium()/useOfferingSheet() piece no longer does;
    // do not read a green result here as "quiz/index.tsx is web-safe".
    it('renders without throwing (confirmed crash site: usePremium()/useOfferingSheet() called unconditionally at the top of the component)', () => {
      const QuizScreen = require('../app/features/quiz/index').default;
      const {getByText} = renderWithWebProviders(<QuizScreen />);
      expect(getByText('quiz-panel-rendered')).toBeTruthy();
    });
  });
});
