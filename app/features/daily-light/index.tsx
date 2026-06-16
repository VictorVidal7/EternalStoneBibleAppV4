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
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useToast} from '@context/ToastContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useServices} from '@context/ServicesContext';
import bibleDB from '@lib/database';
import {getBookById} from '@/constants/bible';
import {DAILY_VERSE_REFS} from '@/constants/daily-verses';
import {getAllThemes} from '@/features/study/themes';
import {buildDailyLight} from '@/features/daily-light/dailyLight';
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
  prompt: string;
  themeId: string;
  themeName: string;
  themeAccent: string;
  themeIcon: string;
  streak: number;
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

      setContent({
        book: display,
        bookId: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        text: row?.text ?? '',
        reference: `${display} ${ref.chapter}:${ref.verse}`,
        prompt: prompts[sel.promptIndex],
        themeId: theme.id,
        themeName: localizedTheme?.name ?? theme.id,
        themeAccent: theme.accent,
        themeIcon: theme.icon,
        streak,
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [td.prompts, language, achievementService, t.themes.list]);

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

            {/* Reflection */}
            <View
              style={[
                styles.card,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <AppText
                scaleRole="compact"
                style={[styles.cardLabel, {color: colors.primary}]}>
                {td.reflectLabel}
              </AppText>
              <AppText
                scaleRole="body"
                style={[styles.promptText, {color: colors.text}]}>
                {content.prompt}
              </AppText>
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
  promptText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.5},
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
