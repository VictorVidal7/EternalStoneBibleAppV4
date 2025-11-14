/**
 * AnalyticsService
 *
 * Servicio de análiticas para rastrear eventos de usuario
 * Características:
 * - Integración con Firebase Analytics (con verificación de disponibilidad)
 * - Fallback a Sentry breadcrumbs si Firebase no está disponible
 * - Logger profesional con tipos TypeScript
 * - Tipado completo de eventos
 * - Redacción de información sensible
 */

import {logger} from '../lib/utils/logger';
import * as Sentry from '@sentry/react-native';

// ============================================================================
// Tipos
// ============================================================================

/**
 * Parámetros genéricos para eventos de analytics
 */
interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Parámetros para screen_view
 */
interface ScreenViewParams extends EventParams {
  screen_name: string;
}

/**
 * Parámetros para reading_progress
 */
interface ReadingProgressParams extends EventParams {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Parámetros para plan_started
 */
interface PlanStartedParams extends EventParams {
  plan_id: string;
}

/**
 * Parámetros para search
 */
interface SearchParams extends EventParams {
  query: string;
  search_type: string;
  results_count: number;
}

/**
 * Parámetros para verse_read
 */
interface VerseReadParams extends EventParams {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Parámetros para bookmark_added
 */
interface BookmarkAddedParams extends EventParams {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Parámetros para note_added
 */
interface NoteAddedParams extends EventParams {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Parámetros para verse_shared
 */
interface VerseSharedParams extends EventParams {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Parámetros para reading_plan_progress
 */
interface ReadingPlanProgressParams extends EventParams {
  plan_id: string;
  day_completed: number;
}

/**
 * Parámetros para settings_changed
 */
interface SettingsChangedParams extends EventParams {
  setting_name: string;
  new_value: string | number | boolean;
}

/**
 * Parámetros para app_error
 */
interface AppErrorParams extends EventParams {
  error_type: string;
  error_message: string;
}

/**
 * Parámetros para performance_metric
 */
interface PerformanceMetricParams extends EventParams {
  metric_name: string;
  value: number;
}

// ============================================================================
// Servicio
// ============================================================================

/**
 * Clase para gestionar Analytics de la aplicación
 * Proporciona abstracción sobre Firebase Analytics con fallback a Sentry
 */
class AnalyticsServiceImpl {
  private analyticsAvailable: boolean = false;
  private analyticsModule: any = null;

  constructor() {
    this.checkAnalyticsAvailability();
  }

