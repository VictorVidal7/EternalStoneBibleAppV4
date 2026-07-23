import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Stack} from 'expo-router';

import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useReaderPreferences} from '@context/ReaderPreferencesContext';
import {
  READER_FONT_SIZE_MIN,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_STEP,
} from '@context/ReaderPreferencesContext';
import {spacing, fontSize} from '@/styles/designTokens';
import {centeredMaxWidth, CONTENT_MAX_WIDTH} from '@/styles/responsive';

/**
 * Web settings (T21) — "Ajustes básicos" per Victor's confirmed scope: theme,
 * font size, language. None of native settings.tsx's ~15 sections (account,
 * sync, notifications, premium, backup/restore, accessibility toggles tied
 * to write features) apply — those contexts aren't mounted on web at all.
 */

type ThemeMode = 'light' | 'dark' | 'auto';
const MODES: ThemeMode[] = ['auto', 'light', 'dark'];

export default function SettingsScreenWeb() {
  const {colors, mode, setThemeMode} = useTheme();
  const {t, language, setLanguage} = useLanguage();
  const {preferences, setFontSize, setRedLetterWords} = useReaderPreferences();

  const modeLabel = (m: ThemeMode) =>
    m === 'light'
      ? t.settings.themeLight
      : m === 'dark'
        ? t.settings.themeDark
        : t.settings.themeAuto;

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <ScrollView
        style={{backgroundColor: colors.background}}
        contentContainerStyle={[
          styles.content,
          centeredMaxWidth(CONTENT_MAX_WIDTH),
        ]}>
        <Text style={[styles.title, {color: colors.text}]}>
          {t.settings.title}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            {t.settings.theme}
          </Text>
          <View style={styles.row}>
            {MODES.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setThemeMode(m)}
                accessibilityRole="button"
                accessibilityLabel={modeLabel(m)}
                style={[
                  styles.chip,
                  {borderColor: colors.glassBorder},
                  mode === m && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: mode === m ? colors.onPrimary : colors.text},
                  ]}>
                  {modeLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            {t.readerPrefs.redLetterSection}
          </Text>
          <Text style={[styles.hintText, {color: colors.textSecondary}]}>
            {t.readerPrefs.redLetterWordsHint}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setRedLetterWords(!preferences.redLetterWords)}
              accessibilityRole="button"
              accessibilityLabel={t.readerPrefs.redLetterWords}
              style={[
                styles.chip,
                {borderColor: colors.glassBorder},
                preferences.redLetterWords && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: preferences.redLetterWords
                      ? colors.onPrimary
                      : colors.text,
                  },
                ]}>
                {t.readerPrefs.redLetterWords}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            {t.settings.webFontSize}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() =>
                setFontSize(
                  Math.max(
                    READER_FONT_SIZE_MIN,
                    preferences.fontSize - READER_FONT_SIZE_STEP,
                  ),
                )
              }
              accessibilityRole="button"
              accessibilityLabel="A-"
              style={[styles.chip, {borderColor: colors.glassBorder}]}>
              <Text style={[styles.chipTextBold, {color: colors.text}]}>
                A-
              </Text>
            </TouchableOpacity>
            <Text style={[styles.fontSizeValue, {color: colors.text}]}>
              {preferences.fontSize}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setFontSize(
                  Math.min(
                    READER_FONT_SIZE_MAX,
                    preferences.fontSize + READER_FONT_SIZE_STEP,
                  ),
                )
              }
              accessibilityRole="button"
              accessibilityLabel="A+"
              style={[styles.chip, {borderColor: colors.glassBorder}]}>
              <Text style={[styles.chipTextBold, {color: colors.text}]}>
                A+
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            {t.settings.language}
          </Text>
          <View style={styles.row}>
            {(['es', 'en'] as const).map(lang => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                accessibilityRole="button"
                accessibilityLabel={lang === 'es' ? 'Español' : 'English'}
                style={[
                  styles.chip,
                  {borderColor: colors.glassBorder},
                  language === lang && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: language === lang ? colors.onPrimary : colors.text,
                    },
                  ]}>
                  {lang === 'es' ? 'Español' : 'English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {padding: spacing.lg, paddingTop: spacing['2xl']},
  title: {fontSize: 26, fontWeight: '700', marginBottom: spacing.xl},
  section: {marginBottom: spacing.xl},
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  fontSizeValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  chipText: {fontWeight: '600'},
  chipTextBold: {fontWeight: '700'},
});
