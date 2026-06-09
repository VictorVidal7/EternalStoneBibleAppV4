/**
 * AudioProgressBar Component
 *
 * Barra de progreso para el reproductor de audio
 * Muestra progreso del versiculo actual dentro del capitulo
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle, withSpring} from 'react-native-reanimated';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';

interface AudioProgressBarProps {
  currentIndex: number;
  totalVerses: number;
  showLabels?: boolean;
  mini?: boolean;
  animated?: boolean;
}

export const AudioProgressBar: React.FC<AudioProgressBarProps> = ({
  currentIndex,
  totalVerses,
  showLabels = true,
  mini = false,
  animated = true,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();

  const progress =
    totalVerses > 0 ? ((currentIndex + 1) / totalVerses) * 100 : 0;

  // Animated progress style
  const progressStyle = useAnimatedStyle(() => {
    const width = animated
      ? withSpring(progress, {damping: 20, stiffness: 90})
      : progress;

    return {
      width: `${width}%`,
    };
  }, [progress, animated]);

  // Animated indicator style
  const indicatorStyle = useAnimatedStyle(
    () => ({
      left: `${progress}%`,
    }),
    [progress],
  );

  if (mini) {
    return (
      <View style={styles.miniContainer}>
        <View style={[styles.miniTrack, {backgroundColor: colors.border}]}>
          <Animated.View
            style={[
              styles.miniFill,
              {backgroundColor: colors.primary},
              progressStyle,
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            {currentIndex + 1}
          </Text>
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            {totalVerses}
          </Text>
        </View>
      )}

      <View style={[styles.track, {backgroundColor: colors.border}]}>
        <Animated.View
          style={[
            styles.fill,
            {backgroundColor: colors.primary},
            progressStyle,
          ]}
        />
        {/* Progress indicator dot */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.primary,
              borderColor: colors.background,
            },
            indicatorStyle,
          ]}
        />
      </View>

      {showLabels && (
        <Text style={[styles.progressText, {color: colors.textTertiary}]}>
          {t.verse.verseProgress
            .replace('{{current}}', String(currentIndex + 1))
            .replace('{{total}}', String(totalVerses))}
        </Text>
      )}
    </View>
  );
};

// ==================== MINI PROGRESS (for collapsed player) ====================

interface MiniProgressDotsProps {
  currentIndex: number;
  totalVerses: number;
  maxDots?: number;
}

export const MiniProgressDots: React.FC<MiniProgressDotsProps> = ({
  currentIndex,
  totalVerses,
  maxDots = 5,
}) => {
  const {colors} = useTheme();

  // Calculate which dots to show
  const dotsToShow = Math.min(maxDots, totalVerses);
  const startIndex = Math.max(
    0,
    Math.min(
      currentIndex - Math.floor(dotsToShow / 2),
      totalVerses - dotsToShow,
    ),
  );

  return (
    <View style={styles.dotsContainer}>
      {Array.from({length: dotsToShow}).map((_, i) => {
        const verseIndex = startIndex + i;
        const isActive = verseIndex === currentIndex;
        const isPast = verseIndex < currentIndex;

        return (
          <View
            key={verseIndex}
            style={[
              styles.dot,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : isPast
                    ? colors.primaryLight
                    : colors.border,
                transform: [{scale: isActive ? 1.3 : 1}],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ============== MINI VERSE PROGRESS (collapsed player) ==============

interface MiniVerseProgressProps {
  currentIndex: number;
  totalVerses: number;
}

/**
 * Compact chapter-position indicator for the COLLAPSED floating player
 * (Sprint 72). Replaces the older 5-dot sliding window — which only ever showed
 * a moving 5-verse slice and read as ambiguous — with an at-a-glance thin
 * progress fill plus an exact "current / total" verse counter. Static width (no
 * reanimated) keeps it reduce-motion-safe and cheap to update per verse.
 */
export const MiniVerseProgress: React.FC<MiniVerseProgressProps> = ({
  currentIndex,
  totalVerses,
}) => {
  const {colors} = useTheme();
  const safeTotal = Math.max(totalVerses, 1);
  const current = Math.min(currentIndex + 1, safeTotal);
  const progress = (current / safeTotal) * 100;

  return (
    <View style={styles.verseProgressRow}>
      <View
        style={[styles.verseProgressTrack, {backgroundColor: colors.border}]}>
        <View
          style={[
            styles.verseProgressFill,
            {backgroundColor: colors.primary, width: `${progress}%`},
          ]}
        />
      </View>
      <Text
        style={[styles.verseProgressLabel, {color: colors.textTertiary}]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}>
        {current}/{totalVerses}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  indicator: {
    position: 'absolute',
    top: -4,
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  // Mini styles
  miniContainer: {
    width: '100%',
    height: 2,
  },
  miniTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 1,
  },
  // Dots styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Mini verse progress (collapsed player) — bar + "current/total" counter
  verseProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verseProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  verseProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  verseProgressLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default AudioProgressBar;
