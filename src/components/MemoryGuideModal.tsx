/**
 * 🧠 MemoryGuideModal — a short, gentle explainer for how the memorization
 * system works (Sprint 98).
 *
 * Readers asked "how does this work?" — the deck shows boxes, the practice
 * card hides words and asks you to grade yourself, but nothing said why. This
 * is a small, discreet sheet (opened from a "?" on the deck and practice
 * screens) that explains the three moving parts in plain language: the Leitner
 * boxes, the progressive word-masking, and the self-grading. Pure presentation
 * — reads its prose from i18n (`t.memory.guide`), 100% theme-driven, no state
 * beyond visibility. Device-local; touches nothing.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

export interface MemoryGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MemoryGuideModal: React.FC<MemoryGuideModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const g = t.memory.guide;

  const sections: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    body: string;
  }[] = [
    {icon: 'layers-outline', title: g.boxesTitle, body: g.boxesBody},
    {icon: 'eye-off-outline', title: g.maskTitle, body: g.maskBody},
    {icon: 'options-outline', title: g.gradeTitle, body: g.gradeBody},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          {...focusTrapProps()}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="school" size={22} color={colors.primary} />
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {g.title}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}>
            <AppText
              scaleRole="body"
              style={[styles.intro, {color: colors.textSecondary}]}>
              {g.intro}
            </AppText>

            {sections.map(s => (
              <View key={s.title} style={styles.section}>
                <View
                  style={[
                    styles.sectionIcon,
                    {backgroundColor: colors.primary + '18'},
                  ]}>
                  <Ionicons name={s.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.sectionText}>
                  <AppText
                    scaleRole="compact"
                    style={[styles.sectionTitle, {color: colors.text}]}>
                    {s.title}
                  </AppText>
                  <AppText
                    scaleRole="body"
                    style={[styles.sectionBody, {color: colors.textSecondary}]}>
                    {s.body}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.cta, {backgroundColor: colors.primary}]}
            onPress={() => {
              haptics.tap();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={g.close}>
            <AppText
              scaleRole="compact"
              style={[styles.ctaText, {color: colors.onPrimary}]}>
              {g.close}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default MemoryGuideModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {fontSize: fontSizes.xl, fontWeight: '800', flexShrink: 1},
  body: {flexGrow: 0},
  bodyContent: {paddingBottom: spacing.md},
  intro: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginBottom: spacing.lg,
  },
  section: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg},
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {flex: 1},
  sectionTitle: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionBody: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5},
  cta: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctaText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
  },
});
