import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../../hooks/useTheme';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useLanguage} from '../../hooks/useLanguage';

interface SaveComparisonDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, notes: string) => void;
  initialName?: string;
  initialNotes?: string;
  isEditing?: boolean;
}

export const SaveComparisonDialog: React.FC<SaveComparisonDialogProps> = ({
  visible,
  onClose,
  onSave,
  initialName = '',
  initialNotes = '',
  isEditing = false,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setNotes(initialNotes);
    }
  }, [visible, initialName, initialNotes]);

  const handleSave = () => {
    onSave(name, notes);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, {backgroundColor: colors.surface}]}
          {...focusTrapProps()}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              {isEditing
                ? t.versionComparison.editComparison
                : t.versionComparison.saveComparison}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.saveForm}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.versionComparison.comparisonName}
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCorrect={true}
              spellCheck={true}
              autoCapitalize="sentences"
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={`${t.versionComparison.notes} (${t.optional || 'Opcional'})`}
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              autoCorrect={true}
              spellCheck={true}
              autoCapitalize="sentences"
            />

            <TouchableOpacity
              style={[
                styles.saveButtonLarge,
                {backgroundColor: colors.primary},
              ]}
              onPress={handleSave}>
              <Text style={[styles.saveButtonText, {color: colors.onPrimary}]}>
                {isEditing
                  ? t.versionComparison.update
                  : t.versionComparison.save}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveForm: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButtonLarge: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
