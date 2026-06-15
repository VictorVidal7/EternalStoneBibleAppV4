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
import {ConstancyRingsGraphic, HABIT_ICONS} from '@components/ConstancyRings';
import {
  HABIT_ORDER,
  type ConstancySummary,
  type HabitKey,
} from '@lib/home/constancyRings';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

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
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts any host ref; LinearGradient's generated ref type does
  // not match useRef<View>, so we widen (as in the sibling share modals).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewRef = useRef<any>(null);
  const template = FREE_TEMPLATES[templateIndex];

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
      logger.error('Error sharing constancy image', error as Error, {
        component: 'ConstancyImageModal',
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
            <LinearGradient
              colors={template.colors}
              style={styles.card}
              ref={previewRef}
              collapsable={false}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
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
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
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
