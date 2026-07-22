/**
 * Extras settings card — the Settings-screen entry point into the offering
 * flow (replaces the old always-visible dev-toggle PremiumSettings.tsx from
 * before real purchases existed).
 *
 * Degrades quietly: hidden entirely when billing isn't available (sideload,
 * or no RevenueCat key configured yet) and the reader hasn't already
 * unlocked anything — there's nothing honest to offer them yet. Once
 * unlocked, always shows the thank-you state regardless of billing
 * availability. The manual override switch is __DEV__-only, for local
 * testing without a real purchase.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {isBillingAvailable} from '@lib/offering/offeringService';

export default function ExtrasSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const {isPremium, isLoading, setPremium} = usePremium();
  const {open} = useOfferingSheet();
  const [billingAvailable, setBillingAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    isBillingAvailable().then(available => {
      if (mounted) setBillingAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, [isPremium]);

  const handleDevToggle = useCallback(
    async (value: boolean) => {
      haptics.tap();
      await setPremium(value);
      toast.success(value ? t.premium.unlockedToast : t.premium.lockedToast);
    },
    [setPremium, toast, t],
  );

  // In production, hide entirely when there's nothing honest to offer yet
  // (sideload / no RevenueCat key). __DEV__ always shows the section so the
  // manual toggle below stays reachable for local testing — that's the
  // whole point of it existing before real billing is configured.
  if (!__DEV__ && !isPremium && !billingAvailable) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="leaf-outline" size={22} color={colors.primary} />
        <Text
          scaleRole="display"
          style={[styles.sectionTitle, {color: colors.text}]}>
          {t.offering.settingsSectionTitle}
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
            <Text
              scaleRole="compact"
              style={[styles.label, {color: colors.text}]}>
              {isPremium
                ? t.offering.settingsUnlockedTitle
                : t.offering.settingsLockedTitle}
            </Text>
            <Text
              scaleRole="compact"
              style={[styles.description, {color: colors.textSecondary}]}>
              {isPremium
                ? t.offering.settingsUnlockedDesc
                : t.offering.settingsLockedDesc}
            </Text>
          </View>
          {isPremium ? (
            <Ionicons name="leaf" size={24} color={colors.primary} />
          ) : null}
        </View>

        {!isPremium && (
          <TouchableCta
            label={t.offering.settingsCta}
            color={colors.primary}
            textColor={colors.onPrimary}
            onPress={open}
          />
        )}
      </View>

      {__DEV__ && (
        <View
          style={[
            styles.card,
            styles.devCard,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}>
          <View style={styles.row}>
            <Text
              scaleRole="compact"
              style={[styles.devLabel, {color: colors.textSecondary}]}>
              {t.offering.devToggleLabel}
            </Text>
            <Switch
              value={isPremium}
              onValueChange={handleDevToggle}
              disabled={isLoading}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={staticColors.white}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function TouchableCta({
  label,
  color,
  textColor,
  onPress,
}: {
  label: string;
  color: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.ctaButton, {backgroundColor: color}]}>
      <Text
        scaleRole="compact"
        style={[styles.ctaButtonText, {color: textColor}]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  ctaButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  devCard: {
    marginTop: 10,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  devLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
});
