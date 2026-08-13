/**
 * 🔵 ConstancyRings — the Apple-Watch-style "Tu constancia hoy" rings (S85).
 *
 * Four concentric arcs that close as today's reading, memorization, devotion
 * and emotional check-in are completed. The pure geometry + colors + summary
 * live in [[constancyRings]]; this view only renders them, so it is
 * render-testable and reusable: the share image (S85 T4) re-uses the same
 * {@link ConstancyRingsGraphic} over a gradient.
 *
 * The graphic defaults to STATIC (no animation) so it still captures cleanly
 * into the share image and renders identically in tests — [[ConstancyImageModal]]
 * never passes `animated`, `pulseRingKey`, or `pulseAnim`. The interactive Home
 * card below (`ConstancyRings`) opts into two independent motion layers on top
 * of that static baseline:
 *   - `animated` eases each ring's `strokeDashoffset` toward its new fraction
 *     instead of snapping, so a habit finishing today (streak review, last
 *     verse, devotion, mood check-in) visibly "closes" the ring rather than
 *     jump-cutting to the closed state. Mirrors [[SVGCircularProgress]]'s
 *     existing RN-`Animated` strokeDashoffset tween — the established pattern
 *     for this exact widget in this codebase.
 *   - `pulseRingKey`/`pulseAnim` drive a ONE-TIME scale "pop" on a single
 *     named ring (reading, today) the moment it transitions to done — see
 *     `pulseReadingToken` on `ConstancyRings` below for the trigger.
 * Both layers are gated behind [[useReducedMotion]] so the tweens are skipped
 * entirely when the OS/app asks for reduced motion.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useReducedMotion} from '@hooks/useReducedMotion';
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
  animation,
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

// Animated Circle component (RN `Animated`, not Reanimated — matches the
// existing SVGCircularProgress/ProgressCircle convention for this widget).
// Used both for the ring-closing `strokeDashoffset` tween (`AnimatedRingArc`
// below) and the one-time "goal just completed" `scale` pulse (`pulseRingKey`/
// `pulseAnim` on `GraphicProps`). Cast to `any` — same as
// SVGCircularProgress.tsx/ProgressCircle.tsx in this codebase: react-native-
// svg's typings don't accept Animated props (scale, strokeDashoffset, …)
// even though they work at runtime.
const AnimatedCircle: any = Animated.createAnimatedComponent(Circle);

/** Ring-closing tween duration — a deliberate ease, not an instant snap. */
const RING_CLOSE_DURATION_MS = animation.duration.slow;

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

interface AnimatedRingArcProps {
  center: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  color: string;
  /** Target fraction, already clamped (see {@link displayFraction}), 0..1. */
  fraction: number;
  /** When set, this arc also carries the one-time "goal just completed"
   *  scale pulse (see `pulseRingKey`/`pulseAnim` on `GraphicProps`) on top
   *  of its own closing tween. */
  pulseAnim?: Animated.Value;
}

/**
 * The animated version of a single ring's progress arc — Home only (see the
 * class doc above). Starts already AT its current fraction so there is no
 * entrance animation on first mount (matching the other high-visibility
 * motion sites [[useReducedMotion]] lists); only SUBSEQUENT changes — a
 * review completed, a chapter finished, coming back from another screen —
 * ease the stroke toward the new value, which is what reads as the ring
 * visibly "closing" its last open segment instead of snapping shut.
 */
