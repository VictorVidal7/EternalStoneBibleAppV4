/**
 * Daily Verse Notification settings card.
 *
 * Lets the user turn the daily-verse reminder on/off and pick the hour it
 * arrives. Self-contained: drops into the Settings screen as one section.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {
  getNotificationPreferences,
  setDailyVerseEnabled,
  updateDailyVerseHour,
} from '@lib/notifications/NotificationService';

const HOUR_OPTIONS = [6, 7, 8, 12, 18, 21];

export default function DailyVerseSettings() {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await getNotificationPreferences();
      setEnabled(prefs.enabled);
      setHour(prefs.hour);
    })();
  }, []);

  const handleToggle = useCallback(
    async (value: boolean) => {
      if (busy) return;
      setBusy(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const ok = await setDailyVerseEnabled(value, {
          hour,
          language,
          version: selectedVersion.id,
        });
        if (value && !ok) {
          Alert.alert(
            t.notifications.permissionDeniedTitle,
            t.notifications.permissionDeniedMessage,
          );
          setEnabled(false);
          return;
        }
        setEnabled(value);
        toast.success(
          value ? t.notifications.enabled : t.notifications.disabled,
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, hour, language, selectedVersion.id, t, toast],
  );

  const handleHourSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === hour) return;
      setHour(selected);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (enabled) {
        setBusy(true);
        try {
          await updateDailyVerseHour({
            hour: selected,
            language,
            version: selectedVersion.id,
          });
          toast.success(t.notifications.enabled);
        } finally {
          setBusy(false);
        }
      }
    },
    [busy, hour, enabled, language, selectedVersion.id, t, toast],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="notifications-outline"
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.notifications.title}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            shadowOpacity: isDark ? 0.3 : 0.1,
          },
        ]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.notifications.dailyVerse}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.notifications.dailyVerseDesc}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={busy}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#ffffff"
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
                      style={{
                        color: active ? '#ffffff' : colors.text,
                        fontWeight: '700',
                        fontSize: 14,
                      }}>
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
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
