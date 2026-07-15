/**
 * 🧩 QUIZ BÍBLICO — free MCQ round (T18) over the curated 24-question bank
 * (`quizBank.ts`) PLUS the premium layer (T18b): mazos por categoría, modo
 * cronometrado, "añadir a mi mazo" tras fallar, y estadísticas extendidas.
 *
 * Free users see the ORIGINAL T18 behavior byte-for-byte: `category` stays
 * `undefined` regardless of any local state (guarded in every place a round is
 * built), no timer, no add-to-deck button, no stats recorded. Every premium
 * control is still visible-but-locked (existing app pattern, e.g.
 * `word-study.tsx`'s KJV row) rather than hidden, and tapping a locked control
 * opens the offering sheet instead of doing anything else.
 *
 * SRS integration (T18b, scoped with Victor via AskUserQuestion): the deck is
 * touched in exactly two ways, both batched ONCE PER ROUND (never per
 * answer/tap — the quota-safety rule this app enforces after the local-first
 * reviewEvents refactor):
 *   1. "Add to my deck" — user-initiated, only offered after a WRONG answer,
 *      excluded for `event-order` (its `refKey` is a supporting reference for
 *      the correct option, not "the verse the question is about").
 *   2. A `complete-verse` question whose verse is ALREADY in the deck gets its
 *      card rescheduled (`reviewCard`, correct→'good'/wrong→'again') once the
 *      round ends — the only question type that's genuinely recall, not
 *      recognition, so it's the only type allowed to touch scheduling.
 *
 * Header/score-chip/round-complete shell mirrors
 * `app/features/prophecies/quiz.tsx` (screen owns round state); the active
 * question itself is `QuizPanel`, a fork of `KidsQuizPanel` generalized to
 * this bank's 4 options.
 *
 * Reached from the Home "Explorar" grid ("Quiz bíblico" tile) + the deep
 * link eternalbible://features/quiz.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useRef, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {useContentBottomInset} from '@hooks/useContentBottomInset';
import {useBackHandlerStep} from '@hooks/useBackHandlerStep';
import {QuizPanel, type AddToDeckStatus} from '@/components/quiz/QuizPanel';
import {
  pickQuizRound,
  prepareQuizRound,
  QUIZ_ROUND_SIZE,
  type PreparedQuizQuestion,
} from '@/features/quiz/quizRound';
import {
  QUIZ_CATEGORIES,
  type QuizCategory,
  type QuizQuestionType,
} from '@/features/quiz/quizBank';
import {
  refKeyToVerseKey,
  resolveVerseForAddCard,
} from '@/features/quiz/quizVerseLookup';
import {useQuizStats} from '@/hooks/useQuizStats';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface QuizBankText {
  question: string;
  options: string[];
}

interface RoundAnswer {
  refKey: string;
  type: QuizQuestionType;
  correct: boolean;
}

/** Question types whose refKey is genuinely "the verse" — eligible for add-to-deck. */
function isAddToDeckEligible(type: QuizQuestionType): boolean {
  return type !== 'event-order';
}

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useContentBottomInset();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const tq = t.quiz;
  const bank = tq.bank as Record<string, QuizBankText>;
  const toast = useToast();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const {hasCard, addCard, reviewCard} = useMemoryDeck();
  const {recordRoundResult} = useQuizStats();

  const seenRef = useRef<Set<string>>(new Set());
  const roundAnswersRef = useRef<RoundAnswer[]>([]);
  const [category, setCategory] = useState<QuizCategory | undefined>(undefined);
  const [timedMode, setTimedMode] = useState(false);
  const [roundNum, setRoundNum] = useState(1);
  const [round, setRound] = useState<PreparedQuizQuestion[]>(() =>
    prepareQuizRound(pickQuizRound(QUIZ_ROUND_SIZE, seenRef.current)),
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [addToDeckStatus, setAddToDeckStatus] =
    useState<AddToDeckStatus>('idle');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const roundComplete = index >= round.length;
  const current = roundComplete ? null : round[index];
  const currentVerseKey = current
    ? refKeyToVerseKey(current.spec.refKey)
    : null;
  // Once the user has tapped (pending/added), keep showing the affordance in
  // its new state — recomputing straight from `hasCard()` would flip this
  // false the instant `addCard` succeeds (the card is now IN the deck), which
  // makes the confirmed "Added to your deck" state vanish instead of show.
  const canAddToDeck =
    addToDeckStatus !== 'idle' ||
    (isPremium &&
      !!current &&
      isAddToDeckEligible(current.spec.type) &&
      !!currentVerseKey &&
      !hasCard(currentVerseKey));

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const buildRound = useCallback(
    (exclude: ReadonlySet<string>, cat: QuizCategory | undefined) =>
      prepareQuizRound(
        pickQuizRound(QUIZ_ROUND_SIZE, exclude, Math.random, cat),
      ),
    [],
  );

  const finishRoundSideEffects = useCallback(() => {
    if (!isPremium) return; // free path: byte-identical to pre-T18b, no side effects
    const answers = roundAnswersRef.current;
    if (answers.length === 0) return;

    const correctCount = answers.filter(a => a.correct).length;
    void recordRoundResult({
      score: correctCount,
      total: answers.length,
      perQuestionResults: answers.map(a => ({
        type: a.type,
        correct: a.correct,
      })),
      timedMode,
    });

    // Batched ONCE per round (never per answer): only reschedule a card that
    // (a) is genuinely recall — `complete-verse` — and (b) is already in the
    // user's deck. Anything else is left untouched by design (see header).
    for (const a of answers) {
      if (a.type !== 'complete-verse') continue;
      const key = refKeyToVerseKey(a.refKey);
      if (key && hasCard(key)) {
        reviewCard(key, a.correct ? 'good' : 'again');
      }
    }
  }, [isPremium, timedMode, recordRoundResult, hasCard, reviewCard]);

  const startNextRound = () => {
    haptics.tap();
    round.forEach(q => seenRef.current.add(q.id));
    setRoundNum(n => n + 1);
    setScore(0);
    setMistakes(0);
    setIndex(0);
    setAddToDeckStatus('idle');
    roundAnswersRef.current = [];
    setRound(buildRound(seenRef.current, isPremium ? category : undefined));
  };

  const restartWithSettings = (
    nextCategory: QuizCategory | undefined,
    nextTimedMode: boolean,
  ) => {
    haptics.tap();
    setCategory(nextCategory);
    setTimedMode(nextTimedMode);
    seenRef.current = new Set();
    setRoundNum(1);
    setScore(0);
    setMistakes(0);
    setIndex(0);
    setAddToDeckStatus('idle');
    roundAnswersRef.current = [];
    setRound(buildRound(new Set(), isPremium ? nextCategory : undefined));
  };

  const handlePickCategory = (cat: QuizCategory | undefined) => {
    if (!isPremium && cat !== undefined) {
      openOfferingSheet();
      return;
    }
    if (cat === category) return;
    restartWithSettings(cat, timedMode);
  };

  const handleToggleTimedMode = () => {
    if (!isPremium) {
      openOfferingSheet();
      return;
    }
    restartWithSettings(category, !timedMode);
  };

  const handleOpenStats = () => {
    if (!isPremium) {
      openOfferingSheet();
      return;
    }
    router.push('/features/quiz/stats' as never);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    else setMistakes(m => m + 1);
    if (current) {
      roundAnswersRef.current.push({
        refKey: current.spec.refKey,
        type: current.spec.type,
        correct,
      });
    }
  };

  const handleAdvance = () => {
    if (index === round.length - 1) finishRoundSideEffects();
    setAddToDeckStatus('idle');
    setIndex(i => i + 1);
  };

  const handleAddToDeck = useCallback(async () => {
    if (!current || addToDeckStatus !== 'idle') return;
    setAddToDeckStatus('pending');
    const resolved = await resolveVerseForAddCard(
      current.spec.refKey,
      selectedVersion.id,
    );
    if (!resolved) {
      setAddToDeckStatus('idle');
      toast.error(tq.addToDeckErrorToast);
      return;
    }
    addCard(resolved);
    setAddToDeckStatus('added');
    toast.success(tq.addToDeckSuccessToast);
  }, [current, addToDeckStatus, selectedVersion.id, addCard, toast, tq]);

  // Nothing is persisted before the round's LAST question (finishRoundSideEffects
  // only runs then), so "progress worth confirming" is simply: past the first
  // question, and the round isn't already complete (roundComplete already has
  // its own "next round" flow, not an exit).
  const roundInProgress = index > 0 && !roundComplete;

  // Hardware back: intercept ONLY when there's progress to lose. Returning
  // `true` consumes the event (dialog decides next); `false` lets the default
  // route-pop proceed exactly like today. Deliberately NOT memoized — the
  // hook re-reads this closure via a ref on every press (see its docstring),
  // so a fresh closure each render is the intended usage.
  const handleBackIntent = (): boolean => {
    if (roundInProgress) {
      setShowExitConfirm(true);
      return true;
    }
    return false;
  };
  useBackHandlerStep(handleBackIntent);

  // On-screen back arrow: same gate, so both back paths agree (this app has
  // a documented history of back-arrow vs. hardware-back disagreeing on other
  // screens — don't repeat that here).
  const handlePressBack = () => {
    if (roundInProgress) {
      setShowExitConfirm(true);
      return;
    }
    router.back();
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    router.back();
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePressBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <AppText scaleRole="compact" style={styles.headerRound}>
            {tq.roundOf.replace('{{n}}', String(roundNum))}
          </AppText>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleOpenStats}
            accessibilityRole="button"
            accessibilityLabel={tq.statsButtonA11y}>
            <Ionicons
              name="stats-chart-outline"
              size={22}
              color={staticColors.white}
            />
            {!isPremium && (
              <View
                style={[styles.miniLock, {backgroundColor: colors.primary}]}>
                <Ionicons
                  name="leaf-outline"
                  size={9}
                  color={staticColors.white}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <AppText scaleRole="display" style={styles.headerTitle}>
          {tq.title}
        </AppText>
        <AppText scaleRole="compact" style={styles.headerSubtitle}>
          {tq.subtitle}
        </AppText>
        <View style={styles.scoreRow}>
          <View style={styles.scoreChip}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={staticColors.white}
            />
            <AppText scaleRole="compact" style={styles.scoreChipText}>
              {tq.score}: {score}
            </AppText>
          </View>
          <View style={styles.scoreChip}>
            <Ionicons
              name="close-circle"
              size={14}
              color={staticColors.white}
            />
            <AppText scaleRole="compact" style={styles.scoreChipText}>
              {tq.mistakes}: {mistakes}
            </AppText>
          </View>
        </View>

        {/* Game-mode toggle, deliberately NOT inside categoryRow below — it's a
            round-setting toggle, not another question-category filter, and
            grouping it with those chips read as "another filter option" to a
            real user (Victor's feedback). Kept visually identical to the
            category chips (same shape/selected-state colors), just relocated. */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: timedMode
                  ? staticColors.white
                  : staticColors.glassWhite18,
              },
            ]}
            onPress={handleToggleTimedMode}
            accessibilityRole="button"
            accessibilityState={{selected: timedMode}}
            accessibilityLabel={tq.timedModeLabel}>
            {!isPremium && (
              <Ionicons
                name="leaf-outline"
                size={12}
                color={timedMode ? colors.primaryDark : staticColors.white}
              />
            )}
            <AppText
              style={[
                styles.categoryChipText,
                {color: timedMode ? colors.primaryDark : staticColors.white},
              ]}>
              ⏱ {tq.timedModeLabel}
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={styles.categoryRowContent}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  category === undefined
                    ? staticColors.white
                    : staticColors.glassWhite18,
              },
            ]}
            onPress={() => handlePickCategory(undefined)}
            accessibilityRole="button"
            accessibilityLabel={tq.categoryAll}>
            <AppText
              style={[
                styles.categoryChipText,
                {
                  color:
                    category === undefined
                      ? colors.primaryDark
                      : staticColors.white,
                },
              ]}>
              {tq.categoryAll}
            </AppText>
          </TouchableOpacity>
          {QUIZ_CATEGORIES.map(cat => {
            const selected = category === cat;
            const locked = !isPremium;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected
                      ? staticColors.white
                      : staticColors.glassWhite18,
                  },
                ]}
                onPress={() => handlePickCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={tq.categories[cat]}>
                {locked && (
                  <Ionicons
                    name="leaf-outline"
                    size={12}
                    color={selected ? colors.primaryDark : staticColors.white}
                  />
                )}
                <AppText
                  style={[
                    styles.categoryChipText,
                    {color: selected ? colors.primaryDark : staticColors.white},
                  ]}>
                  {tq.categories[cat]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottomInset}]}
        showsVerticalScrollIndicator={false}>
        {current ? (
          <QuizPanel
            key={current.id}
            prepared={current}
            text={bank[current.id]}
            questionNumber={index + 1}
            totalQuestions={round.length}
            isLast={index === round.length - 1}
            onAnswer={handleAnswer}
            onAdvance={handleAdvance}
            timedMode={isPremium && timedMode}
            canAddToDeck={canAddToDeck}
            addToDeckStatus={addToDeckStatus}
            onAddToDeck={handleAddToDeck}
          />
        ) : (
          <View
            style={[
              styles.completeCard,
              {backgroundColor: colors.surface, borderColor: colors.primary},
            ]}>
            <AppText style={[styles.completeTitle, {color: colors.text}]}>
              {mistakes === 0 ? tq.roundCompletePerfect : tq.roundComplete}
            </AppText>
            <AppText
              style={[styles.completeScore, {color: colors.textSecondary}]}>
              {tq.score}: {score} · {tq.mistakes}: {mistakes}
            </AppText>
            <TouchableOpacity
              style={[styles.nextRoundBtn, {backgroundColor: colors.primary}]}
              onPress={startNextRound}
              accessibilityRole="button"
              accessibilityLabel={tq.nextRound}>
              <AppText
                style={[styles.nextRoundBtnText, {color: staticColors.white}]}>
                {tq.nextRound}
              </AppText>
              <Ionicons name="refresh" size={18} color={staticColors.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={showExitConfirm}
        title={tq.exitConfirmTitle}
        message={tq.exitConfirmMessage}
        confirmLabel={tq.exitConfirmCta}
        cancelLabel={t.cancel}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitConfirm(false)}
        destructive
        icon="log-out-outline"
      />
    </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLock: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRound: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: staticColors.glassWhite18,
  },
  scoreChipText: {
    color: staticColors.white,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  categoryRow: {marginTop: spacing.md},
  categoryRowContent: {gap: spacing.xs, paddingRight: spacing.lg},
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  categoryChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  completeCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: spacing.md,
  },
  completeTitle: {fontSize: fontSizes.lg, fontWeight: '800'},
  completeScore: {fontSize: fontSizes.md, fontWeight: '600'},
  nextRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  nextRoundBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
});
