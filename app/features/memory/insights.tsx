/**
 * 📊 MEMORY INSIGHTS SCREEN
 *
 * Analytics surface for the verse-memorization deck. Four cards:
 *   1. Deck mastery — a ring of "% mastered" plus headline counters.
 *   2. Box distribution — how many cards sit in each Leitner box.
 *   3. Review forecast — cards coming due over the next 7 days.
 *   4. "Tripping you up" — verses reviewed a lot that stay in low boxes.
 *
 * Every number comes from `computeDeckInsights`, a pure current-state
 * read of the cards already in the deck — no new data store this sprint.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useMemoryGoal} from '@hooks/useMemoryGoal';
import {computeDeckInsights, type StrugglingCard} from '@lib/memory/insights';
import {
  reviewHeatmap,
  retentionByBook,
  retentionTrend,
  weeksSinceFirstEvent,
  type LeechCard,
  type BookRetentionRow,
} from '@lib/memory/history';
import {DEFAULT_EASE} from '@lib/memory/srs';
import {computeEasePrior, MIN_CALIBRATION_REVIEWS} from '@lib/memory/easePrior';
import {getBookByName} from '@/constants/bible';
import SVGCircularProgress from '@components/SVGCircularProgress';
import {MiniBarChart, type BarDatum} from '@components/charts/MiniBarChart';
import {ContributionHeatmap} from '@components/charts/ContributionHeatmap';
import {
  summarizeHeatmapCells,
  buildHeatmapA11yLabel,
} from '@lib/a11y/heatmapSummary';
import {MemoryShareCardModal} from '@components/memory/MemoryShareCardModal';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const MAX_BOOK_ROWS = 8;

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STRUGGLING_ROWS = 5;
const MAX_LEECH_ROWS = 5;

/** Compact, language-neutral axis labels for the retention bands. */
const RETENTION_LABELS: Record<string, string> = {
  d1: '1d',
  d2_3: '2-3',
  d4_7: '4-7',
  d8_14: '8-14',
  d15_30: '15-30',
  d30plus: '30+',
};

export default function MemoryInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {cards} = useMemoryDeck();
  // Sprint 47 — the review-event log + daily goal load via this hook, which
  // also refreshes on focus (returning from practice updates the stats).
  // Passing the deck lets leech detection survive a reinstall via the synced
  // cards' lapseCount even before the local review log re-accumulates.
  const {
    loaded: eventsLoaded,
    events,
    history,
    goal,
    showRestoreBanner,
    dismissRestoreBanner,
  } = useMemoryGoal(cards);
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [shareCardVisible, setShareCardVisible] = useState(false);

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  // Capture "now" once per mount so every chart agrees on the same clock.
  const now = useMemo(() => new Date(), []);
  const insights = useMemo(() => computeDeckInsights(cards, now), [cards, now]);

  const i = t.memory.insights;
  const g = t.memory.goal;
  const isEmpty = cards.length === 0;

  // T8.1 — revert the "full history" toggle if the entitlement is lost
  // while it's on (e.g. a refund), same pattern as the reader's premium
  // theme/font toggles.
  React.useEffect(() => {
    if (!isPremium && showFullHistory) setShowFullHistory(false);
  }, [isPremium, showFullHistory]);

  // T8.1 — full-history heatmap (premium): spans every review ever logged
  // instead of the free HEATMAP_WEEKS window. Falls back to the free
  // heatmap whenever the toggle is off or the entitlement isn't active.
  const extendedWeeks = useMemo(
    () => weeksSinceFirstEvent(events, now),
    [events, now],
  );
  const displayedHeatmap = useMemo(
    () =>
      showFullHistory && isPremium
        ? reviewHeatmap(events, now, extendedWeeks)
        : history.heatmap,
    [showFullHistory, isPremium, events, now, extendedWeeks, history.heatmap],
  );

  // T8.1 — per-book retention breakdown (premium).
  const bookRows = useMemo(() => retentionByBook(events), [events]);
  const topBookRows = bookRows.slice(0, MAX_BOOK_ROWS);

  // T8.1 — month-by-month retention trend (premium).
  const trendPoints = useMemo(() => retentionTrend(events, now), [events, now]);
  const trendData: BarDatum[] = trendPoints.map(p => {
    const d = new Date(p.monthStartMs);
    return {
      label: i.monthsShort[d.getMonth()] ?? '',
      value: p.retention == null ? 0 : Math.round(p.retention * 100),
    };
  });
  const hasTrendData = trendPoints.some(p => p.total > 0);

  // Box distribution — box 5 reads as "mastered" (success), rest primary.
  const distributionData: BarDatum[] = insights.distribution.map(d => ({
    label: String(d.box),
    value: d.count,
    color: d.box === 5 ? colors.success : colors.primary,
  }));

  // Forecast — today (offset 0) highlighted; the rest labeled by weekday.
  const forecastData: BarDatum[] = insights.forecast.map(d => ({
    label:
      d.offset === 0 ? i.today : weekdayShort(now, d.offset, i.weekdaysShort),
    value: d.count,
    color: d.offset === 0 ? colors.warning : colors.primary,
  }));

  const topStruggling = insights.struggling.slice(0, MAX_STRUGGLING_ROWS);

  // Heatmap intensity ramp: empty = border, then the success color at
  // four growing opacities (theme colors are hex, so alpha suffixes work).
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

  // Retention curve — only bands that actually have reviews; the bar
  // value is the recall percentage for that elapsed-interval band.
  const retentionData: BarDatum[] = history.retention
    .filter(b => b.total > 0)
    .map(b => ({
      label: RETENTION_LABELS[b.key] ?? b.key,
      value: Math.round((b.retention ?? 0) * 100),
      color: colors.primary,
    }));
  // Local-first quota feature — a freshly-restored device has zero local
  // `events`, so `history.summary` (events-only by design, see history.ts)
  // stays at zero/null even though the heatmap/retention bands above it
  // already show real floor-restored data. Gate on the floor-merged views
  // themselves (`displayedHeatmap`/`history.retention`), not the events-only
  // summary, so this card doesn't show an empty state while the streak card
  // right above it shows a real streak.
  const hasEvents = displayedHeatmap.windowTotal > 0;
  const retentionTotals = history.retention.reduce(
    (acc, b) => ({
      total: acc.total + b.total,
      recalled: acc.recalled + b.recalled,
    }),
    {total: 0, recalled: 0},
  );
  const overallRetention =
    retentionTotals.total > 0
      ? retentionTotals.recalled / retentionTotals.total
      : null;
  const hasRetention = overallRetention !== null && retentionData.length > 0;
  const topLeeches = history.leeches.slice(0, MAX_LEECH_ROWS);

  // Sprint 48 — the calibrated ease prior new cards start at, derived from
  // the same retention history shown above. Cheap; recompute with the summary.
  const easePrior = useMemo(
    () => computeEasePrior(history.summary),
    [history.summary],
  );
  const calibrationRemaining = Math.max(
    0,
    MIN_CALIBRATION_REVIEWS - easePrior.sampleSize,
  );

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
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="stats-chart" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>{i.subtitle}</Text>
              <Text style={styles.headerTitle}>{i.title}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
          ]}>
          {isEmpty ? (
            <View style={[styles.emptyCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {i.emptyTitle}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {i.emptyBody}
              </Text>
            </View>
          ) : (
            <>
              {showRestoreBanner && (
                <RestoreBanner
                  text={i.restoreBannerText}
                  dismissLabel={i.restoreBannerDismiss}
                  onDismiss={dismissRestoreBanner}
                  colors={colors}
                />
              )}

              {/* 0 — Streak + daily goal hero (Sprint 47) */}
              <InsightCard title={g.heroTitle} colors={colors}>
                <View style={styles.masteryRow}>
                  <SVGCircularProgress
                    progress={Math.round(goal.fraction * 100)}
                    size={116}
                    strokeWidth={12}
                    color={goal.met ? colors.success : colors.primary}
                    label={g.dailyGoal}
                    animated
                  />
                  <View style={styles.goalInfo}>
                    <View style={styles.goalStreakLine}>
                      <Ionicons
                        name="flame"
                        size={22}
                        color={
                          history.summary.currentStreak > 0
                            ? colors.warning
                            : colors.textTertiary
                        }
                      />
                      <Text
                        style={[styles.goalStreakValue, {color: colors.text}]}>
                        {history.summary.currentStreak}
                      </Text>
                      <Text
                        style={[
                          styles.goalStreakLabel,
                          {color: colors.textSecondary},
                        ]}>
                        {i.streakCurrent}
                      </Text>
                    </View>
                    <Text style={[styles.goalTodayText, {color: colors.text}]}>
                      {g.todayCount
                        .replace('{{done}}', String(goal.todayCount))
                        .replace('{{goal}}', String(goal.goal))}
                    </Text>
                    <Text
                      style={[
                        styles.goalRemainingText,
                        {color: goal.met ? colors.success : colors.primary},
                      ]}>
                      {goal.met
                        ? g.goalMet
                        : goal.remaining === 1
                          ? g.remainingSingular
                          : g.remaining.replace(
                              '{{count}}',
                              String(goal.remaining),
                            )}
                    </Text>
                  </View>
                </View>
              </InsightCard>

              {/* 1 — Mastery hero */}
              <InsightCard title={i.masteryTitle} colors={colors}>
                <View style={styles.masteryRow}>
                  <SVGCircularProgress
                    progress={insights.summary.masteredPercent}
                    size={116}
                    strokeWidth={12}
                    color={colors.success}
                    label={i.masteredLabel}
                    animated
                  />
                  <View style={styles.statsGrid}>
                    <HeroStat
                      value={insights.summary.total}
                      label={i.statTotal}
                      colors={colors}
                    />
                    <HeroStat
                      value={insights.summary.due}
                      label={i.statDue}
                      colors={colors}
                    />
                    <HeroStat
                      value={insights.summary.totalReviews}
                      label={i.statReviews}
                      colors={colors}
                    />
                    <HeroStat
                      value={insights.summary.averageBox}
                      label={i.statAvgBox}
                      colors={colors}
                    />
                  </View>
                </View>
              </InsightCard>

              {/* 2 — Box distribution */}
              <InsightCard
                title={i.distributionTitle}
                hint={i.distributionHint}
                colors={colors}>
                <MiniBarChart
                  data={distributionData}
                  barColor={colors.primary}
                  trackColor={colors.border}
                  labelColor={colors.textSecondary}
                  valueColor={colors.textTertiary}
                />
              </InsightCard>

              {/* 3 — Review forecast */}
              <InsightCard
                title={i.forecastTitle}
                hint={i.forecastHint}
                colors={colors}>
                <MiniBarChart
                  data={forecastData}
                  height={100}
                  barColor={colors.primary}
                  trackColor={colors.border}
                  labelColor={colors.textSecondary}
                  valueColor={colors.textTertiary}
                />
              </InsightCard>

              {/* 4 — Struggling verses */}
              <InsightCard
                title={i.strugglingTitle}
                hint={i.strugglingHint}
                colors={colors}>
                {topStruggling.length === 0 ? (
                  <Text style={[styles.positiveNote, {color: colors.success}]}>
                    {i.strugglingEmpty}
                  </Text>
                ) : (
                  topStruggling.map(s => (
                    <StruggleRow
                      key={s.card.verseKey}
                      item={s}
                      language={language}
                      t={t}
                      colors={colors}
                    />
                  ))
                )}
              </InsightCard>

              {/* 5 & 6 — History (Sprint 45), shown once the log loads */}
              {eventsLoaded && (
                <>
                  {/* 5 — Review-activity heatmap */}
                  <InsightCard
                    title={i.heatmapTitle}
                    hint={i.heatmapHint}
                    colors={colors}>
                    {hasEvents ? (
                      <>
                        {showFullHistory && isPremium ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator>
                            <ContributionHeatmap
                              cells={displayedHeatmap.cells}
                              levelColors={heatLevelColors}
                              columnWidth={14}
                              accessibilityLabel={buildHeatmapA11yLabel({
                                title: i.heatmapTitle,
                                activeDays: summarizeHeatmapCells(
                                  displayedHeatmap.cells,
                                ).activeDays,
                                daysWord: i.activeDays,
                              })}
                            />
                          </ScrollView>
                        ) : (
                          <ContributionHeatmap
                            cells={displayedHeatmap.cells}
                            levelColors={heatLevelColors}
                            accessibilityLabel={buildHeatmapA11yLabel({
                              title: i.heatmapTitle,
                              activeDays: summarizeHeatmapCells(
                                displayedHeatmap.cells,
                              ).activeDays,
                              daysWord: i.activeDays,
                            })}
                          />
                        )}
                        <TouchableOpacity
                          style={styles.fullHistoryToggle}
                          onPress={() => {
                            haptics.tap();
                            if (!isPremium) {
                              openOfferingSheet();
                              return;
                            }
                            setShowFullHistory(v => !v);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={
                            isPremium
                              ? showFullHistory
                                ? i.fullHistoryToggleOff
                                : i.fullHistoryToggle
                              : `${i.fullHistoryToggle} — ${t.offering.badgeA11y}`
                          }>
                          {!isPremium ? (
                            <View
                              style={[
                                styles.miniLockBadge,
                                {backgroundColor: colors.primary},
                              ]}>
                              <Ionicons
                                name="leaf-outline"
                                size={10}
                                color={colors.onPrimary}
                              />
                            </View>
                          ) : null}
                          <Text
                            style={[
                              styles.fullHistoryToggleText,
                              {color: colors.primary},
                            ]}>
                            {isPremium && showFullHistory
                              ? i.fullHistoryToggleOff
                              : i.fullHistoryToggle}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.legendRow}>
                          <Text
                            style={[
                              styles.legendText,
                              {color: colors.textTertiary},
                            ]}>
                            {i.legendLess}
                          </Text>
                          {heatLevelColors.map((c, idx) => (
                            <View
                              key={idx}
                              style={[styles.legendCell, {backgroundColor: c}]}
                            />
                          ))}
                          <Text
                            style={[
                              styles.legendText,
                              {color: colors.textTertiary},
                            ]}>
                            {i.legendMore}
                          </Text>
                        </View>
                        <View style={styles.miniStatsRow}>
                          <MiniStat
                            value={history.summary.currentStreak}
                            label={i.streakCurrent}
                            colors={colors}
                          />
                          <MiniStat
                            value={history.summary.longestStreak}
                            label={i.streakLongest}
                            colors={colors}
                          />
                          <MiniStat
                            value={history.summary.activeDays}
                            label={i.activeDays}
                            colors={colors}
                          />
                        </View>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.positiveNote,
                          {color: colors.textSecondary},
                        ]}>
                        {i.heatmapEmpty}
                      </Text>
                    )}
                  </InsightCard>

                  {/* 6 — Retention by interval */}
                  <InsightCard
                    title={i.retentionTitle}
                    hint={i.retentionHint}
                    colors={colors}>
                    {hasRetention ? (
                      <>
                        <View style={styles.retentionHeadline}>
                          <Text
                            style={[
                              styles.retentionValue,
                              {color: colors.success},
                            ]}>
                            {Math.round((overallRetention ?? 0) * 100)}%
                          </Text>
                          <Text
                            style={[
                              styles.retentionLabel,
                              {color: colors.textSecondary},
                            ]}>
                            {i.overallRetention}
                          </Text>
                        </View>
                        <MiniBarChart
                          data={retentionData}
                          height={100}
                          barColor={colors.primary}
                          trackColor={colors.border}
                          labelColor={colors.textSecondary}
                          valueColor={colors.textTertiary}
                        />
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.positiveNote,
                          {color: colors.textSecondary},
                        ]}>
                        {i.retentionEmpty}
                      </Text>
                    )}
                  </InsightCard>

                  {/* 7 — Scheduling calibration (Sprint 48) */}
                  <InsightCard
                    title={i.calibrationTitle}
                    hint={i.calibrationHint}
                    colors={colors}>
                    {easePrior.calibrated ? (
                      <>
                        <View style={styles.retentionHeadline}>
                          <Text
                            style={[
                              styles.retentionValue,
                              {color: colors.primary},
                            ]}>
                            {easePrior.ease.toFixed(2)}×
                          </Text>
                          <Text
                            style={[
                              styles.retentionLabel,
                              {color: colors.textSecondary},
                            ]}>
                            {i.calibrationPace}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.calibrationVerdict,
                            {color: colors.text},
                          ]}>
                          {easePrior.ease > DEFAULT_EASE
                            ? i.calibrationSlower
                            : easePrior.ease < DEFAULT_EASE
                              ? i.calibrationFaster
                              : i.calibrationNeutral}
                        </Text>
                        <Text
                          style={[
                            styles.calibrationBasis,
                            {color: colors.textTertiary},
                          ]}>
                          {i.calibrationBasis
                            .replace(
                              '{{pct}}',
                              String(
                                Math.round(
                                  (easePrior.observedRetention ?? 0) * 100,
                                ),
                              ),
                            )
                            .replace('{{count}}', String(easePrior.sampleSize))}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.positiveNote,
                          {color: colors.textSecondary},
                        ]}>
                        {calibrationRemaining === 1
                          ? i.calibrationLearningSingular
                          : i.calibrationLearning.replace(
                              '{{count}}',
                              String(calibrationRemaining),
                            )}
                      </Text>
                    )}
                  </InsightCard>

                  {/* 8 — Leeches (verses lapsed most often) */}
                  <InsightCard
                    title={i.leechesTitle}
                    hint={i.leechesHint}
                    colors={colors}>
                    {topLeeches.length === 0 ? (
                      <Text
                        style={[styles.positiveNote, {color: colors.success}]}>
                        {i.leechesEmpty}
                      </Text>
                    ) : (
                      topLeeches.map(leech => (
                        <LeechRow
                          key={leech.verseKey}
                          leech={leech}
                          language={language}
                          t={t}
                          colors={colors}
                        />
                      ))
                    )}
                  </InsightCard>

                  {/* 9 — Retention by book (T8.1, premium) */}
                  <InsightCard
                    title={i.byBookTitle}
                    hint={i.byBookHint}
                    exclusiveLabel={i.exclusiveLabel}
                    colors={colors}>
                    {isPremium ? (
                      bookRows.length === 0 ? (
                        <Text
                          style={[
                            styles.positiveNote,
                            {color: colors.textSecondary},
                          ]}>
                          {i.byBookEmpty}
                        </Text>
                      ) : (
                        topBookRows.map(row => (
                          <BookRow
                            key={row.bookName}
                            row={row}
                            language={language}
                            colors={colors}
                          />
                        ))
                      )
                    ) : (
                      <LockedTeaser
                        text={i.byBookLocked}
                        colors={colors}
                        onPress={() => {
                          haptics.tap();
                          openOfferingSheet();
                        }}
                        a11yLabel={`${i.byBookTitle} — ${t.offering.badgeA11y}`}
                      />
                    )}
                  </InsightCard>

                  {/* 10 — Retention trend (T8.1, premium) */}
                  <InsightCard
                    title={i.trendTitle}
                    hint={i.trendHint}
                    exclusiveLabel={i.exclusiveLabel}
                    colors={colors}>
                    {isPremium ? (
                      hasTrendData ? (
                        <MiniBarChart
                          data={trendData}
                          height={100}
                          barColor={colors.primary}
                          trackColor={colors.border}
                          labelColor={colors.textSecondary}
                          valueColor={colors.textTertiary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.positiveNote,
                            {color: colors.textSecondary},
                          ]}>
                          {i.retentionEmpty}
                        </Text>
                      )
                    ) : (
                      <LockedTeaser
                        text={i.trendLocked}
                        colors={colors}
                        onPress={() => {
                          haptics.tap();
                          openOfferingSheet();
                        }}
                        a11yLabel={`${i.trendTitle} — ${t.offering.badgeA11y}`}
                      />
                    )}
                  </InsightCard>

                  {/* 11 — Share progress card (T8.1, premium) */}
                  <TouchableOpacity
                    style={[
                      styles.shareButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      haptics.tap();
                      if (!isPremium) {
                        openOfferingSheet();
                        return;
                      }
                      setShareCardVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPremium
                        ? i.shareProgressButton
                        : `${i.shareProgressButton} — ${t.offering.badgeA11y}`
                    }>
                    {!isPremium ? (
                      <View
                        style={[
                          styles.miniLockBadge,
                          {backgroundColor: colors.primary},
                        ]}>
                        <Ionicons
                          name="leaf-outline"
                          size={10}
                          color={colors.onPrimary}
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name="share-social-outline"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[styles.shareButtonText, {color: colors.primary}]}>
                      {i.shareProgressButton}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {isPremium ? (
        <MemoryShareCardModal
          visible={shareCardVisible}
          onClose={() => setShareCardVisible(false)}
          totalVerses={insights.summary.total}
          retention={overallRetention}
          streak={history.summary.currentStreak}
        />
      ) : null}
    </>
  );
}

/** Weekday abbreviation for `offset` days from `now`, via the localized
 *  Sunday-first array (matches Date.getDay()). */
function weekdayShort(now: Date, offset: number, names: string[]): string {
  const d = new Date(now.getTime() + offset * DAY_MS);
  return names[d.getDay()] ?? '';
}

/** One-time notice shown right after a fresh-device restore floor seed —
 *  explains why streak/heatmap/retention already show data the user didn't
 *  generate on this device. Dismissed for good once tapped away; never
 *  reappears after that (see `useMemoryGoal`'s `dismissRestoreBanner`). */
const RestoreBanner: React.FC<{
  text: string;
  dismissLabel: string;
  onDismiss: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({text, dismissLabel, onDismiss, colors}) => (
  <View
    style={[
      styles.restoreBanner,
      {
        backgroundColor: colors.primary + '14',
        borderColor: colors.primary + '40',
      },
    ]}
    accessibilityRole="alert">
    <Ionicons
      name="cloud-download-outline"
      size={20}
      color={colors.primary}
      style={styles.restoreBannerIcon}
    />
    <Text style={[styles.restoreBannerText, {color: colors.text}]}>{text}</Text>
    <TouchableOpacity
      onPress={onDismiss}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      accessibilityRole="button"
      accessibilityLabel={dismissLabel}>
      <Ionicons name="close" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

interface InsightCardProps {
  title: string;
  hint?: string;
  /** T8.1 — shown as a small pill next to the title on premium sections,
   *  regardless of unlocked state (same convention as the reader's
   *  exclusive themes/fonts). */
  exclusiveLabel?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}
const InsightCard: React.FC<InsightCardProps> = ({
  title,
  hint,
  exclusiveLabel,
  colors,
  children,
}) => (
  <View
    style={[
      styles.card,
      {backgroundColor: colors.surface, borderColor: colors.border},
    ]}>
    <View style={styles.cardTitleRow}>
      <Text style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
      {exclusiveLabel ? (
        <View
          style={[
            styles.exclusiveBadge,
            {backgroundColor: colors.primary + '1a'},
          ]}>
          <Text style={[styles.exclusiveText, {color: colors.primary}]}>
            {exclusiveLabel}
          </Text>
        </View>
      ) : null}
    </View>
    {hint ? (
      <Text style={[styles.cardHint, {color: colors.textSecondary}]}>
        {hint}
      </Text>
    ) : null}
    <View style={styles.cardBody}>{children}</View>
  </View>
);

/** A row in the T8.1 "retention by book" list. */
const BookRow: React.FC<{
  row: BookRetentionRow;
  language: 'es' | 'en';
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({row, language, colors}) => {
  const bookInfo = getBookByName(row.bookName);
  const displayBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : row.bookName;
  const pct = row.retention == null ? null : Math.round(row.retention * 100);
  return (
    <View style={[styles.struggleRow, {borderTopColor: colors.border}]}>
      <View style={styles.struggleMain}>
        <Text style={[styles.struggleRef, {color: colors.text}]}>
          {displayBook}
        </Text>
        <Text style={[styles.struggleMeta, {color: colors.textTertiary}]}>
          {row.totalReviews}
        </Text>
      </View>
      {pct != null ? (
        <View
          style={[styles.boxBadge, {backgroundColor: colors.primary + '15'}]}>
          <Text style={[styles.boxBadgeText, {color: colors.primary}]}>
            {pct}%
          </Text>
        </View>
      ) : null}
    </View>
  );
};

/** T8.1 — the subtle locked-with-offering row shared by the new sections. */
const LockedTeaser: React.FC<{
  text: string;
  a11yLabel: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}> = ({text, a11yLabel, colors, onPress}) => (
  <TouchableOpacity
    style={styles.lockedTeaserRow}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={a11yLabel}>
    <View style={[styles.miniLockBadge, {backgroundColor: colors.primary}]}>
      <Ionicons name="leaf-outline" size={10} color={colors.onPrimary} />
    </View>
    <Text style={[styles.lockedTeaserText, {color: colors.textSecondary}]}>
      {text}
    </Text>
  </TouchableOpacity>
);

const HeroStat: React.FC<{
  value: number;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({value, label, colors}) => (
  <View style={styles.heroStat}>
    <Text style={[styles.heroStatValue, {color: colors.text}]}>{value}</Text>
    <Text style={[styles.heroStatLabel, {color: colors.textSecondary}]}>
      {label}
    </Text>
  </View>
);

/** A compact 1-of-3 stat used beneath the heatmap (streaks / active days). */
const MiniStat: React.FC<{
  value: number;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({value, label, colors}) => (
  <View style={styles.miniStat}>
    <Text style={[styles.miniStatValue, {color: colors.text}]}>{value}</Text>
    <Text
      style={[styles.miniStatLabel, {color: colors.textSecondary}]}
      numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const StruggleRow: React.FC<{
  item: StrugglingCard;
  language: 'es' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({item, language, t, colors}) => {
  const {card} = item;
  const bookInfo = getBookByName(card.bookName);
  const displayBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : card.bookName;
  const reference = `${displayBook} ${card.chapter}:${card.verse}`;
  const reviewsLabel =
    card.reviewCount === 1
      ? t.memory.insights.reviewsCountSingular
      : t.memory.insights.reviewsCount.replace(
          '{{count}}',
          String(card.reviewCount),
        );

  return (
    <View style={[styles.struggleRow, {borderTopColor: colors.border}]}>
      <View style={styles.struggleMain}>
        <Text style={[styles.struggleRef, {color: colors.text}]}>
          {reference}
        </Text>
        <Text style={[styles.struggleMeta, {color: colors.textTertiary}]}>
          {reviewsLabel}
        </Text>
      </View>
      <View style={[styles.boxBadge, {backgroundColor: colors.primary + '15'}]}>
        <Text style={[styles.boxBadgeText, {color: colors.primary}]}>
          {t.memory.box.replace('{{n}}', String(card.box))}
        </Text>
      </View>
    </View>
  );
};

const LeechRow: React.FC<{
  leech: LeechCard;
  language: 'es' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({leech, language, t, colors}) => {
  // verseKey is "Book/Chapter/Verse" — the last two segments are the
  // chapter and verse; the book is localized via the stored book name.
  const parts = leech.verseKey.split('/');
  const verse = parts[parts.length - 1] ?? '';
  const chapter = parts[parts.length - 2] ?? '';
  const bookInfo = getBookByName(leech.bookName);
  const displayBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : leech.bookName;
  const reference = `${displayBook} ${chapter}:${verse}`;
  const i = t.memory.insights;
  const reviewsLabel =
    leech.totalReviews === 1
      ? i.reviewsCountSingular
      : i.reviewsCount.replace('{{count}}', String(leech.totalReviews));
  const lapsesLabel =
    leech.lapses === 1
      ? i.lapsesBadgeSingular
      : i.lapsesBadge.replace('{{count}}', String(leech.lapses));
  const warn = colors.warning;

  return (
    <View style={[styles.struggleRow, {borderTopColor: colors.border}]}>
      <View style={styles.struggleMain}>
        <Text style={[styles.struggleRef, {color: colors.text}]}>
          {reference}
        </Text>
        <Text style={[styles.struggleMeta, {color: colors.textTertiary}]}>
          {reviewsLabel}
        </Text>
      </View>
      <View style={[styles.boxBadge, {backgroundColor: warn + '22'}]}>
        <Text style={[styles.boxBadgeText, {color: warn}]}>{lapsesLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.glassWhite15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: staticColors.glassWhite80,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  restoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  restoreBannerIcon: {
    marginTop: 1,
  },
  restoreBannerText: {
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  cardHint: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  cardBody: {
    marginTop: spacing.md,
  },
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fullHistoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fullHistoryToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  miniLockBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  lockedTeaserText: {
    fontSize: fontSizes.sm,
    flexShrink: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  shareButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  goalStreakLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalStreakValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  goalStreakLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  goalTodayText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  goalRemainingText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  heroStat: {
    width: '50%',
  },
  heroStatValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  positiveNote: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.md,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  retentionHeadline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  retentionValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  retentionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  calibrationVerdict: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  calibrationBasis: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  struggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  struggleMain: {
    flex: 1,
  },
  struggleRef: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  struggleMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  boxBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  boxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
