import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Interface for last read position tracking
 */
export interface LastReadPosition {
  book: string;
  chapter: string;
  verse: string;
}

/**
 * Interface for chapter progress (book -> chapter -> percentage)
 */
export interface ChapterProgress {
  [chapter: string]: number;
}

/**
 * Interface for overall reading progress
 */
export interface ReadingProgress {
  [book: string]: ChapterProgress;
}

/**
 * Interface for Reading Progress Context value
 */
export interface ReadingProgressContextType {
  progress: ReadingProgress;
  updateChapterProgress: (
    book: string,
    chapter: string,
    percentage: number,
  ) => void;
  getChapterProgress: (book: string, chapter: string) => number;
  getLastReadPosition: () => Promise<LastReadPosition | null>;
  setLastReadPosition: (
    book: string,
    chapter: string,
    verse: string,
  ) => Promise<void>;
}

/**
 * Create the Reading Progress Context with undefined type initially
 */
const ReadingProgressContext = createContext<
  ReadingProgressContextType | undefined
>(undefined);

/**
 * Reading Progress Provider component
 *
 * Provides reading progress tracking functionality throughout the app.
 * Handles:
 * - Chapter progress percentages by book and chapter
 * - Last read position tracking
 * - Persistence via AsyncStorage
 */
export const ReadingProgressProvider: FC<{children: ReactNode}> = ({
  children,
}) => {
  const [progress, setProgress] = useState<ReadingProgress>({});

  /**
   * Load reading progress from AsyncStorage on mount
   */
  useEffect(() => {
    loadProgress();
  }, []);

  /**
   * Load progress data from persistent storage
   */
  const loadProgress = async (): Promise<void> => {
    try {
      const savedProgress = await AsyncStorage.getItem('readingProgress');
      if (savedProgress !== null) {
        const parsedProgress: ReadingProgress = JSON.parse(savedProgress);
        setProgress(parsedProgress);
        logger.debug('Reading progress loaded successfully', {
          component: 'ReadingProgressProvider',
          action: 'loadProgress',
          booksLoaded: Object.keys(parsedProgress).length,
        });
      }
    } catch (error) {
      logger.error(
        'Error loading reading progress from AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ReadingProgressProvider',
          action: 'loadProgress',
        },
      );
    }
  };

  /**
   * Save progress data to persistent storage
   */
  const saveProgress = async (newProgress: ReadingProgress): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        'readingProgress',
        JSON.stringify(newProgress),
      );
      setProgress(newProgress);
      logger.debug('Reading progress saved successfully', {
        component: 'ReadingProgressProvider',
        action: 'saveProgress',
        booksUpdated: Object.keys(newProgress).length,
      });
    } catch (error) {
      logger.error(
        'Error saving reading progress to AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ReadingProgressProvider',
          action: 'saveProgress',
        },
      );
    }
  };

  /**
   * Update the progress percentage for a specific chapter
   *
   * @param book - The book name
   * @param chapter - The chapter number or identifier
   * @param percentage - The progress percentage (0-100)
   */
  const updateChapterProgress = (
    book: string,
    chapter: string,
    percentage: number,
  ): void => {
    const newProgress: ReadingProgress = {
      ...progress,
      [book]: {
        ...progress[book],
        [chapter]: percentage,
      },
    };

    logger.breadcrumb(
      `Chapter progress updated: ${book} ${chapter}`,
      'chapter_progress',
      {
        component: 'ReadingProgressProvider',
        action: 'updateChapterProgress',
        book,
        chapter,
        percentage,
      },
    );

    saveProgress(newProgress);
  };

  /**
   * Get the progress percentage for a specific chapter
   *
   * @param book - The book name
   * @param chapter - The chapter number or identifier
   * @returns The progress percentage (0-100), defaults to 0 if not found
   */
  const getChapterProgress = (book: string, chapter: string): number => {
    return progress[book]?.[chapter] || 0;
  };

  /**
   * Get the last position the user was reading from
   *
   * @returns The last read position or null if not found
   */
  const getLastReadPosition = async (): Promise<LastReadPosition | null> => {
    try {
      const lastPosition = await AsyncStorage.getItem('lastReadPosition');
      if (lastPosition) {
        const parsedPosition: LastReadPosition = JSON.parse(lastPosition);
        logger.debug('Last read position retrieved', {
          component: 'ReadingProgressProvider',
          action: 'getLastReadPosition',
          ...parsedPosition,
        });
        return parsedPosition;
      }
      return null;
    } catch (error) {
      logger.error(
        'Error getting last read position from AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ReadingProgressProvider',
          action: 'getLastReadPosition',
        },
      );
      return null;
    }
  };

  /**
   * Set the last position the user is reading
   *
   * @param book - The book name
   * @param chapter - The chapter number or identifier
   * @param verse - The verse number or identifier
   */
  const setLastReadPosition = async (
    book: string,
    chapter: string,
    verse: string,
  ): Promise<void> => {
    try {
      const lastPosition: LastReadPosition = {book, chapter, verse};
      await AsyncStorage.setItem(
        'lastReadPosition',
        JSON.stringify(lastPosition),
      );

      logger.breadcrumb(
        `Last read position updated: ${book} ${chapter}:${verse}`,
        'last_read_position',
        {
          component: 'ReadingProgressProvider',
          action: 'setLastReadPosition',
          book,
          chapter,
          verse,
        },
      );
    } catch (error) {
      logger.error(
        'Error setting last read position in AsyncStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ReadingProgressProvider',
          action: 'setLastReadPosition',
          book,
          chapter,
          verse,
        },
      );
    }
  };

  const value: ReadingProgressContextType = {
    progress,
    updateChapterProgress,
    getChapterProgress,
    getLastReadPosition,
    setLastReadPosition,
  };

  return (
    <ReadingProgressContext.Provider value={value}>
      {children}
    </ReadingProgressContext.Provider>
  );
};

/**
 * Hook to use the Reading Progress context
 *
 * @returns The Reading Progress context value
 * @throws Error if used outside of ReadingProgressProvider
 */
export const useReadingProgress = (): ReadingProgressContextType => {
  const context = useContext(ReadingProgressContext);
  if (context === undefined) {
    throw new Error(
      'useReadingProgress must be used within a ReadingProgressProvider. ' +
        'Make sure your component is wrapped with <ReadingProgressProvider>',
    );
  }
  return context;
};
