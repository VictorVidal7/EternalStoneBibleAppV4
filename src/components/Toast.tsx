/**
 * 🍞 TOAST / SNACKBAR COMPONENT
 *
 * Notificaciones toast elegantes con animaciones suaves,
 * múltiples variantes y auto-dismiss.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { spacing, borderRadius, shadows, fontSize } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';
type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: keyof typeof Ionicons.glyphMap;
  useBlur?: boolean;
}

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
  default: 'notifications',
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  variant = 'default',
  position = 'bottom',
  duration = 3000,
  onDismiss,
  action,
  icon,
  useBlur = Platform.OS === 'ios',
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.success,
          iconColor: '#ffffff',
          textColor: '#ffffff',
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          iconColor: '#ffffff',
          textColor: '#ffffff',
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          iconColor: '#ffffff',
          textColor: '#ffffff',
        };
      case 'info':
        return {
          backgroundColor: colors.info,
          iconColor: '#ffffff',
          textColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: colors.card,
          iconColor: colors.text,
          textColor: colors.text,
        };
    }
  };

  const show = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hide();
      }, duration);
    }
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  if (!visible) return null;

  const variantColors = getVariantColors();
  const toastIcon = icon || ICONS[variant];

  const positionStyle =
    position === 'top'
      ? { top: Platform.OS === 'ios' ? 60 : 20 }
      : { bottom: Platform.OS === 'ios' ? 40 : 20 };

  const ToastContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            variant === 'default' && !useBlur ? variantColors.backgroundColor : 'transparent',
          ...(variant !== 'default' && { backgroundColor: variantColors.backgroundColor }),
          ...shadows.lg,
        },
      ]}
    >
      {/* Icon */}
      <Ionicons name={toastIcon} size={24} color={variantColors.iconColor} />

      {/* Message */}
      <Text
        style={[styles.message, { color: variantColors.textColor }]}
        numberOfLines={2}
      >
        {message}
      </Text>

      {/* Action Button */}
      {action && (
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            hide();
          }}
          style={styles.actionButton}
        >
          <Text style={[styles.actionText, { color: variantColors.textColor }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Close Button */}
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={variantColors.iconColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        positionStyle,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {useBlur && variant === 'default' ? (
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}
        >
          {ToastContent}
        </BlurView>
      ) : (
        ToastContent
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 9999,
  },
  blurContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    minHeight: 56,
  },
  message: {
    flex: 1,
    fontSize: fontSize.base,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: spacing.xs,
  },
});

// ==================== TOAST MANAGER ====================
// Sistema de gestión global de toasts

interface ToastConfig {
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: keyof typeof Ionicons.glyphMap;
}

class ToastManager {
  private listeners: ((config: ToastConfig & { id: string; visible: boolean }) => void)[] =
    [];

  subscribe(
    listener: (config: ToastConfig & { id: string; visible: boolean }) => void
  ) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(config: ToastConfig) {
    const id = Date.now().toString();
    this.listeners.forEach(listener => {
      listener({ ...config, id, visible: true });
    });
  }

  success(message: string, options?: Partial<ToastConfig>) {
    this.show({ message, variant: 'success', ...options });
  }

  error(message: string, options?: Partial<ToastConfig>) {
    this.show({ message, variant: 'error', ...options });
  }

  warning(message: string, options?: Partial<ToastConfig>) {
    this.show({ message, variant: 'warning', ...options });
  }

  info(message: string, options?: Partial<ToastConfig>) {
    this.show({ message, variant: 'info', ...options });
  }
}

export const toastManager = new ToastManager();

export default Toast;
