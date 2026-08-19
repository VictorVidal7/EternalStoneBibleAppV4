/**
 * 🗺️ BIBLE JOURNEY MAPS — "Mapas de viajes bíblicos".
 *
 * A hub listing the app's 5 curated Bible routes ([[journeyMaps]]): Abraham's
 * journey, the Exodus, the exile and return, the ministry of Jesus, and
 * Paul's missionary journeys. Each route card opens its own tappable rail
 * map + stop list at
 * `/features/journeys/[routeId]`.
 *
 * Reached from the Home "Explorar" tile + the deep link
 * eternalbible://features/journeys.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {
  JOURNEY_ROUTE_ORDER,
  JOURNEY_ROUTE_ICON,
  JOURNEY_ROUTE_ACCENT,
  getStopsForRoute,
  getStopCount,
  type JourneyRouteId,
} from '@/features/study/journeyMaps';
import {getVisitedJourneyStops} from '@/features/study/journeyProgress';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';

export default function JourneysHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tj = t.journeys;
  const routes = tj.routes as Record<
    string,
    {title: string; subtitle: string; description: string}
  >;
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [guideVisible, setGuideVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getVisitedJourneyStops().then(set => {
        if (active) setVisited(set);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const openRoute = (route: JourneyRouteId) => {
    haptics.tap();
    router.push(`/features/journeys/${route}` as never);
  };

  // A deep link straight into this screen leaves no back-stack entry, so
  // router.back() would throw a "GO_BACK not handled" navigation error.
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
              <Ionicons name="map" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tj.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tj.title}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.tap();
                setGuideVisible(true);
              }}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityRole="button"
              accessibilityLabel={tj.guide.openLabel}>
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <AppText style={[styles.intro, {color: colors.textSecondary}]}>
            {tj.intro}
          </AppText>

          {JOURNEY_ROUTE_ORDER.map(route => {
            const accent = JOURNEY_ROUTE_ACCENT[route];
            const meta = routes[route];
            const routeStops = getStopsForRoute(route);
            const visitedCount = routeStops.filter(s =>
              visited.has(s.id),
            ).length;
            return (
              <TouchableOpacity
                key={route}
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: accent + '40'},
                ]}
                activeOpacity={0.85}
                onPress={() => openRoute(route)}
                accessibilityRole="button"
                accessibilityLabel={meta.title}>
                <View
                  style={[styles.cardIcon, {backgroundColor: accent + '18'}]}>
                  <Ionicons
                    name={JOURNEY_ROUTE_ICON[route] as never}
                    size={26}
                    color={accent}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <AppText style={[styles.cardTitle, {color: colors.text}]}>
                    {meta.title}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.cardSubtitle, {color: accent}]}
                    numberOfLines={1}>
                    {meta.subtitle}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.cardDesc, {color: colors.textSecondary}]}
                    numberOfLines={2}>
                    {meta.description}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.cardStops, {color: colors.textTertiary}]}>
                    {visitedCount > 0
                      ? tj.progress
                          .replace('{{n}}', String(visitedCount))
                          .replace('{{total}}', String(getStopCount(route)))
                      : tj.stopsCount.replace(
                          '{{n}}',
                          String(getStopCount(route)),
                        )}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FeatureGuideModal
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
          {...getFeatureGuideContent('journeys', t)}
        />
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
  intro: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitle: {fontSize: fontSizes.lg, fontWeight: '800'},
  cardSubtitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  cardDesc: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.4},
  cardStops: {fontSize: fontSizes.xs, fontWeight: '600', marginTop: 2},
});
