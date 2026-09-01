/**
 * 📖 SermonVersePickerSheet — visual book → chapter → verse(s) picker for
 * "Notas de sermón" (Sprint batch6 UX redesign).
 *
 * Replaces "type the exact reference from memory" with the same kind of
 * visual multi-select this app already uses elsewhere (the reader's
 * tap-a-verse-to-select flow that feeds [[AddToCollectionSheet]]) — pick a
 * book, a chapter, then tap one or more verses. Confirming never stores a
 * parallel verse list: it resolves the selection into canonical reference
 * labels (via [[formatVerseSelectionForInsert]]) and hands them back to the
 * SAME `insertReferenceText` path the manual "+" field already uses, so
 * `referencedVerses` stays derived from body prose, one source of truth.
 *
 * Built for a live, mid-sermon context: three shallow steps, no typing
 * required unless the listener wants to narrow the book list.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import bibleDB from '@lib/database';
import {BIBLE_BOOKS} from '@/constants/bible';
import type {BibleBook, BibleVerse} from '@/types/bible';
import {formatVerseSelectionForInsert} from './sermonNotes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Step = 'book' | 'chapter' | 'verse';
type TestamentFilter = 'all' | 'old' | 'new';

interface Props {
  visible: boolean;
  /** Book-name language, matching the editor's own `bookLang` (follows the reading version). */
  bookLang: 'es' | 'en';
  onClose: () => void;
  /** One or more canonical reference labels, ready for `insertReferenceText`. */
  onConfirm: (labels: string[]) => void;
}

