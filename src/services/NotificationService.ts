/**
 * NotificationService TypeScript Migration
 *
 * Features:
 * - Complete TypeScript typing with interfaces
 * - Professional logging system integration
 * - Platform-specific notification handling (iOS/Android)
 * - Local notification scheduling with repeat support
 * - Persistent notification time storage
 */

import {Platform, PermissionsAndroid} from 'react-native';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Notification configuration interface
 */
interface NotificationConfig {
  onRegister?: (token: NotificationToken) => void;
  onNotification?: (notification: NotificationPayload) => void;
  permissions?: NotificationPermissions;
  popInitialNotification?: boolean;
  requestPermissions?: boolean;
}

/**
 * Token received from push notification service
 */
interface NotificationToken {
  token: string;
}

/**
 * Notification payload structure
 */
interface NotificationPayload {
  foreground?: boolean;
  userInteraction?: boolean;
  message?: string;
  title?: string;
  [key: string]: any;
}

/**
 * Permission settings for notifications
 */
interface NotificationPermissions {
  alert?: boolean;
  badge?: boolean;
  sound?: boolean;
}

/**
 * Channel configuration for Android notifications
 */
interface ChannelConfig {
  channelId: string;
  channelName: string;
  channelDescription?: string;
  playSound?: boolean;
  soundName?: string;
  importance?: number;
  vibrate?: boolean;
}

/**
 * Local notification configuration
 */
interface LocalNotificationConfig {
  channelId: string;
  title: string;
  message: string;
  date: Date;
  allowWhileIdle?: boolean;
  repeatType?: 'day' | 'week' | 'month' | 'year' | 'minute' | 'hour';
  repeatTime?: number;
}

/**
 * Notification time structure for storage
 */
interface NotificationTime {
  hour: number;
  minute: number;
}

/**
 * Permission request options
 */
interface PermissionRequestOptions {
  title: string;
  message: string;
  buttonNeutral?: string;
  buttonNegative?: string;
  buttonPositive?: string;
}

/**
 * NotificationService Class
 *
 * Manages all notification-related operations including:
 * - Configuration and initialization
 * - Permission handling for Android
 * - Scheduling local notifications
 * - Cancelling scheduled notifications
 * - Retrieving notification settings
 */
class NotificationService {
  private initialized: boolean = false;
  private readonly serviceName: string = 'NotificationService';

  constructor() {
    this.configure();
    this.createChannel();
    this.initialized = true;
    logger.debug(`${this.serviceName} initialized`, {
      component: this.serviceName,
    });
  }

  /**
   * Configure push notification service
   * Sets up callbacks for token registration and notification reception
   */
  private configure = (): void => {
    try {
      const config: NotificationConfig = {
        onRegister: (token: NotificationToken): void => {
          logger.info('Push notification token received', {
            component: this.serviceName,
            action: 'onRegister',
          });
        },

        onNotification: (notification: NotificationPayload): void => {
          logger.info('Notification received', {
            component: this.serviceName,
            action: 'onNotification',
            foreground: notification.foreground,
            userInteraction: notification.userInteraction,
          });
        },

        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        popInitialNotification: true,
        requestPermissions: true,
      };

      PushNotification.configure(config);

      logger.debug('Push notification service configured', {
        component: this.serviceName,
        action: 'configure',
      });
    } catch (error) {
      logger.error(
        'Failed to configure push notification service',
        error as Error,
        {
          component: this.serviceName,
          action: 'configure',
        },
      );
    }
  };

  /**
   * Create notification channel for Android
   * Required for Android 8.0 (API level 26) and above
   */
  private createChannel = (): void => {
    try {
      const channelConfig: ChannelConfig = {
        channelId: 'daily-reminder',
        channelName: 'Daily Reminder',
        channelDescription: 'A channel to categorise your notifications',
        playSound: false,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      };

      PushNotification.createChannel(
        channelConfig,
        (created: boolean): void => {
          logger.debug('Notification channel creation result', {
            component: this.serviceName,
            action: 'createChannel',
            created,
          });
        },
      );
    } catch (error) {
      logger.error('Failed to create notification channel', error as Error, {
        component: this.serviceName,
        action: 'createChannel',
      });
    }
  };

  /**
   * Request notification permissions on Android
   * No-op on iOS as permissions are handled differently
   *
   * @returns Promise<boolean> True if permission was granted
   */
  requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const permissionOptions: PermissionRequestOptions = {
          title: 'Permiso de Notificaciones',
          message: 'La app necesita permiso para enviar notificaciones.',
          buttonNeutral: 'Preguntar luego',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        };

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          permissionOptions,
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

        if (isGranted) {
          logger.info('Notification permission granted', {
            component: this.serviceName,
            action: 'requestPermissions',
            platform: 'android',
          });
        } else {
          logger.warn('Notification permission denied', {
            component: this.serviceName,
            action: 'requestPermissions',
            platform: 'android',
          });
        }

        return isGranted;
      }

      // iOS permissions are handled automatically
      logger.debug('Notification permissions on iOS handled by system', {
        component: this.serviceName,
        action: 'requestPermissions',
        platform: 'ios',
      });

      return true;
    } catch (error) {
      logger.error(
        'Error requesting notification permissions',
        error as Error,
        {
          component: this.serviceName,
          action: 'requestPermissions',
        },
      );
      return false;
    }
  };

  /**
   * Schedule a daily notification at a specific time
   *
   * @param hour - Hour of the day (0-23)
   * @param minute - Minute of the hour (0-59)
   * @returns Promise<void>
   */
  scheduleNotification = async (
    hour: number,
    minute: number,
  ): Promise<void> => {
    try {
      logger.debug('Starting notification schedule', {
        component: this.serviceName,
        action: 'scheduleNotification',
        hour,
        minute,
      });

      // Request permissions first
      const permissionGranted = await this.requestPermissions();

      if (!permissionGranted && Platform.OS === 'android') {
        logger.warn('Cannot schedule notification without permissions', {
          component: this.serviceName,
          action: 'scheduleNotification',
        });
        return;
      }

      // Calculate the notification date
      const notificationDate = new Date();
      notificationDate.setHours(hour);
      notificationDate.setMinutes(minute);
      notificationDate.setSeconds(0);

      const notificationConfig: LocalNotificationConfig = {
        channelId: 'daily-reminder',
        title: 'Recordatorio de lectura diaria',
        message: 'Es hora de tu lectura bíblica diaria',
        date: notificationDate,
        allowWhileIdle: true,
        repeatType: 'day',
        repeatTime: 24 * 60 * 60 * 1000, // Repeat every 24 hours
      };

      // Use different methods based on platform and Android version
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        // Android 12 and above
        PushNotification.localNotification({
          ...notificationConfig,
        });
        logger.info('Notification scheduled (Android 12+)', {
          component: this.serviceName,
          action: 'scheduleNotification',
          hour,
          minute,
          platform: 'android',
          version: 'android12+',
        });
      } else {
        // Earlier Android versions and iOS
        PushNotification.localNotificationSchedule({
          ...notificationConfig,
        });
        logger.info('Notification scheduled (Android <12 or iOS)', {
          component: this.serviceName,
          action: 'scheduleNotification',
          hour,
          minute,
          platform: Platform.OS,
        });
      }

      // Save notification time to persistent storage
      const notificationTime: NotificationTime = {hour, minute};
      await AsyncStorage.setItem(
        'notificationTime',
        JSON.stringify(notificationTime),
      );

      logger.breadcrumb(
        `Notification scheduled for ${hour}:${String(minute).padStart(2, '0')}`,
        'notification',
        {hour, minute},
      );
    } catch (error) {
      logger.error('Error scheduling notification', error as Error, {
        component: this.serviceName,
        action: 'scheduleNotification',
        hour,
        minute,
      });
      throw error;
    }
  };

  /**
   * Cancel all scheduled local notifications
   * Also removes the saved notification time from storage
   *
   * @returns Promise<void>
   */
  cancelAllNotifications = async (): Promise<void> => {
    try {
      logger.debug('Cancelling all notifications', {
        component: this.serviceName,
        action: 'cancelAllNotifications',
      });

      PushNotification.cancelAllLocalNotifications();

      // Remove saved notification time
      await AsyncStorage.removeItem('notificationTime');

      logger.info('All notifications cancelled', {
        component: this.serviceName,
        action: 'cancelAllNotifications',
      });

      logger.breadcrumb('All notifications cancelled', 'notification');
    } catch (error) {
      logger.error('Error cancelling notifications', error as Error, {
        component: this.serviceName,
        action: 'cancelAllNotifications',
      });
      throw error;
    }
  };

  /**
   * Retrieve the scheduled notification time from storage
   *
   * @returns Promise<NotificationTime | null> The scheduled time or null if not set
   */
  getScheduledNotificationTime = async (): Promise<NotificationTime | null> => {
    try {
      logger.debug('Retrieving scheduled notification time', {
        component: this.serviceName,
        action: 'getScheduledNotificationTime',
      });

      const storedTime = await AsyncStorage.getItem('notificationTime');

      if (!storedTime) {
        logger.debug('No notification time scheduled', {
          component: this.serviceName,
          action: 'getScheduledNotificationTime',
        });
        return null;
      }

      const notificationTime: NotificationTime = JSON.parse(storedTime);

      logger.debug('Retrieved scheduled notification time', {
        component: this.serviceName,
        action: 'getScheduledNotificationTime',
        hour: notificationTime.hour,
        minute: notificationTime.minute,
      });

      return notificationTime;
    } catch (error) {
      logger.error(
        'Error retrieving scheduled notification time',
        error as Error,
        {
          component: this.serviceName,
          action: 'getScheduledNotificationTime',
        },
      );
      return null;
    }
  };

  /**
   * Get initialization status
   *
   * @returns boolean True if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export default new NotificationService();

// Export types for external use
export type {
  NotificationConfig,
  NotificationToken,
  NotificationPayload,
  NotificationPermissions,
  ChannelConfig,
  LocalNotificationConfig,
  NotificationTime,
  PermissionRequestOptions,
};
