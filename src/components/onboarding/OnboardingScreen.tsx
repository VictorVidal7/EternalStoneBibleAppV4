/**
 * 👋 ONBOARDING SCREEN
 *
 * First-run wizard that walks the user through the four choices that
 * shape the rest of the app: language, Bible version, color theme, and
 * a final "all set" celebration. Mounted by `app/_layout.tsx` after the
 * Bible data has loaded but before the tab stack is shown, and only
 * when `@onboarding_completed` is unset.
 *
 * Each step drives the existing context (LanguageProvider /
 * BibleVersionProvider / ThemeProvider) immediately on selection — no
 * "submit at the end" — so the user sees the app react in real time.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {haptics} from '@lib/haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  colorThemes,
  useTheme,
  ColorTheme,
  PREMIUM_COLOR_THEMES,
} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import type {Language} from '../../i18n/translations';
import {useBibleVersion} from '../../hooks/useBibleVersion';
import type {BibleVersion} from '../../types/bible';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '../../styles/designTokens';

const TOTAL_STEPS = 5;

interface OnboardingScreenProps {
  onDone: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({onDone}) => {
  const insets = useSafeAreaInsets();
  const {colors, gradient, colorTheme, setColorTheme} = useTheme();
  const {language, setLanguage, t} = useLanguage();
  const {selectedVersion, setVersion, availableVersions} = useBibleVersion();

  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === TOTAL_STEPS - 1;

  const goNext = () => {
    haptics.tap();
    if (isLast) {
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (isFirst) return;
    haptics.tap();
    setStep(step - 1);
  };

  const handleLanguage = async (next: Language) => {
    haptics.tap();
    await setLanguage(next);
  };

  const handleVersion = async (id: string) => {
    haptics.tap();
    await setVersion(id);
  };

  const handleColorTheme = async (id: ColorTheme) => {
    haptics.tap();
    await setColorTheme(id);
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <StatusBar barStyle="light-content" />

      {/* Header gradient — uses the active color theme so step 4 (theme
          picker) feels alive: tapping a swatch immediately flips the
          gradient. */}
      <LinearGradient
        colors={gradient.headerColors as readonly [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.headerGradient, {paddingTop: insets.top + spacing.md}]}>
        <Text style={styles.stepIndicator}>
          {t.onboarding.step
            .replace('{{current}}', String(step + 1))
            .replace('{{total}}', String(TOTAL_STEPS))}
        </Text>
        <View style={styles.dotsRow}>
          {Array.from({length: TOTAL_STEPS}).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : styles.dotIdle,
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          {paddingBottom: insets.bottom + spacing['4xl']},
        ]}>
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <LanguageStep
            language={language}
            onSelect={handleLanguage}
            colors={colors}
            t={t}
          />
        )}
        {step === 2 && (
          <VersionStep
            currentId={selectedVersion.id}
            onSelect={handleVersion}
            versions={availableVersions}
            colors={colors}
            t={t}
          />
        )}
        {step === 3 && (
          <ColorThemeStep
            currentTheme={colorTheme}
            onSelect={handleColorTheme}
            colors={colors}
            t={t}
          />
        )}
        {step === 4 && <DoneStep />}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        {!isFirst ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={[styles.backText, {color: colors.text}]}>
              {t.onboarding.back}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <TouchableOpacity
          style={[styles.nextButton, {backgroundColor: colors.primary}]}
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={
            isLast ? t.onboarding.done.cta : t.onboarding.next
          }>
          <Text style={[styles.nextText, {color: colors.onPrimary}]}>
            {isFirst
              ? t.onboarding.welcome.cta
              : isLast
                ? t.onboarding.done.cta
                : t.onboarding.next}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// STEP COMPONENTS
// ============================================================================

const WelcomeStep: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  return (
    <View style={styles.step}>
      <View style={[styles.heroIcon, {backgroundColor: colors.primary + '20'}]}>
        <Ionicons name="book" size={72} color={colors.primary} />
      </View>
      <Text style={[styles.title, {color: colors.text}]}>
        {t.onboarding.welcome.title}
      </Text>
      <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
        {t.onboarding.welcome.subtitle}
      </Text>
      <Text style={[styles.body, {color: colors.textSecondary}]}>
        {t.onboarding.welcome.body}
      </Text>
    </View>
  );
};

