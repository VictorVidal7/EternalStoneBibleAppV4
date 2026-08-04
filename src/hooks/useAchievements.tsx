/**
 * Hook personalizado para gestionar logros
 *
 * Consumes the single app-wide `AchievementService` instance from
 * [[ServicesContext]] instead of constructing its own. `AchievementService`
 * caches `getUserStats()` in a private `this.stats` field that only its own
 * mutator methods (trackVersesRead, trackChapterCompleted, trackNote, ...)
 * invalidate. Every real tracking call site (the reader, notes, highlights,
 * search, book completion) goes through the ServicesContext instance, so a
 * second, independently-constructed instance here would never see its cache
 * invalidated by real activity — the Achievements tab's points/level/streak/
 * verses/chapters/books would freeze at whatever they were on first load.
 */

import {useState, useEffect, useCallback} from 'react';
import {useServices} from '../context/ServicesContext';
import {Achievement, UserStats, ReadingStreak} from '../lib/achievements/types';

export function useAchievements() {
  const {achievementService: service} = useServices();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<ReadingStreak | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);
  // ServicesProvider already awaits `achievementService.initialize()` before
  // publishing the instance (see ServicesContext.tsx), so a non-null service
  // here is guaranteed initialized — nothing left for this hook to await.
  const loading = service === null;

  // Cargar / recargar datos. Se expone como `reload` para que la pantalla
  // lo invoque al recuperar el foco y refleje el progreso de la lectura.
  const reload = useCallback(async () => {
    if (!service) return;

    try {
      const [allAchievements, userStats, readingStreak] = await Promise.all([
        service.getAllAchievements(),
        service.getUserStats(),
        service.getReadingStreak(),
      ]);

      setAchievements(allAchievements);
      setStats(userStats);
      setStreak(readingStreak);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, [service]);

  // Cargar datos iniciales
  useEffect(() => {
    reload();
  }, [reload]);

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
      const [updatedAchievements, updatedStats, updatedStreak] =
        await Promise.all([
          service.getAllAchievements(),
          service.getUserStats(),
          service.getReadingStreak(),
        ]);

      setAchievements(updatedAchievements);
      setStats(updatedStats);
      setStreak(updatedStreak);
    },
    [service],
  );

  /**
   * Registra capítulo completado
   */
  const trackChapterCompleted = useCallback(
    async (bookName: string, chapter: number) => {
      if (!service) return;

      const unlocked = await service.trackChapterCompleted(bookName, chapter);
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
    [service],
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

    setAchievements(updatedAchievements);
    setStats(updatedStats);
  }, [service]);

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

    setAchievements(updatedAchievements);
    setStats(updatedStats);
  }, [service]);

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
    reload,
    trackVersesRead,
    trackChapterCompleted,
    trackHighlight,
    trackNote,
    trackSearch,
    clearNewUnlocks,
  };
}
