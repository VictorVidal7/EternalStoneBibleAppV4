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
import {View, StyleSheet, TouchableOpacity, type ViewStyle} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {
  HABIT_ORDER,
  HABIT_RING_COLORS,
  ringRadius,
  ringCircumference,
  ringDashoffset,
  displayFraction,
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
export const HABIT_ICONS: Record<HabitKey, keyof typeof Ionicons.glyphMap> = {
  reading: 'book',
  memory: 'sparkles',
  devotion: 'flame',
  mood: 'heart',
};

const RING_SIZE = 150;
const RING_STROKE = 12;
const RING_GAP = 5;
// Expands each legend row's touch target without growing its visual height
// (rows sit close together to keep the card compact) — matches the row-to-
// row gap below so adjacent hit areas meet without overlapping.
const LEGEND_ROW_HIT_SLOP = {top: 6, bottom: 6, left: 4, right: 4};

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
                strokeDashoffset={ringDashoffset(
                  circumference,
                  displayFraction(ring),
                )}
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
  /** When provided, a small share icon appears in the header (opens the
   *  share image). Optional so the card is usable without sharing. */
  onShare?: () => void;
  /** When provided, tapping the header or the rings graphic opens the
   *  detailed insights screen (T26 — moved off the whole card so each
   *  legend row below can carry its own destination instead). */
  onPress?: () => void;
  /** When provided, each legend row becomes its own button that navigates
   *  to that habit's own screen (T26 — reading/memory/devotion/mood). */
  onHabitPress?: (key: HabitKey) => void;
}

/**
 * The Home card BODY (rings + legend). Router-free and store-free — the owner
 * (S85 T2) passes the already-derived `summary`; T26 added per-row navigation
 * (`onHabitPress`) alongside the original whole-graphic `onPress`.
 */
export const ConstancyRings: React.FC<ConstancyRingsProps> = ({
  summary,
  onShare,
  onPress,
  onHabitPress,
}) => {
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

  // Tapping the header or the rings graphic opens insights (T26 — moved off
  // the whole card so each legend row below can carry its own destination).
  const handleInsightsPress = () => {
    if (!onPress) return;
    haptics.tap();
    onPress();
  };
  const insightsA11y = onPress
    ? {
        accessibilityRole: 'button' as const,
        accessibilityLabel: `${tc.title}: ${summaryLine}`,
        accessibilityHint: tc.cardHint,
      }
    : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <TouchableOpacity
        style={styles.header}
        disabled={!onPress}
        onPress={handleInsightsPress}
        {...insightsA11y}>
        <AppText
          scaleRole="compact"
          style={[styles.title, {color: colors.text}]}>
          {tc.title}
        </AppText>
        <View style={styles.headerRight}>
          <AppText
            scaleRole="compact"
            style={[styles.summary, {color: colors.primary}]}>
            {summaryLine}
          </AppText>
          {onShare && (
            <TouchableOpacity
              onPress={() => {
                haptics.tap();
                onShare();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={tc.share}>
              <Ionicons
                name="share-outline"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <TouchableOpacity
          disabled={!onPress}
          onPress={handleInsightsPress}
          // Not separately exposed to screen readers: the header right above
          // already announces the identical label/hint for this same action,
          // so an AT user isn't forced to hear it twice in a row. Sighted/
          // touch users can still tap the graphic directly.
          accessible={false}
          importantForAccessibility="no-hide-descendants">
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
        </TouchableOpacity>

        <View style={styles.legend}>
          {HABIT_ORDER.map(key => {
            const ring = summary.rings.find(r => r.key === key)!;
            const habitColor = HABIT_RING_COLORS[key];
            const markerBg = ring.done
              ? habitColor + '26'
              : staticColors.transparent;
            // "Empieza hoy" invitation (T26): only for a habit that has
            // NEVER been done, so it self-disables the moment the reader
            // engages it once — no new storage, precedent PrayerCard.isNew.
            const showInvitation = !ring.done && !ring.everDone;
            // Every row reads as label + one status line underneath (T26 —
            // was a cramped icon+number floating on the right before,
            // inconsistent with the invitation's own subtitle style).
            let statusIcon: keyof typeof Ionicons.glyphMap | null = null;
            let statusIconColor = habitColor;
            let statusText: string;
            let statusColor: string;
            if (ring.streak > 0) {
              statusIcon = 'flame';
              statusIconColor = HABIT_RING_COLORS.devotion;
              statusColor = colors.text;
              statusText =
                ring.streak === 1
                  ? tc.rowStreakOne
                  : tc.rowStreak.replace('{{n}}', String(ring.streak));
            } else if (ring.done) {
              statusIcon = 'checkmark-circle';
              statusColor = colors.text;
              statusText = tc.rowDoneToday;
            } else if (showInvitation) {
              statusColor = colors.primary;
              statusText = tc.rowInvitation;
            } else {
              statusColor = colors.textTertiary;
              statusText = tc.rowInactive;
            }
            return (
              <TouchableOpacity
                key={key}
                style={styles.legendRow}
                disabled={!onHabitPress}
                onPress={() => {
                  if (!onHabitPress) return;
                  haptics.tap();
                  onHabitPress(key);
                }}
                // Touch target is grown via hitSlop (not a taller row) so the
                // card stays compact — the gap between rows already leaves
                // room for this without overlapping a neighbor's hit area.
                hitSlop={LEGEND_ROW_HIT_SLOP}
                accessibilityRole={onHabitPress ? 'button' : undefined}
                // An explicit accessibilityLabel replaces (not appends to)
                // the auto-announced child text, so the status line — the
                // whole point of the "Empieza hoy" invitation — must be
                // included here explicitly or a screen-reader user never
                // hears it.
                accessibilityLabel={`${habitLabel[key]}: ${statusText}`}
                accessibilityHint={onHabitPress ? tc.rowHint : undefined}>
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
                <View style={styles.legendLabelStack}>
                  <AppText
                    scaleRole="compact"
                    numberOfLines={1}
                    style={[styles.legendLabel, {color: colors.text}]}>
                    {habitLabel[key]}
                  </AppText>
                  {/* One status line under the label — same treatment for
                      every habit (streak, done-today, never-done invitation,
                      or no-streak-yet), instead of a cramped icon+number
                      column competing for width on the right. */}
                  <View style={styles.legendSubtitleRow}>
                    {statusIcon && (
                      <Ionicons
                        name={statusIcon}
                        size={11}
                        color={statusIconColor}
                      />
                    )}
                    <AppText
                      scaleRole="compact"
                      numberOfLines={1}
                      style={[styles.legendInvitation, {color: statusColor}]}>
                      {statusText}
                    </AppText>
                  </View>
                </View>
                {onHabitPress && (
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textTertiary}
                    style={styles.legendChevron}
                  />
                )}
              </TouchableOpacity>
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
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabelStack: {flex: 1, gap: 1},
  legendLabel: {fontSize: fontSizes.sm, fontWeight: '600'},
  legendSubtitleRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  legendInvitation: {fontSize: fontSizes.xs, fontWeight: '700'},
  legendChevron: {marginLeft: 2},
  caption: {
    marginTop: spacing.md,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
