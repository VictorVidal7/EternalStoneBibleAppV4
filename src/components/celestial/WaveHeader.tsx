import React from 'react';
import {View, StyleSheet, Dimensions, Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import {useTheme, celestialTheme} from '../../hooks/useTheme';
import {AnimatedParticles} from './AnimatedParticles';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface WaveHeaderProps {
  height?: number;
  children?: React.ReactNode;
  showParticles?: boolean;
  particleCount?: number;
  waveHeight?: number;
}

export const WaveHeader: React.FC<WaveHeaderProps> = ({
  height = 180,
  children,
  showParticles = true,
  particleCount = 15,
  waveHeight = 30,
}) => {
  const {gradient, isDark, colors} = useTheme();
  const gradientColors = gradient.headerColors;

  return (
    <View style={[styles.container, {height: height + waveHeight}]}>
      {/* Main gradient background */}
      <LinearGradient
        colors={[...gradientColors] as [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.gradient, {height: height + waveHeight}]}>
        {/* Animated particles overlay */}
        {showParticles && (
          <AnimatedParticles
            count={particleCount}
            height={height}
            color={
              isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)'
            }
          />
        )}

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </LinearGradient>

      {/* Wave SVG at bottom */}
      <View style={[styles.waveContainer, {top: height - 1}]}>
        <Svg
          width={SCREEN_WIDTH}
          height={waveHeight + 2}
          viewBox={`0 0 ${SCREEN_WIDTH} ${waveHeight + 2}`}
          style={styles.waveSvg}>
          <Defs>
            <SvgGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="50%" stopColor={gradientColors[1]} />
              <Stop offset="100%" stopColor={gradientColors[2]} />
            </SvgGradient>
          </Defs>
          <Path
            d={`
              M 0 0
              Q ${SCREEN_WIDTH * 0.25} ${waveHeight * 0.7}, ${SCREEN_WIDTH * 0.5} ${waveHeight * 0.2}
              Q ${SCREEN_WIDTH * 0.75} ${-waveHeight * 0.3}, ${SCREEN_WIDTH} ${waveHeight * 0.5}
              L ${SCREEN_WIDTH} ${waveHeight + 2}
              L 0 ${waveHeight + 2}
              Z
            `}
            fill={colors.background}
          />
        </Svg>
      </View>

      {/* Glow effect at bottom */}
      <View
        style={[
          styles.glowEffect,
          {
            top: height - 10,
            backgroundColor: gradient.accentGlow,
            ...celestialTheme.shadows.glow(gradient.accentGlow),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  gradient: {
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  waveSvg: {
    position: 'absolute',
    top: 0,
  },
  glowEffect: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
});

export default WaveHeader;
