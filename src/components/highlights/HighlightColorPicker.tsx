/**
 * Selector de Color para Resaltados
 * Permite elegir color y categoría para destacar versículos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from 'react';
import {
  HighlightColor,
  HighlightCategory,
  HIGHLIGHT_COLOR_NAMES,
  HIGHLIGHT_CATEGORY_NAMES,
  HIGHLIGHT_CATEGORY_ICONS,
} from '../../lib/highlights';

interface HighlightColorPickerProps {
  visible: boolean;
  currentColor?: HighlightColor;
  currentCategory?: HighlightCategory;
  onSelect: (color: HighlightColor, category?: HighlightCategory) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export const HighlightColorPicker: React.FC<HighlightColorPickerProps> = ({
  visible,
  currentColor,
  currentCategory,
  onSelect,
  onRemove,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<HighlightColor>(
    currentColor || HighlightColor.YELLOW
  );
  const [selectedCategory, setSelectedCategory] = useState<HighlightCategory | undefined>(
    currentCategory
  );

  const handleConfirm = () => {
    onSelect(selectedColor, selectedCategory);
    onClose();
  };

  const colors = Object.values(HighlightColor);
  const categories = Object.values(HighlightCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Resaltar Versículo</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Colores */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.colorGrid}>
                {colors.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
              <Text style={styles.colorName}>
                {HIGHLIGHT_COLOR_NAMES[selectedColor]}
              </Text>
            </View>

            {/* Categorías */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categoría (opcional)</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category ? undefined : category
                      )
                    }
                  >
                    <Text style={styles.categoryIcon}>
                      {HIGHLIGHT_CATEGORY_ICONS[category]}
                    </Text>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category &&
                          styles.categoryTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {HIGHLIGHT_CATEGORY_NAMES[category]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Vista previa */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Vista previa:</Text>
              <View style={[styles.previewText, { backgroundColor: selectedColor }]}>
                <Text style={styles.previewVerse}>
                  "Porque de tal manera amó Dios al mundo..."
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.actions}>
            {onRemove && currentColor && (
              <Pressable
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => {
                  onRemove();
                  onClose();
                }}
              >
                <Text style={styles.removeButtonText}>Quitar resaltado</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.actionButton,
                styles.confirmButton,
                { backgroundColor: selectedColor },
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {currentColor ? 'Actualizar' : 'Resaltar'}
              </Text>
            </Pressable>
          </View>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '400',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#1F2937',
    borderWidth: 3,
  },
  colorCheckmark: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  colorName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    maxWidth: '48%',
  },
  categoryButtonSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  categoryTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  preview: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  previewText: {
    padding: 12,
    borderRadius: 8,
  },
  previewVerse: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
