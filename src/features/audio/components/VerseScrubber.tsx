/**
 * VerseScrubber Component (Sprint 50 — premium verse scrub)
 *
 * A draggable verse-position scrubber for the expanded audio player. The TTS
 * player tracks position by VERSE INDEX (no continuous time), so this is a
 * DISCRETE scrubber: the thumb snaps to a verse and dragging previews the
 * destination reference WITHOUT speaking — only releasing (or tapping the
 * track) commits via `onSeek(index)`. That single commit is what calls the
 * context's `goToVerse`, so the TTS engine is never thrashed mid-drag.
 *
 * Presentational: all playback state comes in via props; the math lives in the
 * pure `scrubMath` module. Gated behind premium by the caller.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  AccessibilityActionEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {clampIndex, indexToFraction, positionToIndex} from '../lib/scrubMath';

interface VerseScrubberProps {
  currentIndex: number;
  totalVerses: number;
  /** Localized reference for a verse index, e.g. "Genesis 1:8" (drag preview). */
  labelForIndex?: (index: number) => string;
  /** Fired exactly once on release / tap with the snapped target index. */
  onSeek: (index: number) => void;
}

const THUMB_SIZE = 16;

export const VerseScrubber: React.FC<VerseScrubberProps> = ({
  currentIndex,
  totalVerses,
  labelForIndex,
  onSeek,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();

  // UI-thread animation values.
  const trackWidth = useSharedValue(0);
  const committedFraction = useSharedValue(
    indexToFraction(currentIndex, totalVerses),
  );
  const dragX = useSharedValue(0);
  const dragging = useSharedValue(false);

  // JS-thread refs so the gesture's runOnJS callbacks always read fresh values
  // even though the gesture object is recreated each render.
  const widthRef = useRef(0);
  const totalRef = useRef(totalVerses);
  const currentRef = useRef(currentIndex);
  useEffect(() => {
    totalRef.current = totalVerses;
  }, [totalVerses]);
  useEffect(() => {
    currentRef.current = currentIndex;
  }, [currentIndex]);

  // The verse being previewed during a drag; null when idle.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Keep the resting thumb aligned with the external current verse when idle.
  useEffect(() => {
    if (!dragging.value) {
      committedFraction.value = withTiming(
        indexToFraction(currentIndex, totalVerses),
        {duration: 160},
      );
    }
  }, [currentIndex, totalVerses, committedFraction, dragging]);

  const onTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      widthRef.current = w;
      trackWidth.value = w;
    },
    [trackWidth],
  );

  const handlePreview = useCallback((x: number) => {
    setPreviewIndex(positionToIndex(x, widthRef.current, totalRef.current));
  }, []);

  const handleCommit = useCallback(
    (x: number) => {
      const idx = positionToIndex(x, widthRef.current, totalRef.current);
      setPreviewIndex(null);
      onSeek(idx);
    },
    [onSeek],
  );

  // Horizontal drag = scrub; a vertical drag yields to the player's swipe-down
  // collapse gesture. A tap jumps straight to the touched position.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-16, 16])
    .onStart(e => {
      dragging.value = true;
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      dragX.value = x;
      runOnJS(handlePreview)(x);
    })
    .onUpdate(e => {
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      dragX.value = x;
      runOnJS(handlePreview)(x);
    })
    .onEnd(e => {
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      dragging.value = false;
      runOnJS(handleCommit)(x);
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const tap = Gesture.Tap()
    .maxDistance(16)
    .onEnd((e, success) => {
      if (success) {
        const x = Math.max(0, Math.min(e.x, trackWidth.value));
        runOnJS(handleCommit)(x);
      }
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const fillStyle = useAnimatedStyle(() => {
    const x = dragging.value
      ? dragX.value
      : committedFraction.value * trackWidth.value;
    return {width: Math.max(0, x)};
  });

  const thumbStyle = useAnimatedStyle(() => {
    const x = dragging.value
      ? dragX.value
      : committedFraction.value * trackWidth.value;
    return {transform: [{translateX: x}]};
  });

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      const name = e.nativeEvent.actionName;
      if (name === 'increment') {
        onSeek(clampIndex(currentRef.current + 1, totalRef.current));
      } else if (name === 'decrement') {
        onSeek(clampIndex(currentRef.current - 1, totalRef.current));
      }
    },
    [onSeek],
  );

  const shownIndex = previewIndex ?? currentIndex;
  const previewLabel =
    previewIndex != null && labelForIndex
      ? labelForIndex(previewIndex)
      : t.audio.scrub.preview
          .replace('{{n}}', String(shownIndex + 1))
          .replace('{{total}}', String(totalVerses));

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={[styles.label, {color: colors.textSecondary}]}>
          {shownIndex + 1}
        </Text>
        <Text style={[styles.label, {color: colors.textSecondary}]}>
          {totalVerses}
        </Text>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          style={styles.touchBand}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t.audio.scrub.a11yLabel}
          accessibilityHint={t.audio.scrub.a11yHint}
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={onAccessibilityAction}
          accessibilityValue={{
            min: 1,
            max: Math.max(1, totalVerses),
            now: shownIndex + 1,
          }}>
          <View
            style={[styles.track, {backgroundColor: colors.border}]}
            onLayout={onTrackLayout}>
            <Animated.View
              style={[
                styles.fill,
                {backgroundColor: colors.primary},
                fillStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.thumb,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
                thumbStyle,
              ]}
            />
          </View>
        </View>
      </GestureDetector>

      <Text
        style={[
          styles.caption,
          {color: previewIndex != null ? colors.primary : colors.textTertiary},
        ]}
        numberOfLines={1}>
        {previewLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  touchBand: {
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -(THUMB_SIZE - 4) / 2,
    left: 0,
    marginLeft: -THUMB_SIZE / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default VerseScrubber;
