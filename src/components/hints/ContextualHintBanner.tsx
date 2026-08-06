/**
 * 💡 CONTEXTUAL HINT BANNER
 *
 * The visual half of the contextual-hints layer (see
 * `src/lib/onboarding/contextualHints.ts` and `useContextualHint` for the
 * persistence/trigger logic). A small, dismissible, one-time callout that
 * explains ONE nearby feature — not a full-screen modal (that register
 * belongs to the existing first-run wizard, `OnboardingScreen`) and not a
 * floating pointer-arrow tooltip.
 *
 * ── Judgment call: inline callout, not an absolutely-positioned floating
 * tooltip ──
 * Renders INLINE in the screen's normal layout flow, directly beside the
 * feature it explains, rather than as a `position: absolute` bubble with
 * an arrow pointing at a measured anchor. A floating tooltip would need
 * `measureInWindow` on the target element and would have to stay correct
 * across scrolling, safe-area insets, and rotation on 4 different screens
 * — real fragility for a feature that only needs to appear "near" the
 * relevant control, not glued pixel-perfect on top of it. The brief calls
 * for "lightweight, dismissible, anchored near the relevant UI element,
 * not a full-screen modal" — an inline card immediately adjacent to that
 * element satisfies that without the measurement/portal machinery.
 *
 * Animation and lifecycle deliberately mirror `Toast` (see
 * ../Toast.tsx) — Animated spring/timing with useNativeDriver, an
 * auto-dismiss timer, and a screen-reader announcement on show — rather
 * than inventing a new transient-UI idiom for this one feature.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useRef} from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {spacing, borderRadius, fontSize, shadows} from '@/styles/designTokens';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';

export interface ContextualHintBannerProps {
  /** Whether this hint has been resolved as showable — from
   * `useContextualHint(hintId).visible`. Renders nothing when false. */
  visible: boolean;
  message: string;
  /** From `useContextualHint(hintId).dismiss` — fires once the banner
   * finishes hiding (explicit close tap OR the auto-dismiss timer). */
  onDismiss: () => void;
  /** Ms before auto-dismissing; 0 disables the timer. Longer than Toast's
   * 3000ms default — this is a short sentence of educational copy meant
   * to be read, not a quick confirmation glance. */
  duration?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ContextualHintBanner: React.FC<ContextualHintBannerProps> = ({
  visible,
  message,
  onDismiss,
  duration = 8000,
  icon = 'bulb-outline',
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const show = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hide();
      }, duration);
    }
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  useEffect(() => {
    if (visible) {
      show();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  // Screen-reader announcement on appearance, mirroring Toast's own wiring
  // (AccessibilityInfo.announceForAccessibility) so a hint isn't a purely
  // visual-only affordance for TalkBack/VoiceOver users.
  useEffect(() => {
    if (visible && message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.info,
          opacity,
          transform: [{translateY}],
          ...shadows.sm,
        },
      ]}>
      <Ionicons name={icon} size={20} color={colors.info} style={styles.icon} />
      <Text style={[styles.message, {color: colors.text}]}>{message}</Text>
      <TouchableOpacity
        onPress={hide}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel={t.close}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  closeButton: {
    padding: spacing['0.5'],
  },
});

export default ContextualHintBanner;
