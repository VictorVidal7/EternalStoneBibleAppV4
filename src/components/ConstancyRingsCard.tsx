/**
 * 🔵 ConstancyRingsCard — the Home owner of the constancy rings (Sprint 85).
 *
 * Thin wrapper that pulls the composed {@link useConstancyRings} summary and
 * renders the presentational [[ConstancyRings]] inside a pressable. Router-free
 * like [[DevotionStreakCard]] / [[MoodVerseCard]] — Home injects `onPress` — and
 * honestly gated: nothing shows until the reader has any footprint in any habit.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {TouchableOpacity} from 'react-native';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {useConstancyRings} from '@hooks/useConstancyRings';
import {ConstancyRings} from '@components/ConstancyRings';

interface ConstancyRingsCardProps {
  /** Open the rings detail (Home injects the route push). */
  onPress: () => void;
}

export const ConstancyRingsCard: React.FC<ConstancyRingsCardProps> = ({
  onPress,
}) => {
  const {t} = useLanguage();
  const {loaded, summary, hasHistory} = useConstancyRings();

  // Honest gate: nothing until the reader has engaged any habit at least once.
  if (!loaded || !hasHistory) return null;

  const summaryLine = t.constancy.summary
    .replace('{{closed}}', String(summary.closedCount))
    .replace('{{total}}', String(summary.total));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${t.constancy.title}: ${summaryLine}`}
      accessibilityHint={t.constancy.cardHint}>
      <ConstancyRings summary={summary} />
    </TouchableOpacity>
  );
};

export default ConstancyRingsCard;
