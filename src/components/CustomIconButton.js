import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CustomIcon from './CustomIcon';

const CustomIconButton = ({ 
  name, 
  size = 24, 
  color, 
  onPress, 
  style, 
  disabled = false,
  accessibilityLabel,
  accessibilityHint
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      margin: 4,
    },
    icon: {
      opacity: disabled ? 0.5 : 1,
    },
    ripple: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 20,
      backgroundColor: colors.primary,
      opacity: 0.1,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.ripple} />
      <CustomIcon 
        name={name} 
        size={size} 
        color={color || colors.primary} 
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

export default CustomIconButton;