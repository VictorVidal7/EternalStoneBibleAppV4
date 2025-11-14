/**
 * BookmarksContext - TypeScript Version
 *
 * Manages user's bookmark state across the application
 * Features:
 * - Add/remove/toggle bookmarks
 * - Persist bookmarks to AsyncStorage
 * - Professional logging system
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  FC,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Interface for a single bookmark
 */
export interface Bookmark {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Context value interface
 */
export interface BookmarksContextType {
  bookmarks: Bookmark[];
  addBookmark: (book: string, chapter: number, verse: number) => Promise<void>;
  removeBookmark: (
    book: string,
    chapter: number,
    verse: number,
  ) => Promise<void>;
  toggleBookmark: (
    book: string,
    chapter: number,
    verse: number,
  ) => Promise<void>;
  isBookmarked: (book: string, chapter: number, verse: number) => boolean;
}

/**
 * Provider props interface
 */
interface BookmarksProviderProps {
  children: ReactNode;
}

/**
 * Create context with undefined default value
 */
const BookmarksContext = createContext<BookmarksContextType | undefined>(
  undefined,
);

/**
 * BookmarksProvider component
 * Manages bookmark state and persistence
 */
export const BookmarksProvider: FC<BookmarksProviderProps> = ({children}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  /**
   * Load bookmarks from AsyncStorage on mount
   */
  useEffect(() => {
    loadBookmarks();
  }, []);

  /**
   * Load bookmarks from AsyncStorage
   */
  const loadBookmarks = async (): Promise<void> => {
    try {
      const savedBookmarks = await AsyncStorage.getItem('bookmarks');
      if (savedBookmarks !== null) {
        const parsedBookmarks: Bookmark[] = JSON.parse(savedBookmarks);
        setBookmarks(parsedBookmarks);
        logger.info('Bookmarks loaded from storage', {
          component: 'BookmarksContext',
          action: 'loadBookmarks',
          bookmarkCount: parsedBookmarks.length,
        });
      }
    } catch (error) {
      logger.error(
        'Error loading bookmarks from AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'BookmarksContext',
          action: 'loadBookmarks',
        },
      );
    }
  };

  /**
   * Save bookmarks to AsyncStorage
   */
  const saveBookmarks = async (newBookmarks: Bookmark[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
      logger.debug('Bookmarks saved to storage', {
        component: 'BookmarksContext',
        action: 'saveBookmarks',
        bookmarkCount: newBookmarks.length,
      });
    } catch (error) {
      logger.error(
        'Error saving bookmarks to AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'BookmarksContext',
          action: 'saveBookmarks',
        },
      );
    }
  };

  /**
   * Check if a specific bookmark exists
   */
  const isBookmarked = (
    book: string,
    chapter: number,
    verse: number,
  ): boolean => {
    return bookmarks.some(
      b => b.book === book && b.chapter === chapter && b.verse === verse,
    );
  };

  /**
   * Add a new bookmark
   */
  const addBookmark = async (
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> => {
    try {
      // Check if bookmark already exists
      if (isBookmarked(book, chapter, verse)) {
        logger.warn('Bookmark already exists', {
          component: 'BookmarksContext',
          action: 'addBookmark',
          book,
          chapter,
          verse,
        });
        return;
      }

      const newBookmark: Bookmark = {book, chapter, verse};
      const newBookmarks = [...bookmarks, newBookmark];
      await saveBookmarks(newBookmarks);

      logger.breadcrumb('Bookmark added', 'bookmark', {
        book,
        chapter,
        verse,
      });
    } catch (error) {
      logger.error(
        'Error adding bookmark',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'BookmarksContext',
          action: 'addBookmark',
          book,
          chapter,
          verse,
        },
      );
    }
  };

  /**
   * Remove a bookmark
   */
  const removeBookmark = async (
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> => {
    try {
      const newBookmarks = bookmarks.filter(
        b => !(b.book === book && b.chapter === chapter && b.verse === verse),
      );

      // Check if bookmark was found and removed
      if (newBookmarks.length === bookmarks.length) {
        logger.warn('Bookmark not found', {
          component: 'BookmarksContext',
          action: 'removeBookmark',
          book,
          chapter,
          verse,
        });
        return;
      }

      await saveBookmarks(newBookmarks);

      logger.breadcrumb('Bookmark removed', 'bookmark', {
        book,
        chapter,
        verse,
      });
    } catch (error) {
      logger.error(
        'Error removing bookmark',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'BookmarksContext',
          action: 'removeBookmark',
          book,
          chapter,
          verse,
        },
      );
    }
  };

  /**
   * Toggle bookmark (add if not exists, remove if exists)
   */
  const toggleBookmark = async (
    book: string,
    chapter: number,
    verse: number,
  ): Promise<void> => {
    try {
      if (isBookmarked(book, chapter, verse)) {
        await removeBookmark(book, chapter, verse);
      } else {
        await addBookmark(book, chapter, verse);
      }
    } catch (error) {
      logger.error(
        'Error toggling bookmark',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'BookmarksContext',
          action: 'toggleBookmark',
          book,
          chapter,
          verse,
        },
      );
    }
  };

  const value: BookmarksContextType = {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};

/**
 * Custom hook to use BookmarksContext
 * Throws error if used outside of BookmarksProvider
 */
export const useBookmarks = (): BookmarksContextType => {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};
