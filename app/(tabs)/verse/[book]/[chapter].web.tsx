import {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import bibleDB from '@lib/database';
import {BibleVerse} from '@/types/bible';
import {getBookByName} from '@/constants/bible';
import {useTheme} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useLanguage} from '@hooks/useLanguage';
import {useReaderPreferences} from '@context/ReaderPreferencesContext';
import {
  READER_FONT_SIZE_MIN,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_STEP,
} from '@context/ReaderPreferencesContext';
import {
  ReaderPreferencesSheet,
  resolveFontFamily,
  resolveFontFamilyBold,
} from '@components/reading/ReaderPreferencesSheet';
import {centeredMaxWidth, READER_MAX_WIDTH} from '@/styles/responsive';
import {spacing, fontSize as tokenFontSize} from '@/styles/designTokens';
import {
  LEGACY_RED_LETTER_LIGHT,
  LEGACY_RED_LETTER_DARK,
} from '@/styles/readerThemes';
// Explicit .web specifier (not the bare '@lib/reading/redLetterText'):
// loadRedLetterSpans is web-only and does not exist in redLetterText.ts
// (native) — tsc has no platform awareness and resolves a bare specifier to
// the native file regardless of this file's own .web.tsx name, so importing
// it unsuffixed would fail type-checking.
import {
  getRedLetterSpans,
  mergeRedLetterSpans,
  loadRedLetterSpans,
} from '@lib/reading/redLetterText.web';

/**
 * Web Bible reader (T21) — a dedicated, from-scratch screen, NOT a
 * Platform.OS-branched version of app/(tabs)/verse/[book]/[chapter].tsx.
 *
 * The native reader is deeply entangled with everything Victor's confirmed
 * v1 scope excludes (audio/immersive, favorites, notes, highlights, sync,
 * premium, cross-references, original languages, collections — ~20 contexts
 * and components). Retrofitting that file with conditionals would mean
 * either mounting all of those on web (defeating the point of the trimmed
 * provider tree in _layout.web.tsx) or leaving dead/hidden UI affordances
 * for features that Victor was explicit "no existen" on web. A dedicated
 * file only touches theme/i18n/bibleVersion/readerPrefs + bibleDB reads —
 * exactly what v1 needs: book/chapter navigation, verse text, theme, font
 * size, and a shareable per-chapter URL (Expo Router web gives the last one
 * for free from the route itself).
 */

