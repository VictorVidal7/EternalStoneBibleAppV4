/**
 * 🌅 DAILY LIGHT — a daily devotional flow (Sprint 67)
 *
 * Composes one calendar day's devotional out of things the app already keeps: a
 * curated verse (DAILY_VERSE_REFS), a topical theme (the S63 taxonomy) and a
 * reflection prompt — picked deterministically by day-of-year (pure
 * [[dailyLight]]) — plus the reader's reading streak. From here a tap leads on:
 * read in context, memorize the verse, or explore the theme.
 *
 * Reached from the Home "Daily Light" card + the deep link
 * eternalbible://features/daily-light. 100% JS, no rebuild, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useToast} from '@context/ToastContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useServices} from '@context/ServicesContext';
import bibleDB from '@lib/database';
import {getBookById, getBookByName} from '@/constants/bible';
import {DAILY_VERSE_REFS} from '@/constants/daily-verses';
import {getAllThemes} from '@/features/study/themes';
import {buildDailyLight} from '@/features/daily-light/dailyLight';
import {
  getChristConnectionById,
  parseChristRef,
  formatChristRefLabel,
} from '@/features/study/christConnections';
import {buildVerseKey} from '@lib/memory/srs';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

const VERSION_KEY = '@bible_version';

interface DailyContent {
  book: string; // display book name
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  applyQuestions: string[];
  themeId: string;
  themeName: string;
  themeAccent: string;
  themeIcon: string;
  streak: number;
  // "Christ in this passage" — present only when the day's verse is curated.
  christNote?: string;
  christPointsTo?: string; // localized fulfillment label, e.g. "Juan 10:11"
  christNavBook?: string; // localized book name for navigation
  christNavChapter?: number;
  christNavVerse?: number;
}

export default function DailyLightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const td = t.dailyLight;
  const toast = useToast();
  const {hasCard, addCard} = useMemoryDeck();
  const {achievementService} = useServices();

  const [content, setContent] = useState<DailyContent | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const themes = getAllThemes();
      const prompts = td.prompts;
      const sel = buildDailyLight(
        new Date(),
        DAILY_VERSE_REFS.length,
        themes.length,
        prompts.length,
      );
      const ref = DAILY_VERSE_REFS[sel.verseIndex];
      const theme = themes[sel.themeIndex];
      const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';

      const row = await bibleDB.getVerse(
        ref.book,
        ref.chapter,
        ref.verse,
        version,
      );
      const book = getBookById(ref.book);
      const display = book
        ? language === 'en'
          ? book.nameEn
          : book.name
        : (row?.book ?? String(ref.book));

      let streak = 0;
      try {
        const stats = await achievementService?.getUserStats();
        streak = stats?.currentStreak ?? 0;
      } catch {
        streak = 0;
      }

      const localizedTheme = (t.themes.list as Record<string, {name: string}>)[
        theme.id
      ];

      // Theme-tied application questions (S97). Fall back to one rotating
      // generic prompt if a theme somehow has none curated.
      const applyMap = td.applyByTheme as Record<string, string[]>;
      const applyQuestions = applyMap[theme.id] ?? [prompts[sel.promptIndex]];

      // "Christ in this passage" — look up a curated insight for this verse.
      const conn = getChristConnectionById(ref.book, ref.chapter, ref.verse);
      const lang = language === 'es' ? 'es' : 'en';
      let christNote: string | undefined;
      let christPointsTo: string | undefined;
      let christNavBook: string | undefined;
      let christNavChapter: number | undefined;
      let christNavVerse: number | undefined;
      if (conn) {
        const notes = t.christConnections.notes as Record<string, string>;
        christNote = notes[conn.id];
        if (conn.fulfillment) {
          const fp = parseChristRef(conn.fulfillment);
          const fbook = fp ? getBookByName(fp.book) : undefined;
          if (fp && fbook) {
            christPointsTo = formatChristRefLabel(conn.fulfillment, lang);
            christNavBook = lang === 'en' ? fbook.nameEn : fbook.name;
            christNavChapter = fp.chapter;
            christNavVerse = fp.verse;
          }
        }
      }

      setContent({
        book: display,
        bookId: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        text: row?.text ?? '',
        reference: `${display} ${ref.chapter}:${ref.verse}`,
        applyQuestions,
        themeId: theme.id,
        themeName: localizedTheme?.name ?? theme.id,
        themeAccent: theme.accent,
        themeIcon: theme.icon,
        streak,
        christNote,
        christPointsTo,
        christNavBook,
        christNavChapter,
        christNavVerse,
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [
    td.prompts,
    td.applyByTheme,
    language,
    achievementService,
    t.themes.list,
    t.christConnections.notes,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const verseKey = content
    ? buildVerseKey(content.book, content.chapter, content.verse)
    : '';
  const inDeck = verseKey ? hasCard(verseKey) : false;

  const handleRead = useCallback(() => {
    if (!content) return;
    haptics.tap();
    router.push(
      `/verse/${content.book}/${content.chapter}?verse=${content.verse}` as never,
    );
  }, [content, router]);

  const handleMemorize = useCallback(async () => {
    if (!content || inDeck) return;
    haptics.tap();
    const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
    addCard({
      bookName: content.book,
      chapter: content.chapter,
      verse: content.verse,
      text: content.text,
      version,
    });
    toast.success(t.memory.addedToast);
  }, [content, inDeck, addCard, toast, t.memory.addedToast]);

  const handleExploreTheme = useCallback(() => {
    if (!content) return;
    haptics.tap();
    router.push(`/features/themes/${content.themeId}` as never);
  }, [content, router]);

  const handleOpenFulfillment = useCallback(() => {
    if (
      !content?.christNavBook ||
      !content.christNavChapter ||
      !content.christNavVerse
    ) {
      return;
    }
    haptics.tap();
    router.push(
      `/verse/${content.christNavBook}/${content.christNavChapter}?verse=${content.christNavVerse}` as never,
    );
  }, [content, router]);

  const dateLabel = new Date().toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    {weekday: 'long', month: 'long', day: 'numeric'},
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

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
              <Ionicons name="sunny" size={26} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {dateLabel}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {td.title}
              </AppText>
            </View>
          </View>
          <View style={styles.streakChip}>
            <Ionicons name="flame" size={14} color={staticColors.white} />
            <AppText scaleRole="compact" style={styles.streakText}>
              {content && content.streak > 0
                ? content.streak === 1
                  ? td.streakOne
                  : td.streak.replace('{{n}}', String(content.streak))
                : td.streakNone}
            </AppText>
          </View>
        </LinearGradient>

        {status === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : status === 'error' || !content ? (
          <View style={styles.center}>
            <AppText scaleRole="body" style={{color: colors.textSecondary}}>
              {td.error}
            </AppText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {/* Verse */}
            <View
              style={[
                styles.card,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <AppText
                scaleRole="compact"
                style={[styles.cardLabel, {color: colors.primary}]}>
                {td.verseLabel}
              </AppText>
              <AppText
                scaleRole="body"
                style={[styles.verseText, {color: colors.text}]}>
                {content.text}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.verseRef, {color: colors.textSecondary}]}>
                {content.reference}
              </AppText>
            </View>

            {/* Christ in this passage — only when the verse is curated */}
            {content.christNote ? (
              <View
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.christHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <AppText
                    scaleRole="compact"
                    style={[
                      styles.cardLabel,
                      {color: colors.primary, marginLeft: spacing['1.5']},
                    ]}>
                    {t.christConnections.cardTitle}
                  </AppText>
                </View>
                <AppText
                  scaleRole="body"
                  style={[styles.christText, {color: colors.text}]}>
                  {content.christNote}
                </AppText>
                {content.christPointsTo ? (
                  <TouchableOpacity
                    style={[
                      styles.christPointsTo,
                      {
                        borderColor: colors.primary + '55',
                        backgroundColor: colors.primary + '12',
                      },
                    ]}
                    onPress={handleOpenFulfillment}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.christConnections.pointsTo}: ${content.christPointsTo}`}>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.christPointsToText,
                        {color: colors.primary},
                      ]}>
                      {`${t.christConnections.pointsTo} · ${content.christPointsTo}`}
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {/* Reflection — theme-tied application questions (S97) */}
            <View
              style={[
                styles.card,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <AppText
                scaleRole="compact"
                style={[styles.cardLabel, {color: colors.primary}]}>
                {td.applyTitle}
              </AppText>
              {content.applyQuestions.map((q, i) => (
                <View key={i} style={styles.applyRow}>
                  <View
                    style={[
                      styles.applyBullet,
                      {backgroundColor: colors.primary},
                    ]}
                  />
                  <AppText
                    scaleRole="body"
                    style={[styles.applyText, {color: colors.text}]}>
                    {q}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Theme of the day */}
            <TouchableOpacity
              style={[
                styles.themeCard,
                {
                  backgroundColor: content.themeAccent + '18',
                  borderColor: content.themeAccent + '55',
                },
              ]}
              onPress={handleExploreTheme}
              accessibilityRole="button"
              accessibilityLabel={`${td.themeLabel}: ${content.themeName}`}>
              <View
                style={[
                  styles.themeIcon,
                  {backgroundColor: content.themeAccent + '33'},
                ]}>
                <Ionicons
                  name={content.themeIcon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={content.themeAccent}
                />
              </View>
              <View style={styles.themeInfo}>
                <AppText
                  scaleRole="compact"
                  style={[styles.cardLabel, {color: content.themeAccent}]}>
                  {td.themeLabel}
                </AppText>
                <AppText
                  scaleRole="display"
                  style={[styles.themeName, {color: colors.text}]}>
                  {content.themeName}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={content.themeAccent}
              />
            </TouchableOpacity>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.primaryAction, {backgroundColor: colors.primary}]}
              onPress={handleRead}
              accessibilityRole="button"
              accessibilityLabel={td.readInContext}>
              <Ionicons
                name="book-outline"
                size={20}
                color={staticColors.white}
              />
              <AppText scaleRole="compact" style={styles.primaryActionText}>
                {td.readInContext}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryAction,
                {borderColor: colors.border, backgroundColor: colors.card},
              ]}
              onPress={handleMemorize}
              disabled={inDeck}
              accessibilityRole="button"
              accessibilityState={{disabled: inDeck}}
              accessibilityLabel={inDeck ? td.memorized : td.memorize}>
              <Ionicons
                name={inDeck ? 'school' : 'school-outline'}
                size={20}
                color={inDeck ? colors.primary : colors.text}
              />
              <AppText
                scaleRole="compact"
                style={[
                  styles.secondaryActionText,
                  {color: inDeck ? colors.primary : colors.text},
                ]}>
                {inDeck ? td.memorized : td.memorize}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        )}
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
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
    textTransform: 'capitalize',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: staticColors.glassWhite20,
  },
  streakText: {
    color: staticColors.white,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
    ...centeredMaxWidth(),
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  verseText: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(fontSizes.lg),
  },
  verseRef: {fontSize: fontSizes.sm, fontWeight: '600'},
  applyRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
  applyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: fontSizes.md * 0.6,
  },
  applyText: {flex: 1, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.5},
  christHeader: {flexDirection: 'row', alignItems: 'center'},
  christText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55},
  christPointsTo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  christPointsToText: {fontSize: fontSizes.xs, fontWeight: '700'},
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  themeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInfo: {flex: 1, gap: 2},
  themeName: {fontSize: fontSizes.md, fontWeight: '700'},
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  primaryActionText: {
    color: staticColors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  secondaryActionText: {fontSize: fontSizes.md, fontWeight: '700'},
});
