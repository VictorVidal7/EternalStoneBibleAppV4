/**
 * 🎨 HighlightsImageModal — share "Mis versículos resaltados" as an image
 * (Sprint 86).
 *
 * Composes the pure {@link HighlightGalleryStats} (total + per-color counts)
 * into a gradient template card with a proportional color-distribution bar in
 * the actual highlight colors, through the S56/77 captureRef → expo-sharing
 * pipeline + the FREE imageTemplates catalog (mirrors ConstancyImageModal).
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
import {useShareImage} from '@/features/share/useShareImage';
import {ShareCardHost} from '@/features/share/ShareCardHost';
import {ShareStylePicker} from '@/features/share/ShareStylePicker';
import type {HighlightGalleryStats} from '@lib/highlights/highlightGallery';
import {spacing, fontSize as fontSizes} from '@/styles/designTokens';

export interface HighlightsImageModalProps {
  visible: boolean;
  stats: HighlightGalleryStats;
  onClose: () => void;
}

export const HighlightsImageModal: React.FC<HighlightsImageModalProps> = ({
  visible,
  stats,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const th = t.highlights;

  const {
    templateIndex,
    setTemplateIndex,
    template,
    templates,
    isSharing,
    previewRef,
    handleShare,
  } = useShareImage({
    componentName: 'HighlightsImageModal',
    canShare: () => stats.total > 0,
    onShared: onClose,
  });

  const countLine =
    stats.total === 1
      ? th.galleryShareCountOne
      : th.galleryShareCount.replace('{{n}}', String(stats.total));

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
          <Text style={[styles.title, {color: colors.text}]}>
            {th.galleryShareTitle}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || stats.total === 0}
            style={isSharing || stats.total === 0 ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={th.galleryShareTitle}
            accessibilityState={{disabled: isSharing || stats.total === 0}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <ShareCardHost ref={previewRef} template={template}>
              <Ionicons
                name="color-palette"
                size={30}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text
                style={[styles.cardTitle, {color: template.textColor}]}
                numberOfLines={2}>
                {th.galleryShareCardTitle}
              </Text>

              <Text style={[styles.hero, {color: template.textColor}]}>
                {stats.total}
              </Text>
              <Text style={[styles.heroLabel, {color: template.textColor}]}>
                {countLine}
              </Text>

              {/* Proportional color-distribution bar (real highlight colors). */}
              {stats.total > 0 && (
                <View style={styles.distBar}>
                  {stats.byColor.map(c => (
                    <View
                      key={c.color}
                      style={{flex: c.count, backgroundColor: c.color}}
                    />
                  ))}
                </View>
              )}

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

          <ShareStylePicker
            templates={templates}
            selectedIndex={templateIndex}
            onSelect={setTemplateIndex}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default HighlightsImageModal;

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
  title: {fontSize: fontSizes.lg, fontWeight: '700'},
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  cardTitle: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  hero: {
    fontSize: 64,
    fontWeight: '800',
    marginTop: spacing.md,
    lineHeight: 68,
  },
  heroLabel: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  distBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
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
