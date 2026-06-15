/**
 * 📖 Daily reading-goal settings card (Sprint 85).
 *
 * The reading counterpart of [[MemoryGoalSettings]]' goal chip: a verses-per-day
 * target that grades the "Leer" constancy ring on Home. Device-local
 * preference (the reading streak it complements is already cross-device through
 * the reading log) — mirrors the memory goal's chip-picker UX exactly.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import {getReadingGoal, setReadingGoal} from '@lib/reading/readingGoalStore';
import {
  DEFAULT_READING_GOAL,
  READING_GOAL_OPTIONS,
} from '@lib/reading/readingGoal';

export default function ReadingGoalSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();

  const [goal, setGoal] = useState(DEFAULT_READING_GOAL);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setGoal(await getReadingGoal());
    })();
  }, []);

  const handleGoalSelect = useCallback(
    async (selected: number) => {
      if (busy || selected === goal) return;
      setBusy(true);
      setGoal(selected);
      haptics.tap();
      try {
        await setReadingGoal(selected);
        toast.success(t.readingGoal.saved);
      } finally {
        setBusy(false);
      }
    },
    [busy, goal, t, toast],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="book-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.readingGoal.title}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.rowInfo}>
          <Text style={[styles.label, {color: colors.text}]}>
            {t.readingGoal.settingsTitle}
          </Text>
          <Text style={[styles.description, {color: colors.textSecondary}]}>
            {t.readingGoal.settingsDesc}
          </Text>
        </View>
        <View style={styles.grid}>
          {READING_GOAL_OPTIONS.map(g => {
            const active = g === goal;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => handleGoalSelect(g)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.surfaceVariant,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: active ? staticColors.white : colors.text},
                  ]}>
                  {g}
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
  section: {marginTop: 24, paddingHorizontal: 16},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {fontSize: 18, fontWeight: 'bold', marginLeft: 8},
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
  rowInfo: {flex: 1},
  label: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  description: {fontSize: 14, lineHeight: 20},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {fontWeight: '700', fontSize: 14},
});
