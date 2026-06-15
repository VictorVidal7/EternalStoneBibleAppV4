/**
 * 🔗 CROSS-REFERENCES SHEET
 *
 * Bottom-sheet modal listing curated parallel passages for a verse.
 * Each row renders the parallel reference + a snippet of its text;
 * tapping deep-links into the reader via `parseReference`.
 *
 * Data lives in `src/constants/cross-references.ts`. Verse text is
 * fetched lazily from the SQLite Bible DB on open (cached per session
 * in component state so reopening the sheet is instant).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {getCrossReferences} from '@/constants/cross-references';
import {parseReference} from '@lib/references/parseReference';
import bibleDB from '@lib/database';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface Props {
  visible: boolean;
  /** Source verse — used both to look up parallels and label the header. */
  sourceBook: string;
  sourceChapter: number;
  sourceVerse: number | null;
  /** Bible version to fetch the parallel text from (matches the reader). */
  version: string;
  onClose: () => void;
}

interface RefRow {
  raw: string;
  bookId: number | null;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string | null;
}

export const CrossReferencesSheet: React.FC<Props> = ({
  visible,
  sourceBook,
  sourceChapter,
  sourceVerse,
  version,
  onClose,
}) => {
  const router = useRouter();
  const {colors} = useTheme();
  const {t, language} = useLanguage();

  const refs = useMemo(() => {
    if (sourceVerse == null) return [];
    return getCrossReferences(sourceBook, sourceChapter, sourceVerse);
  }, [sourceBook, sourceChapter, sourceVerse]);

  const [rows, setRows] = useState<RefRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!visible || refs.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    (async () => {
      const resolved: RefRow[] = await Promise.all(
        refs.map(async raw => {
          // raw is "EnglishBook/Chapter/Verse" — feed it to parseReference
          // through a friendly spaced form so the parser can match.
          const friendly = raw.replace(/\//g, ' ').replace(/ (\d+)$/, ':$1');
          const parsed = parseReference(friendly);
          if (!parsed || parsed.verse == null) {
            return {
              raw,
              bookId: null,
              bookDisplay: raw,
              chapter: 0,
              verse: 0,
              text: null,
            };
          }
          const display =
            language === 'en' ? parsed.book.nameEn : parsed.book.name;
          try {
            const verseRow = await bibleDB.getVerse(
              parsed.book.id,
              parsed.chapter,
              parsed.verse,
              version,
            );
            return {
              raw,
              bookId: parsed.book.id,
              bookDisplay: display,
              chapter: parsed.chapter,
              verse: parsed.verse,
              text: verseRow?.text ?? null,
            };
          } catch {
            return {
              raw,
              bookId: parsed.book.id,
              bookDisplay: display,
              chapter: parsed.chapter,
              verse: parsed.verse,
              text: null,
            };
          }
        }),
      );
      if (!cancelled) {
        setRows(resolved);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, refs, language, version]);

  const handleJump = (row: RefRow) => {
    if (row.bookId == null) return;
    haptics.tap();
    onClose();
    router.push({
      pathname: `/verse/${row.bookDisplay}/${row.chapter}` as never,
      params: {verse: row.verse},
    });
  };

  // Promote the quick peek into the full Study-mode route (two-way connections).
  const handleOpenStudy = () => {
    if (sourceVerse == null) return;
    haptics.tap();
    onClose();
    router.push({
      pathname: '/features/study' as never,
      params: {
        book: sourceBook,
        chapter: String(sourceChapter),
        verse: String(sourceVerse),
        version,
      },
    });
  };

  // Pivot from this verse's connections to the topical index (browse by theme).
  const handleOpenThemes = () => {
    haptics.tap();
    onClose();
    router.push('/features/themes' as never);
  };

  // Begin a guided verse→verse thread seeded at this verse (Sprint 86).
  const handleOpenChain = () => {
    if (sourceVerse == null) return;
    haptics.tap();
    onClose();
    router.push({
      pathname: '/features/reference-chain' as never,
      params: {
        book: sourceBook,
        chapter: String(sourceChapter),
        verse: String(sourceVerse),
      },
    } as never);
  };

  const sourceLabel =
    sourceVerse != null
      ? `${sourceBook} ${sourceChapter}:${sourceVerse}`
      : `${sourceBook} ${sourceChapter}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
          {...a11yHiddenProps()}
        />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, {color: colors.text}]}>
                {t.crossRefs.title}
              </Text>
              <Text
                style={[styles.subtitle, {color: colors.textSecondary}]}
                numberOfLines={1}>
                {sourceLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {refs.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="link-outline"
                size={36}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {t.crossRefs.emptyTitle}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {t.crossRefs.emptyBody}
              </Text>
            </View>
          ) : loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}>
              {rows.map(row => (
                <TouchableOpacity
                  key={row.raw}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.primary + '0F',
                      borderColor: colors.primary + '33',
                    },
                  ]}
                  onPress={() => handleJump(row)}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.bookDisplay} ${row.chapter}:${row.verse}`}>
                  <View style={styles.rowMain}>
                    <Text
                      style={[styles.rowRef, {color: colors.primary}]}
                      numberOfLines={1}>
                      {row.bookDisplay} {row.chapter}:{row.verse}
                    </Text>
                    {row.text ? (
                      <Text
                        style={[styles.rowText, {color: colors.textSecondary}]}
                        numberOfLines={2}>
                        {row.text}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.rowText,
                          styles.missingText,
                          {color: colors.textTertiary},
                        ]}>
                        {t.crossRefs.missingText}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {refs.length > 0 && (
            <TouchableOpacity
              style={[styles.studyButton, {borderColor: colors.primary}]}
              onPress={handleOpenStudy}
              accessibilityRole="button"
              accessibilityLabel={t.study.title}
              accessibilityHint={t.study.subtitle}>
              <Ionicons
                name="git-network-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.studyButtonText, {color: colors.primary}]}>
                {t.study.title}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {refs.length > 0 && (
            <TouchableOpacity
              style={[styles.chainButton, {borderColor: colors.primary}]}
              onPress={handleOpenChain}
              accessibilityRole="button"
              accessibilityLabel={t.referenceChain.start}
              accessibilityHint={t.referenceChain.subtitle}>
              <Ionicons
                name="git-network-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.studyButtonText, {color: colors.primary}]}>
                {t.referenceChain.start}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.themesButton, {borderColor: colors.border}]}
            onPress={handleOpenThemes}
            accessibilityRole="button"
            accessibilityLabel={t.themes.title}
            accessibilityHint={t.themes.cardSubtitle}>
            <Ionicons
              name="grid-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.themesButtonText, {color: colors.textSecondary}]}>
              {t.themes.title}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  missingText: {fontStyle: 'italic'},
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  studyButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  chainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  themesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  themesButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: staticColors.overlayBlack45,
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    maxHeight: '75%',
    minHeight: '40%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  loading: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
  },
  rowRef: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    marginBottom: 4,
  },
  rowText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
});
