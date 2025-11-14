/**
 * NotesContext - Contexto Global para Notas Bíblicas
 *
 * Proporciona funcionalidad para agregar, actualizar, eliminar y recuperar
 * notas asociadas a versículos bíblicos específicos.
 *
 * Almacenamiento: AsyncStorage (persistencia local)
 * TypeScript completo con interfaces tipadas
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
 * Interfaz para una nota individual
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
 * Tipo para el almacén de notas (clave-valor)
 */
type NotesStore = {
  [key: string]: Note;
};

/**
 * Interfaz del contexto de notas
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
 * Contexto de notas - inicializado con valores por defecto
 */
const NotesContext = createContext<NotesContextType | undefined>(undefined);

/**
 * Props para el proveedor de notas
 */
interface NotesProviderProps {
  children: ReactNode;
}

/**
 * Componente proveedor de contexto de notas
 * Maneja la carga, almacenamiento y sincronización de notas
 */
export const NotesProvider: FC<NotesProviderProps> = ({children}) => {
  const [notes, setNotes] = useState<NotesStore>({});
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carga notas guardadas desde AsyncStorage al inicializar
   */
  useEffect(() => {
    loadNotes();
  }, []);

  /**
   * Carga notas desde AsyncStorage con manejo de errores
   */
  const loadNotes = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const savedNotes = await AsyncStorage.getItem('notes');

      if (savedNotes !== null) {
        const parsedNotes: NotesStore = JSON.parse(savedNotes);
        setNotes(parsedNotes);

        logger.info('Notas cargadas desde almacenamiento', {
          component: 'NotesContext',
          action: 'loadNotes',
          count: Object.keys(parsedNotes).length,
        });
      } else {
        logger.info('No hay notas guardadas previamente', {
          component: 'NotesContext',
          action: 'loadNotes',
        });
      }
    } catch (error) {
      logger.error(
        'Error cargando notas',
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
   * Guarda notas en AsyncStorage con manejo de errores
   */
  const saveNotes = useCallback(async (newNotes: NotesStore): Promise<void> => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      setNotes(newNotes);

      logger.info('Notas guardadas en almacenamiento', {
        component: 'NotesContext',
        action: 'saveNotes',
        count: Object.keys(newNotes).length,
      });
    } catch (error) {
      logger.error(
        'Error guardando notas',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'NotesContext',
          action: 'saveNotes',
        },
      );
    }
  }, []);

  /**
   * Agrega una nueva nota o reemplaza una existente
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

        logger.info('Nota agregada', {
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
   * Actualiza una nota existente
   */
  const updateNote = useCallback(
    (book: string, chapter: number, verse: number, content: string): void => {
      const key = `${book}-${chapter}-${verse}`;
      const timestamp = Date.now();

      setNotes(prevNotes => {
        if (!prevNotes[key]) {
          logger.warn('Intento de actualizar nota que no existe', {
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

        logger.info('Nota actualizada', {
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
   * Elimina una nota específica
   */
  const deleteNote = useCallback(
    (book: string, chapter: number, verse: number): void => {
      const key = `${book}-${chapter}-${verse}`;

      setNotes(prevNotes => {
        if (!prevNotes[key]) {
          logger.warn('Intento de eliminar nota que no existe', {
            component: 'NotesContext',
            action: 'deleteNote',
            reference: key,
          });
          return prevNotes;
        }

        const newNotes = {...prevNotes};
        delete newNotes[key];
        saveNotes(newNotes);

        logger.info('Nota eliminada', {
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
   * Obtiene una nota específica por referencia
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
   * Obtiene todas las notas como un array
   */
  const getAllNotes = useCallback((): Note[] => {
    return Object.values(notes);
  }, [notes]);

  /**
   * Valor del contexto con todas las funciones y estados
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
 * Hook para usar el contexto de notas
 * @throws Error si se usa fuera del NotesProvider
 */
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);

  if (context === undefined) {
    throw new Error(
      'useNotes debe ser utilizado dentro de un NotesProvider. ' +
        'Asegúrate de envolver tu componente con <NotesProvider>.',
    );
  }

  return context;
};

/**
 * Tipos exportados para uso en otros módulos
 */
export type {Note, NotesStore, NotesContextType, NotesProviderProps};
