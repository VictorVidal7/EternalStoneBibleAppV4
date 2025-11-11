/**
 * Modal celebratorio cuando se desbloquea un logro
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { Achievement, ACHIEVEMENT_TIER_COLORS } from '../../lib/achievements/types';

interface AchievementUnlockedModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible && achievement) {
      // Resetear animaciones
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.translateY.setValue(0);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
          tension: 40,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(rotateAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 3,
          }),
        ]),
      ]).start();

      // Animación de confeti
      confettiAnims.forEach((anim, index) => {
        const angle = (Math.PI * 2 * index) / confettiAnims.length;
        const distance = 150 + Math.random() * 100;

        Animated.parallel([
          Animated.timing(anim.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: Math.random() * 360,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Confeti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'][
                  index % 5
                ],
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                  { rotate: anim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }) },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}

        {/* Contenido */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={[styles.card, { borderColor: tierColor }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>¡Logro Desbloqueado!</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
              </View>
            </View>

            {/* Icono */}
            <View style={[styles.iconContainer, { backgroundColor: tierColor + '20' }]}>
              <Text style={styles.icon}>{achievement.icon}</Text>
            </View>

            {/* Nombre y descripción */}
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>

            {/* Puntos */}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>Has ganado</Text>
              <Text style={[styles.points, { color: tierColor }]}>
                +{achievement.points} puntos
              </Text>
            </View>

            {/* Botón */}
            <Pressable
              style={[styles.button, { backgroundColor: tierColor }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>¡Genial!</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 56,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  points: {
    fontSize: 32,
    fontWeight: '800',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
