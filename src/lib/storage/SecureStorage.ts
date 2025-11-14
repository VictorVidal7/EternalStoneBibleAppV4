/**
 * SecureStorage - Secure storage wrapper using expo-secure-store
 *
 * Features:
 * - Encrypted storage for sensitive data
 * - Fallback to AsyncStorage for non-sensitive data
 * - Type-safe operations
 * - Error handling with logging
 * - Platform-specific encryption (iOS Keychain, Android Keystore)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../utils/logger';

/**
 * Storage options for SecureStore
 */
export interface SecureStorageOptions {
  keychainService?: string;
  keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
}

/**
 * Keys for sensitive data that should be stored securely
 */
export enum SecureStorageKey {
  USER_TOKEN = 'user_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_CREDENTIALS = 'user_credentials',
  ENCRYPTION_KEY = 'encryption_key',
  BIOMETRIC_KEY = 'biometric_key',
}

/**
 * Keys for non-sensitive data that can use regular AsyncStorage
 */
export enum RegularStorageKey {
  USER_PREFERENCES = 'user_preferences',
  THEME_MODE = 'theme_mode',
  LAST_SYNC = 'last_sync',
  APP_VERSION = 'app_version',
}

/**
 * SecureStorage class providing encrypted storage capabilities
 */
class SecureStorageService {
  /**
   * Store a value securely using expo-secure-store
   */
  async setSecure(
    key: SecureStorageKey | string,
    value: string,
    options?: SecureStorageOptions,
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, options);

      logger.debug('Secure value stored', {
        component: 'SecureStorage',
        action: 'setSecure',
        key,
      });
    } catch (error) {
      logger.error('Error storing secure value', error as Error, {
        component: 'SecureStorage',
        action: 'setSecure',
        key,
      });
      throw error;
    }
  }

  /**
   * Retrieve a value from secure storage
   */
  async getSecure(
    key: SecureStorageKey | string,
    options?: SecureStorageOptions,
  ): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key, options);

      logger.debug('Secure value retrieved', {
        component: 'SecureStorage',
        action: 'getSecure',
        key,
        found: !!value,
      });

      return value;
    } catch (error) {
      logger.error('Error retrieving secure value', error as Error, {
        component: 'SecureStorage',
        action: 'getSecure',
        key,
      });
      return null;
    }
  }

  /**
   * Remove a value from secure storage
   */
  async removeSecure(
    key: SecureStorageKey | string,
    options?: SecureStorageOptions,
  ): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, options);

      logger.debug('Secure value removed', {
        component: 'SecureStorage',
        action: 'removeSecure',
        key,
      });
    } catch (error) {
      logger.error('Error removing secure value', error as Error, {
        component: 'SecureStorage',
        action: 'removeSecure',
        key,
      });
      throw error;
    }
  }

  /**
   * Store a JSON object securely
   */
  async setSecureJSON<T>(
    key: SecureStorageKey | string,
    value: T,
    options?: SecureStorageOptions,
  ): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setSecure(key, jsonString, options);
    } catch (error) {
      logger.error('Error storing secure JSON', error as Error, {
        component: 'SecureStorage',
        action: 'setSecureJSON',
        key,
      });
      throw error;
    }
  }

  /**
   * Retrieve and parse a JSON object from secure storage
   */
  async getSecureJSON<T>(
    key: SecureStorageKey | string,
    options?: SecureStorageOptions,
  ): Promise<T | null> {
    try {
      const jsonString = await this.getSecure(key, options);

      if (!jsonString) {
        return null;
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error('Error retrieving secure JSON', error as Error, {
        component: 'SecureStorage',
        action: 'getSecureJSON',
        key,
      });
      return null;
    }
  }

  /**
   * Store a value in regular AsyncStorage (non-sensitive data)
   */
  async set(key: RegularStorageKey | string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);

      logger.debug('Value stored in AsyncStorage', {
        component: 'SecureStorage',
        action: 'set',
        key,
      });
    } catch (error) {
      logger.error('Error storing value', error as Error, {
        component: 'SecureStorage',
        action: 'set',
        key,
      });
      throw error;
    }
  }

  /**
   * Retrieve a value from regular AsyncStorage
   */
  async get(key: RegularStorageKey | string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);

      logger.debug('Value retrieved from AsyncStorage', {
        component: 'SecureStorage',
        action: 'get',
        key,
        found: !!value,
      });

      return value;
    } catch (error) {
      logger.error('Error retrieving value', error as Error, {
        component: 'SecureStorage',
        action: 'get',
        key,
      });
      return null;
    }
  }

  /**
   * Remove a value from regular AsyncStorage
   */
  async remove(key: RegularStorageKey | string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);

      logger.debug('Value removed from AsyncStorage', {
        component: 'SecureStorage',
        action: 'remove',
        key,
      });
    } catch (error) {
      logger.error('Error removing value', error as Error, {
        component: 'SecureStorage',
        action: 'remove',
        key,
      });
      throw error;
    }
  }

  /**
   * Store a JSON object in regular AsyncStorage
   */
  async setJSON<T>(key: RegularStorageKey | string, value: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString);
    } catch (error) {
      logger.error('Error storing JSON', error as Error, {
        component: 'SecureStorage',
        action: 'setJSON',
        key,
      });
      throw error;
    }
  }

  /**
   * Retrieve and parse a JSON object from regular AsyncStorage
   */
  async getJSON<T>(key: RegularStorageKey | string): Promise<T | null> {
    try {
      const jsonString = await this.get(key);

      if (!jsonString) {
        return null;
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error('Error retrieving JSON', error as Error, {
        component: 'SecureStorage',
        action: 'getJSON',
        key,
      });
      return null;
    }
  }

  /**
   * Clear all secure storage (use with caution!)
   */
  async clearSecure(): Promise<void> {
    try {
      // SecureStore doesn't have a clear all method
      // You need to delete each key individually
      const keys = Object.values(SecureStorageKey);

      for (const key of keys) {
        try {
          await this.removeSecure(key);
        } catch (error) {
          // Continue even if a key doesn't exist
        }
      }

      logger.warn('All secure storage cleared', {
        component: 'SecureStorage',
        action: 'clearSecure',
      });
    } catch (error) {
      logger.error('Error clearing secure storage', error as Error, {
        component: 'SecureStorage',
        action: 'clearSecure',
      });
      throw error;
    }
  }

  /**
   * Clear all regular AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();

      logger.warn('AsyncStorage cleared', {
        component: 'SecureStorage',
        action: 'clear',
      });
    } catch (error) {
      logger.error('Error clearing AsyncStorage', error as Error, {
        component: 'SecureStorage',
        action: 'clear',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();

// Export class for testing
export {SecureStorageService};
