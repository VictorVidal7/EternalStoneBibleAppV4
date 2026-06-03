/**
 * 📋 PremiumBottomSheet - Modal Premium con Gestos
 *
 * Bottom Sheet con gestos avanzados y animaciones fluidas
 * Wrapper mejorado sobre @gorhom/bottom-sheet
 *
 * Características:
 * - Snap points configurables
 * - Handle animado con indicador visual
 * - Backdrop con blur y dim
 * - Haptic feedback en snap points
 * - Header con título y acciones
 * - Soporte para scroll interno
 * - Cierre con swipe down
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {staticColors} from '@/styles/designTokens';
import {View, Text, StyleSheet, Pressable, ViewStyle} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import {BlurView} from 'expo-blur';
import {haptics} from '@lib/haptics';
import {SPRING_CONFIGS} from '../../styles/reanimatedAnimations';
import {focusTrapProps, a11yHiddenProps} from '../../lib/a11y/focusTrap';
import {useLanguage} from '../../hooks/useLanguage';

// ==================== TYPES ====================

export interface PremiumBottomSheetRef {
  open: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
  expand: () => void;
  collapse: () => void;
}

interface HeaderAction {
  label: string;
  onPress: () => void;
  variant?: 'text' | 'icon';
  icon?: React.ReactNode;
  color?: string;
}

interface PremiumBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
  headerLeft?: HeaderAction;
  headerRight?: HeaderAction;
  showHandle?: boolean;
  enableBlurBackdrop?: boolean;
  backdropOpacity?: number;
  isDark?: boolean;
  enableHaptics?: boolean;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  scrollable?: boolean;
  onChange?: (index: number) => void;
  onClose?: () => void;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  handleStyle?: ViewStyle;
}

// ==================== ANIMATED HANDLE ====================

interface HandleProps {
  isDark: boolean;
  animatedIndex: SharedValue<number>;
  style?: ViewStyle;
  /** When the sheet is dismissable, the grab handle doubles as an accessible
   *  "Close" button so screen-reader users (who can't perform the pan-down
   *  gesture) always have a reachable way out — the safety the content
   *  focus-trap relies on. */
  onClose?: () => void;
  closeLabel?: string;
}

const AnimatedHandle: React.FC<HandleProps> = ({
  isDark,
  animatedIndex,
  style,
  onClose,
  closeLabel,
}) => {
  const animatedHandleStyle = useAnimatedStyle(() => {
    const width = interpolate(
      animatedIndex.value,
      [-1, 0, 1],
      [32, 40, 48],
      Extrapolation.CLAMP,
    );

    return {
      width,
    };
  });

  return (
    <Pressable
      style={[styles.handleContainer, style]}
      onPress={onClose}
      disabled={!onClose}
      accessibilityRole={onClose ? 'button' : undefined}
      accessibilityLabel={onClose ? closeLabel : undefined}>
      <Animated.View
        style={[
          styles.handle,
          isDark ? styles.handleDark : styles.handleLight,
          animatedHandleStyle,
        ]}
      />
    </Pressable>
  );
};

// ==================== HEADER ====================

interface HeaderProps {
  title?: string;
  subtitle?: string;
  headerLeft?: HeaderAction;
  headerRight?: HeaderAction;
  isDark: boolean;
  style?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  headerLeft,
  headerRight,
  isDark,
  style,
}) => {
  if (!title && !headerLeft && !headerRight) return null;

  const scale = useSharedValue(1);

  const createPressHandlers = useCallback(
    (action?: HeaderAction) => {
      if (!action) return {};

      return {
        onPressIn: () => {
          scale.value = withSpring(0.95, SPRING_CONFIGS.snappy);
        },
        onPressOut: () => {
          scale.value = withSpring(1, SPRING_CONFIGS.snappy);
        },
        onPress: action.onPress,
      };
    },
    [scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <View style={[styles.header, style]}>
      {/* Left Action */}
      <View style={styles.headerAction}>
        {headerLeft && (
          <AnimatedPressable
            {...createPressHandlers(headerLeft)}
            style={[styles.headerButton, animatedStyle]}>
            {headerLeft.icon || (
              <Text
                style={[
                  styles.headerButtonText,
                  {color: headerLeft.color || '#6366f1'},
                ]}>
                {headerLeft.label}
              </Text>
            )}
          </AnimatedPressable>
        )}
      </View>

      {/* Title */}
      <View style={styles.headerTitleContainer}>
        {title && (
          <Text
            style={[styles.headerTitle, isDark && styles.headerTitleDark]}
            numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}
            numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Action */}
      <View style={styles.headerAction}>
        {headerRight && (
          <AnimatedPressable
            {...createPressHandlers(headerRight)}
            style={[styles.headerButton, animatedStyle]}>
            {headerRight.icon || (
              <Text
                style={[
                  styles.headerButtonText,
                  styles.headerButtonTextRight,
                  {color: headerRight.color || '#6366f1'},
                ]}>
                {headerRight.label}
              </Text>
            )}
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
};

// ==================== CUSTOM BACKDROP ====================

interface CustomBackdropProps extends BottomSheetBackdropProps {
  enableBlur: boolean;
  opacity: number;
  isDark: boolean;
}

const CustomBackdrop: React.FC<CustomBackdropProps> = ({
  animatedIndex,
  enableBlur,
  opacity,
  isDark,
  style,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const backdropOpacity = interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, opacity],
      Extrapolation.CLAMP,
    );

    return {
      opacity: backdropOpacity,
    };
  });

  if (enableBlur) {
    return (
      <Animated.View
        style={[styles.backdrop, style, animatedStyle]}
        {...a11yHiddenProps()}>
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.backdrop,
        {
          backgroundColor: isDark
            ? staticColors.overlayBlack70
            : staticColors.overlayBlack50,
        },
        style,
        animatedStyle,
      ]}
      {...a11yHiddenProps()}
    />
  );
};

