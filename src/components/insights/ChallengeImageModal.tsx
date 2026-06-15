/**
 * 🏆 ChallengeImageModal — share "Mi reto de la semana" as an image (S86 T2).
 *
 * Composes the pure {@link WeeklyChallenge} into a gradient template card
 * (mastered count + target + practice streak) through the S56/77 captureRef →
 * expo-sharing pipeline + the FREE imageTemplates catalog, mirroring
 * ConstancyImageModal / WeeklyRecapModal. Nothing re-computes: the owner passes
 * the already-derived challenge. Monochrome over the gradient so it reads on any
 * template.
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
import type {WeeklyChallenge} from '@lib/memory/weeklyChallenge';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface ChallengeImageModalProps {
  visible: boolean;
  challenge: WeeklyChallenge;
  onClose: () => void;
}

export const ChallengeImageModal: React.FC<ChallengeImageModalProps> = ({
  visible,
  challenge,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tw = t.weeklyChallenge;
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts the host LinearGradient instance ref directly.
  const previewRef = useRef<LinearGradient>(null);
  const template = FREE_TEMPLATES[templateIndex];

  const masteredLine =
    challenge.mastered === 1
      ? tw.shareMasteredOne
      : tw.shareMastered.replace('{{n}}', String(challenge.mastered));
  const targetLine = tw.shareTarget.replace('{{n}}', String(challenge.target));
  const practiceLine =
    challenge.practiceStreak === 1
      ? tw.sharePracticeOne
      : tw.sharePractice.replace('{{n}}', String(challenge.practiceStreak));

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
      logger.error('Error sharing challenge image', error as Error, {
        component: 'ChallengeImageModal',
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
            {tw.shareTitle}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={tw.shareTitle}
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
              <Text
                style={[styles.cardTitle, {color: template.textColor}]}
                numberOfLines={1}>
                {tw.shareCardTitle}
              </Text>

              <Text style={[styles.hero, {color: template.textColor}]}>
                {challenge.mastered}
              </Text>
              <Text style={[styles.heroLabel, {color: template.textColor}]}>
                {masteredLine}
              </Text>

              <View style={styles.statRow}>
                <Ionicons
                  name="flag"
                  size={16}
                  color={template.textColor}
                  style={styles.statIcon}
                />
                <Text style={[styles.statText, {color: template.textColor}]}>
                  {targetLine}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons
                  name="flame"
                  size={16}
                  color={template.textColor}
                  style={styles.statIcon}
                />
                <Text style={[styles.statText, {color: template.textColor}]}>
                  {practiceLine}
                </Text>
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

export default ChallengeImageModal;

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
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
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
    marginBottom: spacing.md,
  },
  statRow: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm},
  statIcon: {marginRight: spacing.sm, opacity: 0.9},
  statText: {fontSize: fontSizes.md, fontWeight: '600', flexShrink: 1},
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
