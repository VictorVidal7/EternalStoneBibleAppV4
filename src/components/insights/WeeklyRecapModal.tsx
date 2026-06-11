/**
 * 📅 WeeklyRecapModal — share "My week in the Word" as a designer image
 * (Sprint 77).
 *
 * The honest 7-day counterpart to the lifetime "Tu camino" Wrapped: a
 * gradient card with the week's day strip (which days actually had reading /
 * listening), verses + time read, listening time + verses heard, and the
 * current streaks. Reuses the Sprint 56 view-shot pipeline (`captureRef` →
 * `expo-sharing`, `collapsable={false}`) and the FREE imageTemplates catalog,
 * mirroring NoteImageModal / CompareImageModal. The numbers come from the
 * pure [[weeklyRecap]] builder — nothing here re-computes data.
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
import type {WeeklyRecap} from '@/features/reading-insights/weeklyRecap';
import {formatReadingTime} from '@lib/utils/formatReadingTime';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface WeeklyRecapModalProps {
  visible: boolean;
  recap: WeeklyRecap;
  onClose: () => void;
}

export const WeeklyRecapModal: React.FC<WeeklyRecapModalProps> = ({
  visible,
  recap,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const ri = t.readingInsights;
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts a ref to any host component; LinearGradient's generated
  // ref type doesn't match useRef<View>, so we widen (as in ImageShareModal).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewRef = useRef<any>(null);
  const template = FREE_TEMPLATES[templateIndex];

  const timeLabels = {
    hour: ri.hourUnit,
    minute: ri.minuteUnit,
    lessThanMinute: ri.lessThanMinute,
  };

  const readingLine =
    ri.weekVersesRead.replace('{{n}}', String(recap.versesRead)) +
    (recap.readingSeconds > 0
      ? ` · ${formatReadingTime(recap.readingSeconds, timeLabels)}`
      : '');
  const listeningLine = ri.weekListeningLine
    .replace(
      '{{time}}',
      formatReadingTime(recap.listeningMs / 1000, timeLabels),
    )
    .replace('{{n}}', String(recap.versesHeard));
  const hasListening = recap.listeningMs > 0 || recap.versesHeard > 0;

  async function handleShare() {
    if (isSharing || !previewRef.current || !recap.hasActivity) return;
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
      logger.error('Error sharing weekly recap image', error as Error, {
        component: 'WeeklyRecapModal',
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
            {ri.weekShare}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || !recap.hasActivity}
            style={
              isSharing || !recap.hasActivity ? styles.disabled : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={ri.weekShare}
            accessibilityState={{disabled: isSharing || !recap.hasActivity}}>
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
                name={template.icon as keyof typeof Ionicons.glyphMap}
                size={30}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text
                style={[styles.cardTitle, {color: template.textColor}]}
                numberOfLines={2}>
                {ri.weekCardTitle}
              </Text>
              <Text style={[styles.cardSubtitle, {color: template.textColor}]}>
                {ri.weekCardSubtitle}
              </Text>

              {/* Day strip — oldest → today; filled = any activity. */}
              <View style={styles.dayStrip}>
                {recap.days.map(day => {
                  const active = day.read || day.listened;
                  return (
                    <View
                      key={day.date}
                      style={[
                        styles.dayDot,
                        {borderColor: template.textColor},
                        active && {backgroundColor: template.textColor},
                        !active && styles.dayDotInactive,
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.statRow}>
                <Ionicons
                  name="book"
                  size={16}
                  color={template.textColor}
                  style={styles.statIcon}
                />
                <Text style={[styles.statText, {color: template.textColor}]}>
                  {readingLine}
                </Text>
              </View>

              {hasListening && (
                <View style={styles.statRow}>
                  <Ionicons
                    name="headset"
                    size={16}
                    color={template.textColor}
                    style={styles.statIcon}
                  />
                  <Text style={[styles.statText, {color: template.textColor}]}>
                    {listeningLine}
                  </Text>
                </View>
              )}

              <View style={styles.statRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={template.textColor}
                  style={styles.statIcon}
                />
                <Text style={[styles.statText, {color: template.textColor}]}>
                  {ri.weekDaysActive.replace('{{n}}', String(recap.daysActive))}
                </Text>
              </View>

              {recap.readingStreak >= 2 && (
                <View style={styles.statRow}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color={template.textColor}
                    style={styles.statIcon}
                  />
                  <Text style={[styles.statText, {color: template.textColor}]}>
                    {ri.weekReadingStreak.replace(
                      '{{n}}',
                      String(recap.readingStreak),
                    )}
                  </Text>
                </View>
              )}

              {recap.listeningStreak >= 2 && (
                <View style={styles.statRow}>
                  <Ionicons
                    name="flame-outline"
                    size={16}
                    color={template.textColor}
                    style={styles.statIcon}
                  />
                  <Text style={[styles.statText, {color: template.textColor}]}>
                    {ri.weekListeningStreak.replace(
                      '{{n}}',
                      String(recap.listeningStreak),
                    )}
                  </Text>
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

          {!recap.hasActivity && (
            <Text style={[styles.emptyHint, {color: colors.textSecondary}]}>
              {ri.weekEmpty}
            </Text>
          )}

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

export default WeeklyRecapModal;

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
  dayStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  dayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  dayDotInactive: {opacity: 0.35},
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
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
  emptyHint: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
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
