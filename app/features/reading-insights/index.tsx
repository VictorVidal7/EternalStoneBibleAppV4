/**
 * 📖 MI LECTURA — reading-insights dashboard (Sprint 60, innovation prong)
 *
 * A GitHub-style activity heatmap of your *Bible reading* (until now the
 * heatmap only ever charted memorization reviews), plus streak, this-week
 * momentum, lifetime totals and your most-read book — all from data the app
 * already keeps (the per-day reading_streak_log + UserStats + the
 * ReadingProgress map). The math lives in the pure [[buildReadingInsights]];
 * this screen only wires the live snapshots and renders. 100% JS, no rebuild,
 * zero Firestore.
 *
 * Reached from a Home "Mi lectura" card and the deep link
 * `eternalbible://features/reading-insights`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useServices} from '@context/ServicesContext';
import {useReadingProgress} from '@context/ReadingProgressContext';
import {AppText} from '@components/ui/AppText';
import {CountUpText} from '@components/ui/CountUpText';
import {ContributionHeatmap} from '@components/charts/ContributionHeatmap';
import {
  summarizeHeatmapCells,
  buildHeatmapA11yLabel,
} from '@lib/a11y/heatmapSummary';
import {
  buildReadingInsights,
  type ReadingInsights,
} from '@/features/reading-insights/readingInsights';
import {formatReadingTime} from '@lib/utils/formatReadingTime';
import {
  TOTAL_BIBLE_BOOKS,
  bookCanonProgressPct,
} from '@lib/achievements/bookCompletion';
import {getBookByName} from '@/constants/bible';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function ReadingInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const ri = t.readingInsights;
  const {achievementService} = useServices();
  const {progress} = useReadingProgress();

  const [insights, setInsights] = useState<ReadingInsights | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const load = useCallback(async () => {
    if (!achievementService) return;
    try {
      setStatus('loading');
      const [stats, readingLog, bookReadingLog] = await Promise.all([
        achievementService.getUserStats(),
        achievementService.getReadingLog(),
        achievementService.getBookReadingLog(),
      ]);
      const built = buildReadingInsights({
        readingLog,
        totals: {
          totalVersesRead: stats.totalVersesRead,
          totalChaptersRead: stats.totalChaptersRead,
          totalBooksCompleted: stats.totalBooksCompleted,
          totalReadingSeconds: stats.totalReadingTime,
        },
        bookProgress: progress,
        bookReadingLog,
      });
      setInsights(built);
      setStatus('ready');
    } catch (err) {
      logger.error('Reading insights load failed', err as Error, {
        component: 'ReadingInsightsScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [achievementService, progress]);

  useEffect(() => {
    load();
  }, [load]);

  // Five-step green ramp (mirrors the memory heatmap's legend).
  const heatLevelColors = useMemo(
    () => [
      colors.border,
      colors.success + '40',
      colors.success + '70',
      colors.success + 'A8',
      colors.success,
    ],
    [colors.border, colors.success],
  );

  const mostReadLabel = useMemo(() => {
    if (!insights?.mostReadBook) return null;
    const key = insights.mostReadBook.book;
    const book = getBookByName(key);
    if (!book) return key;
    return language === 'en' ? book.nameEn : book.name;
  }, [insights?.mostReadBook, language]);

  // Localized unit words for formatReadingTime ("2h 32m" / "2 h 32 min").
  const timeLabels = useMemo(
    () => ({
      hour: ri.hourUnit,
      minute: ri.minuteUnit,
      lessThanMinute: ri.lessThanMinute,
    }),
    [ri.hourUnit, ri.minuteUnit, ri.lessThanMinute],
  );

  // The most-read meta line: REAL "{verses} · {time}" when the per-book log
  // has data, else the legacy "{chapters} chapters" proxy.
  const mostReadMeta = useMemo(() => {
    const mr = insights?.mostReadBook;
    if (!mr) return null;
    if (mr.source === 'log') {
      const verses = `${(mr.versesRead ?? 0).toLocaleString()} ${ri.versesUnit}`;
      const time = mr.timeSpent
        ? ` · ${formatReadingTime(mr.timeSpent, timeLabels)}`
        : '';
      return `${verses}${time}`;
    }
    return `${mr.chapters} ${ri.chaptersUnit}`;
  }, [insights?.mostReadBook, ri.versesUnit, ri.chaptersUnit, timeLabels]);

  // Completion progress toward the whole 66-book canon (0 when not loaded yet).
  const booksPct = insights
    ? bookCanonProgressPct(insights.totalBooksCompleted)
    : 0;

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="book" size={26} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {ri.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {ri.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {status === 'error' && (
            <TouchableOpacity
              style={[styles.card, {backgroundColor: colors.card}]}
              onPress={load}
              accessibilityRole="button">
              <AppText style={[styles.emptyTitle, {color: colors.text}]}>
                {ri.empty}
              </AppText>
            </TouchableOpacity>
          )}

          {status === 'ready' && insights && !insights.hasData && (
            <View style={[styles.card, {backgroundColor: colors.card}]}>
              <Ionicons
                name="book-outline"
                size={40}
                color={colors.textTertiary}
                style={styles.emptyIcon}
              />
              <AppText style={[styles.emptyTitle, {color: colors.text}]}>
                {ri.empty}
              </AppText>
              <AppText
                style={[styles.emptyHint, {color: colors.textSecondary}]}>
                {ri.emptyHint}
              </AppText>
            </View>
          )}

          {status === 'ready' && insights && insights.hasData && (
            <>
              {/* Top metrics */}
              <View style={styles.statRow}>
                <Stat
                  value={insights.currentStreak}
                  label={ri.streakCurrent}
                  colors={colors}
                />
                <Stat
                  value={insights.longestStreak}
                  label={ri.streakLongest}
                  colors={colors}
                />
                <Stat
                  value={insights.activeDays}
                  label={ri.activeDays}
                  colors={colors}
                />
              </View>

              {/* Heatmap */}
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <AppText
                  scaleRole="display"
                  style={[styles.cardTitle, {color: colors.text}]}>
                  {ri.heatmapTitle}
                </AppText>
                <AppText
                  scaleRole="compact"
                  style={[styles.cardHint, {color: colors.textTertiary}]}>
                  {ri.heatmapHint}
                </AppText>
                <ContributionHeatmap
                  cells={insights.heatmap}
                  levelColors={heatLevelColors}
                  accessibilityLabel={buildHeatmapA11yLabel({
                    title: ri.heatmapTitle,
                    activeDays: summarizeHeatmapCells(insights.heatmap)
                      .activeDays,
                    daysWord: ri.daysUnit,
                    total: insights.windowVerses,
                    totalWord: ri.versesUnit,
                  })}
                />
                <View style={styles.legendRow}>
                  <AppText
                    scaleRole="compact"
                    style={[styles.legendText, {color: colors.textTertiary}]}>
                    {ri.legendLess}
                  </AppText>
                  {heatLevelColors.map((c, idx) => (
                    <View
                      key={idx}
                      style={[styles.legendCell, {backgroundColor: c}]}
                    />
                  ))}
                  <AppText
                    scaleRole="compact"
                    style={[styles.legendText, {color: colors.textTertiary}]}>
                    {ri.legendMore}
                  </AppText>
                </View>
                <View style={styles.weekRow}>
                  <Stat
                    value={insights.thisWeekVerses}
                    label={ri.thisWeek}
                    colors={colors}
                  />
                  <Stat
                    value={insights.lastWeekVerses}
                    label={ri.lastWeek}
                    colors={colors}
                  />
                  <Stat
                    value={insights.bestDayVerses}
                    label={ri.bestDay}
                    colors={colors}
                  />
                </View>
              </View>

              {/* Lifetime totals */}
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <AppText
                  scaleRole="display"
                  style={[styles.cardTitle, {color: colors.text}]}>
                  {ri.totalsTitle}
                </AppText>
                <View style={styles.weekRow}>
                  <Stat
                    value={insights.totalVersesRead}
                    label={ri.totalVerses}
                    colors={colors}
                  />
                  <Stat
                    value={insights.totalChaptersRead}
                    label={ri.totalChapters}
                    colors={colors}
                  />
                  <Stat
                    value={insights.totalBooksCompleted}
                    label={ri.totalBooks}
                    colors={colors}
                  />
                </View>
              </View>

              {/* Books of the Bible — real completion progress toward the whole
                  canon. The number was 0 for everyone until Sprint 64 wired the
                  book-completion ledger; now it reflects books actually read. */}
              <View
                style={[styles.card, {backgroundColor: colors.card}]}
                accessible={true}
                accessibilityLabel={`${ri.booksTitle}: ${insights.totalBooksCompleted} / ${TOTAL_BIBLE_BOOKS}, ${booksPct}%`}>
                <AppText
                  scaleRole="display"
                  style={[styles.cardTitle, {color: colors.text}]}>
                  {ri.booksTitle}
                </AppText>
                <View style={styles.booksHeaderRow}>
                  {/* Baseline row so the hero number can count up (Sprint 66):
                      the "/66" used to nest INSIDE the number's <AppText>, which
                      blocked a <CountUpText> swap — split into baseline siblings. */}
                  <View style={styles.booksValueRow}>
                    <CountUpText
                      value={insights.totalBooksCompleted}
                      scaleRole="display"
                      style={[styles.booksValue, {color: colors.text}]}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.booksTotal,
                        {color: colors.textSecondary},
                      ]}>
                      {` / ${TOTAL_BIBLE_BOOKS}`}
                    </AppText>
                  </View>
                  <AppText
                    scaleRole="display"
                    style={[styles.booksPct, {color: colors.primary}]}>
                    {booksPct}%
                  </AppText>
                </View>
                <View
                  style={[styles.booksTrack, {backgroundColor: colors.border}]}>
                  <View
                    style={[
                      styles.booksFill,
                      {width: `${booksPct}%`, backgroundColor: colors.primary},
                    ]}
                  />
                </View>
                <AppText
                  scaleRole="compact"
                  style={[styles.booksCaption, {color: colors.textSecondary}]}>
                  {ri.booksCaption}
                </AppText>
              </View>

              {/* Time in the Word — reading time was tracked but never shown. */}
              <View style={[styles.card, {backgroundColor: colors.card}]}>
                <AppText
                  scaleRole="display"
                  style={[styles.cardTitle, {color: colors.text}]}>
                  {ri.timeTitle}
                </AppText>
                <View style={styles.weekRow}>
                  <TextStat
                    value={formatReadingTime(
                      insights.totalReadingSeconds,
                      timeLabels,
                    )}
                    label={ri.timeTotal}
                    colors={colors}
                  />
                  <TextStat
                    value={formatReadingTime(
                      insights.thisWeekReadingSeconds,
                      timeLabels,
                    )}
                    label={ri.timeWeek}
                    colors={colors}
                  />
                  <TextStat
                    value={formatReadingTime(
                      insights.bestDayReadingSeconds,
                      timeLabels,
                    )}
                    label={ri.timeBestDay}
                    colors={colors}
                  />
                </View>
              </View>

              {/* Most-read book */}
              {mostReadLabel && insights.mostReadBook && (
                <View style={[styles.card, {backgroundColor: colors.card}]}>
                  <AppText
                    scaleRole="display"
                    style={[styles.cardTitle, {color: colors.text}]}>
                    {ri.mostReadTitle}
                  </AppText>
                  <View style={styles.mostReadRow}>
                    <View
                      style={[
                        styles.mostReadIcon,
                        {backgroundColor: colors.primary + '22'},
                      ]}>
                      <Ionicons
                        name="bookmarks"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.mostReadInfo}>
                      <AppText
                        scaleRole="display"
                        numberOfLines={1}
                        style={[styles.mostReadName, {color: colors.text}]}>
                        {mostReadLabel}
                      </AppText>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.mostReadMeta,
                          {color: colors.textSecondary},
                        ]}>
                        {mostReadMeta}
                      </AppText>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

/** A compact number-over-label tile (sidesteps plural rules; honors font-scale). */
const Stat: React.FC<{
  value: number;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({value, label, colors}) => (
  <View
    style={styles.stat}
    accessible={true}
    accessibilityLabel={`${value} ${label}`}>
    <CountUpText
      value={value}
      scaleRole="display"
      style={[styles.statValue, {color: colors.text}]}
    />
    <AppText
      scaleRole="compact"
      numberOfLines={2}
      style={[styles.statLabel, {color: colors.textSecondary}]}>
      {label}
    </AppText>
  </View>
);

/** Like {@link Stat} but for a pre-formatted string value (e.g. "2h 32m"). */
const TextStat: React.FC<{
  value: string;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({value, label, colors}) => (
  <View
    style={styles.stat}
    accessible={true}
    accessibilityLabel={`${value} ${label}`}>
    <AppText
      scaleRole="display"
      numberOfLines={1}
      style={[styles.statValue, {color: colors.text}]}>
      {value}
    </AppText>
    <AppText
      scaleRole="compact"
      numberOfLines={2}
      style={[styles.statLabel, {color: colors.textSecondary}]}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing['1.5'],
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: staticColors.glassWhite80,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  centerState: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  cardHint: {
    fontSize: fontSizes.xs,
  },
  booksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  booksValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  booksValue: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
  },
  booksTotal: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  booksPct: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  booksTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  booksFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  booksCaption: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fontSizes['2xs'],
    fontWeight: '600',
    marginTop: spacing['0.5'],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing['0.5'],
    marginTop: spacing.xs,
  },
  legendText: {
    fontSize: fontSizes['2xs'],
    marginHorizontal: spacing['0.5'],
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  emptyIcon: {
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  mostReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  mostReadIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mostReadInfo: {
    flex: 1,
  },
  mostReadName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  mostReadMeta: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginTop: spacing['0.5'],
  },
});