const AnimatedRingArc: React.FC<AnimatedRingArcProps> = ({
  center,
  radius,
  strokeWidth,
  circumference,
  color,
  fraction,
  pulseAnim,
}) => {
  const reduced = useReducedMotion();
  const animatedFraction = useRef(new Animated.Value(fraction)).current;

  useEffect(() => {
    if (reduced) {
      // Reduced motion: land on the final state instantly, no tween.
      animatedFraction.setValue(fraction);
      return;
    }
    Animated.timing(animatedFraction, {
      toValue: fraction,
      duration: RING_CLOSE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      // `strokeDashoffset` is an SVG shape prop, not transform/opacity, so it
      // can't ride the native driver (react-native-svg patches it on the JS
      // thread either way). Four small rings tweening only on a data change
      // — not continuously — so the JS-thread cost here is negligible.
      useNativeDriver: false,
    }).start();
  }, [fraction, reduced, animatedFraction]);

  const strokeDashoffset = animatedFraction.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedCircle
      cx={center}
      cy={center}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={circumference}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      rotation="-90"
      origin={`${center}, ${center}`}
      {...(pulseAnim ? {scale: pulseAnim} : null)}
    />
  );
};

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
  /**
   * When set ALONGSIDE `pulseAnim`, this one ring's track+arc scale-animate
   * about the shared center instead of rendering as static `Circle`s — the
   * one-time "goal just completed today" pulse. Every other caller (the
   * share image, unit tests) never passes this, so their render stays
   * byte-identical to before — this component is otherwise still the same
   * static, deterministic graphic its docstring promises.
   */
  pulseRingKey?: HabitKey;
  /** The driving Animated.Value for `pulseRingKey`, resting at 1. */
  pulseAnim?: Animated.Value;
  /** Center overlay (a number, a check…). */
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Ease fraction changes instead of snapping (the ring "closing" motion).
   *  Home opts in; [[ConstancyImageModal]] deliberately does NOT, so the
   *  share-image capture and the render tests stay static/deterministic. */
  animated?: boolean;
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
  pulseRingKey,
  pulseAnim,
  children,
  style,
  animated = false,
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
          // Only the ring named by `pulseRingKey` (reading, today) ever
          // swaps to the Animated variant — every other ring, and every
          // caller that never sets these two props, keeps the plain static
          // `Circle` it always rendered.
          const TrackCircle =
            pulseRingKey === ring.key && pulseAnim ? AnimatedCircle : Circle;
          const ArcCircle = TrackCircle;
          const pulseOnly =
            pulseRingKey === ring.key && pulseAnim
              ? {scale: pulseAnim, origin: `${center}, ${center}`}
              : null;
          return (
            <React.Fragment key={ring.key}>
              <TrackCircle
                cx={center}
                cy={center}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
                {...pulseOnly}
              />
              {animated ? (
                <AnimatedRingArc
                  center={center}
                  radius={radius}
                  strokeWidth={strokeWidth}
                  circumference={circumference}
                  color={color}
                  fraction={displayFraction(ring)}
                  pulseAnim={pulseOnly ? pulseAnim : undefined}
                />
              ) : (
                <ArcCircle
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
                  {...(pulseOnly ? {scale: pulseAnim} : null)}
                />
              )}
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
  /**
   * Increments exactly once per real "reading goal just completed today"
   * transition — owned/derived by [[ConstancyRingsCard]] (it stays mounted
   * across the honest gate, unlike this presentational component). A change
   * in this number is the ONLY thing that fires the pulse; its starting
   * value (including on first mount) never does. "Make the app feel alive"
   * backlog item — reading-only scope, see the file-level note below.
   */
  pulseReadingToken?: number;
}

/**
 * The Home card BODY (rings + legend). Router-free and store-free — the owner
 * (S85 T2) passes the already-derived `summary`; T26 added per-row navigation
 * (`onHabitPress`) alongside the original whole-graphic `onPress`.
 *
 * `pulseReadingToken` drives a ONE-TIME, non-repeating pulse + haptic on the
 * reading ring the moment it closes for the day (not on every re-render where
 * it's already closed, e.g. reopening the app later today) — scoped to
 * reading only, the most central habit here, rather than all four rings, to
 * keep this a single small moment rather than four competing ones. The haptic
 * always fires; the visual scale pulse is skipped under reduced motion,
 * mirroring the exact distinction AchievementUnlockedModal already draws
 * (haptics aren't a motion-sickness concern the way visual animation is).
 */
export const ConstancyRings: React.FC<ConstancyRingsProps> = ({
  summary,
  onShare,
  onPress,
  onHabitPress,
  pulseReadingToken,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const reducedMotion = useReducedMotion();
  const tc = t.constancy;
  const trackColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  // The pulse itself — a brief scale up-and-back on the reading ring only
  // (deliberately NOT the rotation-wiggle half of `celebrationAnimation` in
  // reanimatedAnimations.ts, which was explicitly rejected as too playful for
  // this app's tone). `prevPulseTokenRef` starts `undefined` so the effect
  // only reacts to a CHANGE in the token, never its initial value — that's
  // what keeps "reopen the app after already completing today" silent even
  // though the token is already > 0 the moment this component first mounts.
  const readingPulseScale = useRef(new Animated.Value(1)).current;
  const prevPulseTokenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const token = pulseReadingToken ?? 0;
    const prevToken = prevPulseTokenRef.current;
    prevPulseTokenRef.current = token;
    if (prevToken === undefined || token === prevToken) return;

    haptics.success();
    if (reducedMotion) return;

    readingPulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(readingPulseScale, {
        toValue: 1.16,
        duration: 220,
        easing: Easing.out(Easing.quad),
        // SVG `scale` isn't a native-driver prop (unlike `strokeDashoffset`
        // in this file's sibling components) — JS-driven is correct here,
        // and cheap enough for a single ~480ms one-shot.
        useNativeDriver: false,
      }),
      Animated.timing(readingPulseScale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [pulseReadingToken, reducedMotion, readingPulseScale]);

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
          <ConstancyRingsGraphic
            rings={summary.rings}
            trackColor={trackColor}
            animated
            pulseRingKey="reading"
            pulseAnim={readingPulseScale}>
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
    ...StyleSheet.absoluteFill,
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
