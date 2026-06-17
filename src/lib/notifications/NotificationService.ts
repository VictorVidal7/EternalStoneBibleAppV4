/**
 * Daily Verse Notifications
 *
 * Schedules a local notification with the curated verse of the day. Because a
 * background task can't reach the SQLite database, we resolve the verse text
 * up front and schedule one dated notification per day for the next two weeks.
 * The rolling window is topped up every time the app launches.
 */

import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '../database';
import {getDailyVerseRef} from '../../constants/daily-verses';
import {getBookById} from '../../constants/bible';
import {pickPrayerReminderCopy} from './prayerReminderCopy';
import {pickDevotionReminderCopy} from './devotionReminderCopy';
import {logger} from '../utils/logger';

const ENABLED_KEY = '@daily_notifications_enabled';
const HOUR_KEY = '@daily_notifications_hour';
const DEFAULT_HOUR = 8;
/** How many days of notifications to keep scheduled ahead. */
const DAYS_AHEAD = 14;
const ANDROID_CHANNEL_ID = 'daily-verse';

/** Sprint 47 — the memorization review reminder is a SECOND notification
 *  type with its own prefs + channel, independent of the daily verse so the
 *  user can enable either, both, or neither. */
const MEMORY_ENABLED_KEY = '@memory_reminder_enabled';
const MEMORY_HOUR_KEY = '@memory_reminder_hour';
const MEMORY_DEFAULT_HOUR = 19;
const MEMORY_CHANNEL_ID = 'memory-reminder';

/** Sprint 95 — a gentle daily prayer reminder, a THIRD independent reminder
 *  type. The prayer companion (Sprint 93) had no nudge; this is a calm,
 *  pastoral invitation (NEVER a scold) whose copy rotates by day so it stays
 *  fresh. Like the memory reminder it needs no DB lookup. */
const PRAYER_ENABLED_KEY = '@prayer_reminder_enabled';
const PRAYER_HOUR_KEY = '@prayer_reminder_hour';
const PRAYER_DEFAULT_HOUR = 20;
const PRAYER_CHANNEL_ID = 'prayer-reminder';

/** Sprint 97 — a gentle daily invitation to spend time in the Word / Daily
 *  Light devotional, a FOURTH independent reminder type. Defaults to the
 *  morning (08:00) since devotions are most often a morning habit. Like the
 *  prayer reminder it needs no DB lookup and the copy is never a scold. */
const DEVOTION_ENABLED_KEY = '@devotion_reminder_enabled';
const DEVOTION_HOUR_KEY = '@devotion_reminder_hour';
const DEVOTION_DEFAULT_HOUR = 8;
const DEVOTION_CHANNEL_ID = 'devotion-reminder';

/** Discriminator stored on each scheduled notification's `data.type` so we
 *  can cancel one kind without touching the other. */
const DAILY_VERSE_TYPE = 'daily-verse';
const MEMORY_REMINDER_TYPE = 'memory-reminder';
const PRAYER_REMINDER_TYPE = 'prayer-reminder';
const DEVOTION_REMINDER_TYPE = 'devotion-reminder';

export interface NotificationPreferences {
  enabled: boolean;
  hour: number;
}

export interface ScheduleOptions {
  hour: number;
  language: 'es' | 'en';
  version: string;
}

let handlerConfigured = false;

/** Sets the foreground handler and Android channel. Safe to call repeatedly. */
export async function initNotifications(): Promise<void> {
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Versículo del día',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync(MEMORY_CHANNEL_ID, {
        name: 'Recordatorio de repaso',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
        name: 'Recordatorio de oración',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync(DEVOTION_CHANNEL_ID, {
        name: 'Recordatorio de devoción',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch (err) {
      logger.warn('Could not create notification channel', {
        component: 'NotificationService',
        error: err,
      });
    }
  }
}

/** Reads the user's saved notification preferences. */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const [enabledRaw, hourRaw] = await Promise.all([
      AsyncStorage.getItem(ENABLED_KEY),
      AsyncStorage.getItem(HOUR_KEY),
    ]);
    const hour = hourRaw != null ? parseInt(hourRaw, 10) : DEFAULT_HOUR;
    return {
      enabled: enabledRaw === 'true',
      hour: Number.isFinite(hour) ? hour : DEFAULT_HOUR,
    };
  } catch {
    return {enabled: false, hour: DEFAULT_HOUR};
  }
}

