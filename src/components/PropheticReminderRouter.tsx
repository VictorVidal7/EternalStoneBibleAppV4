/**
 * Routes a tap on the "Profecía del día" notification straight to that day's
 * step of the Hilo profético (Sprint: prophecy-thread-round3). Render-less —
 * mounted once in the root layout, mirroring AchievementNotifications.
 *
 * `useLastNotificationResponse` (expo-notifications) covers BOTH a tap while
 * the app is foregrounded/backgrounded and a cold start from the
 * notification tray, deduping automatically once consumed via
 * `clearLastNotificationResponse`.
 */

import {useEffect} from 'react';
import {useRouter} from 'expo-router';
import * as Notifications from 'expo-notifications';
import {PROPHECY_REMINDER_TYPE} from '@lib/notifications/NotificationService';

export function PropheticReminderRouter() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const data = response?.notification.request.content.data as
      | {type?: string; index?: number}
      | undefined;
    if (data?.type !== PROPHECY_REMINDER_TYPE) return;
    const index = typeof data.index === 'number' ? data.index : 0;
    router.push(`/features/prophecies?start=${index}` as never);
    Notifications.clearLastNotificationResponse();
  }, [response, router]);

  return null;
}
