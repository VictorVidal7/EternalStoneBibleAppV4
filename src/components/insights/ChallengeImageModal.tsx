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
import type {WeeklyChallenge} from '@lib/memory/weeklyChallenge';
import {spacing, fontSize as fontSizes} from '@/styles/designTokens';

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

  const {
    templateIndex,
    setTemplateIndex,
    template,
    templates,
    isSharing,
    previewRef,
    handleShare,
  } = useShareImage({componentName: 'ChallengeImageModal', onShared: onClose});

  const masteredLine =
    challenge.mastered === 1
      ? tw.shareMasteredOne
      : tw.shareMastered.replace('{{n}}', String(challenge.mastered));
  const targetLine = tw.shareTarget.replace('{{n}}', String(challenge.target));
  const practiceLine =
    challenge.practiceStreak === 1
      ? tw.sharePracticeOne
      : tw.sharePractice.replace('{{n}}', String(challenge.practiceStreak));

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
            <ShareCardHost ref={previewRef} template={template}>
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
});
