/**
 * Consolidated goals entry point: a single row in Ajustes that opens a
 * full-screen modal containing three chip-picker rows (daily reading goal,
 * daily memorization review goal, weekly mastery target), replacing what
 * used to be two separate full-width sections permanently inline — the same
 * consolidation NotificationsSettings already did for the 6 reminder types.
 * Purely a presentation consolidation: each store (readingGoalStore,
 * goalStore, weeklyTargetStore) and the streaks/rings that read them are
 * untouched.
 */

import {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';
import GoalOptionRow from './GoalOptionRow';
import {getReadingGoal, setReadingGoal} from '@lib/reading/readingGoalStore';
import {
  DEFAULT_READING_GOAL,
  READING_GOAL_OPTIONS,
} from '@lib/reading/readingGoal';
import {getDailyGoal, setDailyGoal} from '@lib/memory/goalStore';
import {getWeeklyTarget, setWeeklyTarget} from '@lib/memory/weeklyTargetStore';
import {WEEKLY_TARGET_OPTIONS} from '@lib/memory/weeklyChallenge';

const MEMORY_GOAL_OPTIONS = [3, 5, 10, 15, 20, 30];

export default function GoalsSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  const [readingGoal, setReadingGoalState] = useState(DEFAULT_READING_GOAL);
  const [readingBusy, setReadingBusy] = useState(false);
  const [memoryGoal, setMemoryGoalState] = useState(10);
  const [weeklyTarget, setWeeklyTargetState] = useState(3);

  useEffect(() => {
    (async () => {
      const [rg, mg, wt] = await Promise.all([
        getReadingGoal(),
        getDailyGoal(),
        getWeeklyTarget(),
      ]);
      setReadingGoalState(rg);
      setMemoryGoalState(mg);
      setWeeklyTargetState(wt);
    })();
  }, []);

  const handleReadingGoalSelect = useCallback(
    async (selected: number) => {
      if (readingBusy || selected === readingGoal) return;
      setReadingBusy(true);
      setReadingGoalState(selected);
      haptics.tap();
      try {
        await setReadingGoal(selected);
        toast.success(t.readingGoal.saved);
      } finally {
        setReadingBusy(false);
      }
    },
    [readingBusy, readingGoal, t, toast],
  );

  const handleMemoryGoalSelect = useCallback(
    async (selected: number) => {
      if (selected === memoryGoal) return;
      setMemoryGoalState(selected);
      haptics.tap();
      await setDailyGoal(selected);
      toast.success(t.memory.goal.saved);
    },
    [memoryGoal, t, toast],
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

  const goalsCard = (
    <View
      style={[
        styles.card,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        {backgroundColor: colors.surface},
      ]}>
      <GoalOptionRow
        isFirst
        icon="book-outline"
        label={t.readingGoal.settingsTitle}
        description={t.readingGoal.settingsDesc}
        value={readingGoal}
        options={READING_GOAL_OPTIONS}
        onSelect={handleReadingGoalSelect}
        disabled={readingBusy}
      />
      <GoalOptionRow
        icon="school-outline"
        label={t.memory.goal.settingsTitle}
        description={t.memory.goal.settingsDesc}
        value={memoryGoal}
        options={MEMORY_GOAL_OPTIONS}
        onSelect={handleMemoryGoalSelect}
      />
      <GoalOptionRow
        icon="ribbon-outline"
        label={t.weeklyChallenge.settingsTitle}
        description={t.weeklyChallenge.settingsDesc}
        value={weeklyTarget}
        options={WEEKLY_TARGET_OPTIONS}
        onSelect={handleWeeklyTargetSelect}
      />
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flag-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.goals.title}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t.goals.entryTitle}>
        <View style={styles.entryRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.goals.entryTitle}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.goals.entryDesc}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={[modalStyles.container, {backgroundColor: colors.background}]}
          {...focusTrapProps()}>
          <View style={[modalStyles.header, {paddingTop: insets.top + 10}]}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[modalStyles.title, {color: colors.text}]}>
              {t.goals.title}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            {goalsCard}
          </ScrollView>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
