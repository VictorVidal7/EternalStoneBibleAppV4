/**
 * 🖼️ TimelineImageModal — share your recent milestones as a designer card.
 *
 * Sprint 81. The Sprint 56 view-shot pipeline (`captureRef` → `expo-sharing`,
 * `collapsable={false}` on Android) over the `imageTemplates` gradients —
 * the CollectionImageModal idiom, drawing the timeline's newest milestones
 * (pure [[timelineCard]] model) instead of verses.
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
import {PremiumShareExtras} from '@/features/share/PremiumShareExtras';
import {SHARE_TEMPLATES} from '@/features/share/imageTemplates';
import {type TimelineCardModel} from '@/features/reading-insights/timelineCard';
import {spacing, fontSize as fontSizes} from '@/styles/designTokens';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';

export interface TimelineImageModalProps {
  visible: boolean;
  /** The render-ready card (newest milestones), built by the screen. */
  card: TimelineCardModel;
  /** Card headline; defaults to the timeline title (recent-milestones share). */
  headline?: string;
  /**
   * Caption under the headline; defaults to "N milestones". A single-milestone
   * share (Sprint 83) passes the milestone's date instead of a "1 hito" count.
   */
  caption?: string;
  onClose: () => void;
}

export const TimelineImageModal: React.FC<TimelineImageModalProps> = ({
  visible,
  card,
  headline,
  caption,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tl = t.readingInsights.timeline;

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
    componentName: 'TimelineImageModal',
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
          <Text style={[styles.title, {color: colors.text}]}>
            {t.verse.shareAsImage}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={tl.shareImage}
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
                name="footsteps"
                size={30}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text
                style={[styles.cardName, {color: template.textColor}]}
                numberOfLines={2}>
                {headline ?? tl.title}
              </Text>
              <Text style={[styles.cardCount, {color: template.textColor}]}>
                {caption ??
                  tl.shareCount.replace('{{n}}', String(card.totalCount))}
              </Text>

              <View style={styles.cardMilestones}>
                {card.milestones.map((m, i) => (
                  <View key={`${m.title}-${i}`} style={styles.cardMilestone}>
                    <View
                      style={[
                        styles.cardGlyph,
                        {borderColor: template.textColor},
                      ]}>
                      <Ionicons
                        name={m.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={template.textColor}
                      />
                    </View>
                    <View style={styles.cardMilestoneBody}>
                      <Text
                        style={[
                          styles.cardMilestoneTitle,
                          {color: template.textColor},
                        ]}
                        numberOfLines={2}>
                        {m.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardMilestoneDate,
                          {color: template.textColor},
                        ]}
                        numberOfLines={1}>
                        {m.dateLabel}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

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

export default TimelineImageModal;

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  cardName: {fontSize: fontSizes['3xl'], fontWeight: '800'},
  cardCount: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.85,
    marginTop: 4,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardMilestones: {gap: spacing.md},
  cardMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardGlyph: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  cardMilestoneBody: {flex: 1},
  cardMilestoneTitle: {fontSize: fontSizes.base, fontWeight: '600'},
  cardMilestoneDate: {fontSize: fontSizes.xs, opacity: 0.8, marginTop: 1},
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
