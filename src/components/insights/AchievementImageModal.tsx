/**
 * 🏆 AchievementImageModal — share a single unlocked achievement or earned
 * title as an image (S92 T6).
 *
 * Until now the gamification surfaces were the ONLY ones without an image
 * share, while constancy rings, the weekly challenge, highlights, mood,
 * recaps, timeline milestones and verse art all had one. This composes a
 * generic "accomplishment" (icon + title + description + optional tier/points)
 * into a gradient template card through the same S56/77 captureRef →
 * expo-sharing pipeline + the FREE imageTemplates catalog, mirroring
 * ChallengeImageModal / ConstancyImageModal. The owner passes the already
 * localized item; nothing re-computes. Monochrome over the gradient so it
 * reads on any template. Reused by the Achievements tab (long-press an
 * unlocked card) and the Badges screen (share an equipped title).
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
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface ShareableAccomplishment {
  /** Emoji glyph (achievement/title icons are emoji, rendered as Text). */
  icon: string;
  title: string;
  description: string;
  /** Optional uppercase tier/rarity label, e.g. "EPIC". */
  tierLabel?: string;
  /** Optional points line. */
  points?: number;
}

export interface AchievementImageModalProps {
  visible: boolean;
  item: ShareableAccomplishment;
  /** Header + share-button label, e.g. "Share achievement" / "Share title". */
  headerTitle: string;
  /** Small card eyebrow, e.g. "Achievement unlocked" / "Title earned". */
  eyebrow: string;
  onClose: () => void;
}

export const AchievementImageModal: React.FC<AchievementImageModalProps> = ({
  visible,
  item,
  headerTitle,
  eyebrow,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();

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
      logger.error('Error sharing achievement image', error as Error, {
        component: 'AchievementImageModal',
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
          <Text style={[styles.title, {color: colors.text}]} numberOfLines={1}>
            {headerTitle}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={headerTitle}
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
                name="trophy-outline"
                size={30}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text style={[styles.eyebrow, {color: template.textColor}]}>
                {eyebrow}
              </Text>

              {/* Catalog icons are EMOJIS → standalone Text, never Ionicons
                  (which renders the missing-glyph "?"), per the S80 lesson. */}
              <Text
                style={[styles.icon, {color: template.textColor}]}
                allowFontScaling={false}>
                {item.icon}
              </Text>

              <Text style={[styles.name, {color: template.textColor}]}>
                {item.title}
              </Text>
              <Text style={[styles.description, {color: template.textColor}]}>
                {item.description}
              </Text>

              {(item.tierLabel || item.points != null) && (
                <View style={styles.metaRow}>
                  {item.tierLabel ? (
                    <View
                      style={[
                        styles.tierBadge,
                        {borderColor: template.textColor},
                      ]}>
                      <Text
                        style={[styles.tierText, {color: template.textColor}]}>
                        {item.tierLabel}
                      </Text>
                    </View>
                  ) : null}
                  {item.points != null ? (
                    <View style={styles.pointsRow}>
                      <Ionicons
                        name="star"
                        size={14}
                        color={template.textColor}
                        style={styles.pointsIcon}
                      />
                      <Text
                        style={[
                          styles.pointsText,
                          {color: template.textColor},
                        ]}>
                        {item.points} {t.achievements.pts}
                      </Text>
                    </View>
                  ) : null}
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

export default AchievementImageModal;

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
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  eyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
  icon: {fontSize: 56, marginTop: spacing.sm},
  name: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  tierBadge: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['0.5'],
    marginRight: spacing.md,
  },
  tierText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pointsRow: {flexDirection: 'row', alignItems: 'center'},
  pointsIcon: {marginRight: spacing.xs, opacity: 0.9},
  pointsText: {fontSize: fontSizes.sm, fontWeight: '700'},
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
