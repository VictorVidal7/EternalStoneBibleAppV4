/**
 * 🔵 ConstancyRings — the Apple-Watch-style "Tu constancia hoy" rings (S85).
 *
 * Four concentric arcs that close as today's reading, memorization, devotion
 * and emotional check-in are completed. The pure geometry + colors + summary
 * live in [[constancyRings]]; this view only renders them, so it is
 * render-testable and reusable: the share image (S85 T4) re-uses the same
 * {@link ConstancyRingsGraphic} over a gradient.
 *
 * The graphic is intentionally STATIC (no entrance animation) so it captures
 * cleanly into the share image and renders identically in tests.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet, type ViewStyle} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {
  HABIT_ORDER,
  HABIT_RING_COLORS,
  ringRadius,
  ringCircumference,
  ringDashoffset,
  type ConstancySummary,
  type HabitKey,
  type RingState,
} from '@lib/home/constancyRings';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

/** Ionicon per habit for the legend (the rings themselves are color-coded). */
const HABIT_ICONS: Record<HabitKey, keyof typeof Ionicons.glyphMap> = {
  reading: 'book',
  memory: 'sparkles',
  devotion: 'flame',
  mood: 'heart',
};

const RING_SIZE = 150;
const RING_STROKE = 12;
const RING_GAP = 5;

interface GraphicProps {
  rings: RingState[];
  /** Square px size of the graphic (default 150). */
  size?: number;
  strokeWidth?: number;
  gap?: number;
  /** Track (unfilled) color behind each arc. */
  trackColor: string;
  /** Optional override for the arc color (e.g. monochrome on a share card). */
  colorFor?: (key: HabitKey) => string;
  /** Center overlay (a number, a check…). */
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The pure concentric-arc graphic — no theme/language hooks, so it renders the
 * same in the Home card, in tests, and over the share gradient. Each ring gets
 * a faint full-circle track plus a progress arc starting at 12 o'clock.
 */
export const ConstancyRingsGraphic: React.FC<GraphicProps> = ({
  rings,
  size = RING_SIZE,
  strokeWidth = RING_STROKE,
  gap = RING_GAP,
  trackColor,
  colorFor,
  children,
  style,
}) => {
  const center = size / 2;
  return (
    <View style={[{width: size, height: size}, styles.graphic, style]}>
      <Svg width={size} height={size}>
        {rings.map((ring, index) => {
          const radius = ringRadius(index, size, strokeWidth, gap);
          const circumference = ringCircumference(radius);
          const color = colorFor
            ? colorFor(ring.key)
            : HABIT_RING_COLORS[ring.key];
          return (
            <React.Fragment key={ring.key}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={ringDashoffset(circumference, ring.fraction)}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      {children != null && <View style={styles.center}>{children}</View>}
    </View>
  );
};

interface ConstancyRingsProps {
  summary: ConstancySummary;
}

/**
 * The Home card BODY (rings + legend). Router-free and store-free — the owner
 * (S85 T2) passes the already-derived `summary` and wraps it in a pressable.
 */
export const ConstancyRings: React.FC<ConstancyRingsProps> = ({summary}) => {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const tc = t.constancy;
  const trackColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  const habitLabel: Record<HabitKey, string> = {
    reading: tc.habitReading,
    memory: tc.habitMemory,
    devotion: tc.habitDevotion,
    mood: tc.habitMood,
  };

  const caption = summary.allClosed ? tc.allClosed : tc.caption;
  const summaryLine = tc.summary
    .replace('{{closed}}', String(summary.closedCount))
    .replace('{{total}}', String(summary.total));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.header}>
        <AppText
          scaleRole="compact"
          style={[styles.title, {color: colors.text}]}>
          {tc.title}
        </AppText>
        <AppText
          scaleRole="compact"
          style={[styles.summary, {color: colors.primary}]}>
          {summaryLine}
        </AppText>
      </View>

      <View style={styles.body}>
        <ConstancyRingsGraphic rings={summary.rings} trackColor={trackColor}>
          {summary.allClosed ? (
            <Ionicons name="checkmark" size={34} color={colors.primary} />
          ) : (
            <View style={styles.centerStack}>
              <AppText style={[styles.centerCount, {color: colors.text}]}>
                {summary.closedCount}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.centerTotal, {color: colors.textSecondary}]}>
                {`/${summary.total}`}
              </AppText>
            </View>
          )}
        </ConstancyRingsGraphic>

        <View style={styles.legend}>
          {HABIT_ORDER.map(key => {
            const ring = summary.rings.find(r => r.key === key)!;
            const habitColor = HABIT_RING_COLORS[key];
            const markerBg = ring.done
              ? habitColor + '26'
              : staticColors.transparent;
            return (
              <View key={key} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendMarker,
                    {backgroundColor: markerBg, borderColor: habitColor},
                  ]}>
                  <Ionicons
                    name={HABIT_ICONS[key]}
                    size={12}
                    color={habitColor}
                  />
                </View>
                <AppText
                  scaleRole="compact"
                  numberOfLines={1}
                  style={[styles.legendLabel, {color: colors.text}]}>
                  {habitLabel[key]}
                </AppText>
                <View style={styles.legendStatus}>
                  {ring.streak > 0 ? (
                    <>
                      <Ionicons
                        name="flame"
                        size={12}
                        color={HABIT_RING_COLORS.devotion}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[styles.legendStreak, {color: colors.text}]}>
                        {String(ring.streak)}
                      </AppText>
                    </>
                  ) : ring.done ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={HABIT_RING_COLORS[key]}
                    />
                  ) : (
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.legendStreak,
                        {color: colors.textTertiary},
                      ]}>
                      ·
                    </AppText>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <AppText
        scaleRole="compact"
        style={[styles.caption, {color: colors.textSecondary}]}>
        {caption}
      </AppText>
    </View>
  );
};

export default ConstancyRings;

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summary: {fontSize: fontSizes.xs, fontWeight: '800'},
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  graphic: {alignItems: 'center', justifyContent: 'center'},
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {flexDirection: 'row', alignItems: 'baseline'},
  centerCount: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  centerTotal: {fontSize: fontSizes.sm, fontWeight: '700'},
  legend: {flex: 1, gap: spacing.sm},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  legendMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {flex: 1, fontSize: fontSizes.sm, fontWeight: '600'},
  legendStatus: {flexDirection: 'row', alignItems: 'center', gap: 2},
  legendStreak: {fontSize: fontSizes.sm, fontWeight: '700'},
  caption: {
    marginTop: spacing.md,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
