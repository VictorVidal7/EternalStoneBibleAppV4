/**
 * 📜 INTERLINEAR SHEET — "Interlineal visual" (T8.3, offering-unlocked).
 *
 * The standard, recognized form of a printed interlinear Bible (as in STEP
 * Bible / Blue Letter Bible): the original Hebrew/Greek text in its OWN
 * manuscript order (Hebrew right-to-left, Greek left-to-right), each word
 * stacked with its transliteration + gloss in a horizontally scrollable row,
 * with the full fluent translation shown as a separate reference line below.
 *
 * This deliberately does NOT attempt to align each original word to a
 * character range inside the rendered translation — no such mapping exists in
 * the bundled data (translations don't preserve, or map 1:1 to, the
 * manuscript's word order), and inventing one would fabricate linguistic
 * data. What it adds over the free word list (`OriginalLanguagesSheet`) is
 * real: the original's own word order, preserved and readable, plus the
 * fluent translation alongside it for comparison — exactly what a printed
 * interlinear offers.
 *
 * Reached from `OriginalLanguagesSheet`'s "Interlineal visual" entry row,
 * which only opens this when premium (else it opens the offering sheet).
 * Also independently defends the entitlement: if it's revoked while this
 * sheet is open, it closes itself (falls back to the free word list
 * underneath) rather than leaving exclusive content on screen.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {usePremium} from '@context/PremiumContext';
import {
  getStrongsDetail,
  getVerseText,
  pickGloss,
  glossLanguage,
  hasLexicon,
  strongsLabel,
  type OriginalWord,
  type StrongsEntry,
} from '@/features/study/originals';
import {
  decodeMorphologyCode,
  describeMorphology,
} from '@/features/study/morphologyDecoder';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface Props {
  visible: boolean;
  sourceBook: string;
  sourceChapter: number;
  sourceVerse: number | null;
  /** Reading version id — the reference translation line follows it. */
  version?: string;
  /** Already-loaded original words for this verse (from the parent sheet). */
  words: OriginalWord[];
  onClose: () => void;
}

