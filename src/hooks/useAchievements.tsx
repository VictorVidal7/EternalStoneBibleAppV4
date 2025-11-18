/**
 * Hook personalizado para gestionar logros
 */

import { useState, useEffect, useCallback } from 'react';
import { AchievementService } from '../lib/achievements/AchievementService';
import { Achievement, UserStats, ReadingStreak } from '../lib/achievements/types';
import { BibleDatabase } from '../lib/database';
import { useLanguage } from './useLanguage';
import { getAchievementDefinitions } from '../lib/achievements/definitions';

export function useAchievements(database: BibleDatabase | null) {
  const { language } = useLanguage();
  const [service, setService] = useState<AchievementService | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<ReadingStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  // Helper function to translate achievements
  const translateAchievements = useCallback((achievements: Achievement[]): Achievement[] => {
    const translations = getAchievementDefinitions(language);
    return achievements.map(achievement => {
      const translation = translations.find(t => t.id === achievement.id);
      return translation ? {
        ...achievement,
        name: translation.name,
        description: translation.description,
      } : achievement;
    });
  }, [language]);

  // Inicializar servicio
  useEffect(() => {
    if (!database) return;

    const achievementService = new AchievementService(database);
    achievementService.initialize().then(() => {
      setService(achievementService);
      setLoading(false);
    });
  }, [database]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!service) return;

    const loadData = async () => {
      try {
        const [allAchievements, userStats, readingStreak] = await Promise.all([
          service.getAllAchievements(),
          service.getUserStats(),
          service.getReadingStreak(),
        ]);

        setAchievements(translateAchievements(allAchievements));
        setStats(userStats);
        setStreak(readingStreak);
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    };

    loadData();
  }, [service, translateAchievements]);

  /**
   * Registra lectura de versículos
   */
  const trackVersesRead = useCallback(
    async (count: number, timeSpent: number = 0) => {
      if (!service) return;

      const unlocked = await service.trackVersesRead(count, timeSpent);
      if (unlocked.length > 0) {
        setNewUnlocks(unlocked);
      }

      // Refrescar datos
      const [updatedAchievements, updatedStats, updatedStreak] = await Promise.all([
        service.getAllAchievements(),
        service.getUserStats(),
        service.getReadingStreak(),
      ]);

      setAchievements(translateAchievements(updatedAchievements));
      setStats(updatedStats);
      setStreak(updatedStreak);
    },
    [service, translateAchievements]
  );

  /**
   * Registra capítulo completado
   */
  const trackChapterCompleted = useCallback(async () => {
    if (!service) return;

    const unlocked = await service.trackChapterCompleted();
    if (unlocked.length > 0) {
      setNewUnlocks(unlocked);
    }

    const [updatedAchievements, updatedStats] = await Promise.all([
      service.getAllAchievements(),
      service.getUserStats(),
    ]);

    setAchievements(translateAchievements(updatedAchievements));
    setStats(updatedStats);
  }, [service, translateAchievements]);

  /**
   * Registra libro completado
   */
  const trackBookCompleted = useCallback(
    async (bookId: string) => {
      if (!service) return;

      const unlocked = await service.trackBookCompleted(bookId);
      if (unlocked.length > 0) {
        setNewUnlocks(unlocked);
      }

      const [updatedAchievements, updatedStats] = await Promise.all([
        service.getAllAchievements(),
        service.getUserStats(),
      ]);

      setAchievements(updatedAchievements);
      setStats(updatedStats);
    },
    [service]
  );

  /**
   * Registra highlight
   */
  const trackHighlight = useCallback(async () => {
    if (!service) return;
    await service.trackHighlight();

    const [updatedAchievements, updatedStats] = await Promise.all([
      service.getAllAchievements(),
      service.getUserStats(),
    ]);

    setAchievements(translateAchievements(updatedAchievements));
    setStats(updatedStats);
  }, [service, translateAchievements]);

  /**
   * Registra nota
   */
  const trackNote = useCallback(async () => {
    if (!service) return;
    await service.trackNote();

    const [updatedAchievements, updatedStats] = await Promise.all([
      service.getAllAchievements(),
      service.getUserStats(),
    ]);

    setAchievements(translateAchievements(updatedAchievements));
    setStats(updatedStats);
  }, [service, translateAchievements]);

  /**
   * Registra búsqueda
   */
  const trackSearch = useCallback(async () => {
    if (!service) return;
    await service.trackSearch();
  }, [service]);

  /**
   * Limpia notificaciones de nuevos logros
   */
  const clearNewUnlocks = useCallback(() => {
    setNewUnlocks([]);
  }, []);

  return {
    achievements,
    stats,
    streak,
    loading,
    newUnlocks,
    trackVersesRead,
    trackChapterCompleted,
    trackBookCompleted,
    trackHighlight,
    trackNote,
    trackSearch,
    clearNewUnlocks,
  };
}
