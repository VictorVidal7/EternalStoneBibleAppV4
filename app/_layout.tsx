import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeBibleData, checkDataStatus } from '../src/lib/database/data-loader';
import { ThemeProvider } from '../src/hooks/useTheme';
import { BibleVersionProvider } from '../src/hooks/useBibleVersion';
import { LanguageProvider } from '../src/hooks/useLanguage';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      const status = await checkDataStatus();

      if (!status.isLoaded) {
        // Load Bible data with progress tracking
        await initializeBibleData((loaded, total) => {
          setLoadingProgress({ loaded, total });
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.appName}>Eternal Bible</Text>
        <Text style={styles.subtitle}>La Palabra de Dios</Text>

        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />

          {loadingProgress.total > 0 && (
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                Cargando la Biblia...
              </Text>
              <Text style={styles.progressNumbers}>
                {loadingProgress.loaded.toLocaleString()} / {loadingProgress.total.toLocaleString()} versículos
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {loadingProgress.total === 0 && (
            <Text style={styles.progressText}>Preparando...</Text>
          )}
        </View>

        <Text style={styles.verse}>
          "Lámpara es a mis pies tu palabra, {'\n'}
          y lumbrera a mi camino" {'\n'}
          - Salmos 119:105
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Por favor, cierra y vuelve a abrir la aplicación.
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 60,
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  progressTextContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: 280,
  },
  progressText: {
    fontSize: 16,
    color: '#34495E',
    marginTop: 16,
    textAlign: 'center',
  },
  progressNumbers: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#ECF0F1',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  verse: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorHint: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BibleVersionProvider>
          <AppContent />
        </BibleVersionProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
