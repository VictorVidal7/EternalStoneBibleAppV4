/**
 * 🔖 BOOKMARKS CONTEXT
 *
 * Multiple named bookmarks — distinct from the single "Continue Reading"
 * position the reader tracks automatically. Each bookmark snapshots a
 * verse the user explicitly chose to save (with an optional label) so
 * they can come back to a specific spot — a sermon prep position, a
 * passage they want to revisit, etc.
 *
 * Persisted in AsyncStorage rather than SQLite: the dataset is small
 * (the user manages it manually), it avoids a schema migration, and
 * keeping it off the verses DB means the "Reset Bible Data" flow (which
 * clears verses) won't nuke the user's bookmarks.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';
import {
  dedupeAndPrepend,
  isBookmarkedAt,
  removeById,
  renameById,
} from './bookmarkOps';

export interface Bookmark {
  id: string;
  book: string; // canonical name as stored in the source Bible version
  chapter: number;
  verse: number;
  text: string; // verse snippet for the list preview
  label?: string; // optional user-chosen name ("Sunday sermon")
  createdAt: number;
}

export interface BookmarksContextType {
  bookmarks: Bookmark[];
  loading: boolean;
  addBookmark: (
    input: Pick<Bookmark, 'book' | 'chapter' | 'verse' | 'text'> & {
      label?: string;
    },
  ) => Promise<Bookmark>;
  removeBookmark: (id: string) => Promise<void>;
  renameBookmark: (id: string, label: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isBookmarked: (book: string, chapter: number, verse: number) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(
  undefined,
);

const STORAGE_KEY = '@bible_bookmarks';

function generateId(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface BookmarksProviderProps {
  children: ReactNode;
}

export const BookmarksProvider: FC<BookmarksProviderProps> = ({children}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setBookmarks(
              parsed.filter(
                (b): b is Bookmark =>
                  typeof b?.id === 'string' &&
                  typeof b?.book === 'string' &&
                  typeof b?.chapter === 'number' &&
                  typeof b?.verse === 'number',
              ),
            );
          }
        }
      } catch (error) {
        logger.error('Failed to load bookmarks', error as Error, {
          component: 'BookmarksProvider',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Bookmark[]) => {
    setBookmarks(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      logger.error('Failed to persist bookmarks', error as Error, {
        component: 'BookmarksProvider',
      });
    }
  }, []);

  const addBookmark: BookmarksContextType['addBookmark'] = useCallback(
    async input => {
      const bookmark: Bookmark = {
        id: generateId(),
        book: input.book,
        chapter: input.chapter,
        verse: input.verse,
        text: input.text,
        label: input.label,
        createdAt: Date.now(),
      };
      // Dedupe + MRU prepend lives in a pure helper (see bookmarkOps.ts)
      // so it can be unit-tested without rendering the provider.
      await persist(dedupeAndPrepend(bookmarks, bookmark));
      return bookmark;
    },
    [bookmarks, persist],
  );

  const removeBookmark = useCallback(
    async (id: string) => {
      await persist(removeById(bookmarks, id));
    },
    [bookmarks, persist],
  );

  const renameBookmark = useCallback(
    async (id: string, label: string) => {
      await persist(renameById(bookmarks, id, label));
    },
    [bookmarks, persist],
  );

  const clearAll = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const isBookmarked = useCallback(
    (book: string, chapter: number, verse: number) =>
      isBookmarkedAt(bookmarks, book, chapter, verse),
    [bookmarks],
  );

  const value = useMemo<BookmarksContextType>(
    () => ({
      bookmarks,
      loading,
      addBookmark,
      removeBookmark,
      renameBookmark,
      clearAll,
      isBookmarked,
    }),
    [
      bookmarks,
      loading,
      addBookmark,
      removeBookmark,
      renameBookmark,
      clearAll,
      isBookmarked,
    ],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};

export function useBookmarks(): BookmarksContextType {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return ctx;
}