interface LanguageStepProps {
  language: Language;
  onSelect: (lang: Language) => void;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    surface: string;
  };
  t: ReturnType<typeof useLanguage>['t'];
}
const LanguageStep: React.FC<LanguageStepProps> = ({
  language,
  onSelect,
  colors,
  t,
}) => {
  const langs: {id: Language; flag: string; label: string}[] = [
    {id: 'es', flag: '🇪🇸', label: 'Español'},
    {id: 'en', flag: '🇺🇸', label: 'English'},
  ];

  return (
    <View style={styles.step}>
      <Text style={[styles.title, {color: colors.text}]}>
        {t.onboarding.language.title}
      </Text>
      <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
        {t.onboarding.language.subtitle}
      </Text>

      <View style={styles.optionList}>
        {langs.map(({id, flag, label}) => {
          const active = language === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.optionRow,
                active ? styles.borderActive : styles.borderInactive,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => onSelect(id)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{selected: active}}>
              <Text style={styles.optionFlag}>{flag}</Text>
              <Text style={[styles.optionLabel, {color: colors.text}]}>
                {label}
              </Text>
              {active && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface VersionStepProps {
  currentId: string;
  onSelect: (id: string) => void;
  /** Installed versions to offer (bundled during onboarding). */
  versions: BibleVersion[];
  colors: LanguageStepProps['colors'];
  t: ReturnType<typeof useLanguage>['t'];
}
const VersionStep: React.FC<VersionStepProps> = ({
  currentId,
  onSelect,
  versions,
  colors,
  t,
}) => {
  return (
    <View style={styles.step}>
      <Text style={[styles.title, {color: colors.text}]}>
        {t.onboarding.version.title}
      </Text>
      <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
        {t.onboarding.version.subtitle}
      </Text>

      <View style={styles.optionList}>
        {versions.map(v => {
          const active = currentId === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.optionRow,
                active ? styles.borderActive : styles.borderInactive,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => onSelect(v.id)}
              accessibilityRole="button"
              accessibilityLabel={`${v.name} ${v.year}`}
              accessibilityState={{selected: active}}>
              <View style={styles.versionInfo}>
                <Text style={[styles.optionLabel, {color: colors.text}]}>
                  {v.abbreviation}
                </Text>
                <Text
                  style={[styles.versionMeta, {color: colors.textSecondary}]}>
                  {v.name} · {v.year}
                </Text>
              </View>
              {active && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface ColorThemeStepProps {
  currentTheme: ColorTheme;
  onSelect: (id: ColorTheme) => void;
  colors: LanguageStepProps['colors'];
  t: ReturnType<typeof useLanguage>['t'];
}
const ColorThemeStep: React.FC<ColorThemeStepProps> = ({
  currentTheme,
  onSelect,
  colors,
  t,
}) => {
  // A brand-new install can't have unlocked anything yet — never offer a
  // premium theme here, only in Settings once there's a real entitlement.
  const ids = (Object.keys(colorThemes) as ColorTheme[]).filter(
    id => !PREMIUM_COLOR_THEMES.includes(id),
  );

  return (
    <View style={styles.step}>
      <Text style={[styles.title, {color: colors.text}]}>
        {t.onboarding.theme.title}
      </Text>
      <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
        {t.onboarding.theme.subtitle}
      </Text>

      <View style={styles.themeGrid}>
        {ids.map(id => {
          const active = currentTheme === id;
          const preview = colorThemes[id].preview;
          const name = t.settings.colorThemeNames[id];
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.themeTile,
                active ? styles.dotBorderActive : styles.dotBorderInactive,
                {
                  borderColor: active
                    ? colors.primary
                    : staticColors.transparent,
                },
              ]}
              onPress={() => onSelect(id)}
              accessibilityRole="button"
              accessibilityLabel={name}
              accessibilityState={{selected: active}}>
              <LinearGradient
                colors={
                  preview as unknown as readonly [string, string, ...string[]]
                }
                style={styles.themeSwatch}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                {active && (
                  <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                )}
              </LinearGradient>
              <Text style={[styles.themeName, {color: colors.text}]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const DoneStep: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  return (
    <View style={styles.step}>
      <View style={[styles.heroIcon, {backgroundColor: colors.primary + '20'}]}>
        <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
      </View>
      <Text style={[styles.title, {color: colors.text}]}>
        {t.onboarding.done.title}
      </Text>
      <Text style={[styles.body, {color: colors.textSecondary}]}>
        {t.onboarding.done.body}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  borderActive: {borderWidth: 2},
  borderInactive: {borderWidth: 1},
  dotBorderActive: {borderWidth: 3},
  dotBorderInactive: {borderWidth: 0},
  root: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  stepIndicator: {
    color: staticColors.glassWhite85,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: staticColors.white,
  },
  dotIdle: {
    backgroundColor: staticColors.glassWhite35,
  },
  body: {
    flex: 1,
    fontSize: fontSizes.base,
    lineHeight: 24,
    textAlign: 'center',
  },
  bodyContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  step: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionList: {
    width: '100%',
    gap: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  optionFlag: {
    fontSize: 32,
  },
  optionLabel: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  versionInfo: {
    flex: 1,
  },
  versionMeta: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  themeTile: {
    width: 96,
    alignItems: 'center',
    padding: 4,
    borderRadius: borderRadius.lg,
  },
  themeSwatch: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  themeName: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 88,
  },
  backText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    marginLeft: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  nextText: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
});
