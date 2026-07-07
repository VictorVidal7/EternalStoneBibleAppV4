/**
 * 🧩 QuizPanel — one question of the "Quiz bíblico" (T18), 4 options.
 *
 * Forked from `KidsQuizPanel` (same green/red feedback + haptics language,
 * same single-question-at-a-time shell) rather than reused directly — that
 * component is hard-typed to `KidsStory` and `t.kids.*` strings. This one is
 * generic over any `PreparedQuizQuestion` + i18n bank text, and is a "dumb"
 * presentational panel: the screen owns round-level state (score, index,
 * mistakes) and passes a fresh `prepared` question in — keyed by
 * `prepared.id` so React remounts (and resets `selected`) per question
 * instead of needing a manual reset effect.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import type {PreparedQuizQuestion} from '@/features/quiz/quizRound';
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

export interface QuizPanelProps {
  prepared: PreparedQuizQuestion;
  text: QuizBankText;
  questionNumber: number;
  totalQuestions: number;
  isLast: boolean;
  onAnswer: (correct: boolean) => void;
  onAdvance: () => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  prepared,
  text,
  questionNumber,
  totalQuestions,
  isLast,
  onAnswer,
  onAdvance,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tq = t.quiz;
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

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

  return (
    <View style={styles.container}>
      <AppText
        scaleRole="compact"
        style={[styles.progress, {color: colors.textTertiary}]}>
        {tq.questionOf
          .replace('{{n}}', String(questionNumber))
          .replace('{{total}}', String(totalQuestions))}
      </AppText>
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
              {
                color:
                  selected === prepared.correctPosition
                    ? colors.success
                    : colors.error,
              },
            ]}>
            {selected === prepared.correctPosition ? tq.correct : tq.wrong}
          </AppText>
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
  progress: {fontSize: fontSizes.sm, fontWeight: '700', textAlign: 'center'},
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
