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

import {useCallback, useEffect, useState} from 'react';
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
import {BOOK_INTROS} from '@/constants/book-intros';
import {getAllThemes} from '@/features/study/themes';
import {
  buildDailyLight,
  rotateApplyQuestions,
} from '@/features/daily-light/dailyLight';
import {
  getChristConnectionById,
  parseChristRef,
  formatChristRefLabel,
  christLangForVersion,
  versionAbbrev,
} from '@/features/study/christConnections';
import {translations} from '@/i18n/translations';
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
  // Brief, faithful background for the verse's book (who/when/why) — S98.
  bookAuthor?: string;
  bookDate?: string;
  bookTheme?: string;
  // "Christ in this passage" — present only when the day's verse is curated.
  // Labels follow the Bible version's language (S98), not the UI language.
  christNote?: string;
  christCardTitle?: string; // localized "Christ in this passage" (version lang)
  christPointsToWord?: string; // localized "Points to Christ" (version lang)
  christPointsTo?: string; // localized fulfillment label, e.g. "Juan 10:11"
  christFulfillmentText?: string; // fulfillment verse text in the selected version
  christVersionAbbrev?: string; // selected version label, e.g. "RVR1960"
  christNavBook?: string; // localized book name for navigation
  christNavChapter?: number;
  christNavVerse?: number;
}

