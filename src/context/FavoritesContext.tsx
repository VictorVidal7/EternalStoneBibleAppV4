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
  useRef,
  ReactNode,
  FC,
} from 'react';
import bibleDB from '../lib/database';
import {logger} from '../lib/utils/logger';
import {BibleVerse} from '../types/bible';
import {canonicalBookName} from '../constants/bible';
import {useServices} from './ServicesContext';
import {getSyncEngine, type SyncAdapter, type SyncEntity} from '../lib/sync';
import {useSyncEngineOptional} from './SyncEngineContext';

type FavoriteSourceVerse = Pick<
  BibleVerse,
  'book' | 'chapter' | 'verse' | 'text'
> &
  Partial<Pick<BibleVerse, 'id' | 'bookNumber' | 'version'>>;

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
    verse: FavoriteSourceVerse,
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

/** Build the Firestore payload for a favorite. Strips React-only
 *  fields and ensures `updatedAt` is present. */
function favoriteToRemote(
  f: Favorite,
): SyncEntity<Omit<Favorite, 'updatedAt'>> {
  return {
    id: f.id,
    verseId: f.verseId,
    book: f.book,
    chapter: f.chapter,
    verse: f.verse,
    text: f.text,
    category: f.category,
    rating: f.rating,
    tags: f.tags,
    note: f.note,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

export const FavoritesProvider: FC<{children: ReactNode}> = ({children}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const {achievementService} = useServices();
  const syncCtx = useSyncEngineOptional();
  // Sprint 45 — depend on the STABLE engine instance, not the context
  // value: the context value changes identity on every engine state
  // update, so a `[syncCtx]` dep made the adapter re-register on every
  // sync tick → onSnapshot churn (a tight re-subscribe loop). The engine
  // ref is created once, so registering once is correct (the adapter
  // reads fresh data via refs, not via the effect closure).
  const syncEngine = syncCtx?.engine ?? null;

  // Keep an always-fresh ref for the sync adapter's getLocal — it
  // runs outside React render and can't capture stale state.
  const favoritesRef = useRef<Favorite[]>([]);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Register the sync adapter once the engine is mounted. The engine
  // calls applyRemoteUpsert/Delete with the local-write suppress flag
  // on, so the setFavorites calls below do NOT bounce back as a push.
  useEffect(() => {
    if (!syncEngine) return;
    const adapter: SyncAdapter<Omit<Favorite, 'updatedAt'>> = {
      collection: 'favorites',
      async getLocal(id) {
        const local = favoritesRef.current.find(f => f.id === id);
        return local ? favoriteToRemote(local) : null;
      },
      async applyRemoteUpsert(id, data) {
        const incoming: Favorite = {
          id,
          verseId: data.verseId,
          book: data.book,
          chapter: data.chapter,
          verse: data.verse,
          text: data.text,
          category: data.category,
          rating: data.rating,
          tags: Array.isArray(data.tags) ? data.tags : [],
          note: data.note,
          createdAt:
            typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
        try {
          await bibleDB.initialize();
          // INSERT OR REPLACE so an inbound update for an existing id
          // overwrites rather than throwing a UNIQUE violation.
          await bibleDB.executeSql(
            `INSERT OR REPLACE INTO favorites
             (id, verse_id, book_name, chapter, verse, text, category, rating, tags, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              incoming.id,
              incoming.verseId,
              incoming.book,
              incoming.chapter,
              incoming.verse,
              incoming.text,
              incoming.category,
              incoming.rating,
              JSON.stringify(incoming.tags),
              incoming.note ?? null,
              incoming.createdAt,
              incoming.updatedAt,
            ],
          );
        } catch (err) {
          logger.error(
            'favorites adapter: applyRemoteUpsert DB write failed',
            err instanceof Error ? err : new Error(String(err)),
            {component: 'FavoritesContext', id},
          );
          return;
        }
        // Mirror into React state so the screen rerenders immediately.
        setFavorites(prev => {
          const idx = prev.findIndex(f => f.id === id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = incoming;
            return next;
          }
          return [incoming, ...prev];
        });
      },
      async applyRemoteDelete(id) {
        try {
          await bibleDB.removeFavorite(id);
        } catch (err) {
          logger.warn('favorites adapter: applyRemoteDelete DB failed', {
            component: 'FavoritesContext',
            id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        setFavorites(prev => prev.filter(f => f.id !== id));
      },
      async pullAllLocal() {
        return favoritesRef.current.map(f => ({
          id: f.id,
          data: favoriteToRemote(f),
        }));
      },
      // Sprint 43 — user-editable fields. verseId/text/book/chapter/verse
      // are immutable identity, so we ignore them for conflict detection.
      getMaterialFields() {
        return ['note', 'category', 'rating', 'tags'] as const;
      },
    };
    syncEngine.register(adapter);
    return () => {
      syncEngine.unregister('favorites');
    };
  }, [syncEngine]);

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
    verse: FavoriteSourceVerse,
    category: FavoriteCategory = 'other',
    rating: number = 5,
    tags: string[] = [],
    note?: string,
  ): Promise<void> {
    try {
      // Canonicalize the book identity so a verse is keyed the same way no
      // matter how the user got here (RVR1960 "Génesis" vs KJV "Genesis" vs a
      // book-grid/deep-link name) — see canonicalBookName. The Firestore doc
      // id is `favorite.id` (random), so this never disturbs sync.
      const book = canonicalBookName(verse.book);
      const verseId = `${book}_${verse.chapter}_${verse.verse}`;

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
        book,
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
      if (achievementService) {
        try {
          await achievementService.trackBookmark();
        } catch (error) {
          logger.warn('Error tracking favorite', {
            component: 'FavoritesContext',
            error,
          });
        }
      }
      setFavorites(prev => [favorite, ...prev]);
      getSyncEngine()?.queueWrite(
        'favorites',
        favorite.id,
        favoriteToRemote(favorite),
      );

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
      // Snapshot the doc BEFORE removing so the tombstone written to
      // Firestore carries the verse identity (useful for S43 conflict
      // UI and so the other device can show "X removed Genesis 1:1").
      const lastKnown = favoritesRef.current.find(f => f.id === id);
      await bibleDB.removeFavorite(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
      getSyncEngine()?.queueDelete(
        'favorites',
        id,
        lastKnown ? favoriteToRemote(lastKnown) : undefined,
      );

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

      let mergedForSync: Favorite | undefined;
      setFavorites(prev =>
        prev.map(f => {
          if (f.id !== id) return f;
          const merged = {...f, ...updatedData};
          mergedForSync = merged;
          return merged;
        }),
      );
      if (mergedForSync) {
        getSyncEngine()?.queueWrite(
          'favorites',
          id,
          favoriteToRemote(mergedForSync),
        );
      }

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
    // Compare on the canonical book identity so a favorite is recognized
    // regardless of the name the caller passes ("Génesis"/"Genesis"/…).
    const canonical = canonicalBookName(book);
    return favorites.some(
      f =>
        canonicalBookName(f.book) === canonical &&
        f.chapter === chapter &&
        f.verse === verse,
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
