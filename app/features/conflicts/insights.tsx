/**
 * 🔀 CONFLICT ANALYTICS SCREEN (Sprint 49)
 *
 * Read-only dashboard over the resolved-conflict audit log that the
 * SyncEngine writes to users/{uid}/conflicts (Sprint 43). Five cards:
 *   1. Overview — total resolved + your resolution tendency.
 *   2. How you resolve — keep mine / keep theirs / merge breakdown.
 *   3. By data type — which datasets clash most.
 *   4. Fields in conflict — which fields differ most often.
 *   5. Activity — conflicts resolved per week.
 *
 * Every number comes from `computeConflictAnalytics`, a pure aggregation
 * of the records fetched one-shot via `engine.fetchResolvedConflicts()` —
 * the conflicts collection is an audit log, not a synced dataset, so we
 * read it on demand (and refresh on focus) instead of mirroring it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useRouter, Stack, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useSyncEngineOptional} from '@context/SyncEngineContext';
import {
  computeConflictAnalytics,
  MIN_VERDICT_SAMPLE,
  type ConflictAnalytics,
  type ResolvedConflictRecord,
} from '@lib/sync';
import {MiniBarChart, type BarDatum} from '@components/charts/MiniBarChart';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const MAX_FIELD_ROWS = 6;

export default function ConflictInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const ins = t.conflicts.insights;
  const syncCtx = useSyncEngineOptional();
  const engine = syncCtx?.engine;

  const [records, setRecords] = useState<ResolvedConflictRecord[] | null>(null);
  const [error, setError] = useState(false);

  // Capture "now" once per mount so every weekly bucket agrees on the clock.
  const now = useMemo(() => new Date(), []);

  const runFetch = useCallback(() => {
    let active = true;
    setError(false);
    (async () => {
      if (!engine) {
        if (active) setError(true);
        return;
      }
      try {
        const recs = await engine.fetchResolvedConflicts();
        if (active) {
          setRecords(recs);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [engine]);

  // Refresh on focus — resolving a new conflict elsewhere shows up on return.
  useFocusEffect(runFetch);

  const analytics: ConflictAnalytics = useMemo(
    () => computeConflictAnalytics(records ?? [], now),
    [records, now],
  );

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#dc2626', '#ea580c', '#f59e0b'] as [string, string, string]),
    [gradient?.headerColors],
  );

  const loading = records === null && !error;
  const isEmpty = !loading && !error && analytics.total === 0;

  // --- card data --------------------------------------------------------

  const choiceColors: Record<string, string> = {
    keepMine: colors.primary,
    keepTheirs: colors.warning ?? colors.error,
    merge: colors.success,
  };
  const choiceLabels: Record<string, string> = {
    keepMine: ins.choiceMine,
    keepTheirs: ins.choiceTheirs,
    merge: ins.choiceMerge,
  };
  const choiceData: BarDatum[] = analytics.byChoice.map(c => ({
    label: choiceLabels[c.choice] ?? c.choice,
    value: c.count,
    color: choiceColors[c.choice] ?? colors.primary,
  }));

  const collectionLabelMap = ins.collectionLabels as Record<string, string>;
  const collectionData: BarDatum[] = analytics.byCollection.map(c => ({
    label: collectionLabelMap[c.collection] ?? c.collection,
    value: c.count,
    color: colors.primary,
  }));

  const fieldLabelMap = ins.fieldLabels as Record<string, string>;
  const topFields = analytics.byField.slice(0, MAX_FIELD_ROWS);

  // Weekly activity — oldest → newest; the current week (offset 0) pops.
  const activityData: BarDatum[] = analytics.weekly.map(w => ({
    label: w.weeksAgo === 0 ? ins.activityNow : String(w.weeksAgo),
    value: w.count,
    color: w.weeksAgo === 0 ? (colors.warning ?? colors.error) : colors.primary,
  }));

  const verdict = useMemo(() => {
    if (analytics.total < MIN_VERDICT_SAMPLE) return ins.verdictLearning;
    const dominant = analytics.dominantChoice;
    if (!dominant) return ins.verdictBalanced;
    const slice = analytics.byChoice.find(c => c.choice === dominant);
    const pct = Math.round((slice?.fraction ?? 0) * 100);
    const template =
      dominant === 'keepMine'
        ? ins.verdictMine
        : dominant === 'keepTheirs'
          ? ins.verdictTheirs
          : ins.verdictMerge;
    return template.replace('{{pct}}', String(pct));
  }, [analytics, ins]);

  const totalText =
    analytics.total === 1
      ? ins.totalLabelSingular
      : ins.totalLabel.replace('{{count}}', String(analytics.total));

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
              <Ionicons name="git-merge" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>{ins.subtitle}</Text>
              <Text style={styles.headerTitle}>{ins.title}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
          ]}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.stateText, {color: colors.textSecondary}]}>
                {ins.loading}
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.emptyCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {ins.errorTitle}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {ins.errorBody}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, {borderColor: colors.primary}]}
                onPress={runFetch}
                accessibilityRole="button"
                accessibilityLabel={ins.retry}>
                <Text style={[styles.retryText, {color: colors.primary}]}>
                  {ins.retry}
                </Text>
              </TouchableOpacity>
            </View>
          ) : isEmpty ? (
            <View style={[styles.emptyCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {ins.emptyTitle}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {ins.emptyBody}
              </Text>
            </View>
          ) : (
            <>
              {/* 1 — Overview + verdict */}
              <InsightCard title={ins.overviewTitle} colors={colors}>
                <View style={styles.overviewRow}>
                  <Text style={[styles.overviewValue, {color: colors.primary}]}>
                    {analytics.total}
                  </Text>
                  <Text
                    style={[
                      styles.overviewLabel,
                      {color: colors.textSecondary},
                    ]}
                    numberOfLines={2}>
                    {totalText}
                  </Text>
                </View>
                <Text style={[styles.verdictText, {color: colors.text}]}>
                  {verdict}
                </Text>
              </InsightCard>

              {/* 2 — How you resolve */}
              <InsightCard
                title={ins.choiceTitle}
                hint={ins.choiceHint}
                colors={colors}>
                <MiniBarChart
                  data={choiceData}
                  height={100}
                  barColor={colors.primary}
                  trackColor={colors.border}
                  labelColor={colors.textSecondary}
                  valueColor={colors.textTertiary}
                />
              </InsightCard>

              {/* 3 — By data type */}
              {collectionData.length > 0 && (
                <InsightCard
                  title={ins.collectionTitle}
                  hint={ins.collectionHint}
                  colors={colors}>
                  <MiniBarChart
                    data={collectionData}
                    height={100}
                    barColor={colors.primary}
                    trackColor={colors.border}
                    labelColor={colors.textSecondary}
                    valueColor={colors.textTertiary}
                  />
                </InsightCard>
              )}

              {/* 4 — Fields in conflict */}
              <InsightCard
                title={ins.fieldTitle}
                hint={ins.fieldHint}
                colors={colors}>
                {topFields.length === 0 ? (
                  <Text
                    style={[
                      styles.positiveNote,
                      {color: colors.textSecondary},
                    ]}>
                    {ins.fieldEmpty}
                  </Text>
                ) : (
                  topFields.map(f => (
                    <View
                      key={f.field}
                      style={[
                        styles.fieldRow,
                        {borderTopColor: colors.border},
                      ]}>
                      <Text
                        style={[styles.fieldName, {color: colors.text}]}
                        numberOfLines={1}>
                        {fieldLabelMap[f.field] ?? f.field}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          {backgroundColor: colors.primary + '15'},
                        ]}>
                        <Text
                          style={[
                            styles.countBadgeText,
                            {color: colors.primary},
                          ]}>
                          {f.count === 1
                            ? ins.timesBadgeSingular
                            : ins.timesBadge.replace(
                                '{{count}}',
                                String(f.count),
                              )}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </InsightCard>

              {/* 5 — Activity over time */}
              <InsightCard
                title={ins.activityTitle}
                hint={ins.activityHint}
                colors={colors}>
                <MiniBarChart
                  data={activityData}
                  height={100}
                  barColor={colors.primary}
                  trackColor={colors.border}
                  labelColor={colors.textSecondary}
                  valueColor={colors.textTertiary}
                />
              </InsightCard>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
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
  centerState: {
    paddingTop: spacing['4xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  stateText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
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
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  overviewValue: {
    fontSize: 44,
    fontWeight: '800',
  },
  overviewLabel: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  verdictText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  positiveNote: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fieldName: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  retryText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
});
