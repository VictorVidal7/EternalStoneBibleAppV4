/* eslint-disable react-native/no-unused-styles -- styles consumed via the
   `createThemedStyles` factory below; the linter cannot trace factory
   returns through the `themedStyles.<x>` variable name. */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import React, {useEffect, useState, useMemo, useRef, useCallback} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {useRouter, useFocusEffect} from 'expo-router';
import {useTheme, colorThemes, ColorTheme, ThemeColors} from '@hooks/useTheme';
import {LinearGradient} from 'expo-linear-gradient';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useLanguage} from '@hooks/useLanguage';
import {initializeBibleData, resetBibleData} from '@lib/database/data-loader';
import {exportBackup} from '@/services/BackupService';
import {logger} from '@lib/utils/logger';
import {useAuth} from '@context/AuthContext';
import {useSyncEngineOptional, useConflicts} from '@context/SyncEngineContext';
import {useToast} from '@context/ToastContext';
import DailyVerseSettings from '@components/settings/DailyVerseSettings';
import MemoryGoalSettings from '@components/settings/MemoryGoalSettings';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

type ThemeOption = 'light' | 'dark' | 'auto';

// Helper function to determine readable text color based on background
function getReadableTextColor(
  lightBgColor: string,
  darkBgColor: string,
  isDark: boolean,
): string {
  // This is a simplified example. In a real app, you might use a more robust color contrast algorithm.
  // For now, we'll assume light text on dark backgrounds and dark text on light backgrounds.
  return isDark ? lightBgColor : darkBgColor;
}

