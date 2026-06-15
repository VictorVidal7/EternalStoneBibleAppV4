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

import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {FREE_TEMPLATES} from '@/features/share/imageTemplates';
import {type TimelineCardModel} from '@/features/reading-insights/timelineCard';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

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
  const toast = useToast();
  const tl = t.readingInsights.timeline;

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts the host LinearGradient instance ref directly.
  const previewRef = useRef<LinearGradient>(null);
  const template = FREE_TEMPLATES[templateIndex];

  async function handleShare() {
    if (isSharing || !previewRef.current) return;
    try {
      setIsSharing(true);
      haptics.press();

      const uri = await captureRef(previewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        toast.error(t.verse.imageShareError);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t.share,
        UTI: 'public.png',
      });

      toast.success(t.verse.imageReady);
      onClose();
    } catch (error) {
      logger.error('Error sharing timeline image', error as Error, {
        component: 'TimelineImageModal',
        action: 'handleShare',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setIsSharing(false);
    }
  }

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
            <LinearGradient
              colors={template.colors}
              style={styles.card}
              ref={previewRef}
              collapsable={false}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
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
            </LinearGradient>
          </View>

          <View style={styles.options}>
            <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
              {t.verse.imageStyle}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FREE_TEMPLATES.map((tpl, index) => {
                const selected = index === templateIndex;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    onPress={() => {
                      haptics.tap();
                      setTemplateIndex(index);
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
                    <LinearGradient
                      colors={tpl.colors}
                      style={styles.swatchGradient}>
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
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
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
