/**
 * "¿Sabías qué?" Reminder settings card (v2 daily-facts nudge).
 *
 * Lets the user turn the "Dato del día" reminder on/off and pick the hour it
 * arrives. Mirrors PropheticReminderSettings — the newest sibling in that
 * same shape (per-day dynamic content, no Bible version needed since the
 * label + detail are resolved from i18n in NotificationService). Self
 * -contained: drops into Settings as one section.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {
  getSabiasQueReminderPreferences,
  setSabiasQueReminderEnabled,
  updateSabiasQueReminderHour,
} from '@lib/notifications/NotificationService';

const HOUR_OPTIONS = [6, 7, 8, 9, 12, 18, 21];

export default function SabiasQueReminderSettings() {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(12);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await getSabiasQueReminderPreferences();
      setEnabled(prefs.enabled);
      setHour(prefs.hour);
    })();
  }, []);

  const handleToggle = useCallback(
    async (value: boolean) => {
      if (busy) return;
      setBusy(true);
      haptics.tap();
      try {
        const ok = await setSabiasQueReminderEnabled(value, {hour, language});
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setEnabled(false);
          return;
        }
        setEnabled(value);
        toast.success(
          value
            ? t.notifications.sabiasQueReminderEnabled
            : t.notifications.sabiasQueReminderDisabled,
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, hour, language, t, toast],
  );

  const handleHourSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === hour) return;
      setHour(selected);
      haptics.tap();
      if (enabled) {
        setBusy(true);
        try {
          await updateSabiasQueReminderHour({hour: selected, language});
          toast.success(t.notifications.sabiasQueReminderEnabled);
        } finally {
          setBusy(false);
        }
      }
    },
    [busy, hour, enabled, language, t, toast],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="bulb-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.notifications.sabiasQueReminderTitle}
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
              {t.notifications.sabiasQueReminder}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.notifications.sabiasQueReminderDesc}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={busy}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={staticColors.white}
            accessibilityLabel={t.notifications.sabiasQueReminder}
          />
        </View>

        {enabled && (
          <View style={styles.hourSection}>
            <Text style={[styles.hourLabel, {color: colors.textSecondary}]}>
              {t.notifications.time}
            </Text>
            <View style={styles.hourGrid}>
              {HOUR_OPTIONS.map(h => {
                const active = h === hour;
                return (
                  <TouchableOpacity
                    key={h}
                    onPress={() => handleHourSelect(h)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityState={{selected: active, disabled: busy}}
                    accessibilityLabel={`${String(h).padStart(2, '0')}:00`}
                    style={[
                      styles.hourChip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceVariant,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.optionChipText,
                        {color: active ? colors.onPrimary : colors.text},
                      ]}>
                      {String(h).padStart(2, '0')}:00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
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
  optionChipText: {fontWeight: '700', fontSize: 14},
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
  hourSection: {
    marginTop: 18,
  },
  hourLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
});
