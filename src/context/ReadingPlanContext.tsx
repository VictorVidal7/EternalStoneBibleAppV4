/**
 * Contexto de Plan de Lectura
 * Gestiona el plan de lectura actual y el progreso del usuario
 * Proporciona métodos para seleccionar planes, marcar días completados, etc.
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Estructura para un día completado en el plan
 */
interface DayProgress {
  [day: number]: boolean;
}

/**
 * Estructura de progreso del plan de lectura
 */
interface PlanProgress {
  [planId: string]: DayProgress;
}

/**
 * Estructura de un plan de lectura
 */
interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // Días
  status?: 'active' | 'completed' | 'paused';
  startDate?: string;
  endDate?: string;
  [key: string]: any; // Permite propiedades adicionales
}

/**
 * Tipo de contexto para el proveedor de plan de lectura
 */
interface ReadingPlanContextType {
  currentPlan: ReadingPlan | null;
  progress: PlanProgress;
  savePlan: (plan: ReadingPlan) => Promise<void>;
  startPlan: () => Promise<void>;
  continuePlan: () => void;
  updateProgress: (day: number) => Promise<void>;
  getProgress: (planId?: string) => DayProgress | null;
  getCompletionPercentage: (planId?: string) => number;
  clearProgress: () => Promise<void>;
}

/**
 * Props del componente proveedor
 */
interface ReadingPlanProviderProps {
  children: ReactNode;
}

/**
 * Crear el contexto con valores por defecto
 */
const ReadingPlanContext = createContext<ReadingPlanContextType>({
  currentPlan: null,
  progress: {},
  savePlan: async () => {},
  startPlan: async () => {},
  continuePlan: () => {},
  updateProgress: async () => {},
  getProgress: () => null,
  getCompletionPercentage: () => 0,
  clearProgress: async () => {},
});

/**
 * Proveedor del contexto de plan de lectura
 * Gestiona el estado global del plan de lectura y persistencia
 */
