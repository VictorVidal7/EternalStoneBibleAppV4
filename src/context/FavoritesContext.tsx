/**
 * 💙 FAVORITES CONTEXT
 * Sistema de versículos favoritos con categorías y ratings
 * Creado para la gloria de Dios Todopoderoso
 *
 * Features:
 * - Favoritos con categorías
 * - Sistema de rating (1-5 estrellas)
 * - Tags personalizados
 * - Búsqueda y filtrado
 * - Persistencia en SQLite
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
} from 'react';
import bibleDB from '../lib/database';
import {logger} from '../lib/utils/logger';
import {BibleVerse} from '../types/bible';

export type FavoriteCategory =
  | 'promise'
  | 'prayer'
  | 'wisdom'
  | 'encouragement'
  | 'worship'
  | 'other';

export interface Favorite {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  category: FavoriteCategory;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  addFavorite: (
    verse: BibleVerse,
    category: FavoriteCategory,
    rating?: number,
    tags?: string[],
    note?: string,
  ) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  updateFavorite: (
    id: string,
    updates: Partial<Omit<Favorite, 'id' | 'verseId' | 'createdAt'>>,
  ) => Promise<void>;
  isFavorite: (book: string, chapter: number, verse: number) => boolean;
  getFavoritesByCategory: (category: FavoriteCategory) => Favorite[];
  getFavoritesByRating: (rating: number) => Favorite[];
  searchFavorites: (query: string) => Favorite[];
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export const FavoritesProvider: FC<{children: ReactNode}> = ({children}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * Carga los favoritos desde la base de datos
   */
  async function loadFavorites(): Promise<void> {
    try {
      await bibleDB.initialize();
      const data = await bibleDB.getFavorites();
      setFavorites(data);
      setLoading(false);

      logger.info('Favorites loaded successfully', {
        component: 'FavoritesContext',
        count: data.length,
      });
    } catch (error) {
      logger.error('Error loading favorites', error as Error, {
        component: 'FavoritesContext',
      });
      setLoading(false);
    }
  }

  /**
   * Añade un versículo a favoritos
   */
  async function addFavorite(
    verse: BibleVerse,
    category: FavoriteCategory = 'other',
    rating: number = 5,
    tags: string[] = [],
    note?: string,
  ): Promise<void> {
    try {
      const verseId = `${verse.book}_${verse.chapter}_${verse.verse}`;

      // Verificar si ya existe
      const existing = favorites.find(f => f.verseId === verseId);
      if (existing) {
        logger.warn('Favorite already exists', {
          component: 'FavoritesContext',
          verseId,
        });
        return;
      }

      const favorite: Favorite = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        verseId,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        category,
        rating: Math.min(5, Math.max(1, rating)) as 1 | 2 | 3 | 4 | 5,
        tags,
        note,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await bibleDB.addFavorite(favorite);
      setFavorites(prev => [favorite, ...prev]);

      logger.info('Favorite added successfully', {
        component: 'FavoritesContext',
        verseId,
        category,
        rating,
      });
    } catch (error) {
      logger.error('Error adding favorite', error as Error, {
        component: 'FavoritesContext',
      });
      throw error;
    }
  }

  /**
   * Elimina un favorito
   */
  async function removeFavorite(id: string): Promise<void> {
    try {
      await bibleDB.removeFavorite(id);
      setFavorites(prev => prev.filter(f => f.id !== id));

      logger.info('Favorite removed successfully', {
        component: 'FavoritesContext',
        id,
      });
    } catch (error) {
      logger.error('Error removing favorite', error as Error, {
        component: 'FavoritesContext',
        id,
      });
      throw error;
    }
  }

  /**
   * Actualiza un favorito
   */
  async function updateFavorite(
    id: string,
    updates: Partial<Omit<Favorite, 'id' | 'verseId' | 'createdAt'>>,
  ): Promise<void> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: Date.now(),
      };

      await bibleDB.updateFavorite(id, updatedData);

      setFavorites(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                ...updatedData,
              }
            : f,
        ),
      );

      logger.info('Favorite updated successfully', {
        component: 'FavoritesContext',
        id,
      });
    } catch (error) {
      logger.error('Error updating favorite', error as Error, {
        component: 'FavoritesContext',
        id,
      });
      throw error;
    }
  }

  /**
   * Verifica si un versículo es favorito
   */
  function isFavorite(book: string, chapter: number, verse: number): boolean {
    return favorites.some(
      f => f.book === book && f.chapter === chapter && f.verse === verse,
    );
  }

  /**
   * Obtiene favoritos por categoría
   */
  function getFavoritesByCategory(category: FavoriteCategory): Favorite[] {
    return favorites.filter(f => f.category === category);
  }

  /**
   * Obtiene favoritos por rating
   */
  function getFavoritesByRating(rating: number): Favorite[] {
    return favorites.filter(f => f.rating === rating);
  }

  /**
   * Busca en favoritos
   */
  function searchFavorites(query: string): Favorite[] {
    const lowerQuery = query.toLowerCase();
    return favorites.filter(
      f =>
        f.text.toLowerCase().includes(lowerQuery) ||
        f.book.toLowerCase().includes(lowerQuery) ||
        f.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        f.note?.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Recarga los favoritos
   */
  async function refreshFavorites(): Promise<void> {
    await loadFavorites();
  }

  const value: FavoritesContextType = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    updateFavorite,
    isFavorite,
    getFavoritesByCategory,
    getFavoritesByRating,
    searchFavorites,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

/**
 * Hook para usar el contexto de favoritos
 */
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
