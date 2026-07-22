/**
 * 🧠 MEMORY PRACTICE SCREEN
 *
 * Flashcard-style review session. The queue is captured **once** on
 * mount (from `dueCards` at that moment) so users finish exactly the
 * session they started — reviewing a card with grade `again` reschedules
 * it via the SRS algo but does NOT re-add it to the active queue.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {getBookByName} from '@/constants/bible';
import {applyMask, MASK_LEVEL_PERCENT, maskLevelForBox} from '@lib/memory/srs';
import type {ReviewGrade} from '@lib/memory/srs';
import {
  firstLetterPrompt,
  buildFillLayout,
  fillScore,
} from '@lib/memory/recall';
import {WriteCanvas} from '@/features/memory/WriteCanvas';
import {MemoryGuideModal} from '@components/MemoryGuideModal';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const GRADE_COLORS: Record<ReviewGrade, string> = {
  again: '#EF4444',
  hard: '#F59E0B',
  good: '#22C55E',
  easy: '#3B82F6',
};

/** The active-recall modes layered on the SRS. */
type PracticeMode = 'reveal' | 'firstLetter' | 'fill' | 'write';
const MODE_ORDER: PracticeMode[] = ['reveal', 'firstLetter', 'fill', 'write'];
const MODE_ICON: Record<PracticeMode, keyof typeof Ionicons.glyphMap> = {
  reveal: 'eye-outline',
  firstLetter: 'text-outline',
  fill: 'create-outline',
  write: 'brush-outline',
};

