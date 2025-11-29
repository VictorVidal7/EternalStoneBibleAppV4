import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {useState} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme} from '../../src/hooks/useTheme';
import {useBibleVersion} from '../../src/hooks/useBibleVersion';
import {useLanguage} from '../../src/hooks/useLanguage';
import {resetBibleData} from '../../src/lib/database/data-loader';
import * as Haptics from 'expo-haptics';
import type {Language} from '../../src/i18n/translations';

type ThemeOption = 'light' | 'dark' | 'auto';

export default function SettingsScreen() {
  const router = useRouter();
  const {mode, setThemeMode, isDark, colors} = useTheme();
  const {selectedVersion, setVersion, availableVersions} = useBibleVersion();
  const {language, setLanguage, t} = useLanguage();
  const [isResetting, setIsResetting] = useState(false);

  async function handleThemeChange(newMode: ThemeOption) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemeMode(newMode);
  }

  async function handleResetData() {
    Alert.alert(t.settings.resetTitle, t.settings.resetMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          setIsResetting(true);
          try {
            await resetBibleData();
            Alert.alert(
              t.settings.resetSuccess,
              t.settings.resetSuccessMessage,
              [{text: t.ok}],
            );
          } catch (error) {
            Alert.alert(t.error, t.settings.resetError);
          } finally {
            setIsResetting(false);
          }
        },
      },
    ]);
  }

  function handleOpenGitHub() {
    Linking.openURL('https://github.com/VictorVidal7/EternalStoneBibleAppV3');
  }

  const themedStyles = createThemedStyles(colors, isDark);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Appearance Section */}
      <View style={themedStyles.section}>
        <View style={themedStyles.sectionHeader}>
          <Ionicons
            name="color-palette-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={themedStyles.sectionTitle}>{t.settings.appearance}</Text>
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
                color={mode === 'light' ? '#FFFFFF' : colors.text}
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
                color={mode === 'dark' ? '#FFFFFF' : colors.text}
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
                color={mode === 'auto' ? '#FFFFFF' : colors.text}
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
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                        color={colors.primary}
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
                          ? colors.primary
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
          <Ionicons name="language-outline" size={22} color={colors.primary} />
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
                    color={colors.primary}
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
                    color={colors.primary}
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
          onPress={handleResetData}
          disabled={isResetting}>
          <View style={themedStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[themedStyles.settingLabel, {color: colors.error}]}>
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

          {/* Version Comparison */}
          <TouchableOpacity
            style={themedStyles.featureItem}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/features/version-comparison');
            }}>
            <View style={styles.featureContent}>
              <View
                style={[
                  themedStyles.featureIcon,
                  {backgroundColor: colors.accent + '15'},
                ]}>
                <Ionicons name="git-compare" size={24} color={colors.accent} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={themedStyles.featureTitle}>
                  {t.settingsV51.versionComparison}
                </Text>
                <Text style={themedStyles.featureDescription}>
                  {t.settingsV51.versionComparisonDesc}
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
            style={[themedStyles.featureItem, {borderBottomWidth: 0}]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/features/cache-stats');
            }}>
            <View style={styles.featureContent}>
              <View
                style={[
                  themedStyles.featureIcon,
                  {backgroundColor: '#10B981' + '15'},
                ]}>
                <Ionicons name="flash" size={24} color="#10B981" />
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
              {t.settings.version} 3.0.0
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
        </View>
      </View>

      {/* Footer */}
      <View style={themedStyles.footer}>
        <Text style={themedStyles.footerText}>{t.settings.footerText}</Text>
        <Text style={themedStyles.footerVerse}>{t.settings.footerVerse}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

function createThemedStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
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
      shadowColor: '#000',
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
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginTop: 8,
    },
    themeOptionTextActive: {
      color: '#FFFFFF',
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
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    versionAbbr: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    versionAbbrActive: {
      color: colors.primary,
    },
    versionName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    versionNameActive: {
      color: colors.text,
      fontWeight: '500',
    },
    versionMetaText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginLeft: 4,
    },
    versionMetaActive: {
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
      backgroundColor: colors.primaryLight,
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
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
    },
    linkText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
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
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
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
  });
}
