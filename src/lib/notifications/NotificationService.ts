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
import {logger} from '../utils/logger';

const ENABLED_KEY = '@daily_notifications_enabled';
const HOUR_KEY = '@daily_notifications_hour';
const DEFAULT_HOUR = 8;
/** How many days of notifications to keep scheduled ahead. */
const DAYS_AHEAD = 14;
const ANDROID_CHANNEL_ID = 'daily-verse';

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

/** Cancels every scheduled daily-verse notification. */
export async function cancelDailyVerseNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    logger.warn('Could not cancel scheduled notifications', {
      component: 'NotificationService',
      error: err,
    });
  }
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
          type: 'daily-verse',
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
