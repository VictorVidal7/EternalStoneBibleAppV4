/**
 * 📊 MINI BAR CHART
 *
 * A lightweight, dependency-free vertical bar chart built from flex
 * Views (no charting library, no SVG width-measuring) so it reflows
 * responsively to any container width. All colors are supplied by the
 * caller so the primitive stays theme-agnostic and reusable.
 *
 * Used by the Memory Insights screen for the box-distribution and
 * review-forecast charts. The mastery ring uses SVGCircularProgress
 * instead — arcs genuinely want SVG, grouped bars do not.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {AppText as Text} from '../ui/AppText';

export interface BarDatum {
  /** Short label rendered beneath the bar. */
  label: string;
  /** Bar magnitude (height is scaled relative to the tallest bar). */
  value: number;
  /** Optional per-bar fill, overriding the chart's default barColor. */
  color?: string;
}

interface MiniBarChartProps {
  data: BarDatum[];
  /** Drawing height of the bar track in dp; labels render below it. */
  height?: number;
  barColor: string;
  trackColor: string;
  labelColor: string;
  valueColor: string;
  /**
   * Makes each bar tappable (e.g. word-study's "filter appearances by
   * book" — Ficha #14). Omit to keep the chart purely decorative, as the
   * Memory Insights screen's box-distribution/review-forecast charts do.
   */
  onBarPress?: (index: number) => void;
  /** Index of the currently-selected bar, highlighted with a ring + bold label. */
  selectedIndex?: number | null;
}

// A non-zero bar never renders shorter than this fraction of the track,
// so a count of 1 next to a count of 30 is still visible.
const MIN_BAR_FRACTION = 0.06;

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  height = 120,
  barColor,
  trackColor,
  labelColor,
  valueColor,
  onBarPress,
  selectedIndex = null,
}) => {
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <View style={styles.container}>
      {data.map((d, i) => {
        const fraction =
          d.value <= 0 ? 0 : Math.max(MIN_BAR_FRACTION, d.value / max);
        const selected = selectedIndex === i;
        const Column = onBarPress ? TouchableOpacity : View;
        return (
          <Column
            key={`${d.label}-${i}`}
            style={styles.column}
            {...(onBarPress
              ? {
                  onPress: () => onBarPress(i),
                  accessibilityRole: 'button' as const,
                  accessibilityState: {selected},
                }
              : null)}>
            <Text
              scaleRole="compact"
              style={[styles.value, {color: valueColor}]}>
              {d.value}
            </Text>
            <View
              style={[
                styles.track,
                {height, backgroundColor: trackColor},
                selected && styles.trackSelected,
                selected && {borderColor: d.color ?? barColor},
              ]}>
              {d.value > 0 && (
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${fraction * 100}%`,
                      backgroundColor: d.color ?? barColor,
                    },
                  ]}
                />
              )}
            </View>
            <Text
              scaleRole="compact"
              style={[
                styles.label,
                {color: selected ? (d.color ?? barColor) : labelColor},
                selected && styles.labelSelected,
              ]}
              numberOfLines={1}>
              {d.label}
            </Text>
          </Column>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  track: {
    width: '70%',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  labelSelected: {
    fontWeight: '800',
  },
  trackSelected: {
    borderWidth: 2,
  },
});

export default MiniBarChart;
