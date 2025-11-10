import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState({});

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes !== null) {
        const parsedNotes = JSON.parse(savedNotes);
        console.log('Notas cargadas:', parsedNotes);
        setNotes(parsedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes) => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      setNotes(newNotes);
      console.log('Notas guardadas:', newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, []);

  const addNote = useCallback((book, chapter, verse, content) => {
    const key = `${book}-${chapter}-${verse}`;
    setNotes(prevNotes => {
      const newNotes = { 
        ...prevNotes, 
        [key]: { book, chapter, verse, text: content } 
      };
      saveNotes(newNotes);
      return newNotes;
    });
  }, [saveNotes]);

  const deleteNote = useCallback((book, chapter, verse) => {
    const key = `${book}-${chapter}-${verse}`;
    setNotes(prevNotes => {
      const newNotes = { ...prevNotes };
      delete newNotes[key];
      saveNotes(newNotes);
      return newNotes;
    });
  }, [saveNotes]);

  const getNote = useCallback((book, chapter, verse) => {
    const key = `${book}-${chapter}-${verse}`;
    return notes[key] || null;
  }, [notes]);

  return (
    <NotesContext.Provider value={{ notes, addNote, deleteNote, getNote }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};