/**
 * 🕸️ PROPHETIC WEB MAP — the "mapa del hilo" (Cristo en las profecías).
 *
 * The whole Hilo profético as the two-rail diagram: OT prophecies/types on the
 * left (OT canon order), their NT fulfillment on the right (NT canon order),
 * joined by threads coloured per movement — the web where all of Scripture is
 * seen converging on Christ (Lucas 24:27). Geometry comes from the pure
 * {@link buildThreadMap}; this layers SVG curves + the theme palette + tap
 * targets.
 *
 * Tapping a thread (either end) SELECTS it: that thread lights up, the rest dim,
 * and a floating panel names the prophecy + its OT→NT refs with an "open in the
 * walk" action (tap the same thread again, or the panel button, to open). The
 * web can also be shared as an image (react-native-view-shot → expo-sharing, the
 * same pipeline as the prophecy card).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {Path, Circle, Text as SvgText} from 'react-native-svg';
import {captureRef} from 'react-native-view-shot';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {shareOrDownloadImage} from '@/features/share/shareOrDownloadImage';
import {AppText} from '@components/ui/AppText';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';
import {
  PROPHECY_GROUP_ACCENT,
  PROPHECY_GROUP_ORDER,
  MESSIANIC_PROPHECIES,
  isNtQuoted,
} from '@/features/study/messianicProphecies';
import {formatChristRefLabel} from '@/features/study/christConnections';
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
  const toast = useToast();
  const tp = t.prophecies;
  const isEs = selectedVersion.language === 'es';
  const lang = isEs ? 'es' : 'en';

  const canvasW = Math.min(width - spacing.lg * 2, 520);
  const map = useMemo(() => buildThreadMap({width: canvasW}), [canvasW]);

  // Which thread is selected (highlighted), by its catalog index. null = none.
  const [selected, setSelected] = useState<number | null>(null);
  const captureCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const groups = tp.groups as Record<string, string>;
  const items = tp.items as Record<string, {label: string; note: string}>;

  const jump = (index: number) => {
    haptics.tap();
    // replace (not push): the map already sits above the index route in the
    // stack, so pushing again on every jump piled up duplicate instances —
    // hardware back then had to pop through all of them before really going
    // back. replace keeps one coherent step.
    router.replace(`/features/prophecies?start=${index}` as never);
  };

  // Tap a thread: first tap selects/highlights it; tapping the same thread
  // again opens it in the walk (so the quick path survives the new selection).
  const onTapThread = (index: number) => {
    haptics.tap();
    if (selected === index) jump(index);
    else setSelected(index);
  };

  // The selected prophecy (for the floating detail panel).
  const selectedProphecy =
    selected !== null ? MESSIANIC_PROPHECIES[selected] : null;

  async function handleShareMap() {
    if (sharing || !captureCardRef.current) return;
    try {
      setSharing(true);
      haptics.press();
      // Capture the full web (no dimming), so deselect first and let it paint.
      setSelected(null);
      await new Promise(resolve => setTimeout(resolve, 60));
      const uri = await captureRef(captureCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const result = await shareOrDownloadImage(uri, {dialogTitle: t.share});
      if (result === 'unavailable') {
        toast.error(t.verse.imageShareError);
        return;
      }
      if (result === 'downloaded') {
        toast.success(t.verse.imageDownloaded);
      }
    } catch (error) {
      logger.error('Error sharing prophecy map image', error as Error, {
        component: 'PropheciesMapScreen',
        action: 'handleShareMap',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setSharing(false);
    }
  }

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
          <View style={styles.headerTopRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                haptics.tap();
                setGuideVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={tp.mapGuide.openLabel}>
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => void handleShareMap()}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel={tp.shareMap}>
              {sharing ? (
                <ActivityIndicator color={staticColors.white} />
              ) : (
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={staticColors.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <AppText scaleRole="display" style={styles.headerTitle}>
          {tp.mapTitle}
        </AppText>
        <AppText scaleRole="compact" style={styles.headerSubtitle}>
          {tp.mapSubtitle}
        </AppText>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* The capturable card: legend + rails + web + signature. The tap
            overlay lives inside (transparent → invisible in the image); the
            floating detail panel is a sibling outside, so it is never captured. */}
        <View
          ref={captureCardRef}
          collapsable={false}
          style={[styles.captureCard, {backgroundColor: colors.background}]}>
          {/* Movement legend. */}
          <View style={[styles.legend, {width: canvasW}]}>
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
                const isSel = node.index === selected;
                const dx = (map.rightX - map.leftX) * 0.45;
                const d = `M ${map.leftX} ${node.leftY} C ${map.leftX + dx} ${node.leftY} ${map.rightX - dx} ${node.rightY} ${map.rightX} ${node.rightY}`;
                return (
                  <Path
                    key={`t-${node.id}`}
                    d={d}
                    stroke={accent}
                    strokeOpacity={isSel ? 0.95 : selected !== null ? 0.1 : 0.4}
                    strokeWidth={isSel ? 2.4 : 1.3}
                    fill="none"
                  />
                );
              })}
              {/* The selected thread drawn again on top, so it is never hidden
                  beneath a later (dimmed) crossing thread. */}
              {selectedProphecy
                ? (() => {
                    const node = map.nodes.find(n => n.index === selected);
                    if (!node) return null;
                    const accent = PROPHECY_GROUP_ACCENT[node.group];
                    const dx = (map.rightX - map.leftX) * 0.45;
                    const d = `M ${map.leftX} ${node.leftY} C ${map.leftX + dx} ${node.leftY} ${map.rightX - dx} ${node.rightY} ${map.rightX} ${node.rightY}`;
                    return (
                      <Path
                        d={d}
                        stroke={accent}
                        strokeOpacity={0.95}
                        strokeWidth={2.4}
                        fill="none"
                      />
                    );
                  })()
                : null}
              {map.nodes.map(node => {
                const accent = PROPHECY_GROUP_ACCENT[node.group];
                const isSel = node.index === selected;
                const dim = selected !== null && !isSel;
                return (
                  <React.Fragment key={`d-${node.id}`}>
                    <Circle
                      cx={map.leftX}
                      cy={node.leftY}
                      r={isSel ? 3.6 : 2.6}
                      fill={accent}
                      fillOpacity={dim ? 0.25 : 1}
                    />
                    <Circle
                      cx={map.rightX}
                      cy={node.rightY}
                      r={isSel ? 3.6 : 2.6}
                      fill={accent}
                      fillOpacity={dim ? 0.25 : 1}
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

            {/* Tap targets: a band at each row on BOTH rails (left + right dots
                are each evenly spaced, so bands on a side never overlap). */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {map.nodes.map(node => (
                <React.Fragment key={`tap-${node.id}`}>
                  <Pressable
                    onPress={() => onTapThread(node.index)}
                    style={[
                      styles.tapBand,
                      {top: node.leftY - 9, width: map.leftX + 28},
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={items[node.id]?.label ?? tp.viewIndex}
                  />
                  <Pressable
                    onPress={() => onTapThread(node.index)}
                    style={[
                      styles.tapBand,
                      {
                        top: node.rightY - 9,
                        left: map.rightX - 28,
                        width: canvasW - map.rightX + 28,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={items[node.id]?.label ?? tp.viewIndex}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Signature — keeps a shared image self-attributed. */}
          <View style={[styles.signatureRow, {width: canvasW}]}>
            <Ionicons
              name="git-network"
              size={12}
              color={colors.textTertiary}
            />
            <AppText
              scaleRole="compact"
              style={[styles.signatureText, {color: colors.textTertiary}]}>
              {tp.shareSignature}
            </AppText>
          </View>
        </View>

        <AppText
          scaleRole="compact"
          style={[styles.hint, {color: colors.textTertiary}]}>
          {tp.mapHint}
        </AppText>
      </ScrollView>

      {/* Floating detail panel for the selected thread. */}
      {selectedProphecy ? (
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.card,
              borderColor: PROPHECY_GROUP_ACCENT[selectedProphecy.group] + '55',
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}>
          <View style={styles.panelTopRow}>
            <View
              style={[
                styles.panelChip,
                {
                  backgroundColor:
                    PROPHECY_GROUP_ACCENT[selectedProphecy.group] + '22',
                },
              ]}>
              <AppText
                scaleRole="compact"
                style={[
                  styles.panelChipText,
                  {color: PROPHECY_GROUP_ACCENT[selectedProphecy.group]},
                ]}>
                {groups[selectedProphecy.group]}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.tap();
                setSelected(null);
              }}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <AppText
            scaleRole="compact"
            style={[styles.panelLabel, {color: colors.text}]}
            numberOfLines={2}>
            {items[selectedProphecy.id]?.label ?? ''}
          </AppText>

          <View style={styles.panelRefRow}>
            <AppText
              scaleRole="compact"
              style={[styles.panelRef, {color: colors.textSecondary}]}
              numberOfLines={1}>
              {`${selectedProphecy.kind === 'shadow' ? tp.shadowLabel : tp.prophecyLabel}: ${formatChristRefLabel(selectedProphecy.prophecy, lang)}`}
            </AppText>
            <Ionicons
              name="arrow-forward"
              size={13}
              color={colors.textTertiary}
            />
            <AppText
              scaleRole="compact"
              style={[styles.panelRef, {color: colors.textSecondary}]}
              numberOfLines={1}>
              {formatChristRefLabel(selectedProphecy.fulfillment, lang)}
            </AppText>
          </View>

          {isNtQuoted(selectedProphecy.id) ? (
            <View style={styles.panelBadgeRow}>
              <View
                style={[
                  styles.panelBadge,
                  {backgroundColor: colors.primary + '18'},
                ]}>
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={colors.primary}
                />
                <AppText
                  scaleRole="compact"
                  style={[styles.panelBadgeText, {color: colors.primary}]}>
                  {tp.quotedBadge}
                </AppText>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.panelOpenBtn, {backgroundColor: colors.primary}]}
            onPress={() => selected !== null && jump(selected)}
            accessibilityRole="button"
            accessibilityLabel={tp.openInWalk}>
            <AppText style={[styles.panelOpenText, {color: colors.onPrimary}]}>
              {tp.openInWalk}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <FeatureGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        {...getFeatureGuideContent('propheticMap', t)}
      />
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
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scroll: {alignItems: 'center', paddingTop: spacing.sm},
  captureCard: {alignItems: 'center', paddingVertical: spacing.sm},
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  legendDot: {width: 10, height: 10, borderRadius: 5},
  legendText: {fontSize: fontSizes.xs, fontWeight: '600'},
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
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  signatureText: {fontSize: fontSizes.xs, fontWeight: '600'},
  hint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  panel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  panelChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panelLabel: {fontSize: fontSizes.lg, fontWeight: '800'},
  panelRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  panelRef: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  panelBadgeRow: {flexDirection: 'row'},
  panelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  panelBadgeText: {fontSize: fontSizes.xs, fontWeight: '700'},
  panelOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
  },
  panelOpenText: {fontSize: fontSizes.md, fontWeight: '800'},
});
