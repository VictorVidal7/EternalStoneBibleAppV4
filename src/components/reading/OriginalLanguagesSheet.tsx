/**
 * 📜 ORIGINAL LANGUAGES SHEET
 *
 * Bottom-sheet showing a verse's original Hebrew/Greek words — each with its
 * transliteration, gloss (Spanish-first), and Strong's number. Tapping a word
 * reveals its Strong's lexicon entry (lemma + definition).
 *
 * Data comes from the optional originals pack (a ~30 MB download); when it isn't
 * installed the sheet offers to download it (or imports an already-downloaded
 * file). All reads go through `@/features/study/originals`. "Word study" opens
 * the dedicated visual-concordance screen for the tapped word's Strong's number.
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
import {staticColors} from '@/styles/designTokens';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {
  getVerseOriginal,
  getStrongsDetail,
  isOriginalsInstalled,
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
import {InterlinearSheet} from './InterlinearSheet';
import {
  downloadAndImportOriginals,
  importLocalOriginalsIfPresent,
  isOriginalsUpdateAvailable,
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
  /** Reading version id — glosses follow its language (e.g. RVR1960 → Spanish). */
  version?: string;
  onClose: () => void;
}

type Status = 'loading' | 'notInstalled' | 'ready' | 'empty' | 'error';

export const OriginalLanguagesSheet: React.FC<Props> = ({
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
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const o = t.originals;
  // Gloss in the language of what's being read (RVR1960 → Spanish), not just
  // the UI language; the sheet chrome stays in the UI language.
  const glossLang = glossLanguage(language, version);

  const [status, setStatus] = useState<Status>('loading');
  const [words, setWords] = useState<OriginalWord[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lex, setLex] = useState<StrongsEntry | null>(null);
  // The Strong's lexicon definition is English-only (public-domain source); in a
  // Spanish UI it's hidden behind this toggle so the panel stays Spanish.
  const [defExpanded, setDefExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [interlinearVisible, setInterlinearVisible] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

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

  // Update check — once per sheet open, only when the pack is installed, and
  // silently skipped when offline. Never re-fetches per verse change while
  // the sheet stays open (this effect only depends on `visible`).
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setUpdateAvailable(false);
    (async () => {
      const installed = await isOriginalsInstalled();
      if (!installed || cancelled) return;
      const stale = await isOriginalsUpdateAvailable();
      if (!cancelled) setUpdateAvailable(stale);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setProgress(0);
    try {
      await downloadAndImportOriginals(setProgress);
      setUpdateAvailable(false);
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
        return;
      }
      setExpanded(word.position);
      setLex(null);
      setDefExpanded(false);
      if (hasLexicon(word.strongs)) {
        setLex(await getStrongsDetail(word.strongs));
      }
    },
    [expanded],
  );

  // Open the dedicated word-study (visual concordance) for this word's Strong's
  // number, seeded with the gloss in the reading language for an instant header.
  const handleOpenWordStudy = useCallback(
    (word: OriginalWord) => {
      if (!hasLexicon(word.strongs)) return;
      haptics.tap();
      onClose();
      router.push({
        pathname: '/features/word-study' as never,
        params: {
          strongs: word.strongs,
          version: version ?? '',
          gloss: pickGloss(word, glossLang) ?? '',
        },
      } as never);
    },
    [onClose, router, version, glossLang],
  );

  // "Interlineal visual" (T8.3) — the real interlinear layout (original word
  // order, horizontal, with the fluent translation as a reference line) is
  // offering-unlocked; tapping it while free opens the offering sheet instead
  // of the exclusive view.
  const handleOpenInterlinear = useCallback(() => {
    haptics.tap();
    if (!isPremium) {
      openOfferingSheet();
      return;
    }
    setInterlinearVisible(true);
  }, [isPremium, openOfferingSheet]);

  const sourceLabel =
    sourceVerse != null
      ? `${sourceBook} ${sourceChapter}:${sourceVerse}`
      : `${sourceBook} ${sourceChapter}`;

  const renderWord = (word: OriginalWord) => {
    const gloss = pickGloss(word, glossLang);
    const isOpen = expanded === word.position;
    const morphology = decodeMorphologyCode(word.grammar, word.lang);
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
            {language === 'es' ? (
              lex.definition_es ? (
                <Text style={[styles.lexDef, {color: colors.textSecondary}]}>
                  {lex.definition_es}
                </Text>
              ) : lex.definition ? (
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
                      style={[styles.defToggleText, {color: colors.primary}]}>
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
                      style={[styles.lexDef, {color: colors.textSecondary}]}>
                      {lex.definition}
                    </Text>
                  ) : null}
                </>
              ) : null
            ) : lex.definition ? (
              <Text style={[styles.lexDef, {color: colors.textSecondary}]}>
                {lex.definition}
              </Text>
            ) : null}

            {morphology ? (
              <View
                style={[styles.morphSection, {borderTopColor: colors.border}]}>
                <View style={styles.morphHeaderRow}>
                  <Text style={[styles.morphTitle, {color: colors.text}]}>
                    {o.morphologyTitle}
                  </Text>
                  <View
                    style={[
                      styles.exclusiveBadge,
                      {backgroundColor: colors.primary + '1a'},
                    ]}>
                    <Text
                      style={[styles.exclusiveText, {color: colors.primary}]}>
                      {o.exclusiveLabel}
                    </Text>
                  </View>
                </View>
                {isPremium ? (
                  <>
                    <Text
                      style={[styles.lexDef, {color: colors.textSecondary}]}>
                      {describeMorphology(morphology, language)}
                    </Text>
                    {lex.kjv_def ? (
                      <Text
                        style={[styles.morphKjv, {color: colors.textTertiary}]}>
                        {o.kjvGloss}: {lex.kjv_def}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.morphLockedRow}
                    onPress={() => {
                      haptics.tap();
                      openOfferingSheet();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.morphologyTitle} — ${t.offering.badgeA11y}`}>
                    <View
                      style={[
                        styles.morphLockBadge,
                        {backgroundColor: colors.primary},
                      ]}>
                      <Ionicons
                        name="leaf-outline"
                        size={11}
                        color={colors.onPrimary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.morphLockedText,
                        {color: colors.textSecondary},
                      ]}>
                      {o.morphologyLocked}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {word.strongs ? (
              <TouchableOpacity
                style={[
                  styles.wordStudyButton,
                  {backgroundColor: colors.primary + '14'},
                ]}
                onPress={() => handleOpenWordStudy(word)}
                accessibilityRole="button"
                accessibilityLabel={`${o.openWordStudy} — ${o.openWordStudySubtitle}`}>
                <Ionicons name="search" size={16} color={colors.primary} />
                <View style={styles.wordStudyTextGroup}>
                  <Text style={[styles.wordStudyText, {color: colors.primary}]}>
                    {o.openWordStudy}
                  </Text>
                  <Text
                    style={[
                      styles.wordStudySubtitle,
                      {color: colors.textSecondary},
                    ]}>
                    {o.openWordStudySubtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
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

          {(status === 'ready' || status === 'empty') && updateAvailable ? (
            <TouchableOpacity
              style={[
                styles.updateBanner,
                {backgroundColor: colors.primary + '14'},
              ]}
              onPress={() => {
                haptics.tap();
                handleDownload();
              }}
              disabled={downloading}
              accessibilityRole="button"
              accessibilityLabel={o.updateAvailable}>
              <Ionicons
                name="refresh-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.updateBannerText, {color: colors.primary}]}>
                {downloading
                  ? progress > 0
                    ? `${o.downloading} ${Math.round(progress * 100)}%`
                    : o.downloading
                  : o.updateAvailable}
              </Text>
            </TouchableOpacity>
          ) : null}

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
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                    <Text
                      style={[styles.downloadText, {color: colors.onPrimary}]}>
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
                      color={colors.onPrimary}
                    />
                    <Text
                      style={[styles.downloadText, {color: colors.onPrimary}]}>
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
            <>
              <TouchableOpacity
                style={[
                  styles.interlinearRow,
                  {
                    backgroundColor: colors.primary + '0F',
                    borderColor: colors.primary + '33',
                  },
                ]}
                onPress={handleOpenInterlinear}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? o.interlinearOpen
                    : `${o.interlinearTitle} — ${t.offering.badgeA11y}`
                }
                accessibilityHint={o.interlinearBlurb}>
                <View style={styles.interlinearRowText}>
                  <View style={styles.interlinearTitleRow}>
                    <Ionicons
                      name="grid-outline"
                      size={15}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.interlinearTitle, {color: colors.text}]}
                      numberOfLines={1}>
                      {o.interlinearTitle}
                    </Text>
                    <View
                      style={[
                        styles.exclusiveBadge,
                        {backgroundColor: colors.primary + '1a'},
                      ]}>
                      <Text
                        style={[styles.exclusiveText, {color: colors.primary}]}>
                        {o.exclusiveLabel}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.interlinearBlurb,
                      {color: colors.textSecondary},
                    ]}
                    numberOfLines={1}>
                    {o.interlinearBlurb}
                  </Text>
                </View>
                <View
                  style={[
                    styles.interlinearButton,
                    {
                      backgroundColor: isPremium
                        ? colors.primary
                        : colors.primary + '1a',
                    },
                  ]}>
                  {isPremium ? (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.onPrimary}
                    />
                  ) : (
                    <Ionicons
                      name="leaf-outline"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>

              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}>
                {words.map(renderWord)}
                <Text
                  style={[styles.attribution, {color: colors.textTertiary}]}>
                  {o.attribution}
                </Text>
              </ScrollView>
            </>
          )}
        </View>
      </View>

      <InterlinearSheet
        visible={interlinearVisible}
        sourceBook={sourceBook}
        sourceChapter={sourceChapter}
        sourceVerse={sourceVerse}
        version={version}
        words={words}
        onClose={() => setInterlinearVisible(false)}
      />
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
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  updateBannerText: {fontSize: fontSizes.xs, fontWeight: '700'},
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
  interlinearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  interlinearRowText: {flex: 1, gap: 2},
  interlinearTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  interlinearTitle: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  interlinearBlurb: {fontSize: fontSizes.xs},
  interlinearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  defToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  defToggleText: {fontSize: fontSizes.sm, fontWeight: '700'},
  wordStudyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  wordStudyTextGroup: {flex: 1, gap: 1},
  wordStudyText: {fontSize: fontSizes.sm, fontWeight: '700'},
  wordStudySubtitle: {fontSize: fontSizes.xs},
  morphSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  morphHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  morphTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  morphKjv: {fontSize: fontSizes.xs, fontStyle: 'italic', marginTop: 2},
  morphLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  morphLockBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morphLockedText: {fontSize: fontSizes.sm, flexShrink: 1},
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
