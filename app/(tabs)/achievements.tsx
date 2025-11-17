/**
 * Pantalla de Logros (Tab)
 * Muestra el sistema completo de logros y gamificación
 */

import React from 'react';
import { AchievementsScreen } from '../../src/screens/AchievementsScreen';
import { useServices } from '../../src/context/ServicesContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useTheme } from '../../src/hooks/useTheme';

export default function AchievementsTab() {
  const { database, initialized } = useServices();
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (!initialized || !database) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t.achievements.loading}
        </Text>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
