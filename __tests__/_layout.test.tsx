/**
 * Tanda N — regression test for the "white screen on resume" bug.
 *
 * Android/iOS can kill the whole app process under memory pressure while
 * backgrounded, keeping only the recents-list entry. Resuming then reruns
 * `AppContent.initializeApp()` from scratch, indistinguishable from a true
 * cold start. Before this fix, `setIsLoading(false)` waited on a
 * `Promise.all([...])` of best-effort services (predictive cache, badges,
 * version comparison, widget registration, reader fonts, RevenueCat
 * offering) PLUS a cache warmup/cleanup — so a slow/cold service (e.g. a
 * RevenueCat network round-trip) could hold the loading screen open far
 * longer than necessary, even though none of those services are required
 * before the user can start reading.
 *
 * This test proves `isLoading` clears as soon as `initializeBibleData`
 * resolves, WITHOUT waiting for the other services — by hanging one of
 * them (`badgeSystemService.initialize`) on a promise that never resolves
 * and asserting the loading UI still clears.
 */
import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {AppContent} from '../app/_layout';

// ---- Hooks AppContent reads directly ----
const mockColors = {
  background: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  primary: '#4f46e5',
  onPrimary: '#ffffff',
  error: '#dc2626',
};
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
}));

jest.mock('../src/hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: {id: 'RVR1960'}}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

// `completed: null` (still hydrating) keeps the post-loading render a bare
// `<View />` — this sidesteps needing to mock the entire tab stack /
// achievement / audio component tree that mounts once onboarding resolves,
// none of which is what this test is about.
jest.mock('../src/hooks/useOnboarding', () => ({
  useOnboarding: () => ({completed: null, complete: jest.fn()}),
}));

// ---- The genuinely-required step ----
// NOTE: each mocked export below is a thin wrapper that looks up its
// `mock*` variable lazily, INSIDE the function body — not a direct
// reference passed to the factory. `jest.mock(...)` factories run the
// first time the module is required (when `app/_layout.tsx` itself is
// imported below), which happens before these `const mock* = jest.fn()`
// declarations further down this file have executed; a direct reference
// captured at factory-eval time would resolve to `undefined`. A wrapper
// closure defers the lookup to actual call time (inside `initializeApp()`,
// well after the whole file has finished initializing), which is safe.
const mockInitializeBibleData = jest.fn();
jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: (onProgress?: (loaded: number, total: number) => void) =>
    mockInitializeBibleData(onProgress),
}));

// ---- Best-effort services (Sprint V5.1) — controllable per-test ----
const mockPredictiveInitialize = jest.fn(() => Promise.resolve());
const mockWarmupCache = jest.fn(() => Promise.resolve());
const mockCleanup = jest.fn(() => Promise.resolve());
jest.mock('../src/lib/cache/PredictiveCache', () => ({
  predictiveCacheService: {
    initialize: () => mockPredictiveInitialize(),
    warmupCache: () => mockWarmupCache(),
    cleanup: () => mockCleanup(),
  },
}));

const mockBadgeInitialize = jest.fn();
jest.mock('../src/lib/badges/BadgeSystem', () => ({
  badgeSystemService: {
    initialize: () => mockBadgeInitialize(),
  },
}));

const mockVersionComparisonInitialize = jest.fn(() => Promise.resolve());
jest.mock('../src/lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    initialize: () => mockVersionComparisonInitialize(),
  },
}));

const mockWidgetInitialize = jest.fn(() => Promise.resolve());
jest.mock('../src/widgets/WidgetTaskHandler', () => ({
  widgetTaskHandler: {
    initialize: () => mockWidgetInitialize(),
  },
}));

const mockLoadReaderFonts = jest.fn(() => Promise.resolve());
jest.mock('../src/lib/reader/fontAssets', () => ({
  loadReaderFonts: () => mockLoadReaderFonts(),
}));

const mockInitializeOffering = jest.fn(() => Promise.resolve());
jest.mock('../src/lib/offering/offeringService', () => ({
  initialize: () => mockInitializeOffering(),
}));

// ---- Fired the moment `isLoading` flips to false — must not blow up ----
jest.mock('../src/lib/notifications/NotificationService', () => ({
  refreshDailyVerseNotifications: jest.fn(() => Promise.resolve()),
  refreshMemoryReminders: jest.fn(() => Promise.resolve()),
  refreshPrayerReminders: jest.fn(() => Promise.resolve()),
  refreshDevotionReminders: jest.fn(() => Promise.resolve()),
  refreshPropheticReminders: jest.fn(() => Promise.resolve()),
  refreshSabiasQueReminders: jest.fn(() => Promise.resolve()),
}));

// ---- expo-router: Stack is imported but never reached (onboarding is
// still `null` in this test), just needs to not throw on import ----
jest.mock('expo-router', () => ({
  Stack: Object.assign(() => null, {Screen: () => null}),
}));

// ---- Ancestor providers / components from `app/_layout.tsx`'s default
// `RootLayout` export — irrelevant to `AppContent` (which we import and
// render directly, bypassing `RootLayout`), but importing `_layout.tsx`
// still evaluates every top-level import in the file, so each of these
// must be stubbed to avoid dragging in native/Firebase-backed transitive
// dependencies (Firestore, SQLite, RevenueCat UI, audio, etc). ----
jest.mock('../src/context/AccessibilityPreferencesContext', () => ({
  AccessibilityPreferencesProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));
jest.mock('../src/context/ServicesContext', () => ({
  ServicesProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/ToastContext', () => ({
  ToastProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/ReadingProgressContext', () => ({
  ReadingProgressProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));
jest.mock('../src/context/FavoritesContext', () => ({
  FavoritesProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/BookmarksContext', () => ({
  BookmarksProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/ReadingPlanProgressContext', () => ({
  ReadingPlanProgressProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));
jest.mock('../src/context/TogetherContext', () => ({
  TogetherProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/CustomPlansContext', () => ({
  CustomPlansProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/ReaderPreferencesContext', () => ({
  ReaderPreferencesProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));
jest.mock('../src/context/MemoryDeckContext', () => ({
  MemoryDeckProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/SyncEngineContext', () => ({
  SyncEngineProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/components/onboarding/OnboardingScreen', () => ({
  OnboardingScreen: () => null,
}));
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../src/components/AchievementNotifications', () => ({
  AchievementNotifications: () => null,
}));
jest.mock('../src/features/audio/context/AudioPlayerContext', () => ({
  AudioPlayerProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/features/audio/components/MiniAudioPlayer', () => ({
  MiniAudioPlayer: () => null,
}));
jest.mock('../src/features/audio/components/AudioResumeRestorer', () => ({
  AudioResumeRestorer: () => null,
}));
jest.mock('../src/components/ScreenAwakeManager', () => ({
  ScreenAwakeManager: () => null,
}));
jest.mock('../src/features/audio/components/AudioChapterAdvancer', () => ({
  AudioChapterAdvancer: () => null,
}));
jest.mock('../src/features/audio/components/AudioListeningTracker', () => ({
  AudioListeningTracker: () => null,
}));
jest.mock('../src/context/PremiumContext', () => ({
  PremiumProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/OfferingSheetContext', () => ({
  OfferingSheetProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/context/DonationSheetContext', () => ({
  DonationSheetProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/components/PropheticReminderRouter', () => ({
  PropheticReminderRouter: () => null,
}));
jest.mock('../src/components/ErrorBoundary', () => ({
  ErrorBoundary: ({children}: {children: React.ReactNode}) => children,
}));

describe('AppContent — Tanda N loading gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPredictiveInitialize.mockImplementation(() => Promise.resolve());
    mockWarmupCache.mockImplementation(() => Promise.resolve());
    mockCleanup.mockImplementation(() => Promise.resolve());
    mockVersionComparisonInitialize.mockImplementation(() => Promise.resolve());
    mockWidgetInitialize.mockImplementation(() => Promise.resolve());
    mockLoadReaderFonts.mockImplementation(() => Promise.resolve());
    mockInitializeOffering.mockImplementation(() => Promise.resolve());
  });

  it('clears the loading screen once initializeBibleData resolves, even if another V5.1 service never resolves', async () => {
    mockInitializeBibleData.mockImplementation(async () => undefined);
    // Hang badgeSystemService.initialize() forever — simulates a slow/cold
    // service (e.g. a RevenueCat network round-trip) that must NOT block
    // the loading screen from clearing.
    mockBadgeInitialize.mockImplementation(() => new Promise(() => {}));

    const {queryByText} = render(<AppContent />);

    // Loading screen visible at first.
    expect(queryByText('Preparando...')).toBeTruthy();

    // The loading text must disappear once the bundled Bible data is
    // ready — it must NOT wait on the hung badge service.
    await waitFor(() => {
      expect(queryByText('Preparando...')).toBeNull();
    });

    // The hung service must actually have been invoked — otherwise a
    // green test could be a false pass from the service never firing.
    expect(mockBadgeInitialize).toHaveBeenCalledTimes(1);
  });

  it('still surfaces an error and clears loading when initializeBibleData itself fails', async () => {
    mockInitializeBibleData.mockImplementation(async () => {
      throw new Error('seed copy failed');
    });

    const {queryByText, findByText} = render(<AppContent />);

    expect(queryByText('Preparando...')).toBeTruthy();

    await findByText('seed copy failed');
    expect(queryByText('Preparando...')).toBeNull();
  });
});
