/**
 * Premium features settings card (Sprint 50).
 *
 * The canonical unlock control for the device-local premium flag. There is no
 * IAP yet — this toggle stands in for a future purchase: flipping it on unlocks
 * verse scrubbing in the audio player (and any future premium features). When
 * real in-app purchases land, this switch is replaced by a purchase/restore
 * flow while `usePremium()` consumers stay put.
 */

import React, {useCallback} from 'react';
import {View, Text, StyleSheet, Switch} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {usePremium} from '@context/PremiumContext';

export default function PremiumSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const {isPremium, isLoading, setPremium} = usePremium();

  const handleToggle = useCallback(
    async (value: boolean) => {
      haptics.tap();
      await setPremium(value);
      toast.success(value ? t.premium.unlockedToast : t.premium.lockedToast);
    },
    [setPremium, toast, t],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="diamond-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.premium.settingsTitle}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.premium.toggleLabel}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.premium.settingsDesc}
            </Text>
          </View>
          <Switch
            value={isPremium}
            onValueChange={handleToggle}
            disabled={isLoading}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