export const SermonVersePickerSheet: React.FC<Props> = ({
  visible,
  bookLang,
  onClose,
  onConfirm,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const h = t.sermonNotes;
  const tb = t.bible;

  const [step, setStep] = useState<Step>('book');
  const [search, setSearch] = useState('');
  const [testamentFilter, setTestamentFilter] =
    useState<TestamentFilter>('all');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const reset = useCallback(() => {
    setStep('book');
    setSearch('');
    setTestamentFilter('all');
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedVerses(new Set());
    setVerses([]);
  }, []);

  // Start every fresh open on a clean book step — a half-finished pick from
  // a previous open should never linger silently in the background.
  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BIBLE_BOOKS.filter(book => {
      if (testamentFilter !== 'all' && book.testament !== testamentFilter) {
        return false;
      }
      if (!q) return true;
      return (
        book.name.toLowerCase().includes(q) ||
        book.nameEn.toLowerCase().includes(q)
      );
    });
  }, [search, testamentFilter]);

  const chapterNumbers = useMemo(
    () =>
      selectedBook
        ? Array.from({length: selectedBook.chapters}, (_, i) => i + 1)
        : [],
    [selectedBook],
  );

  const handlePickBook = useCallback((book: BibleBook) => {
    haptics.tap();
    setSelectedBook(book);
    setStep('chapter');
  }, []);

  const handlePickChapter = useCallback(
    async (chapter: number) => {
      if (!selectedBook) return;
      haptics.tap();
      setSelectedChapter(chapter);
      setSelectedVerses(new Set());
      setStep('verse');
      setLoadingVerses(true);
      try {
        await bibleDB.initialize();
        const result = await bibleDB.getChapter(
          selectedBook.id,
          chapter,
          selectedVersion.id,
        );
        setVerses(result);
      } catch {
        setVerses([]);
      } finally {
        setLoadingVerses(false);
      }
    },
    [selectedBook, selectedVersion.id],
  );

  const toggleVerse = useCallback((verseNum: number) => {
    haptics.tap();
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) {
        next.delete(verseNum);
      } else {
        next.add(verseNum);
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'verse') {
      setStep('chapter');
      setSelectedVerses(new Set());
    } else if (step === 'chapter') {
      setStep('book');
      setSelectedBook(null);
    }
  }, [step]);

  const handleConfirm = useCallback(() => {
    if (!selectedBook || !selectedChapter || selectedVerses.size === 0) return;
    haptics.tap();
    const labels = formatVerseSelectionForInsert(
      selectedBook.nameEn,
      selectedChapter,
      Array.from(selectedVerses),
      bookLang,
    );
    onConfirm(labels);
  }, [selectedBook, selectedChapter, selectedVerses, bookLang, onConfirm]);

  const addLabel = useMemo(() => {
    const n = selectedVerses.size;
    if (n === 0) return h.pickerAddButtonNone;
    if (n === 1) return h.pickerAddButtonOne;
    return h.pickerAddButton.replace('{{n}}', String(n));
  }, [selectedVerses.size, h]);

  const stepTitle =
    step === 'book'
      ? h.pickerTitle
      : step === 'chapter'
        ? ((bookLang === 'es' ? selectedBook?.name : selectedBook?.nameEn) ??
          '')
        : `${(bookLang === 'es' ? selectedBook?.name : selectedBook?.nameEn) ?? ''} ${selectedChapter ?? ''}`.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable
          style={styles.backdropTouch}
          onPress={onClose}
          {...a11yHiddenProps()}
        />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.cardSolid, borderTopColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            {step !== 'book' ? (
              <TouchableOpacity
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel={tb.back}
                style={styles.headerIconButton}>
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerIconButton} />
            )}
            <AppText
              scaleRole="display"
              style={[styles.title, {color: colors.text}]}
              numberOfLines={1}>
              {stepTitle}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={styles.headerIconButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'book' && (
            <>
              <View style={[styles.searchRow, {borderColor: colors.border}]}>
                <Ionicons name="search" size={16} color={colors.textTertiary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={h.pickerBookSearchPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, {color: colors.text}]}
                  accessibilityLabel={h.pickerBookSearchPlaceholder}
                />
              </View>
              <View style={styles.filterRow}>
                {(
                  [
                    ['all', tb.oldTestamentShort + '/' + tb.newTestamentShort],
                    ['old', tb.oldTestamentShort],
                    ['new', tb.newTestamentShort],
                  ] as const
                ).map(([value, label]) => {
                  const active = testamentFilter === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        haptics.tap();
                        setTestamentFilter(value);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{selected: active}}
                      accessibilityLabel={label}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : staticColors.transparent,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.filterChipText,
                          {color: active ? colors.onPrimary : colors.text},
                        ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <FlatList
                data={filteredBooks}
                keyExtractor={item => String(item.id)}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => handlePickBook(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      bookLang === 'es' ? item.name : item.nameEn
                    }
                    style={[styles.row, {borderColor: colors.border}]}>
                    <Text style={[styles.rowText, {color: colors.text}]}>
                      {bookLang === 'es' ? item.name : item.nameEn}
                    </Text>
                    <View style={styles.rowRight}>
                      <Text
                        style={[styles.rowMeta, {color: colors.textTertiary}]}>
                        {item.chapters} {tb.chapters}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {step === 'chapter' && selectedBook && (
            <ScrollView style={styles.list}>
              <View style={styles.chapterGrid}>
                {chapterNumbers.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handlePickChapter(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tb.chapter} ${item}`}
                    style={[
                      styles.chapterCell,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}>
                    <Text
                      style={[styles.chapterCellText, {color: colors.primary}]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {step === 'verse' && (
            <>
              <Text style={[styles.verseHint, {color: colors.textSecondary}]}>
                {h.pickerVerseStepHint}
              </Text>
              {loadingVerses ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : verses.length === 0 ? (
                <View style={styles.centerState}>
                  <Text
                    style={[styles.verseHint, {color: colors.textTertiary}]}>
                    {h.pickerVerseStepEmpty}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={verses}
                  keyExtractor={item => String(item.verse)}
                  style={styles.list}
                  renderItem={({item}) => {
                    const active = selectedVerses.has(item.verse);
                    return (
                      <TouchableOpacity
                        onPress={() => toggleVerse(item.verse)}
                        accessibilityRole="button"
                        accessibilityState={{selected: active}}
                        accessibilityLabel={`${item.verse}. ${item.text}`}
                        style={[
                          styles.verseRow,
                          {
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                            backgroundColor: active
                              ? colors.primary + '14'
                              : staticColors.transparent,
                          },
                        ]}>
                        <View
                          style={[
                            styles.verseCheck,
                            {
                              borderColor: active
                                ? colors.primary
                                : colors.border,
                              backgroundColor: active
                                ? colors.primary
                                : staticColors.transparent,
                            },
                          ]}>
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={colors.onPrimary}
                            />
                          )}
                        </View>
                        <Text
                          style={[styles.verseNumber, {color: colors.primary}]}>
                          {item.verse}
                        </Text>
                        <Text
                          style={[styles.verseText, {color: colors.text}]}
                          numberOfLines={3}>
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={selectedVerses.size === 0}
                accessibilityRole="button"
                accessibilityState={{disabled: selectedVerses.size === 0}}
                accessibilityLabel={addLabel}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor:
                      selectedVerses.size === 0
                        ? colors.border
                        : colors.primary,
                  },
                ]}>
                <Text
                  style={[styles.confirmButtonText, {color: colors.onPrimary}]}>
                  {addLabel}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SermonVersePickerSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack45,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    height: '82%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: staticColors.glassWhite25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {flex: 1, fontSize: fontSizes.base, paddingVertical: spacing.xs},
  filterRow: {flexDirection: 'row', gap: spacing.xs},
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
  list: {flex: 1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {fontSize: fontSizes.base, fontWeight: '600'},
  rowRight: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  rowMeta: {fontSize: fontSizes.xs},
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
  },
  chapterCell: {
    width: '18%',
    aspectRatio: 1,
    margin: '1%',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCellText: {fontSize: fontSizes.base, fontWeight: '700'},
  verseHint: {fontSize: fontSizes.xs, marginBottom: spacing.xs},
  centerState: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  verseCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  verseNumber: {fontSize: fontSizes.sm, fontWeight: '800', marginTop: 1},
  verseText: {fontSize: fontSizes.sm, flex: 1, lineHeight: fontSizes.sm * 1.4},
  confirmButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confirmButtonText: {fontSize: fontSizes.md, fontWeight: '700'},
});
