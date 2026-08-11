/**
 * v2 "¿Sabías qué?" daily reminder — the SIXTH independent reminder type in
 * NotificationService.ts, shaped like prophecy-daily (per-day dynamic
 * content, no DB lookup). Doesn't re-derive fact selection
 * (bibleFacts.test.ts already pins getDailyFact/getDailyFactIndex) or i18n
 * parity (i18nParity.test.ts already pins es/en key parity) — this pins the
 * NEW wiring specific to this reminder type: the type discriminator, the
 * Android channel, that scheduled copy actually matches the i18n fact entry
 * for the SAME date getDailyFact would resolve, that only this type's
 * notifications get cancelled on reschedule, and the enable/disable +
 * permission-gating contract shared with its five siblings.
 */
import {getDailyFact} from '../src/features/study/bibleFacts';
import {translations} from '../src/i18n/translations';

interface ScheduledCall {
  content: {
    title: string;
    body: string;
    data: {type: string};
  };
  trigger: {
    type: string;
    date: Date;
    channelId: string;
  };
}

const mockScheduleNotificationAsync = jest.fn((_arg: ScheduledCall) =>
  Promise.resolve('id'),
);
const mockGetAllScheduled = jest.fn(() =>
  Promise.resolve(
    [] as Array<{identifier: string; content: {data?: {type?: string}}}>,
  ),
);
const mockCancelScheduled = jest.fn((_id: string) => Promise.resolve());
const mockSetNotificationChannelAsync = jest.fn(
  (_id: string, _config: unknown) => Promise.resolve(),
);
const mockGetPermissionsAsync = jest.fn(() =>
  Promise.resolve({granted: true, canAskAgain: true}),
);
const mockRequestPermissionsAsync = jest.fn(() =>
  Promise.resolve({granted: true}),
);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: (id: string, config: unknown) =>
    mockSetNotificationChannelAsync(id, config),
  scheduleNotificationAsync: (arg: ScheduledCall) =>
    mockScheduleNotificationAsync(arg),
  getAllScheduledNotificationsAsync: () => mockGetAllScheduled(),
  cancelScheduledNotificationAsync: (id: string) => mockCancelScheduled(id),
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  AndroidImportance: {DEFAULT: 3},
  SchedulableTriggerInputTypes: {DATE: 'date'},
}));

// NotificationService also imports bibleDB (used only by the daily-verse
// scheduler) — stub it so importing the module here never touches SQLite.
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {initialize: jest.fn(() => Promise.resolve())},
}));

import {
  scheduleSabiasQueReminders,
  setSabiasQueReminderEnabled,
  getSabiasQueReminderPreferences,
  SABIAS_QUE_REMINDER_TYPE,
} from '../src/lib/notifications/NotificationService';

const esItems = translations.es.bibleFacts.items as Record<
  string,
  {label: string; detail: string}
>;

describe('scheduleSabiasQueReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllScheduled.mockResolvedValue([]);
  });

  it("schedules future days with the right type/channel and copy matching that date's fact", async () => {
    const scheduled = await scheduleSabiasQueReminders({
      hour: 12,
      language: 'es',
    });

    expect(scheduled).toBeGreaterThan(0);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(scheduled);

    for (const [arg] of mockScheduleNotificationAsync.mock.calls) {
      expect(arg.content.data.type).toBe(SABIAS_QUE_REMINDER_TYPE);
      expect(arg.trigger.channelId).toBe('sabias-que-reminder');
      expect(arg.trigger.date.getHours()).toBe(12);

      const fact = getDailyFact(arg.trigger.date);
      const item = esItems[fact.id];
      expect(item).toBeTruthy();
      expect(arg.content.title).toBe(`💡 ¿Sabías qué? · ${item.label}`);
      expect(arg.content.body).toBe(item.detail);
    }
  });

  it('never schedules a trigger time already in the past today', async () => {
    await scheduleSabiasQueReminders({hour: 12, language: 'es'});
    const now = Date.now();
    for (const [arg] of mockScheduleNotificationAsync.mock.calls) {
      expect(arg.trigger.date.getTime()).toBeGreaterThan(now);
    }
  });

  it('cancels only its own type before rescheduling, leaving other types alone', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {identifier: 'keep-me', content: {data: {type: 'prophecy-daily'}}},
      {
        identifier: 'cancel-me',
        content: {data: {type: SABIAS_QUE_REMINDER_TYPE}},
      },
    ]);
    await scheduleSabiasQueReminders({hour: 12, language: 'es'});
    expect(mockCancelScheduled).toHaveBeenCalledTimes(1);
    expect(mockCancelScheduled).toHaveBeenCalledWith('cancel-me');
  });
});

describe('setSabiasQueReminderEnabled / getSabiasQueReminderPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllScheduled.mockResolvedValue([]);
    // `clearAllMocks()` resets call history but NOT a persistent
    // `mockResolvedValue` set by an earlier test (e.g. the permission-denied
    // case below) — re-assert the granted default each time so tests don't
    // leak state into one another via mock implementation, not just calls.
    mockGetPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    mockRequestPermissionsAsync.mockResolvedValue({granted: true});
  });

  it('defaults to disabled at the midday (12:00) default hour', async () => {
    const prefs = await getSabiasQueReminderPreferences();
    expect(prefs).toEqual({enabled: false, hour: 12});
  });

  it('does not schedule and returns false when the OS permission is denied', async () => {
    mockGetPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });
    const ok = await setSabiasQueReminderEnabled(true, {
      hour: 9,
      language: 'es',
    });
    expect(ok).toBe(false);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('persists the chosen hour and schedules when enabled with permission granted', async () => {
    const ok = await setSabiasQueReminderEnabled(true, {
      hour: 9,
      language: 'es',
    });
    expect(ok).toBe(true);
    expect(mockScheduleNotificationAsync).toHaveBeenCalled();

    const prefs = await getSabiasQueReminderPreferences();
    expect(prefs).toEqual({enabled: true, hour: 9});
  });
});
