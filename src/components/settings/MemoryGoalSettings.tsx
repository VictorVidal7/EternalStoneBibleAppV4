/**
 * Memorization goal + review-reminder settings card (Sprint 47).
 *
 * Two cards in one Settings section:
 *   1. Daily review goal — a chip picker (persisted to AsyncStorage; the
 *      streak it feeds is already cross-device via the review-event log).
 *   2. Review reminder — an independent daily notification (its own prefs +
 *      channel, separate from the daily-verse reminder).
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {getDailyGoal, setDailyGoal} from '@lib/memory/goalStore';
import {getWeeklyTarget, setWeeklyTarget} from '@lib/memory/weeklyTargetStore';
import {WEEKLY_TARGET_OPTIONS} from '@lib/memory/weeklyChallenge';
import {
  getMemoryReminderPreferences,
  setMemoryReminderEnabled,
  updateMemoryReminderHour,
} from '@lib/notifications/NotificationService';

const GOAL_OPTIONS = [3, 5, 10, 15, 20, 30];
const HOUR_OPTIONS = [6, 7, 8, 12, 18, 21];

export default function MemoryGoalSettings() {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();

  const [goal, setGoal] = useState(10);
  const [weeklyTarget, setWeeklyTargetState] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(19);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [g, wt, prefs] = await Promise.all([
        getDailyGoal(),
        getWeeklyTarget(),
        getMemoryReminderPreferences(),
      ]);
      setGoal(g);
      setWeeklyTargetState(wt);
      setReminderEnabled(prefs.enabled);
      setReminderHour(prefs.hour);
    })();
  }, []);

  const handleGoalSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === goal) return;
      setGoal(selected);
      haptics.tap();
      await setDailyGoal(selected);
      toast.success(t.memory.goal.saved);
    },
    [busy, goal, t, toast],
  );

  const handleWeeklyTargetSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === weeklyTarget) return;
      setWeeklyTargetState(selected);
      haptics.tap();
      await setWeeklyTarget(selected);
      toast.success(t.weeklyChallenge.saved);
    },
    [busy, weeklyTarget, t, toast],
  );

  const handleReminderToggle = useCallback(
    async (value: boolean) => {
      if (busy) return;
      setBusy(true);
      haptics.tap();
      try {
        const ok = await setMemoryReminderEnabled(value, {
          hour: reminderHour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setReminderEnabled(false);
          return;
        }
        setReminderEnabled(value);
        toast.success(
          value
            ? t.notifications.memoryReminderEnabled
            : t.notifications.memoryReminderDisabled,
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, reminderHour, language, t, toast],
  );

  const handleReminderHourSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === reminderHour) return;
      setReminderHour(selected);
      haptics.tap();
      if (reminderEnabled) {
        setBusy(true);
        try {
          await updateMemoryReminderHour({hour: selected, language});
          toast.success(t.notifications.memoryReminderEnabled);
        } finally {
          setBusy(false);
        }
      }
    },
    [busy, reminderHour, reminderEnabled, language, t, toast],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="school-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.memory.title}
        </Text>
      </View>

      {/* Daily goal card */}
      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.memory.goal.settingsTitle}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.memory.goal.settingsDesc}
            </Text>
          </View>
        </View>
        <View style={styles.hourGrid}>
          {GOAL_OPTIONS.map(g => {
            const active = g === goal;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => handleGoalSelect(g)}
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
                  style={[
                    styles.optionChipText,
                    {color: active ? colors.onPrimary : colors.text},
                  ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Weekly mastery challenge target (Sprint 86) */}
      <View
        style={[
          styles.card,
          styles.cardSpacedTop,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.weeklyChallenge.settingsTitle}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.weeklyChallenge.settingsDesc}
            </Text>
          </View>
        </View>
        <View style={styles.hourGrid}>
          {WEEKLY_TARGET_OPTIONS.map(wt => {
            const active = wt === weeklyTarget;
            return (
              <TouchableOpacity
                key={wt}
                onPress={() => handleWeeklyTargetSelect(wt)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
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
                  {wt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Review reminder card */}
      <View
        style={[
          styles.card,
          styles.cardSpacedTop,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.notifications.memoryReminder}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.notifications.memoryReminderDesc}
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            disabled={busy}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#ffffff"
          />
        </View>

        {reminderEnabled && (
          <View style={styles.hourSection}>
            <Text style={[styles.hourLabel, {color: colors.textSecondary}]}>
              {t.notifications.time}
            </Text>
            <View style={styles.hourGrid}>
              {HOUR_OPTIONS.map(h => {
                const active = h === reminderHour;
                return (
                  <TouchableOpacity
                    key={h}
                    onPress={() => handleReminderHourSelect(h)}
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
  cardSpacedTop: {marginTop: 12},
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
    marginTop: 14,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
});
