/**
 * ⚠️ ConfirmDialog — a themed, accessible confirm sheet that replaces the bare
 * native `Alert.alert` for in-app confirmations.
 *
 * The OS alert is a flat gray box that ignores the Settings-selected theme and
 * renders both actions in the same accent — so a destructive "Delete plan" reads
 * exactly like the harmless "Cancel". This dialog instead:
 *   - honors `colors` (surface card, themed text), like every other modal;
 *   - leads with a tinted icon badge (error tint when `destructive`);
 *   - gives the destructive action its OWN filled `error` button with readable
 *     ink (white on the dark light-mode red, near-black on the light dark-mode
 *     red — same logic as `onPrimary`), so the dangerous tap is unmistakable;
 *   - keeps Cancel as a calm, bordered secondary so it's the easy default.
 *
 * Pure presentation: the caller owns visibility state and the confirm/cancel
 * handlers (and any haptics/toasts around them).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Paints the confirm action in the error color + uses a warning icon. */
  destructive?: boolean;
  /** Ionicons glyph for the badge. Defaults to trash (destructive) / help. */
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  icon,
}) => {
  const {colors, isDark} = useTheme();

  const accent = destructive ? colors.error : colors.primary;
  // Dark themes use LIGHT accents (e.g. red-400), so a white glyph washes out —
  // mirror the `onPrimary` rule and ink the filled button with dark text there.
  const confirmInk = destructive
    ? isDark
      ? staticColors.black
      : staticColors.white
    : colors.onPrimary;
  const badgeIcon: keyof typeof Ionicons.glyphMap =
    icon ?? (destructive ? 'trash-outline' : 'help-circle-outline');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[styles.card, {backgroundColor: colors.surface}]}
          {...focusTrapProps()}>
          <View style={[styles.badge, {backgroundColor: accent + '22'}]}>
            <Ionicons name={badgeIcon} size={28} color={accent} />
          </View>

          <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
          <Text style={[styles.message, {color: colors.textSecondary}]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {borderColor: colors.border},
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}>
              <Text style={[styles.buttonText, {color: colors.text}]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, {backgroundColor: accent}]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}>
              <Text style={[styles.buttonText, {color: confirmInk}]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack55,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
