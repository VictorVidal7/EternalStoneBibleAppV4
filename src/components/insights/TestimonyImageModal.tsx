/**
 * 🙏 TestimonyImageModal — share an ANSWERED prayer as a testimony image
 * (Sprint 94).
 *
 * The prayer companion (S93) lets the reader mark a request answered with an
 * optional testimony, but a journal kept only to oneself never becomes the
 * witness Scripture calls for ("Come and hear, all you who fear God, and I
 * will tell what he has done for my soul" — Psalm 66:16). This closes the loop
 * oración → respondida → testimonio: it composes the request + the date it was
 * answered + the optional testimony note into a gradient card and shares it as
 * an image through the same captureRef → expo-sharing pipeline + FREE
 * imageTemplates catalog used by every other share surface.
 *
 * The owner passes the already-localized data; nothing re-computes here. The
 * journal data is device-local — only the rendered image leaves the device,
 * and only when the reader chooses to share it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useShareImage} from '@/features/share/useShareImage';
import {ShareCardHost} from '@/features/share/ShareCardHost';
import {PremiumShareExtras} from '@/features/share/PremiumShareExtras';
import {SHARE_TEMPLATES} from '@/features/share/imageTemplates';
import {
  spacing,
  fontSize as fontSizes,
  verseTextRightSlack,
} from '@/styles/designTokens';

export interface TestimonyImageModalProps {
  visible: boolean;
  /** The answered request's title (what was brought to God). */
  title: string;
  /** Optional testimony note recorded when the prayer was answered. */
  testimony?: string;
  /** Localized "answered on" line, e.g. "Respondida · 16 jun 2026". */
  answeredLine: string;
  /**
   * Small label above the request title. Defaults to the answered-prayer
   * framing ("Dios fue fiel") since this component was originally built for
   * that flow — callers sharing a different kind of testimony (e.g. the
   * general faith-testimony writer) should pass their own copy instead of
   * inheriting prayer-specific wording.
   */
  eyebrow?: string;
  /** Emoji shown under the eyebrow. Defaults to 🙏 (see `eyebrow` above). */
  icon?: string;
  onClose: () => void;
}

export const TestimonyImageModal: React.FC<TestimonyImageModalProps> = ({
  visible,
  title,
  testimony,
  answeredLine,
  eyebrow,
  icon,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tt = t.prayer.testimony;
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  const {
    templateIndex,
    setTemplateIndex,
    template,
    templates,
    texture,
    setTexture,
    isSharing,
    previewRef,
    handleShare,
  } = useShareImage({
    templates: SHARE_TEMPLATES,
    componentName: 'TestimonyImageModal',
    onShared: onClose,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.container, {backgroundColor: colors.background}]}
        {...focusTrapProps()}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.close}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]} numberOfLines={1}>
            {tt.share}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={tt.share}
            accessibilityState={{disabled: isSharing}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <ShareCardHost
              ref={previewRef}
              template={template}
              texture={texture}>
              <Ionicons
                name="sparkles-outline"
                size={28}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text style={[styles.eyebrow, {color: template.textColor}]}>
                {eyebrow ?? tt.eyebrow}
              </Text>

              {/* Emoji → standalone Text, never Ionicons (which would render
                  the missing-glyph "?", per the S80 lesson). */}
              <Text
                style={[styles.icon, {color: template.textColor}]}
                allowFontScaling={false}>
                {icon ?? '🙏'}
              </Text>

              <Text style={[styles.requestTitle, {color: template.textColor}]}>
                {title}
              </Text>
              <Text style={[styles.answeredLine, {color: template.textColor}]}>
                {answeredLine}
              </Text>

              {testimony ? (
                <Text style={[styles.testimony, {color: template.textColor}]}>
                  “{testimony}”
                </Text>
              ) : null}

              <View style={styles.brand}>
                <View
                  style={[
                    styles.brandDivider,
                    {backgroundColor: template.textColor},
                  ]}
                />
                <Text style={[styles.brandText, {color: template.textColor}]}>
                  Eternal Stone Bible
                </Text>
              </View>
            </ShareCardHost>
          </View>

          <PremiumShareExtras
            templates={templates}
            templateIndex={templateIndex}
            onSelectTemplate={setTemplateIndex}
            texture={texture}
            onSelectTexture={setTexture}
            isPremium={isPremium}
            onLockedAction={openOfferingSheet}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default TestimonyImageModal;

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scrollContent: {paddingBottom: spacing['4xl']},
  disabled: {opacity: 0.6},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    flexShrink: 1,
    marginHorizontal: spacing.md,
  },
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  eyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.85,
  },
  icon: {fontSize: 52, marginTop: spacing.sm},
  requestTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  answeredLine: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.85,
    marginTop: spacing.sm,
  },
  testimony: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: fontSizes.md * 1.5,
    opacity: 0.95,
    marginTop: spacing.md,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  brand: {marginTop: spacing.xl, alignItems: 'flex-start'},
  brandDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
});
