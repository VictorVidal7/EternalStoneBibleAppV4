/**
 * 🧩 QUIZ BÍBLICO (T18) — free MCQ round over the curated 24-question bank
 * (`quizBank.ts`): who-said-it, complete-the-verse, reference-to-content,
 * and event-order, 8 questions per round (`QUIZ_ROUND_SIZE`).
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

import React, {useRef, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useContentBottomInset} from '@hooks/useContentBottomInset';
import {QuizPanel} from '@/components/quiz/QuizPanel';
import {
  pickQuizRound,
  prepareQuizRound,
  QUIZ_ROUND_SIZE,
  type PreparedQuizQuestion,
} from '@/features/quiz/quizRound';
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

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useContentBottomInset();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const tq = t.quiz;
  const bank = tq.bank as Record<string, QuizBankText>;

  const seenRef = useRef<Set<string>>(new Set());
  const [roundNum, setRoundNum] = useState(1);
  const [round, setRound] = useState<PreparedQuizQuestion[]>(() =>
    prepareQuizRound(pickQuizRound(QUIZ_ROUND_SIZE, seenRef.current)),
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const roundComplete = index >= round.length;
  const current = roundComplete ? null : round[index];

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const startNextRound = () => {
    haptics.tap();
    round.forEach(q => seenRef.current.add(q.id));
    setRoundNum(n => n + 1);
    setScore(0);
    setMistakes(0);
    setIndex(0);
    setRound(prepareQuizRound(pickQuizRound(QUIZ_ROUND_SIZE, seenRef.current)));
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    else setMistakes(m => m + 1);
  };

  const handleAdvance = () => {
    setIndex(i => i + 1);
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
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <AppText scaleRole="compact" style={styles.headerRound}>
            {tq.roundOf.replace('{{n}}', String(roundNum))}
          </AppText>
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
