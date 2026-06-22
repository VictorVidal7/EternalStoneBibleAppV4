/**
 * 📜 ORIGINAL LANGUAGES SHEET
 *
 * Bottom-sheet showing a verse's original Hebrew/Greek words — each with its
 * transliteration, gloss (Spanish-first), and Strong's number. Tapping a word
 * reveals its Strong's lexicon entry (lemma + definition).
 *
 * Data comes from the optional originals pack (a ~30 MB download); when it isn't
 * installed the sheet offers to download it (or imports an already-downloaded
 * file). All reads go through `@/features/study/originals`. Concordance ("where
 * else it appears") is layered on next.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useState} from 'react';
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
import {getBookById} from '@/constants/bible';
import {staticColors} from '@/styles/designTokens';
import {
  getVerseOriginal,
  getStrongsDetail,
  getStrongsConcordance,
  isOriginalsInstalled,
  pickGloss,
  hasLexicon,
  strongsLabel,
  occurrenceRef,
  type OriginalWord,
  type StrongsEntry,
  type StrongsOccurrence,
} from '@/features/study/originals';
import {
  downloadAndImportOriginals,
  importLocalOriginalsIfPresent,
} from '@lib/database/originals-download-service';
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
  onClose: () => void;
}

type Status = 'loading' | 'notInstalled' | 'ready' | 'empty' | 'error';

export const OriginalLanguagesSheet: React.FC<Props> = ({
  visible,
  sourceBook,
  sourceChapter,
  sourceVerse,
  onClose,
}) => {
  const router = useRouter();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const o = t.originals;

  const [status, setStatus] = useState<Status>('loading');
  const [words, setWords] = useState<OriginalWord[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lex, setLex] = useState<StrongsEntry | null>(null);
  const [concordance, setConcordance] = useState<{
    count: number;
    occurrences: StrongsOccurrence[];
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadWords = useCallback(async () => {
    if (sourceVerse == null) return;
    const rows = await getVerseOriginal(sourceBook, sourceChapter, sourceVerse);
    setWords(rows);
    setStatus(rows.length > 0 ? 'ready' : 'empty');
  }, [sourceBook, sourceChapter, sourceVerse]);

  useEffect(() => {
    let cancelled = false;
    if (!visible || sourceVerse == null) return;
    setExpanded(null);
    setLex(null);
    setStatus('loading');
    (async () => {
      let installed = await isOriginalsInstalled();
      if (!installed) installed = await importLocalOriginalsIfPresent();
      if (cancelled) return;
      if (!installed) {
        setStatus('notInstalled');
        return;
      }
      await loadWords();
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, sourceVerse, loadWords]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setProgress(0);
    try {
      await downloadAndImportOriginals(setProgress);
      await loadWords();
    } catch {
      setStatus('error');
    } finally {
      setDownloading(false);
    }
  }, [loadWords]);

  const handleWordPress = useCallback(
    async (word: OriginalWord) => {
      haptics.tap();
      if (expanded === word.position) {
        setExpanded(null);
        setLex(null);
        setConcordance(null);
        return;
      }
      setExpanded(word.position);
      setLex(null);
      setConcordance(null);
      if (hasLexicon(word.strongs)) {
        setLex(await getStrongsDetail(word.strongs));
      }
    },
    [expanded],
  );

  const handleShowConcordance = useCallback(async (strongs: string) => {
    haptics.tap();
    setConcordance(await getStrongsConcordance(strongs));
  }, []);

  const handleJumpToOccurrence = useCallback(
    (occ: StrongsOccurrence) => {
      const book = getBookById(occ.book_id);
      if (!book) return;
      haptics.tap();
      onClose();
      const name = language === 'en' ? book.nameEn : book.name;
      router.push(`/verse/${name}/${occ.chapter}?verse=${occ.verse}` as never);
    },
    [onClose, router, language],
  );

  const sourceLabel =
    sourceVerse != null
      ? `${sourceBook} ${sourceChapter}:${sourceVerse}`
      : `${sourceBook} ${sourceChapter}`;

  const renderWord = (word: OriginalWord) => {
    const gloss = pickGloss(word, language);
    const isOpen = expanded === word.position;
    return (
      <View key={word.position}>
        <TouchableOpacity
          style={[
            styles.wordRow,
            {
              backgroundColor: colors.primary + '0F',
              borderColor: isOpen ? colors.primary : colors.primary + '33',
            },
          ]}
          onPress={() => handleWordPress(word)}
          accessibilityRole="button"
          accessibilityLabel={`${word.word}${gloss ? `, ${gloss}` : ''}`}
          accessibilityHint={o.openHint}>
          <View style={styles.wordMain}>
            <Text
              style={[styles.wordOriginal, {color: colors.text}]}
              allowFontScaling>
              {word.word}
            </Text>
            {word.translit ? (
              <Text style={[styles.wordTranslit, {color: colors.textTertiary}]}>
                {word.translit}
              </Text>
            ) : null}
            {gloss ? (
              <Text style={[styles.wordGloss, {color: colors.textSecondary}]}>
                {gloss}
              </Text>
            ) : null}
          </View>
          {word.strongs ? (
            <View
              style={[
                styles.strongsChip,
                {backgroundColor: colors.primary + '1A'},
              ]}>
              <Text style={[styles.strongsChipText, {color: colors.primary}]}>
                {strongsLabel(word.strongs)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {isOpen && lex ? (
          <View
            style={[
              styles.lexCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            {lex.lemma ? (
              <Text style={[styles.lexLemma, {color: colors.text}]}>
                {lex.lemma}
                {lex.translit ? (
                  <Text style={{color: colors.textTertiary}}>
                    {`  ${lex.translit}`}
                  </Text>
                ) : null}
              </Text>
            ) : null}
            {lex.definition ? (
              <Text style={[styles.lexDef, {color: colors.textSecondary}]}>
                {lex.definition}
              </Text>
            ) : null}

            {word.strongs && !concordance ? (
              <TouchableOpacity
                style={styles.concordanceLink}
                onPress={() => handleShowConcordance(word.strongs as string)}
                accessibilityRole="button"
                accessibilityLabel={o.viewOccurrences}>
                <Ionicons name="search" size={14} color={colors.primary} />
                <Text
                  style={[styles.concordanceLinkText, {color: colors.primary}]}>
                  {o.viewOccurrences}
                </Text>
              </TouchableOpacity>
            ) : null}

            {concordance ? (
              <View style={styles.concordance}>
                <Text
                  style={[
                    styles.concordanceCount,
                    {color: colors.textTertiary},
                  ]}>
                  {`${concordance.count} ${
                    concordance.count === 1 ? o.occurrencesOne : o.occurrences
                  }`}
                </Text>
                {concordance.occurrences.map((occ, i) => (
                  <TouchableOpacity
                    key={`${occ.book_id}-${occ.chapter}-${occ.verse}-${i}`}
                    style={[styles.occRow, {borderTopColor: colors.border}]}
                    onPress={() => handleJumpToOccurrence(occ)}
                    accessibilityRole="button"
                    accessibilityLabel={occurrenceRef(occ, language)}>
                    <Text
                      style={[styles.occRef, {color: colors.primary}]}
                      numberOfLines={1}>
                      {occurrenceRef(occ, language)}
                    </Text>
                    <Text
                      style={[styles.occWord, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {occ.word}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
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
                {o.title}
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

          {status === 'loading' ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : status === 'notInstalled' || status === 'error' ? (
            <View style={styles.centerState}>
              <Ionicons
                name="language-outline"
                size={40}
                color={colors.textTertiary}
              />
              <Text style={[styles.stateTitle, {color: colors.text}]}>
                {status === 'error' ? o.downloadError : o.notInstalledTitle}
              </Text>
              <Text style={[styles.stateBody, {color: colors.textSecondary}]}>
                {o.notInstalledBody}
              </Text>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  {backgroundColor: colors.primary},
                  downloading && styles.downloadButtonDisabled,
                ]}
                onPress={handleDownload}
                disabled={downloading}
                accessibilityRole="button"
                accessibilityLabel={o.download}>
                {downloading ? (
                  <>
                    <ActivityIndicator
                      color={staticColors.white}
                      size="small"
                    />
                    <Text
                      style={[
                        styles.downloadText,
                        {color: staticColors.white},
                      ]}>
                      {progress > 0
                        ? `${o.downloading} ${Math.round(progress * 100)}%`
                        : o.downloading}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="cloud-download-outline"
                      size={18}
                      color={staticColors.white}
                    />
                    <Text
                      style={[
                        styles.downloadText,
                        {color: staticColors.white},
                      ]}>
                      {o.download}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : status === 'empty' ? (
            <View style={styles.centerState}>
              <Ionicons
                name="language-outline"
                size={36}
                color={colors.textTertiary}
              />
              <Text style={[styles.stateBody, {color: colors.textSecondary}]}>
                {o.empty}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}>
              {words.map(renderWord)}
              <Text style={[styles.attribution, {color: colors.textTertiary}]}>
                {o.attribution}
              </Text>
            </ScrollView>
          )}
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
    maxHeight: '78%',
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
  centerState: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateBody: {fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 20},
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  downloadButtonDisabled: {opacity: 0.7},
  downloadText: {fontSize: fontSizes.md, fontWeight: '700'},
  list: {flexGrow: 0},
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  wordMain: {flex: 1},
  wordOriginal: {fontSize: fontSizes.xl, fontWeight: '700', marginBottom: 2},
  wordTranslit: {fontSize: fontSizes.sm, fontStyle: 'italic'},
  wordGloss: {fontSize: fontSizes.sm, marginTop: 2},
  strongsChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  strongsChipText: {fontSize: fontSizes.xs, fontWeight: '800'},
  lexCard: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  lexLemma: {fontSize: fontSizes.md, fontWeight: '700'},
  lexDef: {fontSize: fontSizes.sm, lineHeight: 20},
  concordanceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  concordanceLinkText: {fontSize: fontSizes.sm, fontWeight: '700'},
  concordance: {marginTop: spacing.xs},
  concordanceCount: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  occRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  occRef: {fontSize: fontSizes.sm, fontWeight: '700'},
  occWord: {fontSize: fontSizes.sm, flexShrink: 1, textAlign: 'right'},
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
