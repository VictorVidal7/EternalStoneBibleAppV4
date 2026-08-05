/**
 * 🧭 EXPLORAR TODO — the complete "browse all features" catalogue.
 *
 * Home's "Explorar" discover grid was trimmed from 11 tiles down to 6 (the
 * ones consulted most often), to keep Home from growing without bound —
 * this app has shipped roughly one new discovery feature every few sprints
 * for over a hundred sprints, and Home can't keep absorbing every one of
 * them forever. This screen is the other half of that reorg: the full,
 * always-reachable index of all 11 discover tiles (same `DiscoverTile`
 * component and the same routes Home's own grid uses), so nothing is ever
 * lost from view and future discovery features have somewhere to land
 * besides an ever-growing Home screen.
 *
 * Reached from Home's "Explorar" section via a "ver todo" link (wired on
 * Home's side, `app/(tabs)/index.tsx`) at `/features/explore-all`.
 *
 * Mirrors the header + back-button pattern of the other simple browse hubs
 * (`app/features/journeys/index.tsx`, `app/features/theology/index.tsx`) —
 * no new header style invented here.
 *
 * REDESIGN (combines 3 polish specs into one screen, all touching the same
 * `DiscoverTile` component so they had to land together):
 *
 *  1. A featured/hero card (`ExploreFeaturedCard`) above everything else,
 *     picking whichever category the reader most recently navigated into
 *     FROM this screen (`src/features/explore/exploreRecency.ts`, purely
 *     local AsyncStorage — no Firestore, nothing to sync). First run / no
 *     history yet falls back to a fixed default (Diccionario).
 *  2. The remaining categories are grouped under section headers (mirroring
 *     Home's own `sectionHeader`/`sectionTitle` style) instead of the old
 *     fixed 2-column grid.
 *  3. Each category carries its own `accentColor` (see
 *     `src/features/explore/exploreCategories.ts`) and renders as a compact
 *     dense-list row (`DiscoverTile`'s new `variant="dense"`) rather than a
 *     2-column tile — the previous ~124px tile grid (and its pixel-exact
 *     `TILE_WIDTH` math) is intentionally retired here in favor of the
 *     dense list.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {DiscoverTile} from '@components/home/DiscoverTile';
import {ExploreFeaturedCard} from '@components/explore/ExploreFeaturedCard';
import {centeredMaxWidth} from '@/styles/responsive';
import {getDailyProphecy} from '@/features/study/messianicProphecies';
import {getDailyFact} from '@/features/study/bibleFacts';
import {
  EXPLORE_CATEGORIES,
  getExploreCategoryIds,
  type ExploreCategoryDef,
} from '@/features/explore/exploreCategories';
import {
  getLastVisitedCategoryId,
  recordCategoryVisit,
  resolveFeaturedCategoryId,
} from '@/features/explore/exploreRecency';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const EXPLORE_CATEGORY_IDS = getExploreCategoryIds();

export default function ExploreAllScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const te = t.exploreAll;

  // Recency-based featured category (T-hero-redesign): read once on mount.
  // Starts `null` (no opinion yet) so the very first render already shows
  // the deterministic first-run fallback via `resolveFeaturedCategoryId`
  // rather than a flash of nothing.
  const [lastVisitedId, setLastVisitedId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getLastVisitedCategoryId().then(id => {
      if (!cancelled) setLastVisitedId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredId = useMemo(
    () => resolveFeaturedCategoryId(lastVisitedId, EXPLORE_CATEGORY_IDS),
    [lastVisitedId],
  );

  // Mirrors Home's own "today's ___" teaser logic for the two tiles whose
  // subtitle rotates daily (Hilo profético / ¿Sabías qué?), so this
  // catalogue reads identically to the tiles it's cataloguing.
  const dailyProphecyLabel = useMemo(() => {
    const p = getDailyProphecy();
    return (t.prophecies.items as Record<string, {label: string}>)[p.id]?.label;
  }, [t.prophecies.items]);

  const dailyFactLabel = useMemo(() => {
    const f = getDailyFact();
    return (t.bibleFacts.items as Record<string, {label: string}>)[f.id]?.label;
  }, [t.bibleFacts.items]);

  // Per-category title/subtitle, keyed by the same `id` exploreCategories.ts
  // uses — the one place daily-rotating copy (prophecies/facts) and the
  // catalogue's differing i18n shapes (`.title`/`.subtitle` vs
  // `.cardTitle`/`.cardSubtitle`) get reconciled into one uniform shape.
  const categoryContent = useMemo<
    Record<string, {title: string; subtitle: string}>
  >(
    () => ({
      dailyLight: {
        title: t.dailyLight.cardTitle,
        subtitle: t.dailyLight.cardSubtitle,
      },
      themes: {title: t.themes.cardTitle, subtitle: t.themes.cardSubtitle},
      prophecies: {
        title: t.prophecies.title,
        subtitle: dailyProphecyLabel
          ? `${t.prophecies.todayLabel} · ${dailyProphecyLabel}`
          : t.prophecies.subtitle,
      },
      bibleFacts: {
        title: t.bibleFacts.title,
        subtitle: dailyFactLabel
          ? `${t.bibleFacts.todayLabel} · ${dailyFactLabel}`
          : t.bibleFacts.subtitle,
      },
      journeys: {title: t.journeys.title, subtitle: t.journeys.subtitle},
      kids: {title: t.kids.cardTitle, subtitle: t.kids.cardSubtitle},
      quiz: {title: t.quiz.cardTitle, subtitle: t.quiz.cardSubtitle},
      dictionary: {
        title: t.dictionary.cardTitle,
        subtitle: t.dictionary.cardSubtitle,
      },
      sermonNotes: {
        title: t.sermonNotes.cardTitle,
        subtitle: t.sermonNotes.cardSubtitle,
      },
      theology: {
        title: t.theology.cardTitle,
        subtitle: t.theology.cardSubtitle,
      },
      shareFaith: {
        title: t.shareFaith.cardTitle,
        subtitle: t.shareFaith.cardSubtitle,
      },
    }),
    [t, dailyProphecyLabel, dailyFactLabel],
  );

  const featuredCategory =
    EXPLORE_CATEGORIES.find(c => c.id === featuredId) ?? EXPLORE_CATEGORIES[0];
  const remainingCategories = EXPLORE_CATEGORIES.filter(
    c => c.id !== featuredCategory.id,
  );
  const popularSection = remainingCategories.filter(
    c => c.section === 'popular',
  );
  const moreSection = remainingCategories.filter(c => c.section === 'more');

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const goToCategory = (category: ExploreCategoryDef) => {
    haptics.tap();
    // Fire-and-forget local write — never blocks navigation (see
    // exploreRecency.ts's `recordCategoryVisit`).
    recordCategoryVisit(category.id);
    router.push(category.route as never);
  };

  // A deep link straight into this screen leaves no back-stack entry, so
  // router.back() would throw a "GO_BACK not handled" navigation error —
  // same guard as journeys/index.tsx.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/' as never);
  };

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
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="compass" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {te.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {te.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <ExploreFeaturedCard
            icon={featuredCategory.icon as keyof typeof Ionicons.glyphMap}
            eyebrow={te.featuredEyebrow}
            title={categoryContent[featuredCategory.id]?.title ?? ''}
            subtitle={categoryContent[featuredCategory.id]?.subtitle ?? ''}
            accentColor={featuredCategory.accentColor}
            onPress={() => goToCategory(featuredCategory)}
          />

          {popularSection.length > 0 && (
            <View style={styles.section}>
              <AppText style={[styles.sectionTitle, {color: colors.text}]}>
                {te.sectionPopular}
              </AppText>
              <View style={styles.sectionList}>
                {popularSection.map(category => (
                  <DiscoverTile
                    key={category.id}
                    variant="dense"
                    icon={category.icon as keyof typeof Ionicons.glyphMap}
                    accentColor={category.accentColor}
                    title={categoryContent[category.id]?.title ?? ''}
                    subtitle={categoryContent[category.id]?.subtitle ?? ''}
                    onPress={() => goToCategory(category)}
                  />
                ))}
              </View>
            </View>
          )}

          {moreSection.length > 0 && (
            <View style={styles.section}>
              <AppText style={[styles.sectionTitle, {color: colors.text}]}>
                {te.sectionMore}
              </AppText>
              <View style={styles.sectionList}>
                {moreSection.map(category => (
                  <DiscoverTile
                    key={category.id}
                    variant="dense"
                    icon={category.icon as keyof typeof Ionicons.glyphMap}
                    accentColor={category.accentColor}
                    title={categoryContent[category.id]?.title ?? ''}
                    subtitle={categoryContent[category.id]?.subtitle ?? ''}
                    onPress={() => goToCategory(category)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {padding: spacing.lg, gap: spacing.lg},
  // Mirrors Home's own sectionHeader/sectionTitle values (app/(tabs)/
  // index.tsx) for visual consistency — this screen has no nested "ver
  // todo" action row to pair it with (it IS the "ver todo" destination),
  // so only the title half of that pattern applies here.
  section: {marginTop: spacing.sm},
  sectionTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  sectionList: {gap: spacing.sm},
});
