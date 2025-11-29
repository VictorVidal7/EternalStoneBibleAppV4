/**
 * 🌟 CHAPTER FAVORITES HOOK
 *
 * Hook para gestionar capítulos favoritos del usuario
 * Persiste en AsyncStorage para acceso rápido
 * Para la gloria de Dios y del Rey Jesús
 */

import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {logger} from '../lib/utils/logger';

const FAVORITES_STORAGE_KEY = '@eternal_bible_chapter_favorites';

export interface ChapterFavorite {
  id: string;
  bookName: string;
  chapter: number;
  addedAt: number; // timestamp
}

export function useChapterFavorites() {
  const [favorites, setFavorites] = useState<ChapterFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos al iniciar
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * Cargar favoritos desde AsyncStorage
   */
  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(parsed);
        logger.info('Chapter favorites loaded', {
          component: 'useChapterFavorites',
          count: parsed.length,
        });
      }
    } catch (error) {
      logger.error('Failed to load chapter favorites', {
        component: 'useChapterFavorites',
        error,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Guardar favoritos en AsyncStorage
   */
  const saveFavorites = useCallback(async (newFavorites: ChapterFavorite[]) => {
    try {
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(newFavorites),
      );
      logger.info('Chapter favorites saved', {
        component: 'useChapterFavorites',
        count: newFavorites.length,
      });
    } catch (error) {
      logger.error('Failed to save chapter favorites', {
        component: 'useChapterFavorites',
        error,
      });
    }
  }, []);

  /**
   * Verificar si un capítulo es favorito
   */
  const isFavorite = useCallback(
    (bookName: string, chapter: number): boolean => {
      return favorites.some(
        fav => fav.bookName === bookName && fav.chapter === chapter,
      );
    },
    [favorites],
  );

  /**
   * Agregar capítulo a favoritos
   */
  const addFavorite = useCallback(
    async (bookName: string, chapter: number) => {
      const id = `${bookName}-${chapter}`;
      const newFavorite: ChapterFavorite = {
        id,
        bookName,
        chapter,
        addedAt: Date.now(),
      };

      const newFavorites = [...favorites, newFavorite];
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      logger.info('Chapter added to favorites', {
        component: 'useChapterFavorites',
        bookName,
        chapter,
      });

      return newFavorite;
    },
    [favorites, saveFavorites],
  );

  /**
   * Remover capítulo de favoritos
   */
  const removeFavorite = useCallback(
    async (bookName: string, chapter: number) => {
      const newFavorites = favorites.filter(
        fav => !(fav.bookName === bookName && fav.chapter === chapter),
      );
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      logger.info('Chapter removed from favorites', {
        component: 'useChapterFavorites',
        bookName,
        chapter,
      });
    },
    [favorites, saveFavorites],
  );

  /**
   * Toggle favorito
   */
  const toggleFavorite = useCallback(
    async (bookName: string, chapter: number) => {
      if (isFavorite(bookName, chapter)) {
        await removeFavorite(bookName, chapter);
        return false;
      } else {
        await addFavorite(bookName, chapter);
        return true;
      }
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  /**
   * Obtener favoritos de un libro específico
   */
  const getFavoritesByBook = useCallback(
    (bookName: string): ChapterFavorite[] => {
      return favorites.filter(fav => fav.bookName === bookName);
    },
    [favorites],
  );

  /**
   * Limpiar todos los favoritos
   */
  const clearAll = useCallback(async () => {
    setFavorites([]);
    await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);

    logger.info('All chapter favorites cleared', {
      component: 'useChapterFavorites',
    });
  }, []);

  return {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoritesByBook,
    clearAll,
    totalCount: favorites.length,
  };
}
