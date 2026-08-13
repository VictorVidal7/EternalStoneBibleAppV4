/**
 * Memorization daily-goal + weekly-mastery-target settings cards (Sprint 47).
 *
 * Two chip-picker cards in one Settings section (persisted to AsyncStorage;
 * the streaks they feed are already cross-device via the review-event log).
 * The reminder notification that used to live here as a third card now
 * lives in NotificationsSettings, alongside the other 5 reminder types.
 */

import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {getDailyGoal, setDailyGoal} from '@lib/memory/goalStore';
import {getWeeklyTarget, setWeeklyTarget} from '@lib/memory/weeklyTargetStore';
import {WEEKLY_TARGET_OPTIONS} from '@lib/memory/weeklyChallenge';

const GOAL_OPTIONS = [3, 5, 10, 15, 20, 30];

export default function MemoryGoalSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();

  const [goal, setGoal] = useState(10);
  const [weeklyTarget, setWeeklyTargetState] = useState(3);

  useEffect(() => {
    (async () => {
      const [g, wt] = await Promise.all([getDailyGoal(), getWeeklyTarget()]);
      setGoal(g);
      setWeeklyTargetState(wt);
    })();
  }, []);

  const handleGoalSelect = useCallback(
    async (selected: number) => {
      if (selected === goal) return;
      setGoal(selected);
      haptics.tap();
      await setDailyGoal(selected);
      toast.success(t.memory.goal.saved);
    },
    [goal, t, toast],
  );

  const handleWeeklyTargetSelect = useCallback(
    async (selected: number) => {
      if (selected === weeklyTarget) return;
      setWeeklyTargetState(selected);
      haptics.tap();
      await setWeeklyTarget(selected);
      toast.success(t.weeklyChallenge.saved);
    },
    [weeklyTarget, t, toast],
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
