/**
 * Achievements Screen (Tab)
 * Displays the complete achievements and gamification system
 */

import React from 'react';
import {AchievementsScreen} from '@screens/AchievementsScreen';
import {useServices} from '@context/ServicesContext';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
// ♿ Dynamic-type: cap OS font-scale on the achievements tab chrome.
import {AppText as Text} from '@components/ui/AppText';
import {useLanguage} from '@hooks/useLanguage';
import {useTheme} from '@hooks/useTheme';

export default function AchievementsTab() {
  const {database, initialized} = useServices();
  const {t} = useLanguage();
  const {colors} = useTheme();

  if (!initialized || !database) {
    return (
      <View
        style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
          {t.achievements.loading}
        </Text>
      </View>
    );
  }

  return <AchievementsScreen />;
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
