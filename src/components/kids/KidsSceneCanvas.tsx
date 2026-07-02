/**
 * 🖼️ KidsSceneCanvas — paints a kids story scene's $0 illustration.
 *
 * A "dumb" renderer over [[buildKidsScene]]'s pure layout: an SVG sky
 * gradient + ground band + decor primitives, with the scene's emoji actors
 * drawn as plain RN `<Text>` absolutely positioned on top — not
 * `<SvgText>`, whose emoji glyph support is inconsistent across platforms,
 * while RN `<Text>` renders emoji with the OS's own font. No binary image
 * assets.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useId, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  buildKidsScene,
  type KidsScenePrimitive,
} from '@/features/kids/kidsSceneArt';
import type {KidsSceneArt} from '@/features/kids/kidsStories';
import {borderRadius} from '@/styles/designTokens';

interface KidsSceneCanvasProps {
  art: KidsSceneArt;
  width: number;
  /** The scene's narration text, used as the canvas's accessible description. */
  accessibilityLabel: string;
}

/** SVG path for a semicircle arc over the top of (cx, cy) with radius r. */
function upperArcPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
}

function renderPrimitive(p: KidsScenePrimitive, key: number): React.ReactNode {
  switch (p.kind) {
    case 'circle':
      return (
        <Circle
          key={key}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.color}
          fillOpacity={p.opacity}
        />
      );
    case 'line':
      return (
        <Line
          key={key}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke={p.color}
          strokeWidth={p.strokeWidth}
          strokeOpacity={p.opacity}
          strokeLinecap="round"
        />
      );
    case 'arc':
      return (
        <Path
          key={key}
          d={upperArcPath(p.cx, p.cy, p.r)}
          stroke={p.color}
          strokeWidth={p.strokeWidth}
          strokeOpacity={p.opacity}
          fill="none"
        />
      );
  }
}

export const KidsSceneCanvas: React.FC<KidsSceneCanvasProps> = ({
  art,
  width,
  accessibilityLabel,
}) => {
  const gradientId = useId();
  const layout = useMemo(() => buildKidsScene(art, width), [art, width]);

  return (
    <View
      style={[styles.container, {width: layout.width, height: layout.height}]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Svg width={layout.width} height={layout.height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={layout.skyGradient[0]}
              stopOpacity={1}
            />
            <Stop
              offset="100%"
              stopColor={layout.skyGradient[1]}
              stopOpacity={1}
            />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          fill={`url(#${gradientId})`}
        />
        {layout.decor.map((p, i) => renderPrimitive(p, i))}
        {layout.ground && (
          <Rect
            x={0}
            y={layout.ground.y}
            width={layout.width}
            height={layout.ground.height}
            fill={layout.ground.color}
            fillOpacity={0.85}
          />
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {layout.actors.map((a, i) => (
          <Text
            key={i}
            importantForAccessibility="no"
            style={[
              styles.actor,
              {left: a.left, top: a.top, fontSize: a.fontSize},
            ]}>
            {a.emoji}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default KidsSceneCanvas;

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  actor: {position: 'absolute', textAlign: 'center'},
});
