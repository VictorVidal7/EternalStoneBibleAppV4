/**
 * 🧩 KidsQuizPanel — the 3-question, 3-option multiple-choice quiz for a
 * kids story (Item 4, Tanda 1).
 *
 * Facts only, straight from the scenes just read — no interpretation, no
 * prescribed devotional answers (only "Para enseñar", rendered by the
 * screen, opens that door, and with open questions). Same green/red
 * feedback + haptics language as the prophecy quiz
 * (`app/features/prophecies/quiz.tsx`), scaled down to one question at a
 * time since this quiz is per-story rather than a big matching board.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {prepareKidsQuiz} from '@/features/kids/kidsQuiz';
import type {KidsStory} from '@/features/kids/kidsStories';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface KidsQuizQuestionText {
  question: string;
  options: string[];
}

interface KidsQuizPanelProps {
  story: KidsStory;
  /** Called once, after the last question is answered, with the correct count (0-3). */
  onFinish: (correctCount: number) => void;
}

export const KidsQuizPanel: React.FC<KidsQuizPanelProps> = ({
  story,
  onFinish,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tk = t.kids;
  const storyText = (
    tk.stories as Record<string, {quiz: Record<string, KidsQuizQuestionText>}>
  )[story.id];

  const prepared = useMemo(() => prepareKidsQuiz(story), [story]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const spec = story.quiz[index];
  const round = prepared[index];
  const text = storyText?.quiz[spec.id];
  const answered = selected !== null;
  const isLast = index === story.quiz.length - 1;

  const selectOption = (position: number) => {
    if (answered) return;
    const correct = position === round.correctPosition;
    haptics[correct ? 'success' : 'error']();
    setSelected(position);
    if (correct) setScore(s => s + 1);
  };

  const advance = () => {
    haptics.tap();
    if (isLast) {
      onFinish(score);
      return;
    }
    setIndex(i => i + 1);
    setSelected(null);
  };

  function optionStyle(position: number) {
    if (!answered) {
      return {backgroundColor: colors.surface, borderColor: colors.border};
    }
    if (position === round.correctPosition) {
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

  if (!text) return null;

  return (
    <View style={styles.container}>
      <AppText
        scaleRole="compact"
        style={[styles.progress, {color: colors.textTertiary}]}>
        {tk.quiz.question
          .replace('{{n}}', String(index + 1))
          .replace('{{total}}', String(story.quiz.length))}
      </AppText>
      <AppText style={[styles.question, {color: colors.text}]}>
        {text.question}
      </AppText>

      <View style={styles.options}>
        {round.order.map((optionIndex, position) => (
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
                  selected === round.correctPosition
                    ? colors.success
                    : colors.error,
              },
            ]}>
            {selected === round.correctPosition
              ? tk.quiz.correct
              : tk.quiz.wrong}
          </AppText>
          <TouchableOpacity
            style={[styles.nextBtn, {backgroundColor: colors.primary}]}
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel={isLast ? tk.quiz.finish : tk.next}>
            <AppText style={styles.nextBtnText}>
              {isLast ? tk.quiz.finish : tk.next}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default KidsQuizPanel;

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
