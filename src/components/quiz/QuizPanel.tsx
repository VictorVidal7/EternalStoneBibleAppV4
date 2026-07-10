/**
 * 🧩 QuizPanel — one question of the "Quiz bíblico" (T18 free / T18b premium).
 *
 * Forked from `KidsQuizPanel` (same green/red feedback + haptics language,
 * same single-question-at-a-time shell) rather than reused directly — that
 * component is hard-typed to `KidsStory` and `t.kids.*` strings. This one is
 * generic over any `PreparedQuizQuestion` + i18n bank text, and is a "dumb"
 * presentational panel: the screen owns round-level state (score, index,
 * mistakes, deck/stats side effects) and passes a fresh `prepared` question
 * in — keyed by `prepared.id` so React remounts (and resets `selected`/the
 * timer) per question instead of needing a manual reset effect.
 *
 * T18b additions, both screen-driven so this stays presentational:
 * - `timedMode`: an internal per-question countdown (`onAnswer(false)` on
 *   timeout). Guarded by the same `answered` check `selectOption` already
 *   used, so a tap landing right at expiry can't double-fire `onAnswer`.
 * - `canAddToDeck`/`addToDeckStatus`/`onAddToDeck`: an "add to my deck"
 *   affordance shown only after a WRONG answer. The screen decides
 *   eligibility (premium, question type, not already in the deck) and does
 *   the actual async lookup/`addCard` call — this component only renders the
 *   button and reports the tap.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import type {PreparedQuizQuestion} from '@/features/quiz/quizRound';
import {QUIZ_TIMED_SECONDS_PER_QUESTION} from '@/features/quiz/quizRound';
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

export type AddToDeckStatus = 'idle' | 'pending' | 'added';

export interface QuizPanelProps {
  prepared: PreparedQuizQuestion;
  text: QuizBankText;
  questionNumber: number;
  totalQuestions: number;
  isLast: boolean;
  onAnswer: (correct: boolean) => void;
  onAdvance: () => void;
  /** Premium (T18b): countdown per question; a timeout counts as wrong. */
  timedMode?: boolean;
  /** Screen-computed: whether "add to my deck" should render for THIS question when wrong. */
  canAddToDeck?: boolean;
  addToDeckStatus?: AddToDeckStatus;
  onAddToDeck?: () => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  prepared,
  text,
  questionNumber,
  totalQuestions,
  isLast,
  onAnswer,
  onAdvance,
  timedMode = false,
  canAddToDeck = false,
  addToDeckStatus = 'idle',
  onAddToDeck,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tq = t.quiz;
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIMED_SECONDS_PER_QUESTION);
  const answered = selected !== null;
  const timedOut = answered && selected === -1;
  const wasWrong = answered && selected !== prepared.correctPosition;

  // Countdown effect — resets automatically per question because `selected`/
  // `timeLeft` are fresh local state and the parent remounts this component
  // (keyed by `prepared.id`) for every new question.
  useEffect(() => {
    if (!timedMode || answered) return;
    if (timeLeft <= 0) {
      haptics.error();
      setSelected(-1); // sentinel: timed out, no option chosen
      onAnswer(false);
      return;
    }
    const id = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
    // (this eslint config has no react-hooks/exhaustive-deps rule, so no
    // suppression directive is needed — see ImmersiveReader.tsx for the same
    // note.) Deps are exactly what should retrigger the tick: timedMode
    // on/off, answered flipping true (stops the chain), and timeLeft itself.
  }, [timedMode, answered, timeLeft]);

  const selectOption = (position: number) => {
    if (answered) return;
    const correct = position === prepared.correctPosition;
    haptics[correct ? 'success' : 'error']();
    setSelected(position);
    onAnswer(correct);
  };

  const advance = () => {
    haptics.tap();
    onAdvance();
  };

  const addToDeck = () => {
    if (addToDeckStatus !== 'idle') return;
    haptics.tap();
    onAddToDeck?.();
  };

  function optionStyle(position: number) {
    if (!answered) {
      return {backgroundColor: colors.surface, borderColor: colors.border};
    }
    if (position === prepared.correctPosition) {
      return {
        backgroundColor: colors.success + '22',
        borderColor: colors.success,
      };
    }
    if (position === selected) {
      return {backgroundColor: colors.error + '22', borderColor: colors.error};
    }
    return {backgroundColor: colors.surface, borderColor: colors.border};
  }

  function addToDeckBtnStyle() {
    return {
      borderColor: colors.primary,
      backgroundColor:
        addToDeckStatus === 'added' ? colors.primary + '15' : 'transparent',
    };
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <AppText
          scaleRole="compact"
          style={[styles.progress, {color: colors.textTertiary}]}>
          {tq.questionOf
            .replace('{{n}}', String(questionNumber))
            .replace('{{total}}', String(totalQuestions))}
        </AppText>
        {timedMode && !answered && (
          <AppText
            scaleRole="compact"
            style={[
              styles.timer,
              {color: timeLeft <= 5 ? colors.error : colors.textTertiary},
            ]}
            accessibilityLabel={tq.timedModeHint.replace(
              '{{n}}',
              String(timeLeft),
            )}>
            ⏱ {timeLeft}s
          </AppText>
        )}
      </View>
      <AppText style={[styles.question, {color: colors.text}]}>
        {text.question}
      </AppText>

      <View style={styles.options}>
        {prepared.order.map((optionIndex, position) => (
          <TouchableOpacity
            key={optionIndex}
            style={[styles.option, optionStyle(position)]}
            disabled={answered}
            onPress={() => selectOption(position)}
            accessibilityRole="button"
            accessibilityState={{
              selected: selected === position,
              disabled: answered,
            }}
            accessibilityLabel={text.options[optionIndex]}>
            <AppText style={[styles.optionText, {color: colors.text}]}>
              {text.options[optionIndex]}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {answered && (
        <View style={styles.feedbackRow}>
          <AppText
            style={[
              styles.feedback,
              {color: wasWrong ? colors.error : colors.success},
            ]}>
            {timedOut ? tq.timeUp : wasWrong ? tq.wrong : tq.correct}
          </AppText>

          {wasWrong && canAddToDeck && (
            <TouchableOpacity
              style={[styles.addToDeckBtn, addToDeckBtnStyle()]}
              onPress={addToDeck}
              disabled={addToDeckStatus !== 'idle'}
              accessibilityRole="button"
              accessibilityLabel={
                addToDeckStatus === 'added' ? tq.addToDeckAdded : tq.addToDeck
              }>
              <Ionicons
                name={
                  addToDeckStatus === 'added'
                    ? 'checkmark-circle'
                    : 'bookmark-outline'
                }
                size={16}
                color={colors.primary}
              />
              <AppText style={[styles.addToDeckText, {color: colors.primary}]}>
                {addToDeckStatus === 'added' ? tq.addToDeckAdded : tq.addToDeck}
              </AppText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, {backgroundColor: colors.primary}]}
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel={isLast ? tq.finish : tq.next}>
            <AppText style={styles.nextBtnText}>
              {isLast ? tq.finish : tq.next}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default QuizPanel;

const styles = StyleSheet.create({
  container: {gap: spacing.md, alignSelf: 'stretch'},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  progress: {fontSize: fontSizes.sm, fontWeight: '700', textAlign: 'center'},
  timer: {fontSize: fontSizes.sm, fontWeight: '800'},
  question: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    lineHeight: fontSizes.lg * 1.4,
    textAlign: 'center',
  },
  options: {gap: spacing.sm},
  option: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 56,
    justifyContent: 'center',
  },
  optionText: {fontSize: fontSizes.md, fontWeight: '600'},
  feedbackRow: {alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs},
  feedback: {fontSize: fontSizes.md, fontWeight: '800'},
  addToDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  addToDeckText: {fontSize: fontSizes.sm, fontWeight: '700'},
  nextBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  nextBtnText: {
    color: staticColors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
