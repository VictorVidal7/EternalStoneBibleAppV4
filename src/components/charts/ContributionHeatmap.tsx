/**
 * 🟩 CONTRIBUTION HEATMAP
 *
 * A GitHub-contributions-style activity grid built from flex Views — no
 * charting library, no SVG, no width measuring. Columns are weeks (top =
 * Sunday), each cell a square tinted by its intensity level; `aspectRatio:
 * 1` plus `flex: 1` columns make the whole grid reflow to any container
 * width, the same dependency-free philosophy as `MiniBarChart`.
 *
 * The caller supplies the already-bucketed cells (from
 * `reviewHeatmap` in `history.ts`) and a 5-entry color ramp indexed by
 * level 0…4, so the primitive stays theme-agnostic and reusable.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import type {HeatmapCell} from '@lib/memory/history';

interface ContributionHeatmapProps {
  /** Contiguous days, oldest first, Sunday-aligned (length need not be ÷7). */
  cells: HeatmapCell[];
  /** Five colors indexed by level: [empty, l1, l2, l3, l4]. */
  levelColors: readonly string[];
  /** Gap in dp between cells and columns. */
  gap?: number;
  /**
   * One-sentence summary for screen readers (e.g. "Reading activity: 1422
   * verses, 3 active days" via `buildHeatmapA11yLabel`). When provided, the
   * grid announces as a single labelled `image`; when omitted, the grid is
   * treated as DECORATIVE (hidden from the screen reader) so it never becomes
   * an empty "image" focus stop next to a labelled wrapper.
   */
  accessibilityLabel?: string;
}

const DAYS_PER_WEEK = 7;

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  cells,
  levelColors,
  gap = 3,
  accessibilityLabel,
}) => {
  // Chunk the contiguous days into week columns of up to 7 (the final
  // column — this week — may be short; trailing slots render transparent
  // so every column keeps the same height).
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    weeks.push(cells.slice(i, i + DAYS_PER_WEEK));
  }

  const a11y = accessibilityLabel
    ? ({accessibilityRole: 'image', accessibilityLabel} as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      } as const);

  return (
    <View style={[styles.row, {gap}]} {...a11y}>
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.col, {gap}]}>
          {Array.from({length: DAYS_PER_WEEK}, (_, di) => {
            const cell = week[di];
            const color = cell
              ? (levelColors[cell.level] ?? levelColors[0])
              : 'transparent';
            return (
              <View key={di} style={[styles.cell, {backgroundColor: color}]} />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    flexDirection: 'column',
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 2,
  },
});

export default ContributionHeatmap;
