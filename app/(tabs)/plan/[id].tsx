/**
 * 📅 READING PLAN DETAIL
 *
 * Shows every day of a reading plan with its chapters. Each day can be
 * marked complete; progress is persisted via ReadingPlanProgressContext and
 * reflected on the home screen.
 */

import {View, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import React from 'react';
import {AppText as Text} from '@components/ui/AppText';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {
  getReadingPlanById,
  getLocalizedPlan,
  ReadingPlanDay,
} from '@/constants/reading-plans';
import {staticColors} from '@/styles/designTokens';
import {getBookByName} from '@/constants/bible';
import * as Haptics from 'expo-haptics';

export default function ReadingPlanDetailScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {getCompletedDays, isDayComplete, toggleDay} = useReadingPlanProgress();

  const plan = getReadingPlanById(id ?? '');

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  if (!plan) {
    return (
      <View
        style={[
          styles.container,
          styles.centerBox,
          {backgroundColor: colors.background},
        ]}>
        <Text style={{color: colors.textSecondary}}>
          {t.bible.bookNotFound}
        </Text>
      </View>
    );
  }

  const completed = getCompletedDays(plan.id).length;
  const percent = Math.round((completed / plan.duration) * 100);
  const localizedPlan = getLocalizedPlan(plan, t);

  function bookLabel(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return language === 'en' ? info.nameEn : info.name;
  }

  function renderDay({item}: {item: ReadingPlanDay}) {
    const done = isDayComplete(plan!.id, item.day);
    const readingsLabel = item.readings
      .map(r => `${bookLabel(r.book)} ${r.chapter}`)
      .join('  ·  ');
    return (
      <View style={[styles.dayRow, {backgroundColor: colors.surface}]}>
        <TouchableOpacity
          style={styles.dayCheck}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleDay(plan!.id, item.day);
          }}>
          <View
            style={[
              styles.checkCircle,
              {
                borderColor: done ? colors.primary : colors.border,
                backgroundColor: done
                  ? colors.primary
                  : staticColors.transparent,
              },
            ]}>
            {done && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dayContent}
          activeOpacity={0.7}
          onPress={() => {
            const first = item.readings[0];
            if (first) {
              router.push(`/verse/${first.book}/${first.chapter}` as never);
            }
          }}>
          <Text
            style={[
              styles.dayTitle,
              {color: done ? colors.textSecondary : colors.text},
            ]}>
            {t.readingPlan.dayLabel} {item.day}
          </Text>
          <Text
            style={[styles.dayReadings, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {readingsLabel}
          </Text>
        </TouchableOpacity>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {localizedPlan.name}
        </Text>
        <Text style={styles.headerSubtitle}>{localizedPlan.description}</Text>

        {/* Progress bar */}
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completed}/{plan.duration} {t.readingPlan.daysCompleted} ·{' '}
            {percent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${percent}%`}]} />
        </View>
      </LinearGradient>

      <FlatList
        data={plan.days}
        keyExtractor={item => String(item.day)}
        renderItem={renderDay}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  centerBox: {alignItems: 'center', justifyContent: 'center'},
  header: {
    paddingTop: 60,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: staticColors.white,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: staticColors.glassWhite85,
    marginTop: 4,
  },
  progressInfo: {marginTop: 16},
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: staticColors.white,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: staticColors.glassWhite25,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: staticColors.white,
  },
  listContent: {padding: 16, paddingBottom: 110},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  dayCheck: {paddingRight: 14},
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContent: {flex: 1},
  dayTitle: {fontSize: 15, fontWeight: '700', marginBottom: 3},
  dayReadings: {fontSize: 13, lineHeight: 18},
});
