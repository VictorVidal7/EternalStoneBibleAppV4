import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ListItem = ({ title, subtitle, onPress, iconName, rightIconName, theme }) => {
  console.log('Theme in ListItem:', theme); // Depuración

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginTop: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Icon name={rightIconName || 'chevron-right'} size={24} color={theme.colors.secondary} />
    </TouchableOpacity>
  );
};

export default ListItem;