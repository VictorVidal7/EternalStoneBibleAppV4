/**
 * 📊 QUIZ STATS (T18b) — extended, device-local "Quiz bíblico" statistics.
 *
 * Read-only view over `useQuizStats()` (`src/hooks/useQuizStats.ts`), which
 * bridges the React-free `quizStatsStore` — 100% local, never synced (shared
 * Firestore quota; see the store's own header comment). Reached only from the
 * quiz screen's stats icon (`app/features/quiz/index.tsx`'s `handleOpenStats`,
 * which already redirects non-premium taps to the offering sheet instead of
 * navigating here) — the `!isPremium` branch below is a safety net for a
 * direct deep link, not the primary gate.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {AppText} from '@components/ui/AppText';
import {useContentBottomInset} from '@hooks/useContentBottomInset';
import {useQuizStats} from '@/hooks/useQuizStats';
import type {QuizQuestionType} from '@/features/quiz/quizBank';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const QUESTION_TYPES: readonly QuizQuestionType[] = [
  'who-said-it',
  'complete-verse',
  'ref-to-content',
  'event-order',
];

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

export default function QuizStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useContentBottomInset();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const tq = t.quiz;
  const ts = tq.stats;
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const {loaded, summary} = useQuizStats();

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const isEmpty = loaded && summary.questionsAnswered === 0;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
        </View>
        <AppText scaleRole="display" style={styles.headerTitle}>
          {ts.title}
        </AppText>
        <AppText scaleRole="compact" style={styles.headerSubtitle}>
          {ts.subtitle}
        </AppText>
      </LinearGradient>

      {!isPremium ? (
        <View style={styles.lockedContainer}>
          <Ionicons name="leaf-outline" size={40} color={colors.primary} />
          <AppText style={[styles.lockedText, {color: colors.textSecondary}]}>
            {tq.premiumLockedHint}
          </AppText>
          <TouchableOpacity
            style={[styles.unlockBtn, {backgroundColor: colors.primary}]}
            onPress={openOfferingSheet}
            accessibilityRole="button"
            accessibilityLabel={tq.premiumLockedHint}>
            <AppText style={[styles.unlockBtnText, {color: colors.onPrimary}]}>
              {tq.premiumLockedHint}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, {paddingBottom: bottomInset}]}
          showsVerticalScrollIndicator={false}>
          {isEmpty ? (
            <AppText style={[styles.emptyText, {color: colors.textSecondary}]}>
              {ts.empty}
            </AppText>
          ) : (
            <>
              <View style={styles.grid}>
                <StatCard
                  label={ts.roundsPlayed}
                  value={String(summary.roundsPlayed)}
                  colors={colors}
                />
                <StatCard
                  label={ts.questionsAnswered}
                  value={String(summary.questionsAnswered)}
                  colors={colors}
                />
                <StatCard
                  label={ts.overallAccuracy}
                  value={fmtPct(summary.overallAccuracy)}
                  colors={colors}
                />
                <StatCard
                  label={ts.bestRound}
                  value={String(summary.bestRoundScore)}
                  colors={colors}
                />
              </View>

              <AppText style={[styles.sectionTitle, {color: colors.text}]}>
                {ts.byType}
              </AppText>
              <View
                style={[
                  styles.card,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                ]}>
                {QUESTION_TYPES.map(type => {
                  const row = summary.byType[type];
                  return (
                    <View key={type} style={styles.typeRow}>
                      <AppText style={[styles.typeLabel, {color: colors.text}]}>
                        {ts.typeLabels[type]}
                      </AppText>
                      <AppText
                        style={[
                          styles.typeValue,
                          {color: colors.textSecondary},
                        ]}>
                        {row.answered > 0
                          ? `${fmtPct(row.accuracy)} (${row.correct}/${row.answered})`
                          : '—'}
                      </AppText>
                    </View>
                  );
                })}
              </View>

              <AppText style={[styles.sectionTitle, {color: colors.text}]}>
                ⏱ {ts.timedMode} · {ts.normalMode}
              </AppText>
              <View
                style={[
                  styles.card,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                ]}>
                <View style={styles.typeRow}>
                  <AppText style={[styles.typeLabel, {color: colors.text}]}>
                    {ts.timedMode}
                  </AppText>
                  <AppText
                    style={[styles.typeValue, {color: colors.textSecondary}]}>
                    {summary.timed.answered > 0
                      ? `${fmtPct(summary.timed.accuracy)} (${summary.timed.correct}/${summary.timed.answered})`
                      : '—'}
                  </AppText>
                </View>
                <View style={styles.typeRow}>
                  <AppText style={[styles.typeLabel, {color: colors.text}]}>
                    {ts.normalMode}
                  </AppText>
                  <AppText
                    style={[styles.typeValue, {color: colors.textSecondary}]}>
                    {summary.normal.answered > 0
                      ? `${fmtPct(summary.normal.accuracy)} (${summary.normal.correct}/${summary.normal.answered})`
                      : '—'}
                  </AppText>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
  };
}) {
  return (
    <View
      style={[
        styles.statCard,
        {backgroundColor: colors.surface, borderColor: colors.border},
      ]}>
      <AppText style={[styles.statValue, {color: colors.text}]}>
        {value}
      </AppText>
      <AppText style={[styles.statLabel, {color: colors.textSecondary}]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {fontSize: fontSizes.xl, fontWeight: '800'},
  statLabel: {fontSize: fontSizes.xs, fontWeight: '600', textAlign: 'center'},
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  typeValue: {fontSize: fontSizes.sm, fontWeight: '600'},
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  lockedText: {fontSize: fontSizes.md, textAlign: 'center'},
  unlockBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  unlockBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
});
