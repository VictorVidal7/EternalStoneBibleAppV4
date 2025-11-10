import React, { createContext, useState, useContext } from 'react';

const ReadingModeContext = createContext();

export const ReadingModeProvider = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = () => setIsFocusMode(prev => !prev);

  return (
    <ReadingModeContext.Provider value={{ isFocusMode, toggleFocusMode }}>
      {children}
    </ReadingModeContext.Provider>
  );
};

export const useReadingMode = () => {
  const context = useContext(ReadingModeContext);
  if (context === undefined) {
    throw new Error('useReadingMode must be used within a ReadingModeProvider');
  }
  return context;
};