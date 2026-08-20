/**
 * Color theme picker — extracted from the Settings screen (T6 — Nuevos
 * extras premium) so the premium-theme gating logic has a real test harness,
 * matching the same extraction pattern already used for ExtrasSettings /
 * DonationSettings rather than growing settings.tsx further.
 *
 * The 12 original themes stay free forever. The 4 new ones (see
 * PREMIUM_COLOR_THEMES) are exclusive additions unlocked by the same
 * offering as every other Extra — tapping a locked swatch opens the
 * offering sheet instead of applying the theme. If the entitlement is later
 * revoked while a premium theme is active, this falls back to Midnight
 * rather than leaving a no-longer-unlocked palette applied.
 *
 * Consolidation (settings reorg): the inline grid now shows only the free
 * themes — plus the user's currently active theme even if it's one of the 4
 * premium ones, so an already-unlocked selection never disappears from view.
 * A small "Ver todos los temas" row opens a full-screen modal (same chrome
 * as NotificationsSettings/GoalsSettings) with the complete 16-theme grid.
 * Both views share the same swatch-rendering logic (`renderGrid`) so the
 * gating/selection behavior is defined once.
 */

import {useCallback, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {haptics} from '@lib/haptics';
import {
  useTheme,
  colorThemes,
  ColorTheme,
  PREMIUM_COLOR_THEMES,
} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';

const ALL_THEME_KEYS = Object.keys(colorThemes) as ColorTheme[];

export default function ColorThemeSettings() {
  const {colors, isDark, colorTheme, setColorTheme} = useTheme();
  const {t} = useLanguage();
  const {isPremium, isLoading: premiumLoading} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  // If a premium theme was active and the entitlement is later revoked (e.g.
  // a refund), fall back to a free theme instead of leaving a
  // no-longer-unlocked palette applied. `!premiumLoading` avoids reverting
  // during PremiumContext's own brief initial cache read. Runs regardless of
  // whether the inline grid or the full modal grid is currently showing.
  useEffect(() => {
    if (
      !premiumLoading &&
      !isPremium &&
      PREMIUM_COLOR_THEMES.includes(colorTheme)
    ) {
      setColorTheme('midnight');
    }
  }, [premiumLoading, isPremium, colorTheme, setColorTheme]);

  const handleSelect = useCallback(
    (themeKey: ColorTheme) => {
      const isLocked = PREMIUM_COLOR_THEMES.includes(themeKey) && !isPremium;
      if (isLocked) {
        haptics.tap();
        openOfferingSheet();
        return;
      }
      haptics.press();
      void setColorTheme(themeKey);
    },
    [isPremium, openOfferingSheet, setColorTheme],
  );

  const renderGrid = (themeKeys: ColorTheme[]) => (
    <View style={styles.grid}>
      {themeKeys.map(themeKey => {
        const theme = colorThemes[themeKey];
        const isSelected = colorTheme === themeKey;
        const isPremiumTheme = PREMIUM_COLOR_THEMES.includes(themeKey);
        const isLocked = isPremiumTheme && !isPremium;
        const themeName = t.settings.colorThemeNames[themeKey];
        return (
          <TouchableOpacity
            key={themeKey}
            style={[
              styles.option,
              isSelected && {backgroundColor: colors.primary + '1a'},
            ]}
            onPress={() => handleSelect(themeKey)}
            accessibilityRole="button"
            accessibilityLabel={
              isLocked ? `${themeName} — ${t.offering.badgeA11y}` : themeName
            }>
            <View
              style={[
                styles.circleWrapper,
                {borderColor: colors.border},
                isSelected && {
                  borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: colors.surface,
                  // A scaled-down local glow, not celestialTheme.shadows.glow
                  // (shadowRadius 20 / shadowOpacity 0.5 / elevation 10) — that
                  // was previously scoped to the 4 premium swatches sitting
                  // alone in their own trailing row. Now that every selected
                  // swatch gets it (fixing the free-vs-premium asymmetry), a
                  // radius that size would bleed into neighboring swatches in
                  // this tightly packed 6-per-row grid, especially the
                  // Android `elevation` shadow which reads as a plain grey
                  // smudge rather than a colored glow.
                  shadowColor: theme.preview[2],
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}>
              <LinearGradient
                colors={theme.preview as [string, string, string]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.previewCircle}>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color={staticColors.white}
                  />
                )}
              </LinearGradient>
              {isLocked && (
                <View
                  style={[styles.lockBadge, {backgroundColor: colors.primary}]}>
                  <Ionicons
                    name="leaf-outline"
                    size={9}
                    color={colors.onPrimary}
                  />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.name,
                {color: colors.textSecondary},
                isSelected && {color: colors.primary},
              ]}
              numberOfLines={1}>
              {themeName}
            </Text>
            {isPremiumTheme && (
              <View
                style={[
                  styles.exclusiveBadge,
                  {backgroundColor: colors.primary + '26'},
                ]}>
                <Text
                  style={[styles.exclusiveText, {color: colors.primary}]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}>
                  {t.settings.exclusiveThemeLabel}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Free themes always show inline; a premium theme that's currently active
  // stays visible too so an already-unlocked selection never disappears.
  const inlineKeys = ALL_THEME_KEYS.filter(
    key => !PREMIUM_COLOR_THEMES.includes(key) || key === colorTheme,
  );

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        {backgroundColor: colors.surface},
      ]}>
      <Text style={[styles.label, {color: colors.text}]}>
        {t.settings.colorTheme}
      </Text>
      <Text style={[styles.description, {color: colors.textSecondary}]}>
        {t.settings.colorThemeDescription}
      </Text>

      {renderGrid(inlineKeys)}

      <TouchableOpacity
        style={styles.viewAllRow}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t.settings.viewAllThemes}>
        <Text style={[styles.viewAllText, {color: colors.primary}]}>
          {t.settings.viewAllThemes}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={[modalStyles.container, {backgroundColor: colors.background}]}
          {...focusTrapProps()}>
          <View style={[modalStyles.header, {paddingTop: insets.top + 10}]}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[modalStyles.title, {color: colors.text}]}>
              {t.settings.colorTheme}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            <View
              style={[
                styles.card,
                isDark ? styles.cardShadowDark : styles.cardShadowLight,
                {backgroundColor: colors.surface},
              ]}>
              {renderGrid(ALL_THEME_KEYS)}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    rowGap: 12,
    // 6 swatches per row — the 12 free themes fill 2 tidy rows, and the 4
    // premium ones (added last, per PREMIUM_COLOR_THEMES) land together in
    // their own trailing row rather than interleaved with the free ones.
    justifyContent: 'space-between',
  },
  option: {
    width: '15%',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 10,
  },
  // A hairline ring (borderColor set inline from `colors.border`) now sits on
  // every swatch in BOTH light and dark mode — previously this ring only
  // existed in dark mode (circleWrapperDark), which read as an unfinished
  // patch rather than an intentional treatment. Sized up from 34 to 36 so
  // the selected state (2px ring + `colors.surface` fill) leaves a visible
  // card-colored gap between the ring and the swatch instead of the ring
  // sitting flush against it — necessary because the ring's selected color
  // (colors.primary) is drawn from the very theme it's marking as active, so
  // it can't be trusted to contrast with the gradient on its own.
  circleWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
  },
  previewCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  exclusiveBadge: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exclusiveText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
