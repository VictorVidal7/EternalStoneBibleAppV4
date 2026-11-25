/**
 * R9-570 (S180) — each cold start with the chosen Bible pack missing doubled
 * the daily-verse reminders.
 *
 * Since R9-424, while the pack is absent `selectedVersion` is the version with
 * no rows until the database answers, and only then falls back to a bundled
 * one: `AppContent`'s reminder effect (`app/_layout.tsx`) runs twice, a second
 * or so apart. Each run is "cancel this type, then ~14 awaited schedules", and
 * nothing serialized them: the second cancel ran while the first run was still
 * scheduling, so both windows survived (26 alarms on the emulator, S141; 13
 * with the generic body of the run without rows). The same shape existed in
 * Settings (two quick version changes) and in the five sibling reminders the
 * same effect refreshes.
 *
 * The fix serializes every reschedule and cancel PER TYPE inside
 * NotificationService, so the later call starts after the earlier one ends:
 * last call wins, one window per type.
 *
 * Real producers: `AppContent` from `app/_layout.tsx` and the real
 * NotificationService. Only the boundaries are simulated: expo-notifications
 * as a stateful store whose every call yields (like the native bridge), and
 * bibleDB.getVerse answering per version (KJV has no rows).
 */
import React from 'react';
import {act, render, waitFor} from '@testing-library/react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// ---- expo-notifications: a stateful store; every call yields a macrotask ----
interface StoredNotification {
  identifier: string;
  content: {title: string; body: string; data: {type: string}};
  trigger: {date: Date};
}
const mockStore = new Map<string, StoredNotification>();
let mockNextId = 0;
let mockScheduleFailures = 0;
const mockTick = () => new Promise<void>(resolve => setImmediate(resolve));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: async () => {
    await mockTick();
  },
  scheduleNotificationAsync: async (arg: {
    content: StoredNotification['content'];
    trigger: StoredNotification['trigger'];
  }) => {
    await mockTick();
    if (mockScheduleFailures > 0) {
      mockScheduleFailures--;
      throw new Error('native scheduling failed');
    }
    const identifier = `n${mockNextId++}`;
    mockStore.set(identifier, {identifier, ...arg});
    return identifier;
  },
  getAllScheduledNotificationsAsync: async () => {
    await mockTick();
    return [...mockStore.values()];
  },
  cancelScheduledNotificationAsync: async (id: string) => {
    await mockTick();
    mockStore.delete(id);
  },
  getPermissionsAsync: async () => ({granted: true, canAskAgain: true}),
  requestPermissionsAsync: async () => ({granted: true}),
  AndroidImportance: {DEFAULT: 3},
  SchedulableTriggerInputTypes: {DATE: 'date'},
}));

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// ---- bibleDB: KJV is the downloaded pack that is missing (no rows) ----
// A gate: the first getVerse for `mockHoldVersion` waits until released, so a
// test can act while a reschedule is provably half-way through its window.
let mockHoldVersion: string | null = null;
let mockHoldReached = false;
let mockRelease: () => void = () => undefined;
const mockGetVerse = jest.fn(
  async (_book: number, _chapter: number, _verse: number, version: string) => {
    await mockTick();
    if (version === mockHoldVersion) {
      mockHoldVersion = null;
      mockHoldReached = true;
      await new Promise<void>(resolve => {
        mockRelease = resolve;
      });
    }
    return version === 'KJV' ? null : {text: `texto ${version}`};
  },
);
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: async () => undefined,
    getVerse: (book: number, chapter: number, verse: number, version: string) =>
      mockGetVerse(book, chapter, verse, version),
  },
}));

// ---- The version AppContent sees: mutable, like the real provider ----
let mockVersionId = 'KJV';
jest.mock('../src/hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: {id: mockVersionId}}),
}));

