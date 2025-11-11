/**
 * Tarjeta de Logro con animación y diseño moderno
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Achievement, ACHIEVEMENT_TIER_COLORS } from '../../lib/achievements/types';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  showProgress?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  showProgress = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar progreso
    Animated.spring(progressAnim, {
      toValue: achievement.isUnlocked
        ? 1
        : achievement.currentProgress / achievement.requirement,
      useNativeDriver: false,
      friction: 5,
    }).start();
  }, [achievement.currentProgress, achievement.isUnlocked]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  const progress = achievement.isUnlocked
    ? 100
    : Math.min(100, (achievement.currentProgress / achievement.requirement) * 100);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={() => onPress?.(achievement)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { borderColor: tierColor },
          achievement.isUnlocked && styles.cardUnlocked,
        ]}
      >
        {/* Icono del logro */}
        <View style={[styles.iconContainer, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.icon, !achievement.isUnlocked && styles.iconLocked]}>
            {achievement.icon}
          </Text>
        </View>

        {/* Información */}
        <View style={styles.info}>
          <Text style={[styles.name, achievement.isUnlocked && styles.nameUnlocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {achievement.description}
          </Text>

          {/* Barra de progreso */}
          {showProgress && !achievement.isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: tierColor,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.currentProgress}/{achievement.requirement}
              </Text>
            </View>
          )}

          {/* Puntos */}
          <View style={styles.footer}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
            </View>
            <Text style={styles.points}>+{achievement.points} pts</Text>
          </View>
        </View>

        {/* Badge de desbloqueado */}
        {achievement.isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardUnlocked: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  nameUnlocked: {
    color: '#0284C7',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  points: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
