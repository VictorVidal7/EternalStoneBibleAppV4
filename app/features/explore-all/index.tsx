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
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {DiscoverTile} from '@components/home/DiscoverTile';
import {centeredMaxWidth, CONTENT_MAX_WIDTH} from '@/styles/responsive';
import {getDailyProphecy} from '@/features/study/messianicProphecies';
import {getDailyFact} from '@/features/study/bibleFacts';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
// Sprint 96's Home grid learned this the hard way (see app/(tabs)/index.tsx):
// a percentage width ('48%') doesn't account for the row gap, so two tiles
// plus the gap overflow the row on every real phone width and Yoga wraps the
// second tile onto its own line — silently collapsing the "grid" into a
// single stacked column. Deriving the width in pixels from the actual
// available content width (capped the same way Home caps it on wide
// screens) guarantees both tiles + the gap always fit on one row.
const EFFECTIVE_CONTENT_WIDTH = Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH);
const TILE_WIDTH = Math.floor(
  (EFFECTIVE_CONTENT_WIDTH - spacing.lg * 2 - spacing.md) / 2,
);

export default function ExploreAllScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const te = t.exploreAll;

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

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const handlePress = (callback: () => void) => {
    haptics.tap();
    callback();
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
          <View style={styles.grid}>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="sunny"
                title={t.dailyLight.cardTitle}
                subtitle={t.dailyLight.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/daily-light' as never),
                  )
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="grid"
                title={t.themes.cardTitle}
                subtitle={t.themes.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/themes' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="git-network"
                title={t.prophecies.title}
                subtitle={
                  dailyProphecyLabel
                    ? `${t.prophecies.todayLabel} · ${dailyProphecyLabel}`
                    : t.prophecies.subtitle
                }
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/prophecies' as never),
                  )
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="bulb"
                title={t.bibleFacts.title}
                subtitle={
                  dailyFactLabel
                    ? `${t.bibleFacts.todayLabel} · ${dailyFactLabel}`
                    : t.bibleFacts.subtitle
                }
                onPress={() =>
                  handlePress(() => router.push('/features/facts' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="map"
                title={t.journeys.title}
                subtitle={t.journeys.subtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/journeys' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="happy"
                title={t.kids.cardTitle}
                subtitle={t.kids.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/kids' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="help-circle"
                title={t.quiz.cardTitle}
                subtitle={t.quiz.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/quiz' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="book"
                title={t.dictionary.cardTitle}
                subtitle={t.dictionary.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/dictionary' as never),
                  )
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="create"
                title={t.sermonNotes.cardTitle}
                subtitle={t.sermonNotes.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/sermon-notes' as never),
                  )
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="school"
                title={t.theology.cardTitle}
                subtitle={t.theology.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/theology' as never))
                }
              />
            </View>
            <View style={styles.tileWrapper}>
              <DiscoverTile
                icon="heart"
                title={t.shareFaith.cardTitle}
                subtitle={t.shareFaith.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/share-faith' as never),
                  )
                }
              />
            </View>
          </View>
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
  content: {padding: spacing.lg},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tileWrapper: {
    width: TILE_WIDTH,
  },
});