async function savePreferences(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.multiSet([
    [ENABLED_KEY, String(prefs.enabled)],
    [HOUR_KEY, String(prefs.hour)],
  ]);
}

/** Requests OS permission for notifications. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (err) {
    logger.error('Notification permission request failed', err as Error, {
      component: 'NotificationService',
    });
    return false;
  }
}

/**
 * Cancels only the scheduled notifications carrying `data.type === type`.
 * Sprint 47 — the daily verse and the memory reminder coexist, so we can no
 * longer `cancelAllScheduledNotificationsAsync()` (that would wipe the other
 * kind); we filter by the type discriminator and cancel by identifier.
 */
async function cancelNotificationsByType(type: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(
          n => (n.content?.data as {type?: string} | undefined)?.type === type,
        )
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch (err) {
    logger.warn('Could not cancel scheduled notifications', {
      component: 'NotificationService',
      type,
      error: err,
    });
  }
}

/** Cancels every scheduled daily-verse notification. */
export async function cancelDailyVerseNotifications(): Promise<void> {
  await cancelNotificationsByType(DAILY_VERSE_TYPE);
}

/**
 * Reschedules the rolling window of daily-verse notifications. Cancels any
 * existing ones first so the schedule never drifts or duplicates.
 */
export async function scheduleDailyVerseNotifications(
  opts: ScheduleOptions,
): Promise<number> {
  await initNotifications();
  await cancelDailyVerseNotifications();

  try {
    await bibleDB.initialize();
  } catch {
    // The reader will have initialised it already in normal use.
  }

  const now = new Date();
  let scheduled = 0;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(opts.hour, 0, 0, 0);
    // Skip a time that has already passed today.
    if (triggerDate.getTime() <= now.getTime()) continue;

    const ref = getDailyVerseRef(triggerDate);
    const book = getBookById(ref.book);
    const bookName = (opts.language === 'en' ? book?.nameEn : book?.name) ?? '';
    const reference = `${bookName} ${ref.chapter}:${ref.verse}`.trim();

    let verseText = '';
    try {
      const verse = await bibleDB.getVerse(
        ref.book,
        ref.chapter,
        ref.verse,
        opts.version,
      );
      verseText = verse?.text ?? '';
    } catch {
      verseText = '';
    }

    const title =
      opts.language === 'en'
        ? `📖 Verse of the day · ${reference}`
        : `📖 Versículo del día · ${reference}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body:
          verseText ||
          (opts.language === 'en'
            ? 'Open the app to read today’s verse'
            : 'Abre la app para leer el versículo de hoy'),
        data: {
          type: DAILY_VERSE_TYPE,
          book: ref.book,
          chapter: ref.chapter,
          verse: ref.verse,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    scheduled++;
  }

  logger.info('Daily verse notifications scheduled', {
    component: 'NotificationService',
    scheduled,
    hour: opts.hour,
  });
  return scheduled;
}

/**
 * Turns the daily reminder on or off. When enabling, the OS permission is
 * requested; returns false if the user denied it.
 */
export async function setDailyVerseEnabled(
  enabled: boolean,
  opts: Omit<ScheduleOptions, 'hour'> & {hour: number},
): Promise<boolean> {
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleDailyVerseNotifications(opts);
  } else {
    await cancelDailyVerseNotifications();
  }
  await savePreferences({enabled, hour: opts.hour});
  return true;
}

/** Updates the reminder hour and reschedules if the reminder is enabled. */
export async function updateDailyVerseHour(
  opts: ScheduleOptions,
): Promise<void> {
  await savePreferences({enabled: true, hour: opts.hour});
  await scheduleDailyVerseNotifications(opts);
}

/**
 * Called on app launch: if the reminder is enabled, refresh the rolling
 * window so the next two weeks are always populated with fresh verse text.
 */
export async function refreshDailyVerseNotifications(
  opts: Omit<ScheduleOptions, 'hour'>,
): Promise<void> {
  const prefs = await getNotificationPreferences();
  await initNotifications();
  if (!prefs.enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await scheduleDailyVerseNotifications({...opts, hour: prefs.hour});
}

// ---------------------------------------------------------------------------
// 🧠 Memorization review reminder (Sprint 47)
//
// A second, independent reminder nudging the user to keep their review streak
// alive. Unlike the daily verse it needs no DB lookup — the copy is a fixed
// motivational line — so it just schedules a rolling window of dated triggers.
// ---------------------------------------------------------------------------

export interface MemoryReminderPreferences {
  enabled: boolean;
  hour: number;
}

export interface MemoryReminderOptions {
  hour: number;
  language: 'es' | 'en';
}

/** Reads the saved memory-reminder preferences. */
export async function getMemoryReminderPreferences(): Promise<MemoryReminderPreferences> {
  try {
    const [enabledRaw, hourRaw] = await Promise.all([
      AsyncStorage.getItem(MEMORY_ENABLED_KEY),
      AsyncStorage.getItem(MEMORY_HOUR_KEY),
    ]);
    const hour = hourRaw != null ? parseInt(hourRaw, 10) : MEMORY_DEFAULT_HOUR;
    return {
      enabled: enabledRaw === 'true',
      hour: Number.isFinite(hour) ? hour : MEMORY_DEFAULT_HOUR,
    };
  } catch {
    return {enabled: false, hour: MEMORY_DEFAULT_HOUR};
  }
}

async function saveMemoryReminderPreferences(
  prefs: MemoryReminderPreferences,
): Promise<void> {
  await AsyncStorage.multiSet([
    [MEMORY_ENABLED_KEY, String(prefs.enabled)],
    [MEMORY_HOUR_KEY, String(prefs.hour)],
  ]);
}

/**
 * Reschedules the rolling window of memorization reminders. Cancels only the
 * existing memory reminders first (never the daily verse).
 */
export async function scheduleMemoryReminders(
  opts: MemoryReminderOptions,
): Promise<number> {
  await initNotifications();
  await cancelNotificationsByType(MEMORY_REMINDER_TYPE);

  const now = new Date();
  let scheduled = 0;

  const title =
    opts.language === 'en' ? '🧠 Time to review' : '🧠 Hora de repasar';
  const body =
    opts.language === 'en'
      ? 'Keep your memorization streak alive — review today’s verses.'
      : 'Mantén viva tu racha de memorización — repasa los versículos de hoy.';

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(opts.hour, 0, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {type: MEMORY_REMINDER_TYPE},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: MEMORY_CHANNEL_ID,
      },
    });
    scheduled++;
  }

  logger.info('Memory reminders scheduled', {
    component: 'NotificationService',
    scheduled,
    hour: opts.hour,
  });
  return scheduled;
}

/** Turns the memorization reminder on or off (requesting permission on). */
export async function setMemoryReminderEnabled(
  enabled: boolean,
  opts: MemoryReminderOptions,
): Promise<boolean> {
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleMemoryReminders(opts);
  } else {
    await cancelNotificationsByType(MEMORY_REMINDER_TYPE);
  }
  await saveMemoryReminderPreferences({enabled, hour: opts.hour});
  return true;
}

/** Updates the reminder hour and reschedules if enabled. */
export async function updateMemoryReminderHour(
  opts: MemoryReminderOptions,
): Promise<void> {
  await saveMemoryReminderPreferences({enabled: true, hour: opts.hour});
  await scheduleMemoryReminders(opts);
}

/** Called on app launch: top up the rolling window if the reminder is on. */
export async function refreshMemoryReminders(
  opts: Omit<MemoryReminderOptions, 'hour'>,
): Promise<void> {
  const prefs = await getMemoryReminderPreferences();
  await initNotifications();
  if (!prefs.enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await scheduleMemoryReminders({...opts, hour: prefs.hour});
}

// ---------------------------------------------------------------------------
// 🙏 Prayer reminder (Sprint 95)
//
// A gentle daily invitation to pray, mirroring the memory reminder's shape but
// with PASTORAL, rotating copy — never a scold, always an open door. The line
// is chosen deterministically by day-of-year (so every notification on a given
// day matches and it refreshes tomorrow), reusing the pure dailyLight rotation.
// ---------------------------------------------------------------------------

export interface PrayerReminderPreferences {
  enabled: boolean;
  hour: number;
}

export interface PrayerReminderOptions {
  hour: number;
  language: 'es' | 'en';
}

/** Reads the saved prayer-reminder preferences. */
export async function getPrayerReminderPreferences(): Promise<PrayerReminderPreferences> {
  try {
    const [enabledRaw, hourRaw] = await Promise.all([
      AsyncStorage.getItem(PRAYER_ENABLED_KEY),
      AsyncStorage.getItem(PRAYER_HOUR_KEY),
    ]);
    const hour = hourRaw != null ? parseInt(hourRaw, 10) : PRAYER_DEFAULT_HOUR;
    return {
      enabled: enabledRaw === 'true',
      hour: Number.isFinite(hour) ? hour : PRAYER_DEFAULT_HOUR,
    };
  } catch {
    return {enabled: false, hour: PRAYER_DEFAULT_HOUR};
  }
}

async function savePrayerReminderPreferences(
  prefs: PrayerReminderPreferences,
): Promise<void> {
  await AsyncStorage.multiSet([
    [PRAYER_ENABLED_KEY, String(prefs.enabled)],
    [PRAYER_HOUR_KEY, String(prefs.hour)],
  ]);
}

/**
 * Reschedules the rolling window of prayer reminders. Cancels only the
 * existing prayer reminders first (never the daily verse or memory reminder).
 */
export async function schedulePrayerReminders(
  opts: PrayerReminderOptions,
): Promise<number> {
  await initNotifications();
  await cancelNotificationsByType(PRAYER_REMINDER_TYPE);

  const now = new Date();
  let scheduled = 0;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(opts.hour, 0, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) continue;

    const copy = pickPrayerReminderCopy(opts.language, triggerDate);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: {type: PRAYER_REMINDER_TYPE},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: PRAYER_CHANNEL_ID,
      },
    });
    scheduled++;
  }

  logger.info('Prayer reminders scheduled', {
    component: 'NotificationService',
    scheduled,
    hour: opts.hour,
  });
  return scheduled;
}

/** Turns the prayer reminder on or off (requesting permission on enable). */
export async function setPrayerReminderEnabled(
  enabled: boolean,
  opts: PrayerReminderOptions,
): Promise<boolean> {
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await schedulePrayerReminders(opts);
  } else {
    await cancelNotificationsByType(PRAYER_REMINDER_TYPE);
  }
  await savePrayerReminderPreferences({enabled, hour: opts.hour});
  return true;
}

/** Updates the reminder hour and reschedules if enabled. */
export async function updatePrayerReminderHour(
  opts: PrayerReminderOptions,
): Promise<void> {
  await savePrayerReminderPreferences({enabled: true, hour: opts.hour});
  await schedulePrayerReminders(opts);
}

/** Called on app launch: top up the rolling window if the reminder is on. */
export async function refreshPrayerReminders(
  opts: Omit<PrayerReminderOptions, 'hour'>,
): Promise<void> {
  const prefs = await getPrayerReminderPreferences();
  await initNotifications();
  if (!prefs.enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await schedulePrayerReminders({...opts, hour: prefs.hour});
}

// ---------------------------------------------------------------------------
// 📖 Devotion reminder (Sprint 97)
//
// A gentle daily invitation to spend time in the Word / the Daily Light
// devotional, mirroring the prayer reminder's shape with its own pastoral,
// rotating copy (never a scold). The line is chosen deterministically by
// day-of-year, reusing the pure dailyLight rotation.
// ---------------------------------------------------------------------------

export interface DevotionReminderPreferences {
  enabled: boolean;
  hour: number;
}

export interface DevotionReminderOptions {
  hour: number;
  language: 'es' | 'en';
}

/** Reads the saved devotion-reminder preferences. */
export async function getDevotionReminderPreferences(): Promise<DevotionReminderPreferences> {
  try {
    const [enabledRaw, hourRaw] = await Promise.all([
      AsyncStorage.getItem(DEVOTION_ENABLED_KEY),
      AsyncStorage.getItem(DEVOTION_HOUR_KEY),
    ]);
    const hour =
      hourRaw != null ? parseInt(hourRaw, 10) : DEVOTION_DEFAULT_HOUR;
    return {
      enabled: enabledRaw === 'true',
      hour: Number.isFinite(hour) ? hour : DEVOTION_DEFAULT_HOUR,
    };
  } catch {
    return {enabled: false, hour: DEVOTION_DEFAULT_HOUR};
  }
}

async function saveDevotionReminderPreferences(
  prefs: DevotionReminderPreferences,
): Promise<void> {
  await AsyncStorage.multiSet([
    [DEVOTION_ENABLED_KEY, String(prefs.enabled)],
    [DEVOTION_HOUR_KEY, String(prefs.hour)],
  ]);
}

/**
 * Reschedules the rolling window of devotion reminders. Cancels only the
 * existing devotion reminders first (never the other reminder types).
 */
export async function scheduleDevotionReminders(
  opts: DevotionReminderOptions,
): Promise<number> {
  await initNotifications();
  await cancelNotificationsByType(DEVOTION_REMINDER_TYPE);

  const now = new Date();
  let scheduled = 0;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(opts.hour, 0, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) continue;

    const copy = pickDevotionReminderCopy(opts.language, triggerDate);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: {type: DEVOTION_REMINDER_TYPE},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: DEVOTION_CHANNEL_ID,
      },
    });
    scheduled++;
  }

  logger.info('Devotion reminders scheduled', {
    component: 'NotificationService',
    scheduled,
    hour: opts.hour,
  });
  return scheduled;
}

/** Turns the devotion reminder on or off (requesting permission on enable). */
export async function setDevotionReminderEnabled(
  enabled: boolean,
  opts: DevotionReminderOptions,
): Promise<boolean> {
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleDevotionReminders(opts);
  } else {
    await cancelNotificationsByType(DEVOTION_REMINDER_TYPE);
  }
  await saveDevotionReminderPreferences({enabled, hour: opts.hour});
  return true;
}

/** Updates the reminder hour and reschedules if enabled. */
export async function updateDevotionReminderHour(
  opts: DevotionReminderOptions,
): Promise<void> {
  await saveDevotionReminderPreferences({enabled: true, hour: opts.hour});
  await scheduleDevotionReminders(opts);
}

/** Called on app launch: top up the rolling window if the reminder is on. */
export async function refreshDevotionReminders(
  opts: Omit<DevotionReminderOptions, 'hour'>,
): Promise<void> {
  const prefs = await getDevotionReminderPreferences();
  await initNotifications();
  if (!prefs.enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await scheduleDevotionReminders({...opts, hour: prefs.hour});
}
