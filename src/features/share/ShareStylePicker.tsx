/**
 * 🎨 ShareStylePicker — the horizontal template-swatch row shared by every
 * "share as image" modal (Tanda M1, deep-audit batch4 item 6).
 *
 * Was byte-identical (bar one loop-var name) across 11 of the 12 duplicated
 * modals. Self-contained like `ShareTextureOverlay` — pulls its own theme/
 * language, so a screen just feeds in the template catalog + current
 * selection.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {
  spacing,
  fontSize as fontSizes,
  staticColors,
} from '@/styles/designTokens';
import type {ShareTemplate} from './imageTemplates';

export interface ShareStylePickerProps {
  templates: readonly ShareTemplate[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const ShareStylePicker: React.FC<ShareStylePickerProps> = ({
  templates,
  selectedIndex,
  onSelect,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();

  return (
    <View style={styles.options}>
      <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
        {t.verse.imageStyle}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {templates.map((tpl, index) => {
          const selected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={tpl.id}
              onPress={() => {
                haptics.tap();
                onSelect(index);
              }}
              accessibilityRole="button"
              accessibilityState={{selected}}
              accessibilityLabel={t.verse.imageStyleA11y.replace(
                '{{n}}',
                String(index + 1),
              )}
              style={[
                styles.swatch,
                selected && styles.swatchSelected,
                selected && {borderColor: colors.primary},
              ]}>
              <LinearGradient colors={tpl.colors} style={styles.swatchGradient}>
                <Ionicons
                  name={tpl.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={tpl.textColor}
                />
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ShareStylePicker;

const styles = StyleSheet.create({
  options: {paddingHorizontal: spacing.xl, paddingTop: spacing.md},
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: staticColors.transparent,
  },
  swatchSelected: {borderWidth: 3},
  swatchGradient: {
    flex: 1,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
