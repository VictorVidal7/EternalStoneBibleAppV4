import { Animated, Easing } from 'react-native';

export const fadeIn = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration: duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

export const fadeOut = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration: duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

export const slideIn = (value, from = 'right', duration = 300) => {
  const toValue = 0;
  const initialValue = from === 'right' ? 100 : from === 'left' ? -100 : from === 'top' ? -100 : 100;

  value.setValue(initialValue);
  return Animated.spring(value, {
    toValue: toValue,
    tension: 20,
    friction: 7,
    useNativeDriver: true,
  });
};

export const pulse = (value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.1,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]);
};