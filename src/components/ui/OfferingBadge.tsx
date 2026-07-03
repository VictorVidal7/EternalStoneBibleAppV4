/**
 * OfferingBadge — the ONE visual marker for anything unlockable by a
 * voluntary offering. Deliberately quiet: a thin leaf-outline glyph, never a
 * lock/crown/"PRO"/currency symbol (see the plan) — the free app is never
 * framed as capped, so the indicator shouldn't look punitive either.
 *
 * Tapping it opens the offering sheet directly (via OfferingSheetContext)
 * unless the caller passes its own onPress, letting a locked-feature
 * touchpoint do its own thing first (e.g. close a modal) before opening it.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React from 'react';
import {TouchableOpacity, StyleProp, ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useLanguage} from '@hooks/useLanguage';
import {useOfferingSheet} from '@context/OfferingSheetContext';

interface OfferingBadgeProps {
  size?: number;
  color: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const OfferingBadge: React.FC<OfferingBadgeProps> = ({
  size = 16,
  color,
  onPress,
  style,
}) => {
  const {t} = useLanguage();
  const {open} = useOfferingSheet();

  return (
    <TouchableOpacity
      onPress={onPress ?? open}
      accessibilityRole="button"
      accessibilityLabel={t.offering.badgeA11y}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      style={style}>
      <Ionicons name="leaf-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default OfferingBadge;
