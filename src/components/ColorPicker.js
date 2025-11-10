import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

const ColorPicker = ({ selectedColor, onColorChange }) => {
  return (
    <View style={styles.container}>
      {colors.map(color => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColor
          ]}
          onPress={() => onColorChange(color)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: 'black',
  },
});

export default ColorPicker;