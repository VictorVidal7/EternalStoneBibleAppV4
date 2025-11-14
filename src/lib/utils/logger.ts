/**
 * Professional Logging System
 *
 * Features:
 * - Different log levels (debug, info, warn, error)
 * - Automatic Sentry integration for errors
 * - Sensitive data redaction
 * - Development/Production modes
 * - Structured logging
 */

import * as Sentry from '@sentry/react-native';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  component?: string;
  screen?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'session',
  'email',
  'phone',
  'creditCard',
];

/**
 * Redact sensitive information from objects
 */
function redactSensitive(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey.toLowerCase()),
    );

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context
    ? ` | Context: ${JSON.stringify(redactSensitive(context))}`
    : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Info level logging - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    const formattedMessage = formatLogMessage(LogLevel.WARN, message, context);
    console.warn(formattedMessage);

    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: redactSensitive(context || {}),
    });
  }

  /**
   * Error level logging - always logs and sends to Sentry
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = formatLogMessage(LogLevel.ERROR, message, context);
    console.error(formattedMessage);

    if (error) {
      console.error('Error details:', error);
    }

    // Send to Sentry
    Sentry.captureException(error || new Error(message), {
      tags: {
        component: context?.component,
        screen: context?.screen,
        action: context?.action,
      },
      extra: redactSensitive(context || {}),
    });
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  breadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>,
  ): void {
    Sentry.addBreadcrumb({
      category,
      message,
      level: 'info',
      data: redactSensitive(data || {}),
    });

    if (this.isDevelopment) {
      console.log(`[BREADCRUMB] [${category}] ${message}`, data);
    }
  }

  /**
   * Performance logging
   */
  performance(action: string, duration: number, context?: LogContext): void {
    const message = `${action} took ${duration}ms`;

    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.INFO, message, context));
    }

    Sentry.addBreadcrumb({
      category: 'performance',
      message,
      level: 'info',
      data: {
        action,
        duration,
        ...redactSensitive(context || {}),
      },
    });
  }

  /**
   * Measure performance of a function
   */
  async measurePerformance<T>(
    action: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.performance(action, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(
        `${action} failed after ${duration}ms`,
        error as Error,
        context,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export {redactSensitive};
