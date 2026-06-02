/**
 * 📝 NOTE EDITOR MODAL
 *
 * Bottom-sheet style modal used by the verse reader to add or edit a
 * note on a single verse. Extracted from `verse/[book]/[chapter].tsx`
 * (Sprint 21 tech debt #13) so the reader file stays under control —
 * the modal owns its own styles + theme glue and exposes a minimal
 * controlled-input surface to the parent.
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {staticColors} from '../../styles/designTokens';
import {
  borderRadius,
  fontSize as fontSizes,
  shadows,
  spacing,
} from '../../styles/designTokens';

export interface NoteEditorModalProps {
  visible: boolean;
  /** Verse the note is attached to (used for the header + preview snippet). */
  verseReference: string;
  verseText: string;
  /** Current draft value of the note input. */
  value: string;
  onChangeText: (next: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  visible,
  verseReference,
  verseText,
  value,
  onChangeText,
  onSave,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const trimmed = value.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View style={[styles.content, {backgroundColor: colors.surface}]}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.text}]}>
              {verseReference || t.notes.add}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {verseText ? (
            <Text
              style={[
                styles.versePreview,
                {
                  color: colors.textSecondary,
                  backgroundColor: colors.surfaceVariant,
                },
              ]}>
              "{verseText}"
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              {color: colors.text, borderColor: colors.border},
            ]}
            placeholder={t.notes.placeholder}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: trimmed ? colors.success : colors.textTertiary,
              },
            ]}
            onPress={onSave}
            disabled={!trimmed}>
            <Text style={styles.saveButtonText}>{t.notes.saveNote}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    minHeight: 450,
    ...shadows['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versePreview: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * 1.6,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSizes.base,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  saveButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: staticColors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