export default function ChapterReaderWeb() {
  const router = useRouter();
  const {colors, isDark, mode, setThemeMode} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {preferences, setFontSize} = useReaderPreferences();
  const params = useLocalSearchParams<{book: string; chapter: string}>();
  const [readerPrefsVisible, setReaderPrefsVisible] = useState(false);
  // Same resolver the native reader uses (app/(tabs)/verse/[book]/[chapter].tsx)
  // — a reader typeface id always maps to a bundled `fontFamily` string, never
  // `undefined`. All faces are loaded eagerly for web in _layout.web.tsx's
  // `loadReaderFonts()` call, awaited before this screen can ever mount, so
  // there is no lazy-load step needed here.
  const readerFontFamily = useMemo(
    () => resolveFontFamily(preferences.fontFamily),
    [preferences.fontFamily],
  );
  // Bold-weight family for the verse number — the bundled faces are static,
  // so `fontWeight: '700'` alone wouldn't bold them (same reasoning as the
  // native reader).
  const readerFontFamilyBold = useMemo(
    () => resolveFontFamilyBold(preferences.fontFamily),
    [preferences.fontFamily],
  );

  const rawBook = params.book;
  const book = typeof rawBook === 'string' ? rawBook : rawBook?.[0] || '';
  const rawChapter = params.chapter;
  const chapterParam =
    typeof rawChapter === 'string' ? rawChapter : rawChapter?.[0] || '1';
  const chapter = parseInt(chapterParam, 10) || 1;

  const bookInfo = getBookByName(book);
  const bookLang: 'es' | 'en' = selectedVersion.language === 'es' ? 'es' : 'en';
  const bookName = bookInfo
    ? bookLang === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : book;

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Red-letter (Words of Christ) is WEB-version-only, exactly like the
  // native reader — gated on both the user's toggle and the active version.
  const redLetterActive =
    preferences.redLetterWords && selectedVersion.id === 'WEB';
  const [redLetterLoaded, setRedLetterLoaded] = useState(false);

  useEffect(() => {
    if (!redLetterActive) return;
    let cancelled = false;
    loadRedLetterSpans().then(() => {
      if (!cancelled) setRedLetterLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [redLetterActive]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookInfo) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        await bibleDB.initialize();
        const result = await bibleDB.getChapter(
          bookInfo.id,
          chapter,
          selectedVersion.id,
        );
        if (!cancelled) setVerses(result);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookInfo, chapter, selectedVersion.id]);

  const goToChapter = useCallback(
    (target: number) => {
      if (!bookInfo || target < 1 || target > bookInfo.chapters) return;
      router.push(`/verse/${book}/${target}` as never);
    },
    [router, book, bookInfo],
  );

  const toggleDarkMode = useCallback(() => {
    setThemeMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setThemeMode]);

  if (!bookInfo) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.text}}>
          {t.bible.couldNotFind}: "{book}"
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {borderBottomColor: colors.glassBorder}]}>
          <TouchableOpacity
            onPress={() => router.push(`/chapter/${book}` as never)}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}
            style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={[styles.headerTitle, {color: colors.text}]}
            numberOfLines={1}>
            {bookName} {chapter}
          </Text>

          <View style={styles.headerActions}>
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
              style={styles.headerButton}>
              <Text style={[styles.fontSizeButtonText, {color: colors.text}]}>
                A-
              </Text>
            </TouchableOpacity>
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
              style={styles.headerButton}>
              <Text style={[styles.fontSizeButtonText, {color: colors.text}]}>
                A+
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setReaderPrefsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t.readerPrefs.openLabel}
              style={styles.headerButton}>
              <Ionicons name="text-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleDarkMode}
              accessibilityRole="button"
              accessibilityLabel={t.settings.theme}
              style={styles.headerButton}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            centeredMaxWidth(READER_MAX_WIDTH),
          ]}>
          {loading ? (
            <Text style={{color: colors.textSecondary}}>{t.loading}</Text>
          ) : loadError ? (
            <Text style={{color: colors.error ?? '#c0392b'}}>{loadError}</Text>
          ) : verses.length === 0 ? (
            <Text style={{color: colors.textSecondary}}>
              {t.bible.couldNotLoadChapters}
            </Text>
          ) : (
            verses.map(v => {
              // Red-letter (Words of Christ, WEB-only): gated on
              // redLetterLoaded so we skip the lookup entirely until the
              // async span data has resolved — before then (or when the
              // toggle/version don't qualify) this falls through to the
              // plain {v.text} below, identical to pre-red-letter behavior.
              const spans =
                redLetterActive && redLetterLoaded
                  ? getRedLetterSpans(bookInfo.id, chapter, v.verse)
                  : undefined;
              // No reference-linkification on this screen, so the whole
              // verse is one implicit plain (ref-less) segment for
              // mergeRedLetterSpans to split on the red-letter span
              // boundaries — an empty linkSegments array would make it
              // return no runs at all (see redLetterText.ts), erasing the
              // verse text.
              const runs: {text: string; isRedLetter: boolean}[] | null =
                spans && spans.length > 0
                  ? mergeRedLetterSpans(v.text, [{text: v.text}], spans)
                  : null;
              return (
                <Text
                  key={v.verse}
                  testID={`web-verse-text-${v.verse}`}
                  style={[
                    styles.verseText,
                    {
                      color: colors.text,
                      fontSize: preferences.fontSize,
                      fontFamily: readerFontFamily,
                      lineHeight:
                        preferences.fontSize * preferences.lineHeightMultiplier,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.verseNumber,
                      {color: colors.primary, fontFamily: readerFontFamilyBold},
                    ]}>
                    {v.verse}{' '}
                  </Text>
                  {runs
                    ? runs.map((run, i) => (
                        <Text
                          key={i}
                          style={{
                            color: run.isRedLetter
                              ? isDark
                                ? LEGACY_RED_LETTER_DARK
                                : LEGACY_RED_LETTER_LIGHT
                              : colors.text,
                          }}>
                          {run.text}
                        </Text>
                      ))
                    : v.text}
                </Text>
              );
            })
          )}

          <View style={styles.navRow}>
            <TouchableOpacity
              disabled={chapter <= 1}
              onPress={() => goToChapter(chapter - 1)}
              accessibilityRole="button"
              accessibilityLabel={t.previous}
              style={[
                styles.navButton,
                {borderColor: colors.glassBorder},
                chapter <= 1 && styles.navButtonDisabled,
              ]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={{color: colors.text}}>{t.previous}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={chapter >= bookInfo.chapters}
              onPress={() => goToChapter(chapter + 1)}
              accessibilityRole="button"
              accessibilityLabel={t.next}
              style={[
                styles.navButton,
                {borderColor: colors.glassBorder},
                chapter >= bookInfo.chapters && styles.navButtonDisabled,
              ]}>
              <Text style={{color: colors.text}}>{t.next}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ReaderPreferencesSheet
          visible={readerPrefsVisible}
          onClose={() => setReaderPrefsVisible(false)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerButton: {padding: 8},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '700'},
  headerActions: {flexDirection: 'row', alignItems: 'center'},
  fontSizeButtonText: {fontSize: tokenFontSize.sm, fontWeight: '700'},
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  verseText: {marginBottom: spacing.sm},
  verseNumber: {fontWeight: '700'},
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  navButtonDisabled: {opacity: 0.35},
});
