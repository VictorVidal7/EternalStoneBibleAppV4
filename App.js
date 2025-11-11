import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferencesProvider } from './src/context/UserPreferencesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ReadingProgressProvider } from './src/context/ReadingProgressContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import { ReadingPlanProvider } from './src/context/ReadingPlanContext';
import { NotesProvider } from './src/context/NotesContext';
import { resetDatabase, initializeBibleData, closeBibleDatabase, preloadFrequentlyAccessedData } from './src/services/bibleDataManager';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  const initApp = useCallback(async () => {
    try {
      console.log('Initializing app...');
      await resetDatabase();
      await initializeBibleData();
      await preloadFrequentlyAccessedData();
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      setInitError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initApp();

    return () => {
      closeBibleDatabase().catch(console.error);
    };
  }, [initApp]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (initError) {
    return <ErrorScreen message={initError} />;
  }

  return (
    <SafeAreaProvider>
      <UserPreferencesProvider>
        <ThemeProvider>
          <ReadingProgressProvider>
            <BookmarksProvider>
              <ReadingPlanProvider>
                <NotesProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </NotesProvider>
              </ReadingPlanProvider>
            </BookmarksProvider>
          </ReadingProgressProvider>
        </ThemeProvider>
      </UserPreferencesProvider>
    </SafeAreaProvider>
  );
};

const LoadingScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
    <Text style={styles.loadingText}>Cargando Eternal Stone Bible App...</Text>
  </View>
);

const ErrorScreen = ({ message }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>Error: {message}</Text>
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;