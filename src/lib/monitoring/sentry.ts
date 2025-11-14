/**
 * Configuración de Sentry para monitoreo y crash reporting
 * Proporciona tracking de errores y performance monitoring
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Inicializar Sentry para la aplicación
 *
 * IMPORTANTE: Antes de usar en producción, configura tu DSN en las variables de entorno
 * o en Constants.expoConfig.extra
 */
export function initializeSentry(): void {
  // Obtener DSN desde configuración (puedes usar expo-constants con .env)
  const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || '';

  // Solo inicializar si hay un DSN configurado
  if (!sentryDsn) {
    console.warn(
      '⚠️ Sentry DSN no configurado. El crash reporting está deshabilitado.\n' +
        'Para habilitar Sentry, configura SENTRY_DSN en tu archivo .env'
    );
    return;
  }

  Sentry.init({
    dsn: sentryDsn,

    // Configuración de entorno
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__, // Deshabilitar en desarrollo

    // Configuración de performance
    tracesSampleRate: 1.0, // Capturar 100% de transacciones en producción
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 segundos

    // Configuración de release
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Constants.expoConfig?.android?.versionCode?.toString() ||
          Constants.expoConfig?.ios?.buildNumber ||
          '1',

    // Configuración de breadcrumbs
    maxBreadcrumbs: 50,

    // Integración con React Native
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        tracingOrigins: ['localhost', /^\//],
      }),
    ],

    // Filtrar información sensible
    beforeSend(event, hint) {
      // Filtrar datos sensibles de eventos
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // No enviar errores de red en desarrollo
      if (__DEV__ && event.exception) {
        return null;
      }

      return event;
    },

    // Filtrar breadcrumbs sensibles
    beforeBreadcrumb(breadcrumb, hint) {
      // Filtrar URLs con información sensible
      if (breadcrumb.category === 'xhr' && breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(/api_key=[\w-]+/, 'api_key=[FILTERED]');
      }

      return breadcrumb;
    },
  });

  console.log('✅ Sentry inicializado correctamente');
}

/**
 * Capturar una excepción manualmente
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Capturar un mensaje informativo
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Establecer información del usuario
 */
export function setUser(user: { id: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Limpiar información del usuario
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Agregar breadcrumb personalizado
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Establecer etiquetas personalizadas
 */
export function setTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Establecer contexto adicional
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Iniciar una transacción de performance
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({ name, op });
}

/**
 * Wrapper para funciones async con tracking de errores
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  operationName?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Si es una promesa, capturar errores async
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, {
            operation: operationName || fn.name,
            arguments: args,
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, {
        operation: operationName || fn.name,
        arguments: args,
      });
      throw error;
    }
  }) as T;
}

/**
 * HOC para envolver componentes con error tracking
 */
export function withSentryProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
): React.ComponentType<P> {
  return Sentry.withProfiler(Component, { name: name || Component.displayName || Component.name });
}

export default Sentry;
