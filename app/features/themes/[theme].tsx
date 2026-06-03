/**
 * 🗂️ THEME DETAIL — the passages for one topical theme (Sprint 63)
 *
 * Resolves a theme's curated refs ([[themes]]) to verse text from the SQLite
 * Bible DB and lists them, each tappable to jump straight into the reader. The
 * header takes the theme's accent colour so each topic has its own identity.
 *
 * Reached from the browse screen and the deep link
 * eternalbible://features/themes/peace. 100% JS: the taxonomy is the pure
 * src/features/study/themes.ts; verse text is fetched from SQLite; zero new
 * native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {getTheme, parseThemeRef} from '@/features/study/themes';
import type {ThemeRefKey} from '@/features/study/themes';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

/** A resolved verse row (canonical key + display name + fetched text). */
interface ThemeVerseRow {
  key: string;
  bookId: number | null;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string | null;
}

const VERSION_KEY = '@bible_version';

/** Resolve a canonical "EnglishBook/Chapter/Verse" key to a display row. */
async function resolveRow(
  key: ThemeRefKey,
  version: string,
  language: 'es' | 'en',
): Promise<ThemeVerseRow> {
  const parsed = parseThemeRef(key);
  if (!parsed) {
    return {
      key,
      bookId: null,
      bookDisplay: key,
      chapter: 0,
      verse: 0,
      text: null,
    };
  }
  const book = getBookByName(parsed.book);
  const bookDisplay = book
    ? language === 'en'
      ? book.nameEn
      : book.name
    : parsed.book;
  if (!book) {
    return {
      key,
      bookId: null,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: null,
    };
  }
  try {
    const row = await bibleDB.getVerse(
      book.id,
      parsed.chapter,
      parsed.verse,
      version,
    );
    return {
      key,
      bookId: book.id,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: row?.text ?? null,
    };
  } catch {
    return {
      key,
      bookId: book.id,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: null,
    };
  }
}

export default function ThemeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const tt = t.themes;

  const params = useLocalSearchParams<{theme?: string}>();
  const theme = useMemo(() => getTheme(params.theme), [params.theme]);
  const localized = theme
    ? (tt.list as Record<string, {name: string; description: string}>)[theme.id]
    : undefined;
  const name = localized?.name ?? theme?.id ?? '';

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [rows, setRows] = useState<ThemeVerseRow[]>([]);

  const load = useCallback(async () => {
    if (!theme) {
      setStatus('unknown');
      return;
    }
    try {
      setStatus('loading');
      const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
      const resolved = await Promise.all(
        theme.verseRefs.map(k => resolveRow(k, version, language)),
      );
      setRows(resolved);
      setStatus('ready');
    } catch (err) {
      logger.error('Theme detail load failed', err as Error, {
        component: 'ThemeDetailScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [theme, language]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJump = useCallback(
    (row: ThemeVerseRow) => {
      if (row.bookId == null) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookDisplay}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const accent = theme?.accent ?? colors.primary;
  const headerGradient: [string, string] = [accent, colors.primaryDark];

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={(theme?.icon ?? 'grid') as keyof typeof Ionicons.glyphMap}
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tt.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {name}
              </AppText>
            </View>
          </View>
          {localized?.description ? (
            <AppText scaleRole="compact" style={styles.headerDesc}>
              {localized.description}
            </AppText>
          ) : null}
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={accent} />
            </View>
          )}

          {(status === 'error' || status === 'unknown') && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {tt.error}
              </AppText>
            </View>
          )}

          {status === 'ready' &&
            rows.map(row => {
              const ref = `${row.bookDisplay} ${row.chapter}:${row.verse}`;
              return (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.verseCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleJump(row)}
                  disabled={row.bookId == null}
                  accessibilityRole="button"
                  accessibilityLabel={ref}
                  accessibilityHint={tt.openHint}>
                  <View style={styles.verseHeader}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.verseRef, {color: accent}]}>
                      {ref}
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text
                    style={[styles.verseText, {color: colors.textSecondary}]}
                    numberOfLines={4}>
                    {row.text ?? tt.missingText}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerDesc: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  verseCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verseRef: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  verseText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
});