// ==================== MAIN COMPONENT ====================

export const PremiumBottomSheet = forwardRef<
  PremiumBottomSheetRef,
  PremiumBottomSheetProps
>(
  (
    {
      children,
      snapPoints: customSnapPoints,
      initialIndex = -1,
      title,
      subtitle,
      headerLeft,
      headerRight,
      showHandle = true,
      enableBlurBackdrop = true,
      backdropOpacity = 0.5,
      isDark = false,
      enableHaptics = true,
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      scrollable = false,
      onChange,
      onClose,
      containerStyle,
      contentStyle,
      headerStyle,
      handleStyle,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const animatedIndex = useSharedValue(initialIndex);
    const {t} = useLanguage();

    // Default snap points
    const snapPoints = useMemo(
      () => customSnapPoints || ['25%', '50%', '90%'],
      [customSnapPoints],
    );

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.snapToIndex(0);
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
      snapToIndex: (index: number) => {
        bottomSheetRef.current?.snapToIndex(index);
      },
      expand: () => {
        bottomSheetRef.current?.expand();
      },
      collapse: () => {
        bottomSheetRef.current?.collapse();
      },
    }));

    // Handle change with haptics
    const handleSheetChange = useCallback(
      (index: number) => {
        animatedIndex.value = index;

        if (enableHaptics) {
          haptics.tap();
        }

        onChange?.(index);

        if (index === -1) {
          onClose?.();
        }
      },
      [enableHaptics, onChange, onClose, animatedIndex],
    );

    // Render backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <CustomBackdrop
          {...props}
          enableBlur={enableBlurBackdrop}
          opacity={backdropOpacity}
          isDark={isDark}
        />
      ),
      [enableBlurBackdrop, backdropOpacity, isDark],
    );

    // Render handle. When the sheet is dismissable, the handle doubles as an
    // accessible Close button so the content focus-trap below never strands a
    // screen-reader user (who can't perform the pan-down-to-close gesture).
    const renderHandle = useCallback(() => {
      if (!showHandle) return null;

      return (
        <AnimatedHandle
          isDark={isDark}
          animatedIndex={animatedIndex}
          style={handleStyle}
          onClose={
            enablePanDownToClose
              ? () => bottomSheetRef.current?.close()
              : undefined
          }
          closeLabel={t.close}
        />
      );
    }, [
      showHandle,
      isDark,
      animatedIndex,
      handleStyle,
      enablePanDownToClose,
      t.close,
    ]);

    // Background style
    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: isDark ? staticColors.grayNeutral : staticColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }),
      [isDark],
    );

    // Content wrapper
    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={initialIndex}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        backgroundStyle={backgroundStyle}
        style={[styles.container, containerStyle]}
        animateOnMount>
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          headerLeft={headerLeft}
          headerRight={headerRight}
          isDark={isDark}
          style={headerStyle}
        />

        {/* Content — focus-trapped so a screen reader can't wander out of the
            sheet into the page behind it (the dismissable handle above is the
            reachable way back out). */}
        <ContentWrapper
          style={[styles.content, contentStyle]}
          {...focusTrapProps()}>
          {children}
        </ContentWrapper>
      </BottomSheet>
    );
  },
);

PremiumBottomSheet.displayName = 'PremiumBottomSheet';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    height: 5,
    borderRadius: 3,
  },
  handleLight: {
    backgroundColor: staticColors.overlayBlack20,
  },
  handleDark: {
    backgroundColor: staticColors.glassWhite30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack08,
  },
  headerAction: {
    width: 80,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonTextRight: {
    textAlign: 'right',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: staticColors.grayNeutral,
    textAlign: 'center',
  },
  headerTitleDark: {
    color: staticColors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: staticColors.overlayBlack50,
    marginTop: 2,
    textAlign: 'center',
  },
  headerSubtitleDark: {
    color: staticColors.glassWhite50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

// ==================== EXPORTS ====================

export default PremiumBottomSheet;
