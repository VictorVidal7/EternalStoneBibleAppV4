/**
 * Haptic Feedback Service
 *
 * Provides cross-platform haptic feedback for iOS and Android
 * using react-native-haptic-feedback with platform-specific handling
 */

import {Platform} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {logger} from '@/lib/utils/logger';

/**
 * Options for haptic feedback configuration
 * @interface HapticFeedbackOptions
 */
interface HapticFeedbackOptions {
  /** Enable fallback to vibration on unsupported devices */
  enableVibrateFallback?: boolean;
  /** Ignore Android system vibration settings */
  ignoreAndroidSystemSettings?: boolean;
}

/**
 * Haptic feedback trigger types
 * @type {HapticFeedbackType}
 */
type HapticFeedbackType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'effectClick'
  | 'effectDoubleClick'
  | 'effectHeavyClick'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

/**
 * Service feedback intensity levels
 * @type {HapticIntensity}
 */
type HapticIntensity = 'light' | 'medium' | 'heavy';

/**
 * Notification types
 * @type {HapticNotificationType}
 */
type HapticNotificationType = 'success' | 'warning' | 'error';

/**
 * Default haptic feedback options
 */
const DEFAULT_OPTIONS: HapticFeedbackOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Haptic Feedback Service
 * Provides a unified API for haptic feedback across iOS and Android
 */
class HapticFeedbackService {
  private options: HapticFeedbackOptions;
  private isSupported: boolean;

  constructor(customOptions?: HapticFeedbackOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...customOptions,
    };
    this.isSupported = this.checkSupport();

    if (!this.isSupported) {
      logger.warn('Haptic feedback is not supported on this device', {
        component: 'HapticFeedbackService',
        platform: Platform.OS,
      });
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  private checkSupport(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Trigger haptic feedback
   * @param feedbackType - The type of haptic feedback to trigger
   */
  private trigger(feedbackType: HapticFeedbackType): void {
    try {
      if (!this.isSupported) {
        logger.debug('Haptic feedback skipped - not supported', {
          component: 'HapticFeedbackService',
          feedbackType,
        });
        return;
      }

      ReactNativeHapticFeedback.trigger(feedbackType, this.options);

      logger.debug('Haptic feedback triggered', {
        component: 'HapticFeedbackService',
        feedbackType,
        platform: Platform.OS,
      });
    } catch (error) {
      logger.error('Failed to trigger haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        feedbackType,
        platform: Platform.OS,
      });
    }
  }

  /**
   * Trigger light impact feedback
   * iOS: impactLight, Android: effectClick
   */
  light(): void {
    try {
      if (Platform.OS === 'ios') {
        this.trigger('impactLight');
      } else {
        this.trigger('effectClick');
      }
    } catch (error) {
      logger.error('Error triggering light haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        intensity: 'light',
      });
    }
  }

  /**
   * Trigger medium impact feedback
   * iOS: impactMedium, Android: effectDoubleClick
   */
  medium(): void {
    try {
      if (Platform.OS === 'ios') {
        this.trigger('impactMedium');
      } else {
        this.trigger('effectDoubleClick');
      }
    } catch (error) {
      logger.error('Error triggering medium haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        intensity: 'medium',
      });
    }
  }

  /**
   * Trigger heavy impact feedback
   * iOS: impactHeavy, Android: effectHeavyClick
   */
  heavy(): void {
    try {
      if (Platform.OS === 'ios') {
        this.trigger('impactHeavy');
      } else {
        this.trigger('effectHeavyClick');
      }
    } catch (error) {
      logger.error('Error triggering heavy haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        intensity: 'heavy',
      });
    }
  }

  /**
   * Trigger success notification feedback
   * Both iOS and Android: notificationSuccess
   */
  success(): void {
    try {
      this.trigger('notificationSuccess');
    } catch (error) {
      logger.error('Error triggering success haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        notificationType: 'success',
      });
    }
  }

  /**
   * Trigger warning notification feedback
   * Both iOS and Android: notificationWarning
   */
  warning(): void {
    try {
      this.trigger('notificationWarning');
    } catch (error) {
      logger.error('Error triggering warning haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        notificationType: 'warning',
      });
    }
  }

  /**
   * Trigger error notification feedback
   * Both iOS and Android: notificationError
   */
  error(): void {
    try {
      this.trigger('notificationError');
    } catch (error) {
      logger.error('Error triggering error haptic feedback', error as Error, {
        component: 'HapticFeedbackService',
        notificationType: 'error',
      });
    }
  }

  /**
   * Trigger feedback by intensity level
   * @param intensity - 'light' | 'medium' | 'heavy'
   */
  byIntensity(intensity: HapticIntensity): void {
    try {
      switch (intensity) {
        case 'light':
          this.light();
          break;
        case 'medium':
          this.medium();
          break;
        case 'heavy':
          this.heavy();
          break;
        default:
          logger.warn('Unknown haptic intensity', {
            component: 'HapticFeedbackService',
            intensity,
          });
      }
    } catch (error) {
      logger.error(
        'Error triggering haptic feedback by intensity',
        error as Error,
        {
          component: 'HapticFeedbackService',
          intensity,
        },
      );
    }
  }

  /**
   * Trigger feedback by notification type
   * @param notificationType - 'success' | 'warning' | 'error'
   */
  byNotificationType(notificationType: HapticNotificationType): void {
    try {
      switch (notificationType) {
        case 'success':
          this.success();
          break;
        case 'warning':
          this.warning();
          break;
        case 'error':
          this.error();
          break;
        default:
          logger.warn('Unknown notification type', {
            component: 'HapticFeedbackService',
            notificationType,
          });
      }
    } catch (error) {
      logger.error(
        'Error triggering haptic feedback by notification type',
        error as Error,
        {
          component: 'HapticFeedbackService',
          notificationType,
        },
      );
    }
  }

  /**
   * Update haptic feedback options
   * @param customOptions - New options to merge with existing
   */
  setOptions(customOptions: HapticFeedbackOptions): void {
    this.options = {
      ...this.options,
      ...customOptions,
    };

    logger.debug('Haptic feedback options updated', {
      component: 'HapticFeedbackService',
      options: this.options,
    });
  }

  /**
   * Get current haptic feedback options
   */
  getOptions(): HapticFeedbackOptions {
    return {...this.options};
  }

  /**
   * Check if haptic feedback is available on the device
   */
  isAvailable(): boolean {
    return this.isSupported;
  }
}

// Export singleton instance for default usage
export const HapticFeedback = new HapticFeedbackService();

// Export class and types for advanced usage
export default HapticFeedback;

// Type exports
export type {
  HapticFeedbackOptions,
  HapticFeedbackType,
  HapticIntensity,
  HapticNotificationType,
};

export {HapticFeedbackService};
