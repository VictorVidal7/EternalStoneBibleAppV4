import {Stack} from 'expo-router';
import {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {
  initializeBibleData,
  checkDataStatus,
} from '../src/lib/database/data-loader';
import {ThemeProvider} from '../src/hooks/useTheme';
import {BibleVersionProvider} from '../src/hooks/useBibleVersion';
import {LanguageProvider, useLanguage} from '../src/hooks/useLanguage';
import {ServicesProvider} from '../src/context/ServicesContext';
import {ToastProvider} from '../src/context/ToastContext';
import {AchievementNotifications} from '../src/components/AchievementNotifications';
import {AnimatedSplashScreen} from '../src/components/AnimatedSplashScreen';
import bibleDB from '../src/lib/database';
import {predictiveCacheService} from '../src/lib/cache/PredictiveCache';
import {badgeSystemService} from '../src/lib/badges/BadgeSystem';
import {versionComparisonService} from '../src/lib/comparison/VersionComparison';
import {widgetTaskHandler} from '../src/widgets/WidgetTaskHandler';

function AppContent() {
  const {t} = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({loaded: 0, total: 0});
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
          setLoadingProgress({loaded, total});
        });
      }

      // ✨ Inicializar servicios V5.1
      console.log('🚀 Inicializando servicios V5.1...');
      try {
        await Promise.all([
          predictiveCacheService.initialize(),
          badgeSystemService.initialize(),
          versionComparisonService.initialize(),
          widgetTaskHandler.initialize(),
        ]);

        // Precalentar caché con contenido popular
        await predictiveCacheService.warmupCache();

        // Limpiar entradas expiradas del caché
        await predictiveCacheService.cleanup();

        console.log('✅ Servicios V5.1 inicializados correctamente');
      } catch (serviceError) {
        console.warn(
          '⚠️ Algunos servicios V5.1 no se pudieron inicializar:',
          serviceError,
        );
        // No fallar la app, solo continuar sin los servicios V5.1
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
      <AnimatedSplashScreen
        loadingProgress={loadingProgress}
        message={loadingProgress.total === 0 ? t.app.preparing : undefined}
      />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t.error}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>{t.app.errorHint}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AchievementNotifications />
    </>
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
          <ServicesProvider database={bibleDB}>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </ServicesProvider>
        </BibleVersionProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