// ---- The rest of AppContent's world, as in __tests__/_layout.test.tsx ----
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
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/hooks/useOnboarding', () => ({
  useOnboarding: () => ({completed: null, complete: jest.fn()}),
}));
jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: async () => undefined,
}));
jest.mock('../src/lib/cache/PredictiveCache', () => ({
  predictiveCacheService: {
    initialize: async () => undefined,
    warmupCache: async () => undefined,
    cleanup: async () => undefined,
  },
}));
jest.mock('../src/lib/badges/BadgeSystem', () => ({
  badgeSystemService: {initialize: async () => undefined},
}));
jest.mock('../src/lib/comparison/VersionComparison', () => ({
  versionComparisonService: {initialize: async () => undefined},
}));
jest.mock('../src/widgets/WidgetTaskHandler', () => ({
  widgetTaskHandler: {initialize: async () => undefined},
}));
jest.mock('../src/lib/reader/fontAssets', () => ({
  loadReaderFonts: async () => undefined,
}));
jest.mock('../src/lib/offering/offeringService', () => ({
  initialize: async () => undefined,
}));
jest.mock('expo-router', () => ({
  Stack: Object.assign(() => null, {Screen: () => null}),
}));
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
  useFavorites: () => ({
    favorites: [],
    loading: false,
    addFavorite: jest.fn(() => Promise.resolve()),
  }),
}));
jest.mock('../src/lib/migrations/retiredBookmarksMigration', () => ({
  migrateRetiredBookmarksToFavorites: jest.fn(() => Promise.resolve()),
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
  useAuth: () => ({user: null, isLoading: false}),
}));
jest.mock('../src/context/SyncEngineContext', () => ({
  SyncEngineProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/components/onboarding/OnboardingScreen', () => ({
  OnboardingScreen: () => null,
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

import {AppContent} from '../app/_layout';
import {
  scheduleDailyVerseNotifications,
  setDailyVerseEnabled,
  refreshDailyVerseNotifications,
  refreshMemoryReminders,
  refreshPrayerReminders,
  refreshDevotionReminders,
  refreshPropheticReminders,
  refreshSabiasQueReminders,
} from '../src/lib/notifications/NotificationService';

const TYPES = [
  'daily-verse',
  'memory-reminder',
  'prayer-reminder',
  'devotion-reminder',
  'prophecy-daily',
  'sabias-que-reminder',
] as const;

const ENABLED_KEYS = [
  '@daily_notifications_enabled',
  '@memory_reminder_enabled',
  '@prayer_reminder_enabled',
  '@devotion_reminder_enabled',
  '@prophecy_reminder_enabled',
  '@sabias_que_reminder_enabled',
];

function ofType(type: string): StoredNotification[] {
  return [...mockStore.values()].filter(n => n.content.data.type === type);
}

/** One window: as many notifications as distinct trigger dates. */
function windowShape(type: string) {
  const list = ofType(type);
  const dates = new Set(list.map(n => n.trigger.date.getTime()));
  return {count: list.length, distinctDates: dates.size};
}

/** Every reminder type idle: no reschedule pending for any of them. */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 400; i++) await mockTick();
  });
}

beforeEach(async () => {
  mockStore.clear();
  mockNextId = 0;
  mockScheduleFailures = 0;
  mockVersionId = 'KJV';
  mockGetVerse.mockClear();
  mockHoldVersion = null;
  mockHoldReached = false;
  await mockAsyncStorage.clear();
  await mockAsyncStorage.multiSet(ENABLED_KEYS.map(k => [k, 'true']));
});

describe('R9-570 — cold start with the chosen pack missing (real AppContent)', () => {
  it('the version falling back mid-reschedule leaves ONE window per reminder type, with the fallback text', async () => {
    mockHoldVersion = 'KJV';
    const {rerender} = render(<AppContent />);

    // First run: the chosen KJV, without rows, has cancelled and is scheduling.
    await waitFor(() => expect(mockHoldReached).toBe(true));
    // The database answers: the safety net falls back to the bundled WEB.
    mockVersionId = 'WEB';
    rerender(<AppContent />);
    await settle();
    mockRelease();
    await settle();

    for (const type of TYPES) {
      const shape = windowShape(type);
      expect({type, ...shape}).toEqual({
        type,
        count: shape.distinctDates,
        distinctDates: shape.distinctDates,
      });
      expect(shape.count).toBeGreaterThanOrEqual(13);
    }
    // The window that survives is the last version's, not the empty run's.
    expect(
      ofType('daily-verse').every(n => n.content.body === 'texto WEB'),
    ).toBe(true);
  });

  it('control: the pack present (no fallback) gives one window, as before', async () => {
    mockVersionId = 'WEB';
    render(<AppContent />);
    await waitFor(() => expect(mockGetVerse).toHaveBeenCalled());
    await settle();

    for (const type of TYPES) {
      const shape = windowShape(type);
      expect(shape.count).toBe(shape.distinctDates);
      expect(shape.count).toBeGreaterThanOrEqual(13);
    }
  });
});

describe('R9-570 — neighbours, on the real NotificationService', () => {
  it('two version changes back to back in Settings: one window, the last version wins', async () => {
    await Promise.all([
      scheduleDailyVerseNotifications({
        hour: 8,
        language: 'es',
        version: 'KJV',
      }),
      scheduleDailyVerseNotifications({
        hour: 8,
        language: 'es',
        version: 'RVR1960',
      }),
    ]);
    const shape = windowShape('daily-verse');
    expect(shape.count).toBe(shape.distinctDates);
    expect(
      ofType('daily-verse').every(n => n.content.body === 'texto RVR1960'),
    ).toBe(true);
  });

  it.each([
    ['memory-reminder', () => refreshMemoryReminders({language: 'es'})],
    ['prayer-reminder', () => refreshPrayerReminders({language: 'es'})],
    ['devotion-reminder', () => refreshDevotionReminders({language: 'es'})],
    ['prophecy-daily', () => refreshPropheticReminders({language: 'es'})],
    ['sabias-que-reminder', () => refreshSabiasQueReminders({language: 'es'})],
  ])('%s: two refreshes at once leave one window', async (type, refresh) => {
    await Promise.all([refresh(), refresh()]);
    const shape = windowShape(type);
    expect(shape.count).toBe(shape.distinctDates);
    expect(shape.count).toBeGreaterThanOrEqual(13);
  });

  it('turning the reminder off while a reschedule is running leaves nothing scheduled', async () => {
    mockHoldVersion = 'WEB';
    const running = refreshDailyVerseNotifications({
      language: 'es',
      version: 'WEB',
    });
    await waitFor(() => expect(mockHoldReached).toBe(true));
    const turningOff = setDailyVerseEnabled(false, {
      hour: 8,
      language: 'es',
      version: 'WEB',
    });
    await settle();
    mockRelease();
    await Promise.all([running, turningOff]);
    expect(ofType('daily-verse')).toHaveLength(0);
  });

  it('a reschedule that fails does not jam the queue: the next one runs', async () => {
    mockScheduleFailures = 1;
    await expect(
      scheduleDailyVerseNotifications({
        hour: 8,
        language: 'es',
        version: 'WEB',
      }),
    ).rejects.toThrow('native scheduling failed');
    await scheduleDailyVerseNotifications({
      hour: 8,
      language: 'es',
      version: 'WEB',
    });
    const shape = windowShape('daily-verse');
    expect(shape.count).toBe(shape.distinctDates);
    expect(shape.count).toBeGreaterThanOrEqual(13);
  });

  it('other types are never cancelled by a daily-verse reschedule', async () => {
    await refreshMemoryReminders({language: 'es'});
    const before = ofType('memory-reminder').length;
    await scheduleDailyVerseNotifications({
      hour: 8,
      language: 'es',
      version: 'WEB',
    });
    expect(ofType('memory-reminder')).toHaveLength(before);
  });
});
