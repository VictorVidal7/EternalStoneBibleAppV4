/**
 * NotesContext - Global Context for Bible Notes
 *
 * Provides functionality to add, update, delete, and retrieve
 * notes associated with specific Bible verses.
 *
 * Storage: AsyncStorage (local persistence)
 * Full TypeScript with typed interfaces
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  FC,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Interface for an individual note
 */
interface Note {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Type for notes storage (key-value)
 */
type NotesStore = {
  [key: string]: Note;
};

/**
 * Notes context interface
 */
interface NotesContextType {
  notes: NotesStore;
  addNote: (
    book: string,
    chapter: number,
    verse: number,
    content: string,
  ) => void;
  updateNote: (
    book: string,
    chapter: number,
    verse: number,
    content: string,
  ) => void;
  deleteNote: (book: string, chapter: number, verse: number) => void;
  getNote: (book: string, chapter: number, verse: number) => Note | null;
  getAllNotes: () => Note[];
  isLoading: boolean;
}

/**
 * Notes context - initialized with default values
 */
const NotesContext = createContext<NotesContextType | undefined>(undefined);

/**
 * Props for notes provider
 */
interface NotesProviderProps {
  children: ReactNode;
}

/**
 * Notes context provider component
 * Handles loading, storage, and synchronization of notes
 */
export const NotesProvider: FC<NotesProviderProps> = ({children}) => {
  const [notes, setNotes] = useState<NotesStore>({});
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load saved notes from AsyncStorage on initialization
   */
  useEffect(() => {
    loadNotes();
  }, []);

  /**
   * Load notes from AsyncStorage with error handling
   */
  const loadNotes = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const savedNotes = await AsyncStorage.getItem('notes');

      if (savedNotes !== null) {
        const parsedNotes: NotesStore = JSON.parse(savedNotes);
        setNotes(parsedNotes);

        logger.info('Notes loaded from storage', {
          component: 'NotesContext',
          action: 'loadNotes',
          count: Object.keys(parsedNotes).length,
        });
      } else {
        logger.info('No previously saved notes', {
          component: 'NotesContext',
          action: 'loadNotes',
        });
      }
    } catch (error) {
      logger.error(
        'Error loading notes',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'NotesContext',
          action: 'loadNotes',
        },
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save notes to AsyncStorage with error handling
   */
  const saveNotes = useCallback(async (newNotes: NotesStore): Promise<void> => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      setNotes(newNotes);

      logger.info('Notes saved to storage', {
        component: 'NotesContext',
        action: 'saveNotes',
        count: Object.keys(newNotes).length,
      });
    } catch (error) {
      logger.error(
        'Error saving notes',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'NotesContext',
          action: 'saveNotes',
        },
      );
    }
  }, []);

  /**
   * Add a new note or replace an existing one
   */
  const addNote = useCallback(
    (book: string, chapter: number, verse: number, content: string): void => {
      const key = `${book}-${chapter}-${verse}`;
      const timestamp = Date.now();

      setNotes(prevNotes => {
        const newNotes = {
          ...prevNotes,
          [key]: {
            book,
            chapter,
            verse,
            text: content,
            createdAt: prevNotes[key]?.createdAt || timestamp,
            updatedAt: timestamp,
          },
        };
        saveNotes(newNotes);

        logger.info('Note added', {
          component: 'NotesContext',
          action: 'addNote',
          reference: key,
        });

        return newNotes;
      });
    },
    [saveNotes],
  );

  /**
   * Update an existing note
   */
  const updateNote = useCallback(
    (book: string, chapter: number, verse: number, content: string): void => {
      const key = `${book}-${chapter}-${verse}`;
      const timestamp = Date.now();

      setNotes(prevNotes => {
        if (!prevNotes[key]) {
          logger.warn('Attempt to update non-existent note', {
            component: 'NotesContext',
            action: 'updateNote',
            reference: key,
          });
          return prevNotes;
        }

        const newNotes = {
          ...prevNotes,
          [key]: {
            ...prevNotes[key],
            text: content,
            updatedAt: timestamp,
          },
        };
        saveNotes(newNotes);

        logger.info('Note updated', {
          component: 'NotesContext',
          action: 'updateNote',
          reference: key,
        });

        return newNotes;
      });
    },
    [saveNotes],
  );

  /**
   * Delete a specific note
   */
  const deleteNote = useCallback(
    (book: string, chapter: number, verse: number): void => {
      const key = `${book}-${chapter}-${verse}`;

      setNotes(prevNotes => {
        if (!prevNotes[key]) {
          logger.warn('Attempt to delete non-existent note', {
            component: 'NotesContext',
            action: 'deleteNote',
            reference: key,
          });
          return prevNotes;
        }

        const newNotes = {...prevNotes};
        delete newNotes[key];
        saveNotes(newNotes);

        logger.info('Note deleted', {
          component: 'NotesContext',
          action: 'deleteNote',
          reference: key,
        });

        return newNotes;
      });
    },
    [saveNotes],
  );

  /**
   * Get a specific note by reference
   */
  const getNote = useCallback(
    (book: string, chapter: number, verse: number): Note | null => {
      const key = `${book}-${chapter}-${verse}`;
      const note = notes[key] || null;

      return note;
    },
    [notes],
  );

  /**
   * Get all notes as an array
   */
  const getAllNotes = useCallback((): Note[] => {
    return Object.values(notes);
  }, [notes]);

  /**
   * Context value with all functions and states
   */
  const value: NotesContextType = {
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNote,
    getAllNotes,
    isLoading,
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
};

/**
 * Hook to use notes context
 * @throws Error if used outside NotesProvider
 */
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);

  if (context === undefined) {
    throw new Error(
      'useNotes must be used within a NotesProvider. ' +
        'Make sure to wrap your component with <NotesProvider>.',
    );
  }

  return context;
};

/**
 * Exported types for use in other modules
 */
export type {Note, NotesStore, NotesContextType, NotesProviderProps};
