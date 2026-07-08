import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import {getBookByName} from '@/constants/bible';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {spacing, fontSize, staticColors} from '@/styles/designTokens';
import {centeredMaxWidth, CONTENT_MAX_WIDTH} from '@/styles/responsive';

/**
 * Web chapter-picker (T21) — same route as native's chapter/[book].tsx, but
 * without the reading-progress summary/checkmarks: progress tracking doesn't
 * exist on web (read-only v1, no write/sync contexts mounted — see
 * app/_layout.web.tsx), so this is a plain chapter grid, not a stub of the
 * native screen's progress UI.
 */

const CARDS_PER_ROW = 5;

interface ChapterItem {
  chapter: number;
  id: string;
}

export default function ChapterSelectionScreenWeb() {
  const router = useRouter();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const bookNameLang: 'es' | 'en' =
    selectedVersion.language === 'es' ? 'es' : 'en';
  const params = useLocalSearchParams<{book: string}>();
  const rawBook = params.book;
  const book = typeof rawBook === 'string' ? rawBook : rawBook?.[0] || '';
  const bookInfo = getBookByName(book);

  const chapters: ChapterItem[] = bookInfo
    ? Array.from({length: bookInfo.chapters}, (_, i) => ({
        chapter: i + 1,
        id: `chapter-${i + 1}`,
      }))
    : [];

  const navigateToVerse = useCallback(
    (chapter: number) => {
      router.push(`/verse/${book}/${chapter}` as never);
    },
    [router, book],
  );

  if (!bookInfo) {
    return (
      <>
        <Stack.Screen options={{headerShown: false}} />
        <View
          style={[
            styles.container,
            styles.center,
            {backgroundColor: colors.background},
          ]}>
          <Text style={[styles.errorText, {color: colors.text}]}>
            {t.bible.couldNotFind}: "{book}"
          </Text>
          <TouchableOpacity
            style={[styles.backButton, {backgroundColor: colors.primary}]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Text style={styles.backButtonText}>{t.bible.back}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const bookName = bookNameLang === 'en' ? bookInfo.nameEn : bookInfo.name;

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {borderBottomColor: colors.glassBorder}]}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}
            style={styles.backIconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, {color: colors.text}]}>
              {bookName}
            </Text>
            <Text
              style={[styles.headerSubtitle, {color: colors.textSecondary}]}>
              {chapters.length}{' '}
              {chapters.length === 1 ? t.bible.chapter : t.bible.chapters}
            </Text>
          </View>
        </View>

        <FlatList
          data={chapters}
          keyExtractor={item => item.id}
          numColumns={CARDS_PER_ROW}
          contentContainerStyle={[
            styles.listContent,
            centeredMaxWidth(CONTENT_MAX_WIDTH),
          ]}
          renderItem={({item}) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                onPress={() => navigateToVerse(item.chapter)}
                accessibilityRole="button"
                accessibilityLabel={`${t.bible.chapter} ${item.chapter} ${t.bible.of} ${bookName}`}
                style={[styles.card, {borderColor: colors.glassBorder}]}>
                <Text style={[styles.chapterNumber, {color: colors.primary}]}>
                  {item.chapter}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {justifyContent: 'center', alignItems: 'center', gap: spacing.base},
  errorText: {fontSize: fontSize.base, textAlign: 'center'},
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  backButtonText: {color: staticColors.white, fontWeight: '600'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  backIconButton: {padding: 4},
  headerTextContainer: {flex: 1},
  headerTitle: {fontSize: 24, fontWeight: '700'},
  headerSubtitle: {fontSize: fontSize.sm, marginTop: 2},
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  cardWrapper: {width: '20%', aspectRatio: 1, padding: 4},
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {fontSize: 18, fontWeight: '600'},
});