export const InterlinearSheet: React.FC<Props> = ({
  visible,
  sourceBook,
  sourceChapter,
  sourceVerse,
  version,
  words,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const {isPremium, isLoading: premiumLoading} = usePremium();
  const o = t.originals;
  const glossLang = glossLanguage(language, version);
  const isHebrew = words[0]?.lang === 'H';

  // `undefined` = not fetched yet (show a spinner); `null` = fetched but the
  // verse/version has no text; a string = the loaded reference translation.
  const [refText, setRefText] = useState<string | null | undefined>(undefined);
  const [selected, setSelected] = useState<number | null>(null);
  const [lex, setLex] = useState<StrongsEntry | null>(null);
  const [defExpanded, setDefExpanded] = useState(false);
  const wordsScrollRef = useRef<ScrollView>(null);

  // A premium-only view: if the entitlement is revoked while it's open, fall
  // back to the free word list underneath instead of leaving it on screen.
  // `!premiumLoading` avoids closing during PremiumContext's own brief
  // initial cache read.
  useEffect(() => {
    if (visible && !premiumLoading && !isPremium) onClose();
  }, [visible, premiumLoading, isPremium, onClose]);

  useEffect(() => {
    if (!visible || sourceVerse == null) return;
    setSelected(null);
    setLex(null);
    setDefExpanded(false);
    setRefText(undefined);
    let cancelled = false;
    (async () => {
      const text = await getVerseText(
        sourceBook,
        sourceChapter,
        sourceVerse,
        version ?? 'RVR1960',
      );
      if (!cancelled) setRefText(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, sourceBook, sourceChapter, sourceVerse, version]);

  const handleWordPress = useCallback(
    async (word: OriginalWord) => {
      haptics.tap();
      if (selected === word.position) {
        setSelected(null);
        setLex(null);
        return;
      }
      setSelected(word.position);
      setLex(null);
      setDefExpanded(false);
      if (hasLexicon(word.strongs)) {
        setLex(await getStrongsDetail(word.strongs));
      }
    },
    [selected],
  );

  const sourceLabel =
    sourceVerse != null
      ? `${sourceBook} ${sourceChapter}:${sourceVerse}`
      : `${sourceBook} ${sourceChapter}`;

  const selectedWord = words.find(w => w.position === selected) ?? null;
  const morphology = selectedWord
    ? decodeMorphologyCode(selectedWord.grammar, selectedWord.lang)
    : null;

  const renderColumn = (word: OriginalWord) => {
    const gloss = pickGloss(word, glossLang);
    const isOpen = selected === word.position;
    return (
      <TouchableOpacity
        key={word.position}
        style={[
          styles.column,
          {
            backgroundColor: colors.primary + '0F',
            borderColor: isOpen ? colors.primary : colors.primary + '33',
          },
        ]}
        onPress={() => handleWordPress(word)}
        accessibilityRole="button"
        accessibilityLabel={`${word.word}${gloss ? `, ${gloss}` : ''}`}
        accessibilityHint={o.interlinearHint}>
        <Text
          style={[styles.columnWord, {color: colors.text}]}
          allowFontScaling
          numberOfLines={1}>
          {word.word}
        </Text>
        {word.translit ? (
          <Text
            style={[styles.columnTranslit, {color: colors.textTertiary}]}
            numberOfLines={1}>
            {word.translit}
          </Text>
        ) : null}
        {gloss ? (
          <Text
            style={[styles.columnGloss, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {gloss}
          </Text>
        ) : null}
        {word.strongs ? (
          <View
            style={[
              styles.columnChip,
              {backgroundColor: colors.primary + '1A'},
            ]}>
            <Text style={[styles.columnChipText, {color: colors.primary}]}>
              {strongsLabel(word.strongs)}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

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
                {o.interlinearTitle}
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

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}>
            {/* The fluent translation, shown as a separate reference line —
                never claimed to align word-for-word with the interlinear. */}
            <View
              style={[
                styles.refCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Text style={[styles.refLabel, {color: colors.textTertiary}]}>
                {o.interlinearReference}
              </Text>
              {refText === undefined ? (
                <ActivityIndicator color={colors.primary} />
              ) : refText ? (
                <Text style={[styles.refText, {color: colors.text}]}>
                  {refText}
                </Text>
              ) : (
                <Text style={[styles.refText, {color: colors.textTertiary}]}>
                  {o.empty}
                </Text>
              )}
              <Text style={[styles.refNote, {color: colors.textTertiary}]}>
                {o.interlinearReferenceNote}
              </Text>
            </View>

            {words.length > 0 ? (
              <ScrollView
                ref={wordsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.row,
                  isHebrew && styles.rowReverse,
                ]}
                // Hebrew's first manuscript word sits at the visual RIGHT
                // (via row-reverse) — a fresh ScrollView starts at offset 0
                // (the visual LEFT), which would show the verse's LAST words
                // first. Jump to the end once laid out so opening the sheet
                // lands on the first word, matching how a reader's eye
                // naturally starts a right-to-left line.
                onContentSizeChange={() => {
                  if (isHebrew) {
                    wordsScrollRef.current?.scrollToEnd({animated: false});
                  }
                }}>
                {words.map(renderColumn)}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                {o.empty}
              </Text>
            )}

            {/* Detail panel for the tapped word: lexicon + morphology, both
                already premium-only by virtue of this whole sheet being
                premium-gated — reuses T6.4's decoder, nothing re-derived. */}
            <View
              style={[
                styles.detailCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              {!selectedWord ? (
                <Text
                  style={[styles.emptyDetail, {color: colors.textSecondary}]}>
                  {o.interlinearEmptyDetail}
                </Text>
              ) : (
                <>
                  {lex?.lemma ? (
                    <Text style={[styles.lexLemma, {color: colors.text}]}>
                      {lex.lemma}
                      {lex.translit ? (
                        <Text style={{color: colors.textTertiary}}>
                          {`  ${lex.translit}`}
                        </Text>
                      ) : null}
                    </Text>
                  ) : null}
                  {language === 'es' ? (
                    lex?.definition_es ? (
                      <Text
                        style={[styles.lexDef, {color: colors.textSecondary}]}>
                        {lex.definition_es}
                      </Text>
                    ) : lex?.definition ? (
                      <>
                        <TouchableOpacity
                          style={styles.defToggle}
                          onPress={() => {
                            haptics.tap();
                            setDefExpanded(v => !v);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={o.definitionEnglish}
                          accessibilityState={{expanded: defExpanded}}>
                          <Text
                            style={[
                              styles.defToggleText,
                              {color: colors.primary},
                            ]}>
                            {o.definitionEnglish}
                          </Text>
                          <Ionicons
                            name={defExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        {defExpanded ? (
                          <Text
                            style={[
                              styles.lexDef,
                              {color: colors.textSecondary},
                            ]}>
                            {lex.definition}
                          </Text>
                        ) : null}
                      </>
                    ) : null
                  ) : lex?.definition ? (
                    <Text
                      style={[styles.lexDef, {color: colors.textSecondary}]}>
                      {lex.definition}
                    </Text>
                  ) : null}

                  {morphology ? (
                    <View
                      style={[
                        styles.morphSection,
                        {borderTopColor: colors.border},
                      ]}>
                      <Text style={[styles.morphTitle, {color: colors.text}]}>
                        {o.morphologyTitle}
                      </Text>
                      <Text
                        style={[styles.lexDef, {color: colors.textSecondary}]}>
                        {describeMorphology(morphology, language)}
                      </Text>
                      {lex?.kjv_def ? (
                        <Text
                          style={[
                            styles.morphKjv,
                            {color: colors.textTertiary},
                          ]}>
                          {o.kjvGloss}: {lex.kjv_def}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
              )}
            </View>

            <Text style={[styles.attribution, {color: colors.textTertiary}]}>
              {o.attribution}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: staticColors.overlayBlack45,
  },
  backdropTouch: {flex: 1},
  sheet: {
    maxHeight: '88%',
    minHeight: '55%',
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
  headerText: {flex: 1, paddingRight: spacing.sm},
  title: {fontSize: fontSizes.lg, fontWeight: '800'},
  subtitle: {fontSize: fontSizes.sm, fontWeight: '600', marginTop: 2},
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {flexGrow: 0},
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  refCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  refLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refText: {fontSize: fontSizes.md, lineHeight: 24, fontWeight: '500'},
  refNote: {fontSize: fontSizes.xs, lineHeight: 16, marginTop: 2},
  row: {flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs},
  rowReverse: {flexDirection: 'row-reverse'},
  column: {
    width: 104,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 2,
  },
  columnWord: {fontSize: fontSizes.lg, fontWeight: '700'},
  columnTranslit: {fontSize: fontSizes.xs, fontStyle: 'italic'},
  columnGloss: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  columnChip: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  columnChipText: {fontSize: fontSizes['2xs'], fontWeight: '800'},
  emptyText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  detailCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    minHeight: 64,
  },
  emptyDetail: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  lexLemma: {fontSize: fontSizes.md, fontWeight: '700'},
  lexDef: {fontSize: fontSizes.sm, lineHeight: 20},
  defToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  defToggleText: {fontSize: fontSizes.sm, fontWeight: '700'},
  morphSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  morphTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  morphKjv: {fontSize: fontSizes.xs, fontStyle: 'italic', marginTop: 2},
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default InterlinearSheet;
