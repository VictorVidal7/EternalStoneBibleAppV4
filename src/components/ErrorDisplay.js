import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useError } from '../context/ErrorContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const ErrorDisplay = () => {
  const { error } = useError();
  const { nightMode } = useUserPreferences();
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (error) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [error, opacity]);

  if (!error) return null;

  return (
    <Animated.View style={[styles.container, { opacity }, nightMode && styles.nightMode]}>
      <Text style={[styles.text, nightMode && styles.nightModeText]}>{error}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  nightMode: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
  nightModeText: {
    color: '#f0f0f0',
  },
});

export default ErrorDisplay;