/**
 * 🧵 SHARE TEXTURE OVERLAY (T8.2, offering-unlocked)
 *
 * Renders one of `textures.ts`'s subtle SVG pattern fills, absolutely
 * positioned over the share-image card. `pointerEvents="none"` so it never
 * intercepts taps meant for the card underneath. Renders nothing for
 * `'none'` (the default — no visual change for anyone who hasn't picked a
 * texture, free or premium).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, Line, Pattern, Rect} from 'react-native-svg';
import type {ShareTexture} from '@/features/share/textures';

interface Props {
  texture: ShareTexture;
  /** Tint for the pattern strokes/dots — normally the template's own textColor. */
  color: string;
}

const TILE = 24;

export const ShareTextureOverlay: React.FC<Props> = ({texture, color}) => {
  if (texture === 'none') return null;

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      width="100%"
      height="100%">
      <Pattern
        id="shareTexture"
        patternUnits="userSpaceOnUse"
        width={TILE}
        height={TILE}>
        {texture === 'dots' && (
          <Circle
            cx={TILE / 2}
            cy={TILE / 2}
            r={1.4}
            fill={color}
            opacity={0.16}
          />
        )}
        {texture === 'lines' && (
          <Line
            x1={0}
            y1={TILE}
            x2={TILE}
            y2={0}
            stroke={color}
            strokeWidth={1}
            opacity={0.12}
          />
        )}
        {texture === 'grain' && (
          <>
            <Circle cx={4} cy={5} r={0.8} fill={color} opacity={0.14} />
            <Circle cx={15} cy={3} r={1.1} fill={color} opacity={0.1} />
            <Circle cx={9} cy={12} r={0.7} fill={color} opacity={0.18} />
            <Circle cx={20} cy={16} r={1} fill={color} opacity={0.12} />
            <Circle cx={2} cy={19} r={0.9} fill={color} opacity={0.15} />
            <Circle cx={17} cy={21} r={0.6} fill={color} opacity={0.1} />
          </>
        )}
      </Pattern>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#shareTexture)" />
    </Svg>
  );
};

export default ShareTextureOverlay;
