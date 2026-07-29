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

import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useConstancyRings} from '@hooks/useConstancyRings';
import {ConstancyRings} from '@components/ConstancyRings';
import {ConstancyImageModal} from '@components/insights/ConstancyImageModal';
import type {HabitKey} from '@lib/home/constancyRings';
import {localDayKey} from '@lib/utils/dateKey';
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

  // "Make the app feel alive" backlog: fire a one-time pulse + haptic the
  // exact moment the READING ring (the most central habit here) crosses from
  // open to closed for the day — not on every render where it's already
  // closed (e.g. reopening the app after finishing earlier today). This
  // component — not the presentational [[ConstancyRings]] — owns the
  // transition detection because IT stays mounted across the honest gate
  // below; a ref inside a conditionally-rendered child would reset every time
  // the gate flips. `prevReadingRef` only updates once `loaded` is true, so
  // the first real data this component ever sees becomes the baseline (never
  // a false "just completed" reading) — day-keyed via `localDayKey()`, the
  // shared day-boundary definition every habit tracker in this app already
  // uses, so a transition only counts within the same local day.
  const prevReadingRef = useRef<{day: string; done: boolean} | undefined>(
    undefined,
  );
  const [pulseReadingToken, setPulseReadingToken] = useState(0);

  useEffect(() => {
    if (!loaded) return; // ignore the pre-load placeholder state
    const readingDone =
      summary.rings.find(r => r.key === 'reading')?.done ?? false;
    const day = localDayKey(Date.now());
    const prev = prevReadingRef.current;
    if (prev && prev.day === day && !prev.done && readingDone) {
      setPulseReadingToken(t => t + 1);
    }
    prevReadingRef.current = {day, done: readingDone};
  }, [loaded, summary]);

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
          pulseReadingToken={pulseReadingToken}
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
