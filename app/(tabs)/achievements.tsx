/**
 * Pantalla de Logros (Tab)
 * Muestra el sistema completo de logros y gamificación
 */

import React from 'react';
import { AchievementsScreen } from '../../src/screens/AchievementsScreen';
import { useServices } from '../../src/context/ServicesContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AchievementsTab() {
  const { database, initialized } = useServices();

  if (!initialized || !database) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando logros...</Text>
      </View>
    );
  }

  return <AchievementsScreen database={database} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});
