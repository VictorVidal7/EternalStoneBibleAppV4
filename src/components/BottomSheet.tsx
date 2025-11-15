/**
 * 🎨 BOTTOM SHEET COMPONENT
 *
 * Modal bottom sheet con animaciones suaves, gestos táctiles
 * y diseño glassmorphism moderno.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Commented out temporarily
import { spacing, borderRadius, shadows } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const THRESHOLD = 100; // Distancia mínima para cerrar

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto';
  enableBackdropDismiss?: boolean;
  enableGestureDismiss?: boolean;
  backdropOpacity?: number;
  useBlur?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = 'auto',
  enableBackdropDismiss = true,
  enableGestureDismiss = true,
  backdropOpacity = 0.5,
  useBlur = Platform.OS === 'ios',
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;

  // Gestos para arrastrar el sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableGestureDismiss,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableGestureDismiss && gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > THRESHOLD || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          // Volver a la posición original
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(backdropOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      openSheet();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const sheetHeight = height === 'auto' ? undefined : height;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={enableBackdropDismiss ? closeSheet : undefined}
      >
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              backgroundColor: colors.overlay,
              opacity: backdropOpacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, backdropOpacity],
              }),
            },
          ]}
        />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}
        {...(enableGestureDismiss ? panResponder.panHandlers : {})}
      >
        {/* Temporarily disabled BlurView until expo-blur is installed */}
        {/* {useBlur ? (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark
                    ? colors.glass
                    : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            >
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: colors.border },
                  ]}
                />
              </View>
              <View style={styles.content}>{children}</View>
            </View>
          </BlurView>
        ) : ( */}
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                ...shadows.xl,
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </View>
        {/* )} */}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    flex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 200,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default BottomSheet;
