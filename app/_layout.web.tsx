import {Stack} from 'expo-router';
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {staticColors} from '@/styles/designTokens';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {initializeBibleData} from '@lib/database/data-loader';
// Explicit .web specifier (not the bare '@lib/database/data-loader'):
// clearWebStorageForLockRecovery is web-only and does not exist in
// data-loader.ts (native) — tsc has no platform awareness and resolves a
// bare specifier to the native file regardless of this file's own .web.tsx
// name, so importing it unsuffixed would fail type-checking.
import {clearWebStorageForLockRecovery} from '@lib/database/data-loader.web';
import {isStorageLockError} from '@lib/database/storageLockError';
import {loadReaderFonts} from '@lib/reader/fontAssets';
import {ThemeProvider} from '@hooks/useTheme';
import {BibleVersionProvider} from '@hooks/useBibleVersion';
import {LanguageProvider, useLanguage} from '@hooks/useLanguage';
import {AccessibilityPreferencesProvider} from '@context/AccessibilityPreferencesContext';
import {useReducedMotion} from '@hooks/useReducedMotion';
import {ToastProvider} from '@context/ToastContext';
import {ReaderPreferencesProvider} from '@context/ReaderPreferencesContext';
import {FavoritesProvider} from '@context/FavoritesContext';
import {MemoryDeckProvider} from '@context/MemoryDeckContext';
import {PremiumProvider} from '@context/PremiumContext';
import {OfferingSheetProvider} from '@context/OfferingSheetContext';
import {AudioPlayerProvider} from '@/features/audio/context/AudioPlayerContext';
import {logger} from '@lib/utils/logger';
import {ErrorBoundary} from '@/components/ErrorBoundary';

/**
 * Web root layout (T21) — deliberately NOT app/_layout.tsx's provider tree.
 *
 * v1 web is a read-only reader with no login/sync/notifications
 * (Victor-confirmed scope, T21). This mounts only the providers those reader
 * screens actually touch — Auth/SyncEngine/Offering(real purchase flow)/
 * Donation/ReadingProgress/ReadingPlanProgress/CustomPlans/Together/
 * Bookmarks/Services are never imported here, so their native-only
 * dependencies (chiefly @react-native-firebase/*, which T20 found throws "No
 * Firebase App '[DEFAULT]' has been created" on web) never enter the web
 * bundle's mounted tree at all — no firestore.web.ts needed for this tanda.
 * (ServicesContext specifically: `useServices()` can never throw — its
 * `createContext` default is a real object, not `undefined` — so leaving it
 * unmounted costs nothing; mounting it would only add unnecessary write-path
 * machinery, achievement/highlight service init, to every web page load.)
 *
 * Premium/OfferingSheet/AudioPlayer/MemoryDeck ARE mounted below, but as
 * inert web STUBS (see PremiumContext.web.tsx / OfferingSheetContext.web.tsx
 * / AudioPlayerContext.web.tsx / MemoryDeckContext.web.tsx) rather than the
 * real native providers. Metro resolves those .web.tsx siblings
 * automatically in place of the imports below when bundling for web, so this
 * file imports the plain (bare) provider names exactly like the native tree
 * does. Without them, route files under app/features/** (and app/(tabs)/) —
 * originally ~27, now including 4 more found in a follow-up audit — that
 * call usePremium()/useOfferingSheet()/useAudioPlayer()/useMemoryDeck()
 * unconditionally (no .web.tsx variant, no Platform.OS guard) would throw
 * "must be used within a ...Provider" the instant they render — and since
 * firebase.json's catch-all SPA rewrite makes every one of those routes
 * reachable via a direct URL/bookmark, and ErrorBoundary below wraps the
 * whole Stack (not per-route), that throw took down the entire deployed web
 * app with no in-app recovery.
 *
 * MemoryDeck is specifically a STUB (not the real provider) despite having
 * no native-only dependency: mounting the real one would let a web visitor
 * build an SRS memorization deck that can never sync (no Auth/SyncEngine on
 * web) and silently vanishes on clearing site data — a data-loss trap, not a
 * harmless read feature. See MemoryDeckContext.web.tsx's header for the full
 * reasoning.
 *
 * FavoritesProvider, by contrast, IS mounted for real below (not stubbed):
 * it has the same "no native-only dependency" profile as MemoryDeck, but NO
 * web-reachable screen calls `addFavorite` (the .web.tsx reader screens only
 * do theme/i18n/version/prefs + bibleDB reads), so there is no equivalent
 * orphaned-data risk — favorites simply reads/displays an always-empty local
 * table, which is both correct and the simpler implementation (no new stub
 * file needed).
 */

function AppContent() {
  const {t} = useLanguage();
  const reduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({loaded: 0, total: 0});
  const [error, setError] = useState<string | null>(null);
  const [isStorageLocked, setIsStorageLocked] = useState(false);
  const [isClearingStorage, setIsClearingStorage] = useState(false);

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
      // A stale OPFS lock from an interrupted first-run download poisons
      // expo-sqlite's web worker for the rest of this page load (its VFS
      // singleton never retries after the first failed acquisition — see
      // isStorageLockError's doc comment), so calling initializeApp() again
      // in place, the way the generic Retry button below does, reliably
      // hits the exact same error. Only an actual page reload tears down
      // that worker and gives the browser a chance to drop the lock.
      setIsStorageLocked(isStorageLockError(err));
      setIsLoading(false);
    }
  }

  async function handleClearStorageAndReload() {
    setIsClearingStorage(true);
    try {
      await clearWebStorageForLockRecovery();
    } catch (clearError) {
      logger.error('Web storage clear error', clearError as Error, {
        component: 'RootLayoutWeb',
        action: 'handleClearStorageAndReload',
      });
    } finally {
      window.location.reload();
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

  if (error && isStorageLocked) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t.app.storageLockedTitle}</Text>
        <Text style={styles.errorText}>{t.app.storageLockedMessage}</Text>
        <TouchableOpacity
          style={styles.clearButton}
          disabled={isClearingStorage}
          onPress={handleClearStorageAndReload}
          accessibilityRole="button"
          accessibilityLabel={t.app.clearDataAndReload}>
          <Text style={styles.clearButtonText}>
            {isClearingStorage ? t.app.clearingData : t.app.clearDataAndReload}
          </Text>
        </TouchableOpacity>
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
    // Mirrors app/_layout.tsx's native root Stack for parity: same explicit,
    // reduced-motion-aware `animation` instead of an unconfigured default.
    // Whether react-native-screens' web build actually renders this as a
    // transition is unverified here — v1 web is the read-only reader shell,
    // and `(tabs)/_layout.web.tsx` (the nav one level down) is a bare `Slot`
    // with no animation concept at all, so this Stack is the only place on
    // web where it could matter.
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduceMotion ? 'none' : 'slide_from_right',
      }}>
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
  clearButton: {
    backgroundColor: staticColors.amber500,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
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
              <FavoritesProvider>
                <ReaderPreferencesProvider>
                  <MemoryDeckProvider>
                    <ToastProvider>
                      <PremiumProvider>
                        <OfferingSheetProvider>
                          <AudioPlayerProvider>
                            <ErrorBoundary>
                              <AppContent />
                            </ErrorBoundary>
                          </AudioPlayerProvider>
                        </OfferingSheetProvider>
                      </PremiumProvider>
                    </ToastProvider>
                  </MemoryDeckProvider>
                </ReaderPreferencesProvider>
              </FavoritesProvider>
            </BibleVersionProvider>
          </AccessibilityPreferencesProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
