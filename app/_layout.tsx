import {Stack} from 'expo-router';
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet, LogBox, TouchableOpacity} from 'react-native';
import {staticColors} from '@/styles/designTokens';

// React Native Firebase v22+ emits a verbose namespaced-API deprecation
// warning on EVERY firestore/crashlytics call (collection/onSnapshot/log…),
// which buries genuine warnings in the LogBox. The namespaced API still works
// correctly — a full modular-API migration of the live sync layer is queued
// for a dedicated effort (it touches the user's synced data, so it needs real
// Firestore testing). Until then, use RNFirebase's own sanctioned flag to
// silence the advisory noise AT THE SOURCE (no console spam, no perf cost),
// so the LogBox only surfaces warnings that actually matter. Must run before
// any Firebase call (contexts mount after this module loads).
(
  globalThis as {RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS?: boolean}
).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// En produccion ignorar todo, en desarrollo ignorar warnings no criticos
if (!__DEV__) {
  LogBox.ignoreAllLogs();
} else {
  // In development, ignore non-critical warnings to reduce noise
  LogBox.ignoreLogs([
    'Remote debugger',
    'Debugger and device times',
    'Non-serializable values were found in the navigation state',
    'Require cycle',
    'ViewPropTypes',
    'ColorPropType',
    'EdgeInsetsPropType',
    'PointPropType',
    'Animated:',
    'componentWillReceiveProps',
    'componentWillMount',
    'Each child in a list',
    'VirtualizedLists should never',
    'Failed prop type',
    'Warning:',
    // Defensive belt-and-suspenders for the RNFirebase deprecation warning
    // (the source-level flag above is the primary silencer).
    'This method is deprecated',
    // Reanimated logs this in dev whenever the OS "reduce motion" a11y
    // setting is on (emulators default it on); it's informational only and
    // never affects production — the app already honors reduced motion.
    '[Reanimated] Reduced motion',
  ]);
}
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {initializeBibleData} from '@lib/database/data-loader';
import {loadReaderFonts} from '@lib/reader/fontAssets';
import {ThemeProvider} from '@hooks/useTheme';
import {BibleVersionProvider, useBibleVersion} from '@hooks/useBibleVersion';
import {LanguageProvider, useLanguage} from '@hooks/useLanguage';
import {ServicesProvider} from '@context/ServicesContext';
import {ToastProvider} from '@context/ToastContext';
import {ReadingProgressProvider} from '@context/ReadingProgressContext';
import {FavoritesProvider} from '@context/FavoritesContext';
import {BookmarksProvider} from '@context/BookmarksContext';
import {ReadingPlanProgressProvider} from '@context/ReadingPlanProgressContext';
import {ReaderPreferencesProvider} from '@context/ReaderPreferencesContext';
import {MemoryDeckProvider} from '@context/MemoryDeckContext';
import {AuthProvider} from '@context/AuthContext';
import {SyncEngineProvider} from '@context/SyncEngineContext';
import {useOnboarding} from '@hooks/useOnboarding';
import {OnboardingScreen} from '@components/onboarding/OnboardingScreen';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {predictiveCacheService} from '@lib/cache/PredictiveCache';
import {badgeSystemService} from '@lib/badges/BadgeSystem';
import {versionComparisonService} from '@lib/comparison/VersionComparison';
import {widgetTaskHandler} from '@/widgets/WidgetTaskHandler';
// Achievement unlock celebration modal (driven by ServicesContext.notifyAchievements)
import {AchievementNotifications} from '@/components/AchievementNotifications';
// Audio Bible Feature
import {AudioPlayerProvider} from '@/features/audio/context/AudioPlayerContext';
import {MiniAudioPlayer} from '@/features/audio/components/MiniAudioPlayer';
// Cold-start player restore (Sprint 53)
import {AudioResumeRestorer} from '@/features/audio/components/AudioResumeRestorer';
// Continuous playback across chapters (Sprint 72)
import {AudioChapterAdvancer} from '@/features/audio/components/AudioChapterAdvancer';
import {AudioListeningTracker} from '@/features/audio/components/AudioListeningTracker';
// Premium entitlement (Sprint 50 — local feature flag)
import {PremiumProvider} from '@context/PremiumContext';
import {
  refreshDailyVerseNotifications,
  refreshMemoryReminders,
  refreshPrayerReminders,
} from '@lib/notifications/NotificationService';

