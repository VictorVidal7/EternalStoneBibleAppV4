/**
 * 📖 FeatureGuideModal — a short, gentle "how does this work?" explainer,
 * generalized from the memorization-only `MemoryGuideModal` (Sprint 98) so
 * any deep feature can reuse the same sheet instead of hand-rolling its own.
 *
 * Pure presentation: title/intro/sections/close copy all come in as props
 * (see `src/lib/onboarding/featureGuides.ts` for the central registry that
 * supplies them from i18n), 100% theme-driven, no state beyond visibility.
 * Device-local; touches nothing. This is deliberately still a single static
 * sheet, never a multi-step coachmark/spotlight tour — see
 * `contextualHints.ts`'s doc comment for why that's out of scope.
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

export interface FeatureGuideSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

export interface FeatureGuideModalProps {
  visible: boolean;
  onClose: () => void;
  /** Icon shown next to the title in the sheet header. */
  headerIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  intro: string;
  sections: FeatureGuideSection[];
  closeLabel: string;
}

export const FeatureGuideModal: React.FC<FeatureGuideModalProps> = ({
  visible,
  onClose,
  headerIcon = 'school',
  title,
  intro,
  sections,
  closeLabel,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();

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
              backgroundColor: colors.cardSolid,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          {...focusTrapProps()}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name={headerIcon} size={22} color={colors.primary} />
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {title}
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
              {intro}
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
            accessibilityLabel={closeLabel}>
            <AppText
              scaleRole="compact"
              style={[styles.ctaText, {color: colors.onPrimary}]}>
              {closeLabel}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FeatureGuideModal;

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