export default function MemoryPracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {dueCards, reviewCard} = useMemoryDeck();

  // Freeze the queue on mount so a grade-driven reshuffle doesn't add
  // the same card back into the current session.
  const [queue] = useState(() => [...dueCards]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('reveal');
  const [fillAnswers, setFillAnswers] = useState<string[]>([]);
  const [guideVisible, setGuideVisible] = useState(false);

  const total = queue.length;
  const card = queue[index];
  const done = index >= total;

  // A fresh card or a mode switch starts the recall over.
  useEffect(() => {
    setRevealed(false);
    setFillAnswers([]);
  }, [index, mode]);

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  const displayBookName = useMemo(() => {
    if (!card) return '';
    const info = getBookByName(card.bookName);
    if (!info) return card.bookName;
    return selectedVersion.language === 'es' ? info.name : info.nameEn;
  }, [card, selectedVersion.language]);

  const maskLevel = card ? maskLevelForBox(card.box) : 0;
  const maskPercent = MASK_LEVEL_PERCENT[maskLevel];
  const maskedText = useMemo(
    () => (card ? applyMask(card.text, maskLevel) : ''),
    [card, maskLevel],
  );
  const firstLetterText = useMemo(
    () => (card ? firstLetterPrompt(card.text) : ''),
    [card],
  );
  const fillLayout = useMemo(
    () => (card ? buildFillLayout(card.text) : {tokens: [], blankCount: 0}),
    [card],
  );
  const maskHintLabel =
    maskPercent === 0
      ? t.memory.practice.maskNone
      : t.memory.practice.maskHint.replace('{{percent}}', String(maskPercent));

  // Box-1 cards (a verse's first time in the deck) are shown in full in REVEAL
  // mode — the mask hides nothing — so there is nothing to "reveal"; skip the
  // reveal step there. The other modes always pose a real recall, so they wait
  // for the user to reveal/check.
  const nothingMasked = mode === 'reveal' && maskLevel === 0;
  const showAnswer = revealed || nothingMasked;

  const fillExpected = useMemo(
    () => fillLayout.tokens.filter(tk => tk.isBlank).map(tk => tk.text),
    [fillLayout],
  );
  const fillCorrect = fillScore(fillAnswers, fillExpected);

  const handleReveal = () => {
    haptics.tap();
    setRevealed(true);
  };

  const setFillAnswer = (blankIndex: number, value: string) => {
    setFillAnswers(prev => {
      const next = [...prev];
      next[blankIndex] = value;
      return next;
    });
  };

  const handleGrade = (grade: ReviewGrade) => {
    if (!card) return;
    if (grade === 'again') haptics.warning();
    else haptics.success();
    reviewCard(card.verseKey, grade);
    // Advance to the next card. We don't pull from `dueCards` again on
    // purpose — see the queue-freeze rationale at the top.
    setIndex(prev => prev + 1);
    setRevealed(false);
  };

  const modeLabel = (m: PracticeMode): string => {
    switch (m) {
      case 'reveal':
        return t.memory.practice.modeReveal;
      case 'firstLetter':
        return t.memory.practice.modeFirstLetter;
      case 'fill':
        return t.memory.practice.modeFill;
      case 'write':
        return t.memory.practice.modeWrite;
    }
  };

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                haptics.tap();
                setGuideVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.memory.guide.openLabel}>
              <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerTextRow}>
            <Text style={styles.headerTitle}>{t.memory.practice.title}</Text>
            {!done && (
              <Text style={styles.headerProgress}>
                {t.memory.practice.progress
                  .replace('{{current}}', String(Math.min(index + 1, total)))
                  .replace('{{total}}', String(total))}
              </Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${total ? (index / total) * 100 : 0}%`},
              ]}
            />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
            centeredMaxWidth(),
          ]}>
          {done ? (
            <View style={styles.doneState}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={[styles.doneTitle, {color: colors.text}]}>
                {t.memory.practice.done}
              </Text>
              <Text style={[styles.doneBody, {color: colors.textSecondary}]}>
                {total === 1
                  ? t.memory.practice.doneBodySingular
                  : t.memory.practice.doneBody.replace(
                      '{{count}}',
                      String(total),
                    )}
              </Text>
              <TouchableOpacity
                style={[styles.doneCta, {backgroundColor: colors.primary}]}
                onPress={() => router.back()}>
                <Text style={[styles.doneCtaText, {color: colors.onPrimary}]}>
                  {t.memory.practice.doneCta}
                </Text>
              </TouchableOpacity>
            </View>
          ) : card ? (
            <>
              {/* Recall-mode selector */}
              <View style={styles.modeRow}>
                {MODE_ORDER.map(m => {
                  const active = mode === m;
                  const label = modeLabel(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modeTab,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        haptics.tap();
                        setMode(m);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{selected: active}}
                      accessibilityLabel={label}>
                      <Ionicons
                        name={MODE_ICON[m]}
                        size={15}
                        color={active ? colors.onPrimary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.modeTabText,
                          {
                            color: active
                              ? colors.onPrimary
                              : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                        // Four equal-width tabs leave little room — let a long
                        // label (e.g. ES "Iniciales") shrink to fit instead of
                        // clipping to "Primera l…" (UX review #4).
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <View style={styles.cardMetaRow}>
                  <View
                    style={[
                      styles.boxBadge,
                      {backgroundColor: colors.primary + '22'},
                    ]}>
                    <Text
                      style={[styles.boxBadgeText, {color: colors.primary}]}>
                      {t.memory.practice.boxLabel.replace(
                        '{{box}}',
                        String(card.box),
                      )}
                    </Text>
                  </View>
                  {mode === 'reveal' ? (
                    <Text
                      style={[
                        styles.maskHintText,
                        {color: colors.textTertiary},
                      ]}>
                      {maskHintLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.reference, {color: colors.primary}]}>
                  {displayBookName} {card.chapter}:{card.verse}
                </Text>

                {/* Body per recall mode */}
                {showAnswer ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {card.text}
                  </Text>
                ) : mode === 'reveal' ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {maskedText}
                  </Text>
                ) : mode === 'firstLetter' ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {firstLetterText}
                  </Text>
                ) : mode === 'fill' ? (
                  <View style={styles.fillWrap}>
                    {fillLayout.tokens.map((tk, i) =>
                      tk.isBlank ? (
                        <TextInput
                          key={`tk-${i}`}
                          style={[
                            styles.fillInput,
                            {color: colors.text, borderColor: colors.primary},
                          ]}
                          value={fillAnswers[tk.blankIndex] ?? ''}
                          onChangeText={v => setFillAnswer(tk.blankIndex, v)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="·····"
                          placeholderTextColor={colors.textTertiary}
                          accessibilityLabel={t.memory.practice.fillPrompt}
                        />
                      ) : (
                        <Text
                          key={`tk-${i}`}
                          style={[styles.fillWord, {color: colors.text}]}>
                          {tk.text}
                        </Text>
                      ),
                    )}
                  </View>
                ) : (
                  <WriteCanvas
                    key={`${card.verseKey}-write`}
                    strokeColor={colors.text}
                    bgColor={colors.background}
                    borderColor={colors.border}
                    controlColor={colors.primary}
                    clearLabel={t.memory.practice.clear}
                    undoLabel={t.memory.practice.undo}
                  />
                )}
              </View>

              {!showAnswer ? (
                <TouchableOpacity
                  style={[
                    styles.revealButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={handleReveal}>
                  <Ionicons
                    name={
                      mode === 'fill' && fillLayout.blankCount > 0
                        ? 'checkmark-circle-outline'
                        : 'eye-outline'
                    }
                    size={22}
                    color={colors.onPrimary}
                  />
                  <Text style={[styles.revealText, {color: colors.onPrimary}]}>
                    {mode === 'fill' && fillLayout.blankCount > 0
                      ? t.memory.practice.fillCheck
                      : t.memory.practice.reveal}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.prompt, {color: colors.textSecondary}]}>
                    {mode === 'fill' && fillLayout.blankCount > 0
                      ? t.memory.practice.fillResult
                          .replace('{{correct}}', String(fillCorrect))
                          .replace('{{total}}', String(fillLayout.blankCount))
                      : nothingMasked
                        ? t.memory.practice.promptFullVerse
                        : t.memory.practice.prompt}
                  </Text>
                  <View style={styles.gradeRow}>
                    <GradeButton
                      grade="again"
                      label={t.memory.practice.again}
                      onPress={() => handleGrade('again')}
                    />
                    <GradeButton
                      grade="hard"
                      label={t.memory.practice.hard}
                      onPress={() => handleGrade('hard')}
                    />
                    <GradeButton
                      grade="good"
                      label={t.memory.practice.good}
                      onPress={() => handleGrade('good')}
                    />
                    <GradeButton
                      grade="easy"
                      label={t.memory.practice.easy}
                      onPress={() => handleGrade('easy')}
                    />
                  </View>
                </>
              )}
            </>
          ) : null}
        </ScrollView>

        {/* "How memorization works" explainer (Sprint 98) */}
        <MemoryGuideModal
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
        />
      </View>
    </>
  );
}

const GradeButton: React.FC<{
  grade: ReviewGrade;
  label: string;
  onPress: () => void;
}> = ({grade, label, onPress}) => (
  <TouchableOpacity
    style={[styles.gradeButton, {backgroundColor: GRADE_COLORS[grade]}]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <Text style={styles.gradeText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerProgress: {
    color: staticColors.glassWhite85,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: staticColors.glassWhite18,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: staticColors.white,
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  flashcard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 220,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  boxBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  boxBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  maskHintText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  fillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fillWord: {
    fontSize: fontSizes.lg,
    lineHeight: 36,
  },
  fillInput: {
    minWidth: 64,
    fontSize: fontSizes.base,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomWidth: 2,
  },
  reference: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  verseText: {
    fontSize: fontSizes.lg,
    lineHeight: 28,
    textAlign: 'center',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  revealText: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  prompt: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gradeButton: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    color: staticColors.white,
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  doneState: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.sm,
  },
  doneEmoji: {
    fontSize: 64,
  },
  doneTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
  },
  doneBody: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  doneCta: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
  },
  doneCtaText: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
});
