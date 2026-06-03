/* eslint-disable no-console -- this IS the logger; all real
   console.* calls are intentional and gated by isDevelopment. */
/**
 * Professional Logging System
 *
 * Features:
 *  - Log levels (debug, info, warn, error) — debug/info gated to dev.
 *  - Automatic Firebase Crashlytics integration for errors (Sprint 40).
 *  - Sensitive-key redaction before anything leaves the device.
 *  - Lazy + defensive Crashlytics access so a missing/disabled native
 *    module never crashes the app (e.g., during Jest unit tests, where
 *    the native binding doesn't exist).
 *
 * Migration note: prior versions routed to @sentry/react-native. Sentry
 * is no longer wired (Sprint 40 replaced it with Crashlytics for the
 * Google ecosystem). Sentry remains in package.json for now but
 * unimported; can be removed once we're confident Crashlytics covers
 * everything we need.
 */

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
  [key: string]: unknown;
}

// Sensitive keys to redact from logs before sending to crash reporter.
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

/** Crashlytics native module — loaded lazily so jest + dev hot-reload
 *  don't bomb when the native binding isn't present. */
type CrashlyticsModule = {
  log: (msg: string) => void;
  recordError: (e: Error, jsErrorName?: string) => void;
  setAttribute: (key: string, value: string) => void;
  setAttributes: (attrs: Record<string, string>) => void;
  setUserId: (id: string) => void;
};
let _crashlytics: CrashlyticsModule | null | undefined;
function getCrashlytics(): CrashlyticsModule | null {
  if (_crashlytics !== undefined) return _crashlytics;
  try {
    const mod = require('@react-native-firebase/crashlytics');
    // The default export is a callable that returns the instance.
    _crashlytics = (mod.default || mod)() as CrashlyticsModule;
  } catch {
    _crashlytics = null;
  }
  return _crashlytics;
}

function redactSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(s =>
      lowerKey.includes(s.toLowerCase()),
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

/**
 * Emit a Crashlytics breadcrumb. Crashlytics has a single `log()` method
 * (not category-tagged like Sentry's breadcrumbs); we serialize the
 * category + payload into the text so it stays searchable in the
 * dashboard.
 */
function crashlyticsLog(
  level: LogLevel,
  category: string,
  message: string,
  context?: LogContext,
): void {
  const c = getCrashlytics();
  if (!c) return;
  const tag = `[${level.toUpperCase()}] [${category}]`;
  const ctx = context ? ` ${JSON.stringify(redactSensitive(context))}` : '';
  c.log(`${tag} ${message}${ctx}`);
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.INFO, message, context));
    }
    // Info-level breadcrumbs help reconstruct what the user did right
    // before a crash. Keep them concise so the Crashlytics log buffer
    // (last ~64 KB before a crash) stays useful.
    crashlyticsLog(LogLevel.INFO, 'info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    const formatted = formatLogMessage(LogLevel.WARN, message, context);
    console.warn(formatted);
    crashlyticsLog(LogLevel.WARN, 'warning', message, context);
  }

  /**
   * Error-level logging. Always logs and records a non-fatal exception
   * to Crashlytics so it surfaces on the dashboard even if the app
   * recovered without crashing.
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const formatted = formatLogMessage(LogLevel.ERROR, message, context);
    console.error(formatted);
    if (error) console.error('Error details:', error);

    const c = getCrashlytics();
    if (!c) return;

    // Tag the error with structured attributes so Crashlytics can group
    // by component/screen/action even though the message itself is just
    // a string. setAttributes is per-session so we set immediately
    // before recordError.
    if (context) {
      const attrs: Record<string, string> = {};
      if (context.component) attrs.component = String(context.component);
      if (context.screen) attrs.screen = String(context.screen);
      if (context.action) attrs.action = String(context.action);
      if (Object.keys(attrs).length > 0) c.setAttributes(attrs);
    }
    // recordError treats this as a NON-FATAL — the app keeps running.
    // For actual crashes the native layer reports them automatically.
    c.recordError(error || new Error(message));
  }

  /** Tag the current user id for crash attribution (opt-in). */
  setUserId(id: string): void {
    const c = getCrashlytics();
    if (!c) return;
    c.setUserId(id);
  }

  breadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>,
  ): void {
    crashlyticsLog(LogLevel.INFO, category, message, data as LogContext);
    if (this.isDevelopment) {
      console.log(`[BREADCRUMB] [${category}] ${message}`, data);
    }
  }

  performance(action: string, duration: number, context?: LogContext): void {
    const message = `${action} took ${duration}ms`;
    if (this.isDevelopment) {
      console.log(formatLogMessage(LogLevel.INFO, message, context));
    }
    crashlyticsLog(LogLevel.INFO, 'performance', message, {
      action,
      duration,
      ...(context || {}),
    });
  }

  async measurePerformance<T>(
    action: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      this.performance(action, Date.now() - startTime, context);
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

  /**
   * DEV-ONLY: force a fatal native crash so we can prove the
   * Crashlytics ingestion pipeline end-to-end. Crashes ~5-10 minutes
   * later show in the Firebase Console dashboard. Should never be
   * called from production code paths.
   */
  testCrash(): void {
    const c = getCrashlytics();
    if (!c) {
      console.error(
        '[logger.testCrash] Crashlytics module not available — ' +
          'check google-services.json and native rebuild.',
      );
      return;
    }
    // @ts-expect-error: `crash()` exists on the native module but isn't
    // in our minimal type declaration. We only use it from a hidden
    // debug action, never production code.
    c.crash();
  }
}

export const logger = new Logger();
export {redactSensitive};
