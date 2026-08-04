/**
 * Contexto Global de Servicios
 * Proporciona acceso a todos los servicios de la app (logros, resaltados)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {BibleDatabase} from '../lib/database';
import {AchievementService} from '../lib/achievements/AchievementService';
import {
  setAchievementServiceInstance,
  getAchievementServiceInstance,
} from '../lib/achievements/instance';
import {HighlightService} from '../lib/highlights/HighlightService';
import {Achievement} from '../lib/achievements/types';
import {logger} from '../lib/utils/logger';

interface ServicesContextType {
  database: BibleDatabase | null;
  achievementService: AchievementService | null;
  highlightService: HighlightService | null;
  initialized: boolean;
  newAchievements: Achievement[];
  clearNewAchievements: () => void;
  /**
   * Surface freshly-unlocked achievements so the global
   * [[AchievementNotifications]] modal can celebrate them. Until Sprint 64
   * `setNewAchievements` was never called, so reader-driven unlocks (verse /
   * chapter milestones, and now book completion) unlocked silently in the DB
   * and only ever appeared in the Achievements tab. Idempotent unlocks already
   * return [], so this only ever fires for genuinely new achievements.
   */
  notifyAchievements: (achievements: Achievement[]) => void;
}

const ServicesContext = createContext<ServicesContextType>({
  database: null,
  achievementService: null,
  highlightService: null,
  initialized: false,
  newAchievements: [],
  clearNewAchievements: () => {},
  notifyAchievements: () => {},
});

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
};

interface ServicesProviderProps {
  children: ReactNode;
  database: BibleDatabase;
}

export const ServicesProvider: React.FC<ServicesProviderProps> = ({
  children,
  database,
}) => {
  const [achievementService, setAchievementService] =
    useState<AchievementService | null>(null);
  const [highlightService, setHighlightService] =
    useState<HighlightService | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!database) return;

    // Tracks the instance THIS effect run published into the module-level
    // singleton (if any) — the async `initializeServices` below can still be
    // in flight when cleanup fires, so cleanup only clears the singleton if
    // it still holds what this effect run actually published, never a value
    // published by a newer run (avoids a stale-clear race on a `database`
    // change/remount).
    let publishedInstance: AchievementService | null = null;

    const initializeServices = async () => {
      try {
        logger.info('🔵 Initializing services...', {
          component: 'ServicesProvider',
        });

        // IMPORTANTE: Inicializar la base de datos primero
        await database.initialize();
        logger.info('🟢 Database initialized for services', {
          component: 'ServicesProvider',
        });

        // Ahora inicializar servicios
        const achievements = new AchievementService(database);
        const highlights = new HighlightService(database);

        await Promise.all([achievements.initialize(), highlights.initialize()]);

        // One-shot normalization of book identities for favorites/highlights/
        // notes (Sprint 58). Runs here, after every table exists (the
        // highlights table is created by HighlightService.initialize above).
        await database.migrateCanonicalBookKeys();

        setAchievementService(achievements);
        setHighlightService(highlights);
        // Mirror into the module-level singleton so non-React callsites
        // (BackupService's export/import) reach this SAME instance instead
        // of constructing their own — see lib/achievements/instance.ts.
        publishedInstance = achievements;
        setAchievementServiceInstance(achievements);
        setInitialized(true);
        logger.info('🟢 Services initialized successfully', {
          component: 'ServicesProvider',
        });
      } catch (error) {
        logger.error('❌ Error initializing services:', error as Error, {
          component: 'ServicesProvider',
        });
      }
    };

    initializeServices();

    return () => {
      if (
        publishedInstance &&
        getAchievementServiceInstance() === publishedInstance
      ) {
        setAchievementServiceInstance(null);
      }
    };
  }, [database]);

  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  const notifyAchievements = useCallback((achievements: Achievement[]) => {
    if (achievements.length > 0) {
      setNewAchievements(prev => [...prev, ...achievements]);
    }
  }, []);

  const value: ServicesContextType = {
    database,
    achievementService,
    highlightService,
    initialized,
    newAchievements,
    clearNewAchievements,
    notifyAchievements,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