export default function SettingsScreen() {
  const router = useRouter();
  const {
    mode,
    setThemeMode,
    isDark,
    colors,
    colorTheme,
    setColorTheme,
    gradient,
  } = useTheme();
  const {selectedVersion, setVersion, availableVersions} = useBibleVersion();
  const {language, setLanguage, t} = useLanguage();
  const {user, signInWithGoogle, signOut} = useAuth();
  const syncCtx = useSyncEngineOptional();
  const conflicts = useConflicts();
  const toast = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Tick every 10s so the "Synced Xs ago" label stays accurate without
  // re-rendering every frame.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const id = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(id);
  }, [user]);

  const syncIndicator = useMemo(() => {
    if (!syncCtx || !user || user.isAnonymous) return null;
    const {state} = syncCtx;
    if (state.pendingWrites > 0) {
      return state.pendingWrites === 1
        ? t.sync.syncingSingular
        : t.sync.syncing.replace('{{count}}', String(state.pendingWrites));
    }
    if (!state.isOnline) {
      if (state.pendingWrites === 1) return t.sync.offlineWithQueueSingular;
      if (state.pendingWrites > 1)
        return t.sync.offlineWithQueue.replace(
          '{{count}}',
          String(state.pendingWrites),
        );
      return t.sync.offline;
    }
    if (state.lastSyncedAt == null) return t.sync.waiting;
    const secsAgo = Math.max(
      0,
      Math.floor((nowTick - state.lastSyncedAt) / 1000),
    );
    if (secsAgo < 5) return t.sync.justNow;
    if (secsAgo < 60)
      return t.sync.secondsAgo.replace('{{n}}', String(secsAgo));
    const minsAgo = Math.floor(secsAgo / 60);
    return t.sync.minutesAgo.replace('{{n}}', String(minsAgo));
  }, [syncCtx, user, nowTick, t]);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );

  async function handleThemeChange(newMode: ThemeOption) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemeMode(newMode);
  }

  async function handleColorThemeChange(newColorTheme: ColorTheme) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setColorTheme(newColorTheme);
  }

  async function handleResetData() {
    Alert.alert(t.settings.resetTitle, t.settings.resetMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        // Confirm verb mirrors the action: this resets/reloads, it does
        // not delete user content (favorites/notes/highlights survive).
        text: t.settings.resetConfirm,
        style: 'destructive',
        onPress: async () => {
          setIsResetting(true);
          try {
            await resetBibleData();
            // The reset clears the verse tables and flags; reload right
            // away so the user lands on a working app instead of having
            // to close-and-reopen the way the old success copy demanded.
            await initializeBibleData();
            Alert.alert(
              t.settings.resetSuccess,
              t.settings.resetSuccessMessage,
              [{text: t.ok}],
            );
          } catch {
            Alert.alert(t.error, t.settings.resetError);
          } finally {
            setIsResetting(false);
          }
        },
      },
    ]);
  }

  function handleOpenGitHub() {
    Linking.openURL('https://github.com/VictorVidal7/EternalStoneBibleAppV4');
  }

  async function handleExportBackup() {
    setIsExporting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await exportBackup();
    } catch (error) {
      Alert.alert(t.error, t.settings.exportError, [{text: t.ok}]);
      void error;
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSignInWithGoogle() {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signInWithGoogle();
      toast.success(
        t.auth.signedInToast.replace(
          '{{name}}',
          user?.displayName ?? user?.email ?? '',
        ),
      );
    } catch (err: any) {
      // GoogleSignin status codes: SIGN_IN_CANCELLED = '-5' or '12501';
      // we tolerate cancellations silently and surface real errors.
      const code = err?.code ?? '';
      if (code === '-5' || code === '12501' || code === 'SIGN_IN_CANCELLED') {
        toast.info(t.auth.signInCancelled);
      } else {
        logger.error('Google sign-in failed', err as Error, {
          component: 'SettingsScreen',
          action: 'handleSignInWithGoogle',
        });
        toast.error(t.auth.signInError);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleSignOut() {
    Alert.alert(t.auth.signOutConfirmTitle, t.auth.signOutConfirmMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.auth.signOutConfirmCta,
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
            toast.success(t.auth.signedOutToast);
          } catch (err) {
            logger.error('Sign-out failed', err as Error, {
              component: 'SettingsScreen',
              action: 'handleSignOut',
            });
            toast.error(t.auth.signInError);
          }
        },
      },
    ]);
  }

  const themeActiveTextColor = getReadableTextColor(
    colors.primaryLight,
    colors.primaryDark,
    isDark,
  );
  const themedStyles = createThemedStyles(colors, isDark, themeActiveTextColor);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        {/* No back button — this is a root tab; bottom bar is the nav. */}

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="settings" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.tabs.settings}
            </Text>
            <Text style={styles.headerSubtitle}>{t.settings.subtitle}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}>
        {/* Appearance Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={themedStyles.sectionTitle}>
              {t.settings.appearance}
            </Text>
          </View>

          <View style={themedStyles.card}>
            <Text style={themedStyles.settingLabel}>{t.settings.theme}</Text>
            <Text style={themedStyles.settingDescription}>
              {t.settings.themeDescription}
            </Text>

            <View style={themedStyles.themeOptions}>
              <TouchableOpacity
                style={[
                  themedStyles.themeOption,
                  mode === 'light' && themedStyles.themeOptionActive,
                ]}
                onPress={() => handleThemeChange('light')}>
                <Ionicons
                  name="sunny"
                  size={24}
                  color={mode === 'light' ? themeActiveTextColor : colors.text}
                />
                <Text
                  style={[
                    themedStyles.themeOptionText,
                    mode === 'light' && themedStyles.themeOptionTextActive,
                  ]}>
                  {t.settings.themeLight}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themedStyles.themeOption,
                  mode === 'dark' && themedStyles.themeOptionActive,
                ]}
                onPress={() => handleThemeChange('dark')}>
                <Ionicons
                  name="moon"
                  size={24}
                  color={mode === 'dark' ? themeActiveTextColor : colors.text}
                />
                <Text
                  style={[
                    themedStyles.themeOptionText,
                    mode === 'dark' && themedStyles.themeOptionTextActive,
                  ]}>
                  {t.settings.themeDark}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themedStyles.themeOption,
                  mode === 'auto' && themedStyles.themeOptionActive,
                ]}
                onPress={() => handleThemeChange('auto')}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={mode === 'auto' ? themeActiveTextColor : colors.text}
                />
                <Text
                  style={[
                    themedStyles.themeOptionText,
                    mode === 'auto' && themedStyles.themeOptionTextActive,
                  ]}>
                  {t.settings.themeAuto}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Theme Selector - Compacto */}
          <View style={themedStyles.cardWithMargin}>
            <Text style={themedStyles.settingLabel}>
              {t.settings.colorTheme}
            </Text>
            <Text style={themedStyles.settingDescription}>
              {t.settings.colorThemeDescription}
            </Text>

            <View style={themedStyles.colorThemeGridCompact}>
              {(Object.keys(colorThemes) as ColorTheme[]).map(themeKey => {
                const theme = colorThemes[themeKey];
                const isSelected = colorTheme === themeKey;
                return (
                  <TouchableOpacity
                    key={themeKey}
                    style={[
                      themedStyles.colorThemeOptionCompact,
                      isSelected && themedStyles.colorThemeOptionCompactActive,
                    ]}
                    onPress={() => handleColorThemeChange(themeKey)}>
                    <View style={themedStyles.colorThemeCircleWrapper}>
                      <LinearGradient
                        colors={theme.preview as [string, string, string]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={themedStyles.colorThemePreviewCompact}>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#FFFFFF"
                          />
                        )}
                      </LinearGradient>
                    </View>
                    <Text
                      style={[
                        themedStyles.colorThemeNameCompact,
                        isSelected && themedStyles.colorThemeNameCompactActive,
                      ]}
                      numberOfLines={1}>
                      {t.settings.colorThemeNames[themeKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bible Version Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <Text style={themedStyles.sectionTitle}>
              {t.settings.bibleVersion}
            </Text>
          </View>

          <View style={themedStyles.card}>
            <Text style={themedStyles.settingLabel}>
              {t.settings.selectVersion}
            </Text>
            <Text style={themedStyles.settingDescription}>
              {t.settings.versionDescription}
            </Text>

            <View style={themedStyles.versionOptions}>
              {availableVersions.map(version => (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    themedStyles.versionOption,
                    selectedVersion.id === version.id &&
                      themedStyles.versionOptionActive,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    );
                    await setVersion(version.id);
                  }}>
                  <View style={styles.versionOptionContent}>
                    <View style={styles.versionHeader}>
                      <Text
                        style={[
                          themedStyles.versionAbbr,
                          selectedVersion.id === version.id &&
                            themedStyles.versionAbbrActive,
                        ]}>
                        {version.abbreviation}
                      </Text>
                      {selectedVersion.id === version.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={isDark ? colors.primaryDark : colors.primary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        themedStyles.versionName,
                        selectedVersion.id === version.id &&
                          themedStyles.versionNameActive,
                      ]}>
                      {version.name}
                    </Text>
                    <View style={styles.versionMeta}>
                      <Ionicons
                        name="language-outline"
                        size={12}
                        color={
                          selectedVersion.id === version.id
                            ? isDark
                              ? colors.primaryDark
                              : colors.primary
                            : colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          themedStyles.versionMetaText,
                          selectedVersion.id === version.id &&
                            themedStyles.versionMetaActive,
                        ]}>
                        {version.language === 'es' ? 'Español' : 'English'}
                      </Text>
                      {version.year && (
                        <>
                          <Text style={themedStyles.versionMetaText}> • </Text>
                          <Text
                            style={[
                              themedStyles.versionMetaText,
                              selectedVersion.id === version.id &&
                                themedStyles.versionMetaActive,
                            ]}>
                            {version.year}
                          </Text>
                        </>
                      )}
                    </View>
                    {version.id !== 'RVR1960' && version.id !== 'KJV' && (
                      <View style={themedStyles.comingSoonBadge}>
                        <Text style={themedStyles.comingSoonBadgeText}>
                          {t.settings.comingSoon}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons
              name="language-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={themedStyles.sectionTitle}>{t.settings.language}</Text>
          </View>

          <View style={themedStyles.card}>
            <Text style={themedStyles.settingLabel}>
              {t.settings.selectLanguage}
            </Text>
            <Text style={themedStyles.settingDescription}>
              {t.settings.languageDescription}
            </Text>

            <View style={themedStyles.languageOptions}>
              <TouchableOpacity
                style={[
                  themedStyles.languageOption,
                  language === 'es' && themedStyles.languageOptionActive,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await setLanguage('es');
                }}>
                <View style={styles.languageContent}>
                  <Text style={themedStyles.languageFlag}>🇪🇸</Text>
                  <Text
                    style={[
                      themedStyles.languageName,
                      language === 'es' && themedStyles.languageNameActive,
                    ]}>
                    Español
                  </Text>
                  {language === 'es' && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={isDark ? colors.primaryDark : colors.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themedStyles.languageOption,
                  language === 'en' && themedStyles.languageOptionActive,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await setLanguage('en');
                }}>
                <View style={styles.languageContent}>
                  <Text style={themedStyles.languageFlag}>🇺🇸</Text>
                  <Text
                    style={[
                      themedStyles.languageName,
                      language === 'en' && themedStyles.languageNameActive,
                    ]}>
                    English
                  </Text>
                  {language === 'en' && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={isDark ? colors.primaryDark : colors.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="server-outline" size={22} color={colors.primary} />
            <Text style={themedStyles.sectionTitle}>{t.settings.data}</Text>
          </View>

          <TouchableOpacity
            style={themedStyles.card}
            onPress={handleExportBackup}
            disabled={isExporting}
            accessibilityRole="button"
            accessibilityLabel={t.settings.exportBackup}>
            <View style={themedStyles.settingRow}>
              <View style={styles.settingInfo}>
                <Text
                  style={[themedStyles.settingLabel, {color: colors.primary}]}>
                  {isExporting ? t.settings.exporting : t.settings.exportBackup}
                </Text>
                <Text style={themedStyles.settingDescription}>
                  {t.settings.exportBackupDescription}
                </Text>
              </View>
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.card}
            onPress={handleResetData}
            disabled={isResetting}>
            <View style={themedStyles.settingRow}>
              <View style={styles.settingInfo}>
                <Text
                  style={[themedStyles.settingLabel, {color: colors.error}]}>
                  {isResetting ? t.settings.resetting : t.settings.resetData}
                </Text>
                <Text style={themedStyles.settingDescription}>
                  {t.settings.resetDescription}
                </Text>
              </View>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Verse Notifications */}
        <DailyVerseSettings />

        {/* Memorization goal + review reminder (Sprint 47) */}
        <MemoryGoalSettings />

        {/* New Features V5.1 Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="sparkles" size={22} color={colors.accent} />
            <Text style={themedStyles.sectionTitle}>{t.settingsV51.title}</Text>
          </View>

          <View style={themedStyles.card}>
            {/* Widgets */}
            <TouchableOpacity
              style={themedStyles.featureItem}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/features/widgets');
              }}>
              <View style={styles.featureContent}>
                <View
                  style={[
                    themedStyles.featureIcon,
                    {backgroundColor: colors.primary + '15'},
                  ]}>
                  <Ionicons name="apps" size={24} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={themedStyles.featureTitle}>
                    {t.settingsV51.widgets}
                  </Text>
                  <Text style={themedStyles.featureDescription}>
                    {t.settingsV51.widgetsDesc}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            {/* Badges & Titles */}
            <TouchableOpacity
              style={themedStyles.featureItem}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/features/badges');
              }}>
              <View style={styles.featureContent}>
                <View
                  style={[
                    themedStyles.featureIcon,
                    {backgroundColor: colors.warning + '15'},
                  ]}>
                  <Ionicons name="ribbon" size={24} color={colors.warning} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={themedStyles.featureTitle}>
                    {t.settingsV51.badges}
                  </Text>
                  <Text style={themedStyles.featureDescription}>
                    {t.settingsV51.badgesDesc}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            {/* Cache Stats */}
            <TouchableOpacity
              style={themedStyles.featureItemLast}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/features/cache-stats');
              }}>
              <View style={styles.featureContent}>
                <View style={themedStyles.featureIconSuccess}>
                  <Ionicons name="flash" size={24} color={colors.success} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={themedStyles.featureTitle}>
                    {t.settingsV51.cacheStats}
                  </Text>
                  <Text style={themedStyles.featureDescription}>
                    {t.settingsV51.cacheStatsDesc}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section (Sprint 41 — Firebase Auth) */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={themedStyles.sectionTitle}>{t.auth.sectionTitle}</Text>
          </View>

          <View style={themedStyles.card}>
            {user && !user.isAnonymous ? (
              <>
                <View style={styles.accountRow}>
                  {user.photoURL ? (
                    <Image
                      source={{uri: user.photoURL}}
                      style={styles.accountAvatar}
                      accessibilityLabel={t.auth.avatarA11y.replace(
                        '{{name}}',
                        user.displayName ?? user.email ?? '',
                      )}
                    />
                  ) : (
                    <View
                      style={[
                        styles.accountAvatar,
                        styles.accountAvatarFallback,
                        {backgroundColor: colors.primary + '20'},
                      ]}>
                      <Ionicons
                        name="person"
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <View style={styles.accountInfo}>
                    <Text style={themedStyles.settingLabel} numberOfLines={1}>
                      {user.displayName ?? t.auth.anonymousLabel}
                    </Text>
                    {user.email ? (
                      <Text
                        style={themedStyles.settingDescription}
                        numberOfLines={1}>
                        {user.email}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {syncIndicator ? (
                  <View style={styles.syncRow}>
                    <Ionicons
                      name={
                        syncCtx?.state.pendingWrites
                          ? 'cloud-upload-outline'
                          : !syncCtx?.state.isOnline
                            ? 'cloud-offline-outline'
                            : 'cloud-done-outline'
                      }
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.syncText, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {syncIndicator}
                    </Text>
                  </View>
                ) : null}
                {conflicts.length > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.conflictsBadge,
                      {
                        borderColor: colors.warning ?? colors.error,
                        backgroundColor:
                          (colors.warning ?? colors.error) + '15',
                      },
                    ]}
                    onPress={() => router.push('/(tabs)/conflicts')}
                    accessibilityRole="button"
                    accessibilityLabel={t.conflicts.badgeA11y}>
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color={colors.warning ?? colors.error}
                    />
                    <Text
                      style={[
                        styles.conflictsBadgeText,
                        {color: colors.warning ?? colors.error},
                      ]}
                      numberOfLines={1}>
                      {conflicts.length === 1
                        ? t.conflicts.badgeSingular
                        : t.conflicts.badge.replace(
                            '{{count}}',
                            String(conflicts.length),
                          )}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.warning ?? colors.error}
                    />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.historyRow, {borderColor: colors.border}]}
                  onPress={() => router.push('/features/conflicts/insights')}
                  accessibilityRole="button"
                  accessibilityLabel={t.conflicts.insights.openLabel}>
                  <Ionicons
                    name="git-merge-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.historyRowText, {color: colors.text}]}
                    numberOfLines={1}>
                    {t.conflicts.insights.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    themedStyles.signOutButton,
                    {borderColor: colors.error},
                  ]}
                  onPress={handleSignOut}
                  accessibilityRole="button"
                  accessibilityLabel={t.auth.signOut}>
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text
                    style={[
                      themedStyles.signOutButtonText,
                      {color: colors.error},
                    ]}>
                    {t.auth.signOut}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={[
                    themedStyles.settingDescription,
                    {marginBottom: 16, marginTop: 0},
                  ]}>
                  {t.auth.notSignedIn}
                </Text>
                <TouchableOpacity
                  style={[
                    themedStyles.googleSignInButton,
                    isAuthenticating && {opacity: 0.6},
                  ]}
                  onPress={handleSignInWithGoogle}
                  disabled={isAuthenticating}
                  accessibilityRole="button"
                  accessibilityLabel={t.auth.signInWithGoogle}>
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons
                      name="logo-google"
                      size={20}
                      color="#4285F4"
                      accessibilityLabel={t.auth.googleLogoA11y}
                    />
                  )}
                  <Text style={themedStyles.googleSignInButtonText}>
                    {t.auth.signInWithGoogle}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={themedStyles.sectionTitle}>{t.settings.about}</Text>
          </View>

          <View style={themedStyles.card}>
            <View style={themedStyles.aboutRow}>
              <Text style={themedStyles.settingLabel}>Eternal Bible</Text>
              <Text style={themedStyles.settingValue}>
                {t.settings.version} {Constants.expoConfig?.version ?? '3.0.4'}
              </Text>
            </View>

            <View style={themedStyles.aboutRow}>
              <Text style={themedStyles.settingDescription}>
                {t.settings.description}
              </Text>
            </View>

            <TouchableOpacity
              style={themedStyles.linkButton}
              onPress={handleOpenGitHub}>
              <Ionicons name="logo-github" size={20} color={colors.primary} />
              <Text style={themedStyles.linkText}>{t.settings.viewGitHub}</Text>
            </TouchableOpacity>

            {/* Dev-only Crashlytics smoke test. __DEV__ keeps it out of
                production builds; the long-press requirement keeps it
                out of accidental taps during dev. */}
            {__DEV__ && (
              <TouchableOpacity
                style={themedStyles.linkButton}
                onLongPress={() => {
                  Alert.alert(
                    'Crashlytics test',
                    'Force a native crash now? The app will close and the ' +
                      'crash should appear in the Firebase Console within ' +
                      '5-10 minutes.',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Crash',
                        style: 'destructive',
                        onPress: () => logger.testCrash(),
                      },
                    ],
                  );
                }}
                delayLongPress={800}>
                <Ionicons name="bug-outline" size={20} color={colors.error} />
                <Text style={[themedStyles.linkText, {color: colors.error}]}>
                  Dev · long-press to test crash
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={themedStyles.footer}>
          <Text style={themedStyles.footerText}>{t.settings.footerText}</Text>
          <Text style={themedStyles.footerVerse}>{t.settings.footerVerse}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: staticColors.glassWhite30,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: staticColors.glassWhite90,
    fontWeight: '500',
  },
  settingInfo: {
    flex: 1,
  },
  versionOptionContent: {
    flex: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  versionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  featureInfo: {
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  accountAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  syncText: {
    fontSize: 12,
    flex: 1,
  },
  conflictsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  conflictsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  historyRowText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

function createThemedStyles(
  colors: ThemeColors,
  isDark: boolean,
  themeActiveTextColor: string,
) {
  return StyleSheet.create({
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: staticColors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardWithMargin: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      shadowColor: staticColors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    settingValue: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600',
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    themeOptions: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 12,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primary + '40', // 25% opacity para visibilidad en modo oscuro
      borderColor: colors.primary,
      borderWidth: 2,
    },
    themeOptionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginTop: 8,
    },
    themeOptionTextActive: {
      color: themeActiveTextColor,
    },
    comingSoon: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.warning + '15',
      borderRadius: 8,
    },
    comingSoonText: {
      fontSize: 13,
      color: colors.warning,
      marginLeft: 8,
      flex: 1,
      lineHeight: 18,
    },
    versionOptions: {
      marginTop: 16,
      gap: 12,
    },
    versionOption: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderColor: colors.border,
    },
    versionOptionActive: {
      backgroundColor: colors.primary + '40', // 25% opacity para coincidir con themeOptionActive
      borderColor: colors.primary,
    },
    versionAbbr: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    versionAbbrActive: {
      // Color primario para coincidir con el estilo del botón GitHub
      color: colors.primary,
    },
    versionName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    versionNameActive: {
      // Color primario para coincidir con el estilo del botón GitHub
      color: colors.primary,
      fontWeight: '500',
    },
    versionMetaText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginLeft: 4,
    },
    versionMetaActive: {
      // Color primario para coincidir con el estilo del botón GitHub
      color: colors.primary,
    },
    comingSoonBadge: {
      marginTop: 10,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: colors.warning + '20',
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    comingSoonBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.warning,
    },
    languageOptions: {
      marginTop: 16,
      gap: 12,
    },
    languageOption: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderColor: colors.border,
    },
    languageOptionActive: {
      backgroundColor: colors.primary + '40', // 25% opacity para coincidir con themeOptionActive
      borderColor: colors.primary,
    },
    languageFlag: {
      fontSize: 28,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    languageNameActive: {
      // Color primario para coincidir con el estilo del botón GitHub
      color: colors.primary,
    },
    aboutRow: {
      marginBottom: 12,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.primary + '40', // 25% opacity para coincidir con themeOptionActive
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    linkText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    googleSignInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: isDark ? staticColors.glassWhite90 : staticColors.white,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: staticColors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    googleSignInButtonText: {
      fontSize: 15,
      color: '#3c4043',
      fontWeight: '600',
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    signOutButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      paddingTop: 32,
      paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
      paddingHorizontal: 16,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    footerVerse: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    featureItemLast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 0,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureIconSuccess: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success + '20',
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    colorThemeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 16,
      gap: 12,
    },
    colorThemeOption: {
      width: '30%',
      alignItems: 'center',
      padding: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: staticColors.transparent,
    },
    colorThemeOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    colorThemePreview: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    colorThemeName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    colorThemeNameActive: {
      // En modo oscuro usar color oscuro para contrastar con fondo claro
      color: isDark ? colors.primaryDark : colors.primary,
    },
    // Estilos compactos para el selector de temas
    colorThemeGridCompact: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
      justifyContent: 'flex-start',
    },
    colorThemeOptionCompact: {
      width: '23%',
      alignItems: 'center',
      padding: 6,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: staticColors.transparent,
    },
    colorThemeOptionCompactActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '40', // 25% opacity para coincidir con themeOptionActive
    },
    // Wrapper con borde circular para que el círculo sea visible en modo oscuro
    colorThemeCircleWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.25)' : staticColors.transparent,
      marginBottom: 4,
    },
    colorThemePreviewCompact: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorThemeNameCompact: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    colorThemeNameCompactActive: {
      // Color primario para coincidir con el estilo del botón GitHub
      color: colors.primary,
    },
  });
}
