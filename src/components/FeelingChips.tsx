/**
 * 💛 FeelingChips — the Home emotional check-in row (Sprint 79).
 *
 * A gentle horizontal strip of feeling chips ("Ansioso", "Agradecido"…) under
 * the daily verse: one tap names the reader's state of heart and opens the
 * matching passages ([[feelings]]). A trailing "Ver todos" chip opens the
 * browse grid. Router-free by design — the owner injects `onOpenFeeling` /
 * `onOpenAll` — so the component stays unit-testable.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {getAllFeelings} from '@/features/study/feelings';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  FEELING_CHIP_WIDTH,
} from '@/styles/designTokens';

interface FeelingChipsProps {
  /** Open one feeling's detail (`/features/feelings/[id]`). */
  onOpenFeeling: (feelingId: string) => void;
  /** Open the browse grid (`/features/feelings`). */
  onOpenAll: () => void;
}

export const FeelingChips: React.FC<FeelingChipsProps> = ({
  onOpenFeeling,
  onOpenAll,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tf = t.feelings;
  const list = tf.list as Record<string, {name: string; description: string}>;
  const feelings = getAllFeelings();

  return (
    <View>
      <AppText
        scaleRole="compact"
        style={[styles.prompt, {color: colors.textSecondary}]}>
        {tf.homePrompt}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {feelings.map(feeling => {
          const name = list[feeling.id]?.name ?? feeling.id;
          return (
            <TouchableOpacity
              key={feeling.id}
              style={[
                styles.chip,
                {
                  backgroundColor: feeling.accent + '16',
                  borderColor: feeling.accent + '50',
                },
              ]}
              onPress={() => {
                haptics.tap();
                onOpenFeeling(feeling.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={name}
              accessibilityHint={list[feeling.id]?.description}>
              <Ionicons
                name={feeling.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={feeling.accent}
              />
              <AppText
                scaleRole="compact"
                style={[styles.chipText, {color: colors.text}]}>
                {name}
              </AppText>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.chip, {borderColor: colors.border}]}
          onPress={() => {
            haptics.tap();
            onOpenAll();
          }}
          accessibilityRole="button"
          accessibilityLabel={tf.seeAll}>
          <AppText
            scaleRole="compact"
            style={[styles.chipText, {color: colors.textSecondary}]}>
            {tf.seeAll}
          </AppText>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  prompt: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  // width (not minWidth) — see FEELING_CHIP_WIDTH's doc comment: a floor
  // alone lets long labels ("Esperando en Dios") grow past it while short
  // ones ("Solo") sit at the floor, so chips end up visibly uneven widths.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: FEELING_CHIP_WIDTH,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    // flexShrink lets the label wrap to fit the fixed chip width instead of
    // overflowing it (RN text doesn't wrap in a row without it); textAlign
    // keeps short, single-line labels centered like before.
    flexShrink: 1,
    textAlign: 'center',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default FeelingChips;
