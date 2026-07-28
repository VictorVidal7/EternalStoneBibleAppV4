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
import {useReducedMotion} from '@hooks/useReducedMotion';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

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

      {/* Valor — display number in a fixed hero column: cap font scaling */}
      <AppText
        scaleRole="display"
        numberOfLines={1}
        style={[styles.value, {color: valueColor}]}>
        {value}
      </AppText>

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
