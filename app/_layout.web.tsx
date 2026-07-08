import {Stack} from 'expo-router';
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {staticColors} from '@/styles/designTokens';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {initializeBibleData} from '@lib/database/data-loader';
import {loadReaderFonts} from '@lib/reader/fontAssets';
import {ThemeProvider} from '@hooks/useTheme';
import {BibleVersionProvider} from '@hooks/useBibleVersion';
import {LanguageProvider, useLanguage} from '@hooks/useLanguage';
import {AccessibilityPreferencesProvider} from '@context/AccessibilityPreferencesContext';
import {ToastProvider} from '@context/ToastContext';
import {ReaderPreferencesProvider} from '@context/ReaderPreferencesContext';
import {logger} from '@lib/utils/logger';
import {ErrorBoundary} from '@/components/ErrorBoundary';

/**
 * Web root layout (T21) — deliberately NOT app/_layout.tsx's provider tree.
 *
 * v1 web is a read-only reader with no login/sync/premium/audio/notifications
 * (Victor-confirmed scope, T21). This mounts only the providers those reader
 * screens actually touch — Auth/SyncEngine/Premium/Audio/Offering/Donation and
 * every write-feature context (Favorites/Bookmarks/ReadingProgress/
 * ReadingPlanProgress/CustomPlans/Together/MemoryDeck) are never imported here,
 * so their native-only dependencies (chiefly @react-native-firebase/*, which
 * T20 found throws "No Firebase App '[DEFAULT]' has been created" on web)
 * never enter the web bundle's mounted tree at all — no firestore.web.ts
 * needed for this tanda.
 */

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
      await initializeBibleData((loaded, total) => {
        setLoadingProgress({loaded, total});
      });
      await loadReaderFonts().catch(() => undefined);
      setIsLoading(false);
    } catch (err) {
      logger.error('Web initialization error', err as Error, {
        component: 'RootLayoutWeb',
        action: 'initializeApp',
      });
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.progressText}>
          {loadingProgress.total === 0
            ? t.app.preparing
            : t.app.loadingProgress.replace(
                '{{percent}}',
                String(
                  Math.round(
                    (loadingProgress.loaded / loadingProgress.total) * 100,
                  ),
                ),
              )}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t.error}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsLoading(true);
            setLoadingProgress({loaded: 0, total: 0});
            initializeApp();
          }}
          accessibilityRole="button"
          accessibilityLabel={t.app.retry}>
          <Text style={styles.retryButtonText}>{t.app.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    color: staticColors.slate600,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: staticColors.accentRed,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: staticColors.grayDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: staticColors.brandBlue,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: staticColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default function RootLayoutWeb() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <LanguageProvider>
        <ThemeProvider>
          <AccessibilityPreferencesProvider>
            <BibleVersionProvider>
              <ReaderPreferencesProvider>
                <ToastProvider>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </ToastProvider>
              </ReaderPreferencesProvider>
            </BibleVersionProvider>
          </AccessibilityPreferencesProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