  /**
   * Verifica si Firebase Analytics está disponible
   */
  private checkAnalyticsAvailability(): void {
    try {
      // Intentar importar Firebase Analytics
      const analytics = require('@react-native-firebase/analytics').default;
      if (analytics && typeof analytics === 'function') {
        this.analyticsModule = analytics();
        this.analyticsAvailable = true;
        logger.debug('Firebase Analytics disponible');
      } else {
        this.analyticsAvailable = false;
        logger.warn(
          'Firebase Analytics module no tiene la estructura esperada',
        );
      }
    } catch (error) {
      this.analyticsAvailable = false;
      logger.warn('Firebase Analytics no está instalado o disponible', {
        component: 'AnalyticsService',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Registra un evento en analytics
   * Intenta usar Firebase Analytics, fallback a Sentry breadcrumb
   */
  async logEvent(eventName: string, params: EventParams = {}): Promise<void> {
    try {
      if (this.analyticsAvailable && this.analyticsModule) {
        // Usar Firebase Analytics si está disponible
        await this.analyticsModule.logEvent(eventName, params);
        logger.debug(`Analytics event logged: ${eventName}`, {
          component: 'AnalyticsService',
          eventName,
          params,
        });
      } else {
        // Fallback a Sentry breadcrumb
        this.logEventToSentry(eventName, params);
      }
    } catch (error) {
      // Si falla Firebase, usar Sentry como fallback
      logger.error(
        `Error logging event to Firebase: ${eventName}`,
        error as Error,
        {
          component: 'AnalyticsService',
          eventName,
          params,
        },
      );
      this.logEventToSentry(eventName, params);
    }
  }

  /**
   * Registra un evento en Sentry como breadcrumb (fallback)
   */
  private logEventToSentry(eventName: string, params: EventParams): void {
    try {
      Sentry.addBreadcrumb({
        category: 'analytics',
        message: `Analytics event: ${eventName}`,
        level: 'info',
        data: params,
      });
    } catch (error) {
      logger.error('Error adding breadcrumb to Sentry', error as Error, {
        component: 'AnalyticsService',
        eventName,
      });
    }
  }

  /**
   * Establece una propiedad de usuario
   */
  async setUserProperty(name: string, value: string | number): Promise<void> {
    try {
      if (this.analyticsAvailable && this.analyticsModule) {
        await this.analyticsModule.setUserProperty(name, String(value));
        logger.debug(`User property set: ${name} = ${value}`, {
          component: 'AnalyticsService',
          propertyName: name,
        });
      } else {
        logger.warn('Firebase Analytics no disponible para setUserProperty', {
          component: 'AnalyticsService',
          propertyName: name,
        });
        // Fallback: registrar como breadcrumb
        Sentry.addBreadcrumb({
          category: 'user_property',
          message: `User property: ${name}`,
          level: 'info',
          data: {[name]: value},
        });
      }
    } catch (error) {
      logger.error(`Error setting user property: ${name}`, error as Error, {
        component: 'AnalyticsService',
        propertyName: name,
      });
    }
  }

  /**
   * Registra una visualización de pantalla
   */
  async logScreenView(screenName: string): Promise<void> {
    const params: ScreenViewParams = {screen_name: screenName};
    await this.logEvent('screen_view', params);
  }

  /**
   * Registra el progreso de lectura
   */
  async logReadingProgress(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const params: ReadingProgressParams = {book, chapter, verse};
    await this.logEvent('reading_progress', params);
  }

  /**
   * Registra el inicio de un plan de lectura
   */
  async logPlanStarted(planId: string): Promise<void> {
    const params: PlanStartedParams = {plan_id: planId};
    await this.logEvent('plan_started', params);
  }

  /**
   * Registra una búsqueda
   */
  async logSearch(
    query: string,
    searchType: string,
    resultsCount: number,
  ): Promise<void> {
    const params: SearchParams = {
      query,
      search_type: searchType,
      results_count: resultsCount,
    };
    await this.logEvent('search', params);
  }

  /**
   * Registra la lectura de un versículo
   */
  async logVerseRead(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const params: VerseReadParams = {book, chapter, verse};
    await this.logEvent('verse_read', params);
  }

  /**
   * Registra un marcador agregado
   */
  async logBookmarkAdded(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const params: BookmarkAddedParams = {book, chapter, verse};
    await this.logEvent('bookmark_added', params);
  }

  /**
   * Registra una nota agregada
   */
  async logNoteAdded(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const params: NoteAddedParams = {book, chapter, verse};
    await this.logEvent('note_added', params);
  }

  /**
   * Registra el compartir de un versículo
   */
  async logShareVerse(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const params: VerseSharedParams = {book, chapter, verse};
    await this.logEvent('verse_shared', params);
  }

  /**
   * Registra el progreso del plan de lectura
   */
  async logReadingPlanProgress(
    planId: string,
    dayCompleted: number,
  ): Promise<void> {
    const params: ReadingPlanProgressParams = {
      plan_id: planId,
      day_completed: dayCompleted,
    };
    await this.logEvent('reading_plan_progress', params);
  }

  /**
   * Registra cambios en configuración
   */
  async logSettingsChanged(
    settingName: string,
    newValue: string | number | boolean,
  ): Promise<void> {
    const params: SettingsChangedParams = {
      setting_name: settingName,
      new_value: newValue,
    };
    await this.logEvent('settings_changed', params);
  }

  /**
   * Registra un error de la aplicación
   */
  async logError(errorType: string, errorMessage: string): Promise<void> {
    const params: AppErrorParams = {
      error_type: errorType,
      error_message: errorMessage,
    };
    await this.logEvent('app_error', params);

    // También registrar en Sentry como error crítico
    logger.error(`Application error: ${errorType}`, new Error(errorMessage), {
      component: 'AnalyticsService',
      errorType,
    });
  }

  /**
   * Registra una métrica de rendimiento
   */
  async logPerformanceMetric(metricName: string, value: number): Promise<void> {
    const params: PerformanceMetricParams = {
      metric_name: metricName,
      value,
    };
    await this.logEvent('performance_metric', params);
  }

  /**
   * Obtiene el estado de disponibilidad de Firebase Analytics
   */
  isAnalyticsAvailable(): boolean {
    return this.analyticsAvailable;
  }
}

// ============================================================================
// Exportar instancia única (Singleton)
// ============================================================================

export const AnalyticsService = new AnalyticsServiceImpl();

export default AnalyticsService;