export const ReadingPlanProvider: React.FC<ReadingPlanProviderProps> = ({
  children,
}): React.ReactElement => {
  const [currentPlan, setCurrentPlan] = useState<ReadingPlan | null>(null);
  const [progress, setProgress] = useState<PlanProgress>({});

  /**
   * Cargar el progreso guardado al montar el componente
   */
  useEffect(() => {
    loadSavedData();
  }, []);

  /**
   * Cargar progreso y plan actual desde el almacenamiento
   */
  const loadSavedData = async (): Promise<void> => {
    try {
      logger.debug('Loading saved reading plan data', {
        component: 'ReadingPlanContext',
      });

      // Cargar progreso
      const savedProgress = await AsyncStorage.getItem('readingPlanProgress');
      if (savedProgress) {
        const parsedProgress: PlanProgress = JSON.parse(savedProgress);
        setProgress(parsedProgress);
        logger.debug('Progress loaded successfully', {
          component: 'ReadingPlanContext',
          progressKeys: Object.keys(parsedProgress),
        });
      }

      // Cargar plan actual
      const savedPlan = await AsyncStorage.getItem('currentPlan');
      if (savedPlan) {
        const parsedPlan: ReadingPlan = JSON.parse(savedPlan);
        setCurrentPlan(parsedPlan);
        logger.debug('Current plan loaded', {
          component: 'ReadingPlanContext',
          planId: parsedPlan.id,
          planName: parsedPlan.name,
        });
      }
    } catch (error) {
      logger.error('Error loading reading plan data', error as Error, {
        component: 'ReadingPlanContext',
        action: 'loadSavedData',
      });
    }
  };

  /**
   * Guardar un plan como el plan actual
   */
  const savePlan = async (plan: ReadingPlan): Promise<void> => {
    try {
      logger.debug('Saving new reading plan', {
        component: 'ReadingPlanContext',
        planId: plan.id,
        planName: plan.name,
      });

      setCurrentPlan(plan);
      await AsyncStorage.setItem('currentPlan', JSON.stringify(plan));

      logger.breadcrumb('Plan saved', 'reading-plan', {
        planId: plan.id,
        planName: plan.name,
      });
    } catch (error) {
      logger.error('Error saving reading plan', error as Error, {
        component: 'ReadingPlanContext',
        action: 'savePlan',
        planId: plan.id,
      });
      throw error;
    }
  };

  /**
   * Iniciar un nuevo plan (marcar el día 1 como completado)
   */
  const startPlan = async (): Promise<void> => {
    try {
      if (!currentPlan) {
        logger.warn('Attempted to start plan without selecting one', {
          component: 'ReadingPlanContext',
          action: 'startPlan',
        });
        return;
      }

      logger.debug('Starting reading plan', {
        component: 'ReadingPlanContext',
        planId: currentPlan.id,
      });

      const newProgress: PlanProgress = {
        ...progress,
        [currentPlan.id]: {1: true},
      };

      setProgress(newProgress);
      await AsyncStorage.setItem(
        'readingPlanProgress',
        JSON.stringify(newProgress),
      );

      logger.breadcrumb('Plan started', 'reading-plan', {
        planId: currentPlan.id,
        planName: currentPlan.name,
      });
    } catch (error) {
      logger.error('Error starting reading plan', error as Error, {
        component: 'ReadingPlanContext',
        action: 'startPlan',
        planId: currentPlan?.id,
      });
      throw error;
    }
  };

  /**
   * Continuar con un plan existente (placeholder)
   * Implementar la lógica para continuar el plan según sea necesario
   */
  const continuePlan = (): void => {
    logger.debug('Continuing reading plan', {
      component: 'ReadingPlanContext',
      planId: currentPlan?.id,
    });

    logger.breadcrumb('Plan continued', 'reading-plan', {
      planId: currentPlan?.id,
    });
  };

  /**
   * Actualizar el progreso para un día específico
   */
  const updateProgress = async (day: number): Promise<void> => {
    try {
      if (!currentPlan) {
        logger.warn('Attempted to update progress without a plan', {
          component: 'ReadingPlanContext',
          action: 'updateProgress',
        });
        return;
      }

      logger.debug('Updating reading plan progress', {
        component: 'ReadingPlanContext',
        planId: currentPlan.id,
        day,
      });

      const planProgress = progress[currentPlan.id] || {};
      const newProgress: PlanProgress = {
        ...progress,
        [currentPlan.id]: {...planProgress, [day]: true},
      };

      setProgress(newProgress);
      await AsyncStorage.setItem(
        'readingPlanProgress',
        JSON.stringify(newProgress),
      );

      logger.breadcrumb('Progress updated', 'reading-plan', {
        planId: currentPlan.id,
        day,
        completionPercentage: Math.round(
          (Object.keys(newProgress[currentPlan.id]).length /
            (currentPlan.duration || 1)) *
            100,
        ),
      });
    } catch (error) {
      logger.error('Error updating reading plan progress', error as Error, {
        component: 'ReadingPlanContext',
        action: 'updateProgress',
        planId: currentPlan?.id,
        day,
      });
      throw error;
    }
  };

  /**
   * Obtener el progreso de un plan específico
   */
  const getProgress = (planId?: string): DayProgress | null => {
    const targetPlanId = planId || currentPlan?.id;
    if (!targetPlanId) {
      return null;
    }
    return progress[targetPlanId] || null;
  };

  /**
   * Obtener el porcentaje de completitud de un plan
   */
  const getCompletionPercentage = (planId?: string): number => {
    const targetPlanId = planId || currentPlan?.id;
    if (!targetPlanId || !currentPlan) {
      return 0;
    }

    const planProgress = progress[targetPlanId];
    if (!planProgress) {
      return 0;
    }

    const completedDays = Object.values(planProgress).filter(Boolean).length;
    const totalDays = currentPlan.duration || 1;

    return Math.round((completedDays / totalDays) * 100);
  };

  /**
   * Limpiar el progreso del plan actual
   */
  const clearProgress = async (): Promise<void> => {
    try {
      if (!currentPlan) {
        return;
      }

      logger.debug('Clearing reading plan progress', {
        component: 'ReadingPlanContext',
        planId: currentPlan.id,
      });

      const newProgress: PlanProgress = {...progress};
      delete newProgress[currentPlan.id];

      setProgress(newProgress);
      await AsyncStorage.setItem(
        'readingPlanProgress',
        JSON.stringify(newProgress),
      );

      logger.breadcrumb('Progress cleared', 'reading-plan', {
        planId: currentPlan.id,
      });
    } catch (error) {
      logger.error('Error clearing reading plan progress', error as Error, {
        component: 'ReadingPlanContext',
        action: 'clearProgress',
        planId: currentPlan?.id,
      });
      throw error;
    }
  };

  /**
   * Valor del contexto
   */
  const value: ReadingPlanContextType = {
    currentPlan,
    progress,
    savePlan,
    startPlan,
    continuePlan,
    updateProgress,
    getProgress,
    getCompletionPercentage,
    clearProgress,
  };

  return (
    <ReadingPlanContext.Provider value={value}>
      {children}
    </ReadingPlanContext.Provider>
  );
};

/**
 * Hook para usar el contexto de plan de lectura
 * Debe usarse dentro del proveedor ReadingPlanProvider
 *
 * @throws Error si se usa fuera del proveedor
 * @returns {ReadingPlanContextType} Contexto del plan de lectura
 */
export const useReadingPlan = (): ReadingPlanContextType => {
  const context = useContext(ReadingPlanContext);
  if (!context) {
    throw new Error('useReadingPlan must be used within a ReadingPlanProvider');
  }
  return context;
};

/**
 * Exportar tipos para uso en otros componentes
 */
export type {ReadingPlan, PlanProgress, DayProgress, ReadingPlanContextType};