function AppContent() {
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {completed: onboardingCompleted, complete: completeOnboarding} =
    useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({loaded: 0, total: 0});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  // Once the app is ready, top up the rolling window of daily-verse
  // notifications (no-op unless the user has enabled the reminder). Re-runs
  // if the language or Bible version changes so the verse text stays correct.
  useEffect(() => {
    if (isLoading) return;
    refreshDailyVerseNotifications({
      language,
      version: selectedVersion.id,
    }).catch(() => {
      // Notifications are best-effort; never block the app on them.
    });
    // Sprint 47 — top up the memorization review reminder window too.
    refreshMemoryReminders({language}).catch(() => {});
    // Sprint 95 — and the gentle prayer reminder window.
    refreshPrayerReminders({language}).catch(() => {});
  }, [isLoading, language, selectedVersion.id]);

  async function initializeApp() {
    try {
      // initializeBibleData is idempotent + INCREMENTAL: bibleDB.initialize() is
      // safe to re-run and each version is guarded by its own AsyncStorage flag,
      // so an install that already has RVR1960 + KJV only pays the one-time
      // additive load of any newly bundled version (WEB, Sprint 66) and a fully
      // up-to-date install just does a few cheap flag reads. (Until Sprint 66
      // this was gated on checkDataStatus().isLoaded, which short-circuited the
      // WHOLE init the moment ANY version was present — so a newly added version
      // would never seed on an existing device.)
      await initializeBibleData((loaded, total) => {
        setLoadingProgress({loaded, total});
      });

      // ✨ Inicializar servicios V5.1
      logger.info('Inicializando servicios V5.1', {
        component: 'RootLayout',
        action: 'initializeApp',
      });
      try {
        await Promise.all([
          predictiveCacheService.initialize(),
          badgeSystemService.initialize(),
          versionComparisonService.initialize(),
          widgetTaskHandler.initialize(),
          // Register the bundled reader typefaces (Sprint 82) so the reader's
          // first paint already has the chosen face. Best-effort: a font load
          // failure must never abort the other services or the app, and the
          // text falls back to the system default until a later load lands.
          loadReaderFonts().catch(() => undefined),
        ]);

        // Precalentar caché con contenido popular
        await predictiveCacheService.warmupCache();

        // Limpiar entradas expiradas del caché
        await predictiveCacheService.cleanup();

        logger.info('Servicios V5.1 inicializados correctamente', {
          component: 'RootLayout',
          action: 'initializeApp',
        });
      } catch (serviceError) {
        logger.warn('Algunos servicios V5.1 no se pudieron inicializar', {
          component: 'RootLayout',
          action: 'initializeApp',
          error: serviceError,
        });
        // No fallar la app, solo continuar sin los servicios V5.1
      }

      setIsLoading(false);
    } catch (err) {
      logger.error('Initialization error', err as Error, {
        component: 'RootLayout',
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
        <Text style={styles.errorHint}>{t.app.errorHint}</Text>
      </View>
    );
  }

  // Onboarding gate — show the first-run wizard before the tabs ever
  // mount. `null` = still hydrating the flag, so render a tick of nothing
  // rather than briefly flashing either UI.
  if (onboardingCompleted === null) {
    return <View style={styles.loadingContainer} />;
  }
  if (onboardingCompleted === false) {
    return <OnboardingScreen onDone={completeOnboarding} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Celebrates freshly-earned achievements app-wide. Inert until
          ServicesContext.notifyAchievements is called (Sprint 64 wired it — the
          modal was previously a no-op because setNewAchievements was never
          invoked, so it had been left commented out). */}
      <AchievementNotifications />
      <MiniAudioPlayer />
      {/* Re-opens the floating player at the last position on cold start
          (premium, paused) — Sprint 53. Render-less. */}
      <AudioResumeRestorer />
      {/* Continuous playback: auto-advances into the next chapter when the
          current one finishes (Sprint 72). Render-less. */}
      <AudioChapterAdvancer />
      {/* Tracks listening time + voiced verses into per-day buckets for the
          "Mi lectura" listening card (Sprint 75). Render-less. */}
      <AudioListeningTracker />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  errorHint: {
    fontSize: 14,
    color: staticColors.grayTertiary,
    textAlign: 'center',
    marginTop: 16,
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <LanguageProvider>
        <ThemeProvider>
          <BibleVersionProvider>
            <ServicesProvider database={bibleDB}>
              <AuthProvider>
                <SyncEngineProvider>
                  <ReadingProgressProvider>
                    <ReadingPlanProgressProvider>
                      <FavoritesProvider>
                        <BookmarksProvider>
                          <ReaderPreferencesProvider>
                            <MemoryDeckProvider>
                              <ToastProvider>
                                <PremiumProvider>
                                  <AudioPlayerProvider>
                                    <AppContent />
                                  </AudioPlayerProvider>
                                </PremiumProvider>
                              </ToastProvider>
                            </MemoryDeckProvider>
                          </ReaderPreferencesProvider>
                        </BookmarksProvider>
                      </FavoritesProvider>
                    </ReadingPlanProgressProvider>
                  </ReadingProgressProvider>
                </SyncEngineProvider>
              </AuthProvider>
            </ServicesProvider>
          </BibleVersionProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
