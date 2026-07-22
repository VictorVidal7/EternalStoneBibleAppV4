/**
 * Donation settings card — the Settings-screen entry point into the
 * donation flow. Always says the same thing (there's no entitlement to
 * reflect — giving is repeatable and unlocks nothing), so unlike
 * ExtrasSettings this card has no unlocked/locked state and no dev toggle.
 *
 * Degrades quietly: hidden entirely when billing isn't available (sideload,
 * or no RevenueCat key configured yet) — same as ExtrasSettings, except
 * __DEV__ still shows it so the flow stays reachable for local testing.
 */

import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useDonationSheet} from '@context/DonationSheetContext';
import {isBillingAvailable} from '@lib/offering/offeringService';

export default function DonationSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const {open} = useDonationSheet();
  const [billingAvailable, setBillingAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    isBillingAvailable().then(available => {
      if (mounted) setBillingAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!__DEV__ && !billingAvailable) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="heart-outline" size={22} color={colors.primary} />
        <Text
          scaleRole="display"
          style={[styles.sectionTitle, {color: colors.text}]}>
          {t.donation.settingsSectionTitle}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <Text
          scaleRole="compact"
          style={[styles.description, {color: colors.textSecondary}]}>
          {t.donation.settingsDesc}
        </Text>
        <TouchableOpacity
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={t.donation.settingsCta}
          style={[styles.ctaButton, {backgroundColor: colors.primary}]}>
          <Text
            scaleRole="compact"
            style={[styles.ctaButtonText, {color: colors.onPrimary}]}>
            {t.donation.settingsCta}
          </Text>
        </TouchableOpacity>
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
});
