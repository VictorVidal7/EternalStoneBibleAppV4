/**
 * 💛 FEELING DETAIL — the Word for one state of heart (Sprint 79)
 *
 * Resolves a feeling's curated refs ([[feelings]]) to verse text from the
 * SQLite Bible DB and lists them, each tappable to jump straight into the
 * reader — opened by a short breath-prayer card and closed by a doorway into
 * the feeling's related topical theme ("Explora el tema: Paz →"). The header
 * takes the feeling's accent colour so each state of heart has its own
 * identity.
 *
 * Reached from the browse screen, the Home chip row, and the deep link
 * eternalbible://features/feelings/anxious. 100% JS: the taxonomy is the pure
 * src/features/study/feelings.ts; verse text is fetched from SQLite; zero new
 * native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
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
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {christLangForVersion} from '@/features/study/christConnections';
import {getFeeling} from '@/features/study/feelings';
import {recordTodayFeeling} from '@/features/study/feelingsLogStore';
import {parseThemeRef} from '@/features/study/themes';
import type {ThemeRefKey} from '@/features/study/themes';
import {buildVersePlaylist, useAudioPlayer} from '@/features/audio';
import {useToast} from '@context/ToastContext';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

/** A resolved verse row (canonical key + display name + fetched text). */
interface FeelingVerseRow {
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
): Promise<FeelingVerseRow> {
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

export default function FeelingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tf = t.feelings;

  const params = useLocalSearchParams<{feeling?: string}>();
  const {loadChapter, play} = useAudioPlayer();
  const toast = useToast();
  const feeling = useMemo(() => getFeeling(params.feeling), [params.feeling]);
  const localized = feeling
    ? (
        tf.list as Record<
          string,
          {name: string; description: string; prayer: string}
        >
      )[feeling.id]
    : undefined;
  const name = localized?.name ?? feeling?.id ?? '';

  const relatedTheme = feeling
    ? (t.themes.list as Record<string, {name: string}>)[feeling.relatedThemeId]
    : undefined;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [rows, setRows] = useState<FeelingVerseRow[]>([]);

  const load = useCallback(async () => {
    if (!feeling) {
      setStatus('unknown');
      return;
    }
    try {
      setStatus('loading');
      const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
      // Book names follow the reading version's language, not the UI language.
      const bookLang = christLangForVersion(version);
      const resolved = await Promise.all(
        feeling.verseRefs.map(k => resolveRow(k, version, bookLang)),
      );
      setRows(resolved);
      setStatus('ready');
    } catch (err) {
      logger.error('Feeling detail load failed', err as Error, {
        component: 'FeelingDetailScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [feeling]);

  useEffect(() => {
    load();
  }, [load]);

  // Emotional check-in history (Sprint 80): opening a feeling IS the
  // check-in — whoever the entry (Home chips, browse grid, deep link).
  // One per local day, last write wins; device-local only.
  useEffect(() => {
    if (feeling) void recordTodayFeeling(feeling.id);
  }, [feeling]);

  const handleJump = useCallback(
    (row: FeelingVerseRow) => {
      if (row.bookId == null) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookDisplay}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const handleOpenTheme = useCallback(() => {
    if (!feeling) return;
    haptics.tap();
    router.push(`/features/themes/${feeling.relatedThemeId}` as never);
  }, [router, feeling]);

  // 🎧 Listen to these verses (Sprint 80): the feeling's resolved rows queue
  // as a labeled verse playlist — the same composition as the theme detail.
  const handleListenAll = useCallback(() => {
    const playlist = buildVersePlaylist(
      rows
        .filter(r => r.bookId != null && r.text)
        .map(r => ({
          book: r.bookDisplay,
          chapter: r.chapter,
          verse: r.verse,
          text: r.text as string,
        })),
    );
    if (playlist.length === 0) return;
    haptics.press();
    logger.info('Feeling playlist queued', {
      feeling: feeling?.id,
      count: playlist.length,
    });
    loadChapter(playlist, {mode: 'playlist', label: name});
    // Let loadChapter's eager refs settle before play (the engine idiom).
    setTimeout(() => play(), 150);
    toast.success(
      t.audio.queue.playlistQueued
        .replace('{{label}}', name)
        .replace('{{n}}', String(playlist.length)),
    );
  }, [rows, feeling?.id, name, loadChapter, play, toast, t]);

  const accent = feeling?.accent ?? colors.primary;
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [accent, colors.primaryDark];

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
                name={
                  (feeling?.icon ??
                    'heart-half') as keyof typeof Ionicons.glyphMap
                }
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tf.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {name}
              </AppText>
            </View>
            {/* 🎧 Queue these verses as a playlist (Sprint 80). */}
            {status === 'ready' && (
              <TouchableOpacity
                style={styles.listenButton}
                onPress={handleListenAll}
                accessibilityRole="button"
                accessibilityLabel={tf.listenAll}>
                <Ionicons
                  name="headset-outline"
                  size={22}
                  color={staticColors.white}
                />
              </TouchableOpacity>
            )}
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
                {tf.error}
              </AppText>
            </View>
          )}

          {status === 'ready' && localized?.prayer ? (
            <View
              style={[
                styles.prayerCard,
                {backgroundColor: accent + '14', borderColor: accent + '40'},
              ]}>
              <View style={styles.prayerHeader}>
                <Ionicons name="rose-outline" size={16} color={accent} />
                <AppText
                  scaleRole="compact"
                  style={[styles.prayerTitle, {color: accent}]}>
                  {tf.prayerTitle}
                </AppText>
              </View>
              <Text style={[styles.prayerText, {color: colors.text}]}>
                {localized.prayer}
              </Text>
              <AppText
                scaleRole="compact"
                style={[styles.prayerHedge, {color: colors.textSecondary}]}>
                {tf.prayerHedge}
              </AppText>
            </View>
          ) : null}

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
                  accessibilityHint={tf.openHint}>
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
                    {row.text ?? tf.missingText}
                  </Text>
                </TouchableOpacity>
              );
            })}

          {status === 'ready' && relatedTheme ? (
            <TouchableOpacity
              style={[
                styles.themeCta,
                {backgroundColor: colors.card, borderColor: accent + '55'},
              ]}
              onPress={handleOpenTheme}
              accessibilityRole="button"
              accessibilityLabel={tf.relatedTheme.replace(
                '{{theme}}',
                relatedTheme.name,
              )}>
              <Ionicons name="grid" size={18} color={accent} />
              <AppText
                scaleRole="compact"
                style={[styles.themeCtaText, {color: colors.text}]}>
                {tf.relatedTheme.replace('{{theme}}', relatedTheme.name)}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={accent} />
            </TouchableOpacity>
          ) : null}
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
  listenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    ...centeredMaxWidth(),
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
  prayerCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prayerTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  prayerHedge: {
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.4,
    marginTop: spacing.xs,
  },
  prayerText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    fontStyle: 'italic',
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
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  themeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  themeCtaText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
