/**
 * Contexto Global de Servicios
 * Proporciona acceso a todos los servicios de la app (logros, resaltados, analytics)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BibleDatabase } from '../lib/database';
import { AchievementService } from '../lib/achievements/AchievementService';
import { HighlightService } from '../lib/highlights/HighlightService';
import { AdvancedAnalytics } from '../lib/analytics/AdvancedAnalytics';
import { Achievement } from '../lib/achievements/types';

interface ServicesContextType {
  database: BibleDatabase | null;
  achievementService: AchievementService | null;
  highlightService: HighlightService | null;
  analyticsService: AdvancedAnalytics | null;
  initialized: boolean;
  newAchievements: Achievement[];
  clearNewAchievements: () => void;
}

const ServicesContext = createContext<ServicesContextType>({
  database: null,
  achievementService: null,
  highlightService: null,
  analyticsService: null,
  initialized: false,
  newAchievements: [],
  clearNewAchievements: () => {},
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
  const [achievementService, setAchievementService] = useState<AchievementService | null>(null);
  const [highlightService, setHighlightService] = useState<HighlightService | null>(null);
  const [analyticsService, setAnalyticsService] = useState<AdvancedAnalytics | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!database) return;

    const initializeServices = async () => {
      try {
        console.log('🔵 Initializing services...');

        // Inicializar servicios
        const achievements = new AchievementService(database);
        const highlights = new HighlightService(database);
        const analytics = new AdvancedAnalytics(database);

        await Promise.all([
          achievements.initialize(),
          highlights.initialize(),
          analytics.initialize(),
        ]);

        setAchievementService(achievements);
        setHighlightService(highlights);
        setAnalyticsService(analytics);
        setInitialized(true);

        console.log('🟢 Services initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing services:', error);
      }
    };

    initializeServices();
  }, [database]);

  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  const value: ServicesContextType = {
    database,
    achievementService,
    highlightService,
    analyticsService,
    initialized,
    newAchievements,
    clearNewAchievements,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
