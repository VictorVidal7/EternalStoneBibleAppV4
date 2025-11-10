import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import HapticFeedback from '../services/HapticFeedback';

const CustomButton = ({ onPress, title, style }) => {
  const handlePress = () => {
    HapticFeedback.light();
    onPress();
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});

export default CustomButton;