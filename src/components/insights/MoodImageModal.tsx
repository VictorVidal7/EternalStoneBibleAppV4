/**
 * 💛 MoodImageModal — share "My emotional month" as a designer image
 * (Sprint 84).
 *
 * The shareable counterpart to the Mi-lectura mood cards: ONE gradient card
 * that COMPOSES the two pure summaries the screen already computes — the
 * rolling 30-day "Tu mes emocional" ({@link MoodMonthSummary}) and the
 * month-vs-month "Tu tendencia emocional" ({@link MoodTrendSummary}) — into a
 * dominant-feeling hero, a distribution strip, and (when both windows carry a
 * check-in) the gentle trend line. Reuses the Sprint 56/77 view-shot pipeline
 * (`captureRef` → `expo-sharing`, `collapsable={false}`) and the FREE
 * imageTemplates catalog, mirroring WeeklyRecapModal / NoteImageModal.
 *
 * Nothing here re-computes data: the summaries arrive ready, and — like the
 * feelings log itself — this view is DEVICE-LOCAL and never touches Firestore.
 * The card stays monochrome over the gradient (template.textColor at varied
 * opacity) so it reads cleanly on ANY template, exactly like the weekly recap.
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
import {getFeeling} from '@/features/study/feelings';
import type {
  MoodMonthSummary,
  MoodTrendSummary,
} from '@/features/study/feelingsLog';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface MoodImageModalProps {
  visible: boolean;
  /** The rolling-30-day summary — the card's backbone (always shown). */
  month: MoodMonthSummary;
  /** The month-vs-month trend; its line shows only when hasComparison. */
  trend: MoodTrendSummary | null;
  onClose: () => void;
}

export const MoodImageModal: React.FC<MoodImageModalProps> = ({
  visible,
  month,
  trend,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const ri = t.readingInsights;
  const feelingNames = t.feelings.list as Record<string, {name: string}>;
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts the host LinearGradient instance ref directly.
  const previewRef = useRef<LinearGradient>(null);
  const template = FREE_TEMPLATES[templateIndex];

  const hasData = month.daysLogged > 0;
  const dominant = getFeeling(month.dominant);
  const dominantName = dominant
    ? (feelingNames[dominant.id]?.name ?? dominant.id)
    : '';
  const maxCount = month.counts[0]?.count ?? 1;
  const daysLine = ri.moodMonthDays
    .replace('{{n}}', String(month.daysLogged))
    .replace('{{total}}', String(month.windowDays));
  const subtitle = ri.moodCardSubtitle.replace(
    '{{total}}',
    String(month.windowDays),
  );

  const showTrend = !!trend && trend.hasComparison;
  const dir = trend?.direction ?? 'steady';
  const dirText =
    dir === 'lighter'
      ? ri.moodTrendLighter
      : dir === 'heavier'
        ? ri.moodTrendHeavier
        : ri.moodTrendSteady;
  const dirIcon =
    dir === 'lighter'
      ? 'trending-up'
      : dir === 'heavier'
        ? 'trending-down'
        : 'remove';
  // Up to two movers — the steepest swing each way — kept compact.
  const movers = trend
    ? [...trend.rising.slice(0, 1), ...trend.easing.slice(0, 1)]
    : [];

  async function handleShare() {
    if (isSharing || !previewRef.current || !hasData) return;
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
      logger.error('Error sharing mood image', error as Error, {
        component: 'MoodImageModal',
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
            {ri.moodShare}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || !hasData}
            style={isSharing || !hasData ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={ri.moodShare}
            accessibilityState={{disabled: isSharing || !hasData}}>
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
              <Text
                style={[styles.cardTitle, {color: template.textColor}]}
                numberOfLines={2}>
                {ri.moodCardTitle}
              </Text>
              <Text style={[styles.cardSubtitle, {color: template.textColor}]}>
                {subtitle}
              </Text>

              {/* Dominant-feeling hero — the month's defining state. The days
                  line sits on its OWN row below so the feeling name keeps the
                  full width and never truncates (e.g. "Grat…" — Sprint 98). */}
              {dominant ? (
                <View style={styles.hero}>
                  <View style={styles.heroRow}>
                    <View
                      style={[
                        styles.heroIcon,
                        {borderColor: template.textColor},
                      ]}>
                      <Ionicons
                        name={dominant.icon as keyof typeof Ionicons.glyphMap}
                        size={28}
                        color={template.textColor}
                      />
                    </View>
                    <View style={styles.heroText}>
                      <Text
                        style={[styles.heroLabel, {color: template.textColor}]}>
                        {ri.moodMonthDominant}
                      </Text>
                      <Text
                        style={[styles.heroName, {color: template.textColor}]}
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}>
                        {dominantName}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.heroDays, {color: template.textColor}]}>
                    {daysLine}
                  </Text>
                </View>
              ) : null}

              {/* Distribution — top feelings, monochrome bars by relative count. */}
              <View style={styles.bars}>
                {month.counts.slice(0, 5).map(c => {
                  const f = getFeeling(c.feelingId);
                  if (!f) return null;
                  const pct = Math.max(0.06, c.count / maxCount);
                  return (
                    <View key={c.feelingId} style={styles.barRow}>
                      <Text
                        numberOfLines={1}
                        style={[styles.barName, {color: template.textColor}]}>
                        {feelingNames[f.id]?.name ?? f.id}
                      </Text>
                      <View
                        style={[
                          styles.barTrack,
                          {backgroundColor: template.textColor},
                        ]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: template.textColor,
                              width: `${pct * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.barCount, {color: template.textColor}]}>
                        {c.count}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Gentle trend line — only when both windows carry a check-in. */}
              {showTrend ? (
                <View style={styles.trend}>
                  <View
                    style={[
                      styles.trendDivider,
                      {backgroundColor: template.textColor},
                    ]}
                  />
                  <View style={styles.trendRow}>
                    <Ionicons
                      name={dirIcon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={template.textColor}
                      style={styles.trendIcon}
                    />
                    <Text
                      style={[styles.trendText, {color: template.textColor}]}>
                      {dirText}
                    </Text>
                  </View>
                  {movers.length > 0 ? (
                    <View style={styles.moversRow}>
                      {movers.map(mv => {
                        const f = getFeeling(mv.feelingId);
                        if (!f) return null;
                        const up = mv.delta > 0;
                        const deltaText = (
                          up ? ri.moodTrendMoreDays : ri.moodTrendFewerDays
                        ).replace('{{n}}', String(Math.abs(mv.delta)));
                        return (
                          <Text
                            key={mv.feelingId}
                            style={[
                              styles.moverChip,
                              {
                                color: template.textColor,
                                borderColor: template.textColor,
                              },
                            ]}>
                            {(feelingNames[f.id]?.name ?? f.id) +
                              '  ' +
                              deltaText}
                          </Text>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
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
            </LinearGradient>
          </View>

          {!hasData && (
            <Text style={[styles.emptyHint, {color: colors.textSecondary}]}>
              {ri.moodShareEmpty}
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

export default MoodImageModal;

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
  cardTitle: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  cardSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.85,
    marginTop: spacing.xs,
  },
  hero: {marginTop: spacing.lg, marginBottom: spacing.sm},
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroText: {flex: 1},
  heroLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroName: {fontSize: fontSizes.xl, fontWeight: '800', marginTop: 2},
  heroDays: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: spacing.sm,
  },
  bars: {marginTop: spacing.md, gap: spacing.sm},
  barRow: {flexDirection: 'row', alignItems: 'center'},
  barName: {
    width: 96,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.95,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    opacity: 0.25,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  barFill: {height: '100%', borderRadius: 4, opacity: 1},
  barCount: {
    width: 22,
    textAlign: 'right',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    opacity: 0.9,
  },
  trend: {marginTop: spacing.lg},
  trendDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.md,
    opacity: 0.3,
  },
  trendRow: {flexDirection: 'row', alignItems: 'center'},
  trendIcon: {marginRight: spacing.sm, opacity: 0.95},
  trendText: {fontSize: fontSizes.md, fontWeight: '700', flexShrink: 1},
  moversRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  moverChip: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    opacity: 0.92,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
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