export default function DailyLightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  // Daily Light speaks the language of the SELECTED Bible version (S99), so the
  // whole devotional reads in one language alongside the verse — even when the
  // app's interface language differs (e.g. English UI + RVR1960). devLang is
  // set from the version once it's read in load(); until then it mirrors the UI.
  const [devLang, setDevLang] = useState<'es' | 'en'>(
    language === 'en' ? 'en' : 'es',
  );
  const dl = translations[devLang].dailyLight;
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
      // Resolve the devotional language from the selected Bible version (S99)
      // before anything else, so the verse, book intro, reflection, theme and
      // the Christ card all read in one coherent language.
      const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
      const vlang = christLangForVersion(version);
      setDevLang(vlang);
      const vt = translations[vlang].dailyLight;

      const now = new Date();
      const themes = getAllThemes();
      const prompts = vt.prompts;
      const sel = buildDailyLight(
        now,
        DAILY_VERSE_REFS.length,
        themes.length,
        prompts.length,
      );
      const ref = DAILY_VERSE_REFS[sel.verseIndex];
      // The theme — and so the "To apply" questions — follows the DAY'S VERSE
      // (Sprint 98), so a love verse never lands beside wisdom questions. The
      // salted themeIndex stays as a defensive fallback for an unknown tag.
      const theme =
        themes.find(thm => thm.id === ref.theme) ?? themes[sel.themeIndex];

      const row = await bibleDB.getVerse(
        ref.book,
        ref.chapter,
        ref.verse,
        version,
      );
      const book = getBookById(ref.book);
      const display = book
        ? vlang === 'en'
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

      const localizedTheme = (
        translations[vlang].themes.list as Record<string, {name: string}>
      )[theme.id];

      // Brief, faithful background for the verse's book (S98) — reuses the
      // curated, conservative BOOK_INTROS (who wrote it, when, its theme).
      const intro = BOOK_INTROS[ref.book]?.[vlang];

      // Theme-tied application questions (S97). Each theme keeps a pool of
      // prompts; show a rotating window of three so a reader who returns to the
      // same theme on different days finds fresh ones (S99). Fall back to one
      // generic prompt if a theme somehow has none curated.
      const applyMap = vt.applyByTheme as Record<string, string[]>;
      const pool = applyMap[theme.id] ?? [prompts[sel.promptIndex]];
      const applyQuestions = rotateApplyQuestions(pool, now, 3);

      // "Christ in this passage" — look up a curated insight for this verse
      // (S98), in the same version language as the rest of the devotional.
      const conn = getChristConnectionById(ref.book, ref.chapter, ref.verse);
      const christLang = vlang;
      const cc = translations[christLang].christConnections;
      let christNote: string | undefined;
      let christPointsTo: string | undefined;
      let christFulfillmentText: string | undefined;
      let christNavBook: string | undefined;
      let christNavChapter: number | undefined;
      let christNavVerse: number | undefined;
      if (conn) {
        const notes = cc.notes as Record<string, string>;
        christNote = notes[conn.id];
        if (conn.fulfillment) {
          const fp = parseChristRef(conn.fulfillment);
          const fbook = fp ? getBookByName(fp.book) : undefined;
          if (fp && fbook) {
            christPointsTo = formatChristRefLabel(conn.fulfillment, christLang);
            christNavBook = christLang === 'en' ? fbook.nameEn : fbook.name;
            christNavChapter = fp.chapter;
            christNavVerse = fp.verse;
            // Ground the connection in the reader's OWN Bible version: show the
            // fulfillment verse text in the selected version, so it matches the
            // day's passage above (Sprint 98).
            const frow = await bibleDB.getVerse(
              fbook.id,
              fp.chapter,
              fp.verse,
              version,
            );
            christFulfillmentText = frow?.text ?? undefined;
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
        bookAuthor: intro?.author,
        bookDate: intro?.date,
        bookTheme: intro?.theme,
        christNote,
        christCardTitle: cc.cardTitle,
        christPointsToWord: cc.pointsTo,
        christPointsTo,
        christFulfillmentText,
        christVersionAbbrev: versionAbbrev(version),
        christNavBook,
        christNavChapter,
        christNavVerse,
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
    // Content resolves from the selected version's language via the static
    // `translations` import (read fresh inside load), so the only reactive
    // input is the achievement service for the streak.
  }, [achievementService]);

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

  const rawDateLabel = new Date().toLocaleDateString(
    devLang === 'es' ? 'es-ES' : 'en-US',
    {weekday: 'long', month: 'long', day: 'numeric'},
  );
  // Only the first character should be capitalized (Spanish date formatting
  // is lowercase by convention) — `textTransform: 'capitalize'` used to
  // capitalize every word, which is wrong for ES ("Martes, 14 De Julio").
  const dateLabel =
    rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1);

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

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
                {dl.title}
              </AppText>
            </View>
          </View>
          <View style={styles.streakChip}>
            <Ionicons name="flame" size={14} color={staticColors.white} />
            <AppText scaleRole="compact" style={styles.streakText}>
              {content && content.streak > 0
                ? content.streak === 1
                  ? dl.streakOne
                  : dl.streak.replace('{{n}}', String(content.streak))
                : dl.streakNone}
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
              {dl.error}
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
                {dl.verseLabel}
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

            {/* Brief, faithful background for the verse's book (S98) */}
            {content.bookTheme ? (
              <View
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.christHeader}>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <AppText
                    scaleRole="compact"
                    style={[
                      styles.cardLabel,
                      {color: colors.textSecondary, marginLeft: spacing['1.5']},
                    ]}>
                    {dl.contextTitle}
                  </AppText>
                </View>
                {content.bookAuthor || content.bookDate ? (
                  <AppText
                    scaleRole="compact"
                    style={[styles.contextMeta, {color: colors.textTertiary}]}>
                    {[content.bookAuthor, content.bookDate]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                ) : null}
                <AppText
                  scaleRole="body"
                  style={[styles.contextTheme, {color: colors.text}]}>
                  {content.bookTheme}
                </AppText>
              </View>
            ) : null}

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
                    {content.christCardTitle ?? t.christConnections.cardTitle}
                  </AppText>
                </View>
                <AppText
                  scaleRole="body"
                  style={[styles.christText, {color: colors.text}]}>
                  {content.christNote}
                </AppText>
                {content.christFulfillmentText && content.christPointsTo ? (
                  <View
                    style={[
                      styles.christVerse,
                      {borderLeftColor: colors.primary + '55'},
                    ]}>
                    <AppText
                      scaleRole="body"
                      style={[styles.christVerseText, {color: colors.text}]}>
                      {`“${content.christFulfillmentText}”`}
                    </AppText>
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.christVerseRef,
                        {color: colors.textSecondary},
                      ]}>
                      {content.christVersionAbbrev
                        ? `— ${content.christPointsTo} · ${content.christVersionAbbrev}`
                        : `— ${content.christPointsTo}`}
                    </AppText>
                  </View>
                ) : null}
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
                    accessibilityLabel={`${content.christPointsToWord ?? t.christConnections.pointsTo}: ${content.christPointsTo}`}>
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
                      {`${content.christPointsToWord ?? t.christConnections.pointsTo} · ${content.christPointsTo}`}
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
                {dl.applyTitle}
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
              accessibilityLabel={`${dl.themeLabel}: ${content.themeName}`}>
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
                  {dl.themeLabel}
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
              accessibilityLabel={dl.readInContext}>
              <Ionicons
                name="book-outline"
                size={20}
                color={colors.onPrimary}
              />
              <AppText
                scaleRole="compact"
                style={[styles.primaryActionText, {color: colors.onPrimary}]}>
                {dl.readInContext}
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
              accessibilityLabel={inDeck ? dl.memorized : dl.memorize}>
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
                {inDeck ? dl.memorized : dl.memorize}
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
  contextMeta: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  contextTheme: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55},
  christText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55},
  christVerse: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
    gap: spacing['0.5'],
  },
  christVerseText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  christVerseRef: {fontSize: fontSizes.sm, fontWeight: '600'},
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
