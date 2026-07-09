/**
 * 🔵 ConstancyRingsCard — the Home owner of the constancy rings (Sprint 85).
 *
 * Thin wrapper that pulls the composed {@link useConstancyRings} summary and
 * renders the presentational [[ConstancyRings]]. Router-free like
 * [[DevotionStreakCard]] / [[MoodVerseCard]] — Home injects `onPress` (opens
 * insights) and `onHabitPress` (opens a specific habit's own screen, T26) —
 * and honestly gated: nothing shows until the reader has any footprint in
 * any habit.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useConstancyRings} from '@hooks/useConstancyRings';
import {ConstancyRings} from '@components/ConstancyRings';
import {ConstancyImageModal} from '@components/insights/ConstancyImageModal';
import type {HabitKey} from '@lib/home/constancyRings';
import {spacing} from '@/styles/designTokens';

interface ConstancyRingsCardProps {
  /** Open the rings detail/insights (Home injects the route push) — now
   *  triggered by tapping the header or the graphic (T26). */
  onPress: () => void;
  /** Open a specific habit's own screen (Home injects the route push per
   *  key: reading/memory/devotion/mood) — T26, one per legend row. */
  onHabitPress: (key: HabitKey) => void;
}

export const ConstancyRingsCard: React.FC<ConstancyRingsCardProps> = ({
  onPress,
  onHabitPress,
}) => {
  const {loaded, summary, hasHistory} = useConstancyRings();
  const [shareVisible, setShareVisible] = useState(false);

  // Honest gate: nothing until the reader has engaged any habit at least once.
  if (!loaded || !hasHistory) return null;

  return (
    <>
      <View
        // Owns the top gap to the previous Home card so it collapses with the
        // card when the honest gate above returns null (no phantom space).
        style={styles.card}>
        <ConstancyRings
          summary={summary}
          onShare={() => setShareVisible(true)}
          onPress={onPress}
          onHabitPress={onHabitPress}
        />
      </View>
      <ConstancyImageModal
        visible={shareVisible}
        summary={summary}
        onClose={() => setShareVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {marginTop: spacing.lg},
});

export default ConstancyRingsCard;
