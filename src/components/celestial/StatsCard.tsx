/**
 * 📊 STATS CARD - Tarjeta de Estadísticas
 *
 * Componente de estadística individual para el Hero/Welcome section
 * Incluye ícono, valor y label con animación pulse opcional
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {ComponentProps} from 'react';
import {AppText} from '@components/ui/AppText';
import {CountUpText} from '@components/ui/CountUpText';
import {useReducedMotion} from '@hooks/useReducedMotion';
import {
  contrastRatio,
  parseHexColor,
  relativeLuminance,
} from '../../lib/a11y/contrast';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/** R9-456 — the veil's opacity: the lowest that reads ≥ 4.5:1 everywhere. */
const HERO_VEIL_ALPHA = 0.4;

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/**
 * R9-456 — the colors of the stats row over a gradient (Home's hero).
 * The row was a fixed white over a white glass, and on the light end of six
 * morning gradients the numbers fell under 3:1. Now the row lies on a veil of
 * the darker of the theme's two inks (`text` and `background`), and its ink
 * is, of those two, the one whose worst contrast over the veiled stops is
 * highest (the criterion of R9-454's toast). `null` when a color is not
 * `#RGB`/`#RRGGBB`: the caller keeps its own look.
 */
export function heroStatsColors(
  stops: readonly string[],
  inkA: string,
  inkB: string,
): {veil: string; ink: string} | null {
  try {
    const dark = parseHexColor(
      relativeLuminance(inkA) <= relativeLuminance(inkB) ? inkA : inkB,
    );
    const a = HERO_VEIL_ALPHA;
    const veiled = stops.map(stop => {
      const s = parseHexColor(stop);
      return (
        '#' +
        hex2(dark.r * a + s.r * (1 - a)) +
        hex2(dark.g * a + s.g * (1 - a)) +
        hex2(dark.b * a + s.b * (1 - a))
      );
    });
    const worst = (ink: string) =>
      Math.min(...veiled.map(c => contrastRatio(ink, c)));
    return {
      veil: '#' + hex2(dark.r) + hex2(dark.g) + hex2(dark.b) + hex2(a * 255),
      ink: worst(inkA) >= worst(inkB) ? inkA : inkB,
    };
  } catch {
    return null;
  }
}

interface StatsCardProps {
  /**
   * Nombre del ícono de Ionicons
   * Ejemplos: 'flame', 'diamond-outline', 'trending-up'
   */
  icon: IoniconsName;

  /**
   * Valor a mostrar (número o texto)
   */
  value: string | number;

  /**
   * Label descriptivo
   */
  label: string;

  /**
   * Color del ícono
   * @default '#fbbf24' (yellow/amber)
   */
  iconColor?: string;

  /**
   * Color del texto del valor
   * @default '#ffffff'
   */
  valueColor?: string;

  /**
   * Color del texto del label
   * @default 'rgba(255, 255, 255, 0.75)'
   */
  labelColor?: string;

  /**
   * Tamaño del ícono
   * @default 24
   */
  iconSize?: number;

  /**
   * Activar animación pulse en el ícono (para streak)
   * @default false
   */
  pulse?: boolean;

  /**
   * Animate `value` ticking up to its new number instead of snapping in
   * (make-it-feel-alive backlog). Only applies when `value` is a number —
   * string values (e.g. the "XX%" progress tile) always render plainly.
   * Delegates reduced-motion handling to [[CountUpText]], which already
   * skips the animation and renders the final value when motion is reduced.
   * @default false
   */
  countUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  iconColor = '#fbbf24', // amber-400
  valueColor = '#ffffff',
  labelColor = 'rgba(255, 255, 255, 0.75)',
  iconSize = 24,
  pulse = false,
  countUp = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!pulse || reducedMotion) {
      pulseAnim.setValue(1);
      return;
    }
    // Animación pulse continua
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, pulseAnim, reducedMotion]);

  return (
    <View style={styles.container}>
      {/* Ícono con animación pulse opcional */}
      <Animated.View
        style={[
          styles.iconContainer,
          pulse && {
            transform: [{scale: pulseAnim}],
          },
        ]}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </Animated.View>

      {/* Valor — display number in a fixed hero column: cap font scaling.
          countUp swaps in CountUpText so the number ticks up to its new
          value on change instead of snapping in; only meaningful for
          numeric values, so string values (e.g. "XX%") always render plain. */}
      {countUp && typeof value === 'number' ? (
        <CountUpText
          value={value}
          scaleRole="display"
          numberOfLines={1}
          style={[styles.value, {color: valueColor}]}
        />
      ) : (
        <AppText
          scaleRole="display"
          numberOfLines={1}
          style={[styles.value, {color: valueColor}]}>
          {value}
        </AppText>
      )}

      {/* Label — compact uppercase caption: tightest cap */}
      <AppText
        scaleRole="compact"
        numberOfLines={1}
        style={[styles.label, {color: labelColor}]}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default StatsCard;
