/**
 * 🔵 ConstancyImageModal — share "Mi constancia" as a designer image (S85 T4).
 *
 * Composes the SAME {@link ConstancyRingsGraphic} the Home card shows over a
 * gradient template, plus a per-habit legend (streak / done today), through the
 * S56/77 captureRef → expo-sharing pipeline + the FREE imageTemplates catalog —
 * mirroring WeeklyRecapModal / MoodImageModal. Nothing re-computes: the owner
 * passes the already-derived {@link ConstancySummary}.
 *
 * The rings keep their semantic habit colors (they are the brand); the track,
 * text and legend take the template's foreground color so the card reads on any
 * gradient.
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
import {ConstancyRingsGraphic, HABIT_ICONS} from '@components/ConstancyRings';
import {
  HABIT_ORDER,
  type ConstancySummary,
  type HabitKey,
} from '@lib/home/constancyRings';
import {spacing, fontSize as fontSizes} from '@/styles/designTokens';

export interface ConstancyImageModalProps {
  visible: boolean;
  summary: ConstancySummary;
  onClose: () => void;
}

export const ConstancyImageModal: React.FC<ConstancyImageModalProps> = ({
  visible,
  summary,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tc = t.constancy;
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
    componentName: 'ConstancyImageModal',
    onShared: onClose,
  });

  const habitLabel: Record<HabitKey, string> = {
    reading: tc.habitReading,
    memory: tc.habitMemory,
    devotion: tc.habitDevotion,
    mood: tc.habitMood,
  };

  const statusFor = (key: HabitKey): string => {
    const ring = summary.rings.find(r => r.key === key);
    if (ring && ring.streak > 0) {
      return ring.streak === 1
        ? tc.shareStreakDay
        : tc.shareStreakDays.replace('{{n}}', String(ring.streak));
    }
    if (ring?.done) return tc.shareToday;
    return '·';
  };

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
            {tc.shareTitle}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={tc.shareTitle}
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
                name="ellipse-outline"
                size={28}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text
                style={[styles.cardTitle, {color: template.textColor}]}
                numberOfLines={1}>
                {tc.shareCardTitle}
              </Text>
              <Text style={[styles.cardSubtitle, {color: template.textColor}]}>
                {tc.shareCardSubtitle}
              </Text>

              <View style={styles.ringsRow}>
                <ConstancyRingsGraphic
                  rings={summary.rings}
                  size={132}
                  trackColor={template.textColor + '26'}>
                  <View style={styles.centerStack}>
                    <Text
                      style={[styles.centerCount, {color: template.textColor}]}>
                      {summary.closedCount}
                    </Text>
                    <Text
                      style={[styles.centerTotal, {color: template.textColor}]}>
                      {`/${summary.total}`}
                    </Text>
                  </View>
                </ConstancyRingsGraphic>

                <View style={styles.legend}>
                  {HABIT_ORDER.map(key => (
                    <View key={key} style={styles.legendRow}>
                      <Ionicons
                        name={HABIT_ICONS[key]}
                        size={14}
                        color={template.textColor}
                        style={styles.legendIcon}
                      />
                      <Text
                        style={[
                          styles.legendLabel,
                          {color: template.textColor},
                        ]}
                        numberOfLines={1}>
                        {habitLabel[key]}
                      </Text>
                      <Text
                        style={[
                          styles.legendStatus,
                          {color: template.textColor},
                        ]}>
                        {statusFor(key)}
                      </Text>
                    </View>
                  ))}
                </View>
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

export default ConstancyImageModal;

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
  cardSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.85,
    marginTop: spacing.xs,
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  centerStack: {flexDirection: 'row', alignItems: 'baseline'},
  centerCount: {fontSize: fontSizes['3xl'], fontWeight: '800'},
  centerTotal: {fontSize: fontSizes.base, fontWeight: '700', opacity: 0.85},
  legend: {flex: 1, gap: spacing.sm},
  legendRow: {flexDirection: 'row', alignItems: 'center'},
  legendIcon: {marginRight: spacing.sm, opacity: 0.95},
  legendLabel: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  legendStatus: {fontSize: fontSizes.sm, fontWeight: '700', opacity: 0.9},
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
