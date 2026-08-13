/**
 * Routes a tap on a scheduled local reminder notification to the right
 * screen. Render-less — mounted once in the root layout, mirroring
 * AchievementNotifications. Despite the name (kept for the original Hilo
 * profético use case, Sprint: prophecy-thread-round3), it now routes TWO
 * notification types by their `data.type` discriminator:
 *  - PROPHECY_REMINDER_TYPE → that day's step of the Hilo profético.
 *  - SABIAS_QUE_REMINDER_TYPE (v2) → the "¿Sabías qué?" hub, whose "Dato del
 *    día" hero already shows today's fact by default (getDailyFact() with no
 *    date arg), so no extra query param is needed the way prophecies uses
 *    `?start=`.
 * The other four reminder types (daily-verse, memory, prayer, devotion) have
 * no deep-link target — tapping them just brings the app to the foreground.
 *
 * `useLastNotificationResponse` (expo-notifications) covers BOTH a tap while
 * the app is foregrounded/backgrounded and a cold start from the
 * notification tray, deduping automatically once consumed via
 * `clearLastNotificationResponse`.
 */

import {useEffect} from 'react';
import {useRouter} from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  PROPHECY_REMINDER_TYPE,
  SABIAS_QUE_REMINDER_TYPE,
} from '@lib/notifications/NotificationService';

export function PropheticReminderRouter() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const data = response?.notification.request.content.data as
      {type?: string; index?: number} | undefined;
    if (data?.type === PROPHECY_REMINDER_TYPE) {
      const index = typeof data.index === 'number' ? data.index : 0;
      router.push(`/features/prophecies?start=${index}` as never);
      Notifications.clearLastNotificationResponse();
      return;
    }
    if (data?.type === SABIAS_QUE_REMINDER_TYPE) {
      router.push('/features/facts' as never);
      Notifications.clearLastNotificationResponse();
      return;
    }
  }, [response, router]);

  return null;
}
