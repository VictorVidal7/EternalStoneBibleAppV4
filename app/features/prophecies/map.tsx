/**
 * 🕸️ PROPHETIC WEB MAP — the "mapa del hilo" (Cristo en las profecías).
 *
 * The whole Hilo profético as the two-rail diagram: OT prophecies/types on the
 * left (OT canon order), their NT fulfillment on the right (NT canon order),
 * joined by threads coloured per movement — the web where all of Scripture is
 * seen converging on Christ (Lucas 24:27). Geometry comes from the pure
 * {@link buildThreadMap}; this layers SVG curves + the theme palette + tap
 * targets that jump into the thread.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {Path, Circle, Text as SvgText} from 'react-native-svg';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {
  PROPHECY_GROUP_ACCENT,
  PROPHECY_GROUP_ORDER,
} from '@/features/study/messianicProphecies';
import {buildThreadMap} from '@/features/study/prophecyMap';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function PropheciesMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tp = t.prophecies;
  const isEs = selectedVersion.language === 'es';

  const canvasW = Math.min(width - spacing.lg * 2, 520);
  const map = useMemo(() => buildThreadMap({width: canvasW}), [canvasW]);

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const groups = tp.groups as Record<string, string>;
  const jump = (index: number) => {
    haptics.tap();
    router.push(`/features/prophecies?start=${index}` as never);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />
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
        <AppText scaleRole="display" style={styles.headerTitle}>
          {tp.mapTitle}
        </AppText>
        <AppText scaleRole="compact" style={styles.headerSubtitle}>
          {tp.mapSubtitle}
        </AppText>
      </LinearGradient>

      {/* Movement legend. */}
      <View style={styles.legend}>
        {PROPHECY_GROUP_ORDER.map(g => (
          <View key={g} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {backgroundColor: PROPHECY_GROUP_ACCENT[g]},
              ]}
            />
            <AppText
              scaleRole="compact"
              style={[styles.legendText, {color: colors.textSecondary}]}
              numberOfLines={1}>
              {groups[g]}
            </AppText>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.railHeaderRow, {width: canvasW}]}>
          <AppText
            scaleRole="compact"
            style={[styles.railHeader, {color: colors.textTertiary}]}>
            {tp.otTestament}
          </AppText>
          <AppText
            scaleRole="compact"
            style={[styles.railHeader, {color: colors.textTertiary}]}>
            {tp.ntTestament}
          </AppText>
        </View>

        <View style={{width: canvasW, height: map.height}}>
          <Svg width={canvasW} height={map.height}>
            {/* Threads first, then dots + labels on top. */}
            {map.nodes.map(node => {
              const accent = PROPHECY_GROUP_ACCENT[node.group];
              const dx = (map.rightX - map.leftX) * 0.45;
              const d = `M ${map.leftX} ${node.leftY} C ${map.leftX + dx} ${node.leftY} ${map.rightX - dx} ${node.rightY} ${map.rightX} ${node.rightY}`;
              return (
                <Path
                  key={`t-${node.id}`}
                  d={d}
                  stroke={accent}
                  strokeOpacity={0.4}
                  strokeWidth={1.3}
                  fill="none"
                />
              );
            })}
            {map.nodes.map(node => {
              const accent = PROPHECY_GROUP_ACCENT[node.group];
              return (
                <React.Fragment key={`d-${node.id}`}>
                  <Circle
                    cx={map.leftX}
                    cy={node.leftY}
                    r={2.6}
                    fill={accent}
                  />
                  <Circle
                    cx={map.rightX}
                    cy={node.rightY}
                    r={2.6}
                    fill={accent}
                  />
                </React.Fragment>
              );
            })}
            {map.otLabels.map(l => (
              <SvgText
                key={`ot-${l.nameEn}`}
                x={map.leftX - 6}
                y={l.y + 3}
                fontSize={9}
                fontWeight="600"
                fill={colors.textSecondary}
                textAnchor="end">
                {isEs ? l.abbrEs : l.abbrEn}
              </SvgText>
            ))}
            {map.ntLabels.map(l => (
              <SvgText
                key={`nt-${l.nameEn}`}
                x={map.rightX + 6}
                y={l.y + 3}
                fontSize={9}
                fontWeight="600"
                fill={colors.textSecondary}
                textAnchor="start">
                {isEs ? l.abbrEs : l.abbrEn}
              </SvgText>
            ))}
          </Svg>

          {/* Tap targets: a band at each row on BOTH rails. The left dots and the
              right dots are each evenly spaced, so bands on a side never overlap
              — and either end of a thread opens that prophecy in the walk. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {map.nodes.map(node => (
              <React.Fragment key={`tap-${node.id}`}>
                <Pressable
                  onPress={() => jump(node.index)}
                  style={[
                    styles.tapBand,
                    {top: node.leftY - 9, width: map.leftX + 28},
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={tp.viewIndex}
                />
                <Pressable
                  onPress={() => jump(node.index)}
                  style={[
                    styles.tapBand,
                    {
                      top: node.rightY - 9,
                      left: map.rightX - 28,
                      width: canvasW - map.rightX + 28,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={tp.viewIndex}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        <AppText
          scaleRole="compact"
          style={[styles.hint, {color: colors.textTertiary}]}>
          {tp.mapHint}
        </AppText>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  legendDot: {width: 10, height: 10, borderRadius: 5},
  legendText: {fontSize: fontSizes.xs, fontWeight: '600'},
  scroll: {alignItems: 'center', paddingTop: spacing.sm},
  railHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  railHeader: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapBand: {position: 'absolute', left: 0, height: 18},
  hint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
