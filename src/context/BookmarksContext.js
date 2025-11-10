import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookmarksContext = createContext();

export const BookmarksProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem('bookmarks');
      if (savedBookmarks !== null) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const saveBookmarks = async (newBookmarks) => {
    try {
      await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const addBookmark = (book, chapter, verse) => {
    const newBookmark = { book, chapter, verse };
    const newBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(newBookmarks);
  };

  const removeBookmark = (book, chapter, verse) => {
    const newBookmarks = bookmarks.filter(
      b => !(b.book === book && b.chapter === chapter && b.verse === verse)
    );
    saveBookmarks(newBookmarks);
  };

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};