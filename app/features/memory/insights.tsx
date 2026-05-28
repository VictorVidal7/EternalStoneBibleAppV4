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

import React, {useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {computeDeckInsights, type StrugglingCard} from '@lib/memory/insights';
import {getBookByName} from '@/constants/bible';
import SVGCircularProgress from '@components/SVGCircularProgress';
import {MiniBarChart, type BarDatum} from '@components/charts/MiniBarChart';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STRUGGLING_ROWS = 5;

export default function MemoryInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {cards} = useMemoryDeck();

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
  const isEmpty = cards.length === 0;

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
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

/** Weekday abbreviation for `offset` days from `now`, via the localized
 *  Sunday-first array (matches Date.getDay()). */
function weekdayShort(now: Date, offset: number, names: string[]): string {
  const d = new Date(now.getTime() + offset * DAY_MS);
  return names[d.getDay()] ?? '';
}

interface InsightCardProps {
  title: string;
  hint?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}
const InsightCard: React.FC<InsightCardProps> = ({
  title,
  hint,
  colors,
  children,
}) => (
  <View
    style={[
      styles.card,
      {backgroundColor: colors.surface, borderColor: colors.border},
    ]}>
    <Text style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
    {hint ? (
      <Text style={[styles.cardHint, {color: colors.textSecondary}]}>
        {hint}
      </Text>
    ) : null}
    <View style={styles.cardBody}>{children}</View>
  </View>
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
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
