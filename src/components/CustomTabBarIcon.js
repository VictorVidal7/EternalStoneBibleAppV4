import React from 'react';
import { View } from 'react-native';
import CustomIconButton from '../components/CustomIconButton';

const CustomTabBarIcon = ({ name, color, size }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <CustomIconButton name={name} color={color} size={size} />
  </View>
);

export default CustomTabBarIcon;