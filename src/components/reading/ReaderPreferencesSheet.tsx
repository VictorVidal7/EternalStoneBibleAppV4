/**
 * 🎛️ READER PREFERENCES SHEET
 *
 * Bottom-sheet modal for the verse reader's typography + layout knobs:
 * font family, size, line spacing, alignment, margins. Renders a live
 * sample paragraph at the top so the user sees each change before they
 * commit. State lives in [[ReaderPreferencesContext]] and persists to
 * AsyncStorage automatically — this sheet is a pure UI surface.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {
  useReaderPreferences,
  READER_FONT_SIZE_MIN,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_STEP,
  READER_MARGIN_PADDING,
  ReaderFontFamily,
  ReaderTextAlign,
  ReaderMargin,
} from '../../context/ReaderPreferencesContext';
import {
  ReaderTheme,
  READER_THEME_ORDER,
  PREMIUM_READER_THEMES,
  resolveReaderTheme,
  isReaderThemeUnlocked,
} from '../../styles/readerThemes';
import {
  READER_TYPEFACES,
  READER_FONT_FAMILY_ORDER,
  PREMIUM_READER_FONTS,
  resolveTypeface,
  resolveTypefaceBold,
} from '../../lib/reader/typefaces';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {useBibleVersionOptional} from '../../hooks/useBibleVersion';
import {hasRedLetterData} from '@lib/reading/redLetterText';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '../../styles/designTokens';

interface ReaderPreferencesSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LINE_HEIGHT_OPTIONS = [1.2, 1.4, 1.6, 1.8, 2.0];

export const ReaderPreferencesSheet: React.FC<ReaderPreferencesSheetProps> = ({
  visible,
  onClose,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const {
    preferences,
    setFontFamily,
    setFontSize,
    setLineHeightMultiplier,
    setTextAlign,
    setMargin,
    setTheme,
    setAutoImmersiveOnListen,
    setSwipeChapterNavigation,
    setRedLetterWords,
    reset,
  } = useReaderPreferences();
  const {isPremium, isLoading: premiumLoading} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  // Red-letter has real data for WEB and RVR1960 (see hasRedLetterData /
  // WEB_RED_LETTER / RVR1960_RED_LETTER) — on any other version the switch
  // would be a silent no-op, so it's disabled rather than left looking live.
  // `useBibleVersionOptional` degrades to undefined for the handful of call
  // sites/tests that render this sheet above/without a BibleVersionProvider,
  // which correctly falls to "no known version, so unavailable".
  const {selectedVersion} = useBibleVersionOptional() ?? {};
  const isRedLetterAvailable =
    !!selectedVersion && hasRedLetterData(selectedVersion.id);

  // If a premium typeface or reading theme was active and the entitlement is
  // later revoked (e.g. a refund), fall back to the default instead of
  // leaving a no-longer-unlocked one applied. `isPremium` is in the
  // dependency array, so this reacts immediately if the sheet is already
  // open when the revocation lands, and otherwise on next open —
  // `!premiumLoading` avoids reverting during PremiumContext's own brief
  // initial cache read. Sepia is checked through `isReaderThemeUnlocked`
  // (not a plain `PREMIUM_READER_THEMES.includes` check) so a grandfathered
  // device's Sepia is NEVER reverted here — T6.3b's whole point is that a
  // device which already had Sepia keeps it working without premium.
  React.useEffect(() => {
    if (visible && !premiumLoading && !isPremium) {
      if (PREMIUM_READER_FONTS.includes(preferences.fontFamily)) {
        setFontFamily('sans');
      }
      if (
        !isReaderThemeUnlocked(
          preferences.theme,
          isPremium,
          preferences.sepiaGrandfathered,
        )
      ) {
        setTheme('system');
      }
    }
  }, [
    visible,
    premiumLoading,
    isPremium,
    preferences.fontFamily,
    preferences.theme,
    preferences.sepiaGrandfathered,
    setFontFamily,
    setTheme,
  ]);

  const previewFontFamily = useMemo(
    () => resolveFontFamily(preferences.fontFamily),
    [preferences.fontFamily],
  );
  const previewFontFamilyBold = useMemo(
    () => resolveFontFamilyBold(preferences.fontFamily),
    [preferences.fontFamily],
  );

  // The preview + reader surface follow the selected reading theme. 'system'
  // resolves back to the live app colors so the sheet stays consistent.
  const previewColors = useMemo(
    () => resolveReaderTheme(colors, preferences.theme, isDark),
    [colors, preferences.theme, isDark],
  );

  // Right-edge anti-clip reserve — same fontSize-derived gutter as the real
  // reader screen (app/(tabs)/verse/[book]/[chapter].tsx). A tight line can
  // paint a couple px wider than its measured wrap on some Android OEMs and
  // the canvas clips the last glyph; padding (not margin) is what actually
  // protects against it, since padding extends Android's own glyph clip
  // rect while a plain margin only narrows the box. Unconditional for both
  // alignments as of Sprint 112 (2026-07-28): the earlier margin-for-
  // justified split here was ported from chapter.tsx's OWN pre-fix
  // pattern, which turned out to never fully prevent the clip either — see
  // that file's `rightSlack` history for the full saga.
  const previewRightSlack = Math.max(
    24,
    Math.round(preferences.fontSize * 0.7),
  );

  const previewTextStyle = {
    color: previewColors.text,
    fontSize: preferences.fontSize,
    lineHeight: preferences.fontSize * preferences.lineHeightMultiplier,
    textAlign: preferences.textAlign,
    fontFamily: previewFontFamily,
    paddingRight: previewRightSlack,
  } as const;

  const themeLabels: Record<ReaderTheme, string> = {
    system: t.readerPrefs.themeSystem,
    paper: t.readerPrefs.themePaper,
    sepia: t.readerPrefs.themeSepia,
    night: t.readerPrefs.themeNight,
    'high-contrast': t.readerPrefs.themeHighContrast,
    musgo: t.readerPrefs.themeMusgo,
    crepusculo: t.readerPrefs.themeCrepusculo,
    niebla: t.readerPrefs.themeNiebla,
  };
  const themeOptions: {
    id: ReaderTheme;
    label: string;
    isPremiumTheme: boolean;
    isLocked: boolean;
  }[] = READER_THEME_ORDER.map(id => {
    const isPremiumTheme = PREMIUM_READER_THEMES.includes(id);
    return {
      id,
      label: themeLabels[id],
      // The "Exclusivo" pill (isPremiumTheme) always shows for a gated
      // theme, grandfathered or not — it's purely informational. The lock
      // state is the one thing grandfathering changes, so it goes through
      // `isReaderThemeUnlocked` rather than a plain premium check.
      isPremiumTheme,
      isLocked: !isReaderThemeUnlocked(
        id,
        isPremium,
        preferences.sepiaGrandfathered,
      ),
    };
  });

  const tap = (fn: () => void) => () => {
    haptics.tap();
    fn();
  };

  // Lets a screen reader treat the font-size stepper as one "adjustable"
  // control (swipe up/down), mirroring the audio VerseScrubber.
  const onFontSizeAction = (e: AccessibilityActionEvent) => {
    const delta =
      e.nativeEvent.actionName === 'increment'
        ? READER_FONT_SIZE_STEP
        : -READER_FONT_SIZE_STEP;
    const next = Math.min(
      READER_FONT_SIZE_MAX,
      Math.max(READER_FONT_SIZE_MIN, preferences.fontSize + delta),
    );
    if (next !== preferences.fontSize) {
      haptics.tap();
      setFontSize(next);
    }
  };

  const fontFamilyOptions: {
    id: ReaderFontFamily;
    label: string;
    sample: string;
    isPremiumFont: boolean;
    isLocked: boolean;
  }[] = READER_FONT_FAMILY_ORDER.map(id => {
    const isPremiumFont = PREMIUM_READER_FONTS.includes(id);
    return {
      id,
      label: t.readerPrefs[READER_TYPEFACES[id].labelKey],
      sample: READER_TYPEFACES[id].sample,
      isPremiumFont,
      isLocked: isPremiumFont && !isPremium,
    };
  });

  const alignOptions: {id: ReaderTextAlign; icon: string; label: string}[] = [
    {id: 'left', icon: 'list-outline', label: t.readerPrefs.alignLeft},
    {id: 'justify', icon: 'menu-outline', label: t.readerPrefs.alignJustify},
  ];

  const marginOptions: {id: ReaderMargin; label: string}[] = [
    {id: 'small', label: t.readerPrefs.marginSmall},
    {id: 'medium', label: t.readerPrefs.marginMedium},
    {id: 'large', label: t.readerPrefs.marginLarge},
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayDismiss}
          onPress={onClose}
          activeOpacity={1}
          {...a11yHiddenProps()}
        />

        <View
          {...focusTrapProps()}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text
              style={[styles.title, {color: colors.text}]}
              numberOfLines={1}>
              {t.readerPrefs.title}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={tap(reset)}
                accessibilityRole="button"
                accessibilityLabel={t.readerPrefs.reset}>
                <Text style={[styles.resetText, {color: colors.primary}]}>
                  {t.readerPrefs.reset}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.close}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Live preview */}
          <View
            style={[
              styles.preview,
              {
                backgroundColor: previewColors.background,
                borderColor: previewColors.border,
                paddingHorizontal: READER_MARGIN_PADDING[preferences.margin],
              },
            ]}>
            <Text
              testID="reader-prefs-preview-text"
              style={previewTextStyle}
              // Matches the real reader's textBreakStrategy (chapter.tsx) for
              // behavioral parity between preview and reader — 'simple' for
              // BOTH alignments since Sprint 112. `textAlign: 'justify'` was
              // pixel-scanned on-device and found NOT to actually stretch
              // lines flush on this Android/RN build, so 'highQuality'
              // (needed for real inter-word justification) bought nothing
              // visually while its denser packing was the actual source of
              // clip risk.
              textBreakStrategy="simple">
              <Text
                style={[
                  styles.previewNumber,
                  {
                    color: previewColors.primary,
                    fontFamily: previewFontFamilyBold,
                  },
                ]}>
                1{'  '}
              </Text>
              {t.readerPrefs.sampleText}
            </Text>
          </View>

          <ScrollView
            style={styles.options}
            contentContainerStyle={styles.optionsContent}>
            {/* Reading theme — each card IS its palette preview (the whole
                surface shows the theme), mirroring a YouVersion/Logos theme
                picker. Content is two flat <Text>s (no nested swatch View) so
                every card centres identically in any selected/line state. */}
            <Section title={t.readerPrefs.theme} colors={colors}>
              <View style={styles.row}>
                {themeOptions.map(opt => {
                  const swatch = resolveReaderTheme(colors, opt.id, isDark);
                  const active = preferences.theme === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.choiceCard,
                        styles.themeCard,
                        active ? styles.borderActive : styles.borderInactive,
                        {
                          backgroundColor: swatch.background,
                          borderColor: active ? colors.primary : swatch.border,
                        },
                      ]}
                      onPress={tap(() =>
                        opt.isLocked ? openOfferingSheet() : setTheme(opt.id),
                      )}
                      accessibilityRole="button"
                      accessibilityLabel={
                        opt.isLocked
                          ? `${opt.label} — ${t.offering.badgeA11y}`
                          : opt.label
                      }
                      accessibilityState={{selected: active}}>
                      {opt.isLocked && (
                        // HC audit (batch 5): this badge only ever renders for
                        // the 4 gated palettes (sepia/musgo/crepusculo/niebla —
                        // see `isLocked` above), and of those only crepúsculo's
                        // swatch.primary (#7FA8D9) fails contrast against a
                        // fixed white icon (~2.47:1). A correct per-palette fix
                        // needs an `onPrimary`-equivalent added to
                        // `ReaderThemeColors` (readerThemes.ts) — out of scope
                        // here since that file isn't part of this batch and
                        // "always black" would in turn hurt sepia/musgo/niebla
                        // (all comfortably readable with white today).
                        <View
                          style={[
                            styles.themeLockBadge,
                            {backgroundColor: swatch.primary},
                          ]}>
                          <Ionicons
                            name="leaf-outline"
                            size={8}
                            color={staticColors.white}
                          />
                        </View>
                      )}
                      <Text style={styles.themePreview}>
                        <Text
                          style={[
                            styles.themeSwatchNumber,
                            {color: swatch.primary},
                          ]}>
                          1{'  '}
                        </Text>
                        <Text
                          style={[
                            styles.themeSwatchText,
                            {color: swatch.text},
                          ]}>
                          Aa
                        </Text>
                      </Text>
                      <Text
                        style={[
                          styles.choiceLabel,
                          styles.themeChoiceLabel,
                          {
                            color: active
                              ? swatch.primary
                              : swatch.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit>
                        {opt.label}
                      </Text>
                      {opt.isPremiumTheme && (
                        <View
                          style={[
                            styles.exclusiveBadge,
                            {backgroundColor: swatch.primary + '22'},
                          ]}>
                          <Text
                            style={[
                              styles.exclusiveText,
                              {color: swatch.primary},
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}>
                            {t.readerPrefs.exclusiveLabel}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>

            {/* Font family */}
            <Section title={t.readerPrefs.font} colors={colors}>
              <View style={styles.row}>
                {fontFamilyOptions.map(opt => (
                  <ChoiceCard
                    key={opt.id}
                    active={preferences.fontFamily === opt.id}
                    colors={colors}
                    onPress={tap(() =>
                      opt.isLocked
                        ? openOfferingSheet()
                        : setFontFamily(opt.id),
                    )}
                    accessibilityLabel={
                      opt.isLocked
                        ? `${opt.label} — ${t.offering.badgeA11y}`
                        : opt.label
                    }
                    cardStyle={styles.fontFamilyCard}>
                    {opt.isLocked && (
                      <View
                        style={[
                          styles.fontLockBadge,
                          {backgroundColor: colors.primary},
                        ]}>
                        <Ionicons
                          name="leaf-outline"
                          size={9}
                          color={colors.onPrimary}
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.fontPreviewText,
                        {
                          color:
                            preferences.fontFamily === opt.id
                              ? colors.primary
                              : colors.text,
                          fontFamily: resolveFontFamilyBold(opt.id),
                        },
                      ]}>
                      {opt.sample}
                    </Text>
                    <Text style={[styles.choiceLabel, {color: colors.text}]}>
                      {opt.label}
                    </Text>
                    {opt.isPremiumFont && (
                      <View
                        style={[
                          styles.exclusiveBadge,
                          {backgroundColor: colors.primary + '1a'},
                        ]}>
                        <Text
                          style={[
                            styles.exclusiveText,
                            {color: colors.primary},
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}>
                          {t.readerPrefs.exclusiveLabel}
                        </Text>
                      </View>
                    )}
                  </ChoiceCard>
                ))}
              </View>
            </Section>

            {/* Font size — stepper (one "adjustable" node for screen readers) */}
            <Section title={t.readerPrefs.size} colors={colors}>
              <View
                style={styles.stepperRow}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={t.readerPrefs.size}
                accessibilityValue={{
                  min: READER_FONT_SIZE_MIN,
                  max: READER_FONT_SIZE_MAX,
                  now: preferences.fontSize,
                }}
                accessibilityActions={[
                  {name: 'increment'},
                  {name: 'decrement'},
                ]}
                onAccessibilityAction={onFontSizeAction}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    {backgroundColor: colors.background},
                  ]}
                  disabled={preferences.fontSize <= READER_FONT_SIZE_MIN}
                  onPress={tap(() =>
                    setFontSize(preferences.fontSize - READER_FONT_SIZE_STEP),
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={t.readerPrefs.decreaseSize}>
                  <Ionicons
                    name="remove"
                    size={22}
                    color={
                      preferences.fontSize <= READER_FONT_SIZE_MIN
                        ? colors.textTertiary
                        : colors.text
                    }
                  />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, {color: colors.text}]}>
                  {preferences.fontSize}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    {backgroundColor: colors.background},
                  ]}
                  disabled={preferences.fontSize >= READER_FONT_SIZE_MAX}
                  onPress={tap(() =>
                    setFontSize(preferences.fontSize + READER_FONT_SIZE_STEP),
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={t.readerPrefs.increaseSize}>
                  <Ionicons
                    name="add"
                    size={22}
                    color={
                      preferences.fontSize >= READER_FONT_SIZE_MAX
                        ? colors.textTertiary
                        : colors.text
                    }
                  />
                </TouchableOpacity>
              </View>
            </Section>

            {/* Line spacing */}
            <Section title={t.readerPrefs.lineSpacing} colors={colors}>
              <View style={styles.row}>
                {LINE_HEIGHT_OPTIONS.map(value => (
                  <PillButton
                    key={value}
                    active={
                      Math.abs(preferences.lineHeightMultiplier - value) < 0.05
                    }
                    colors={colors}
                    onPress={tap(() => setLineHeightMultiplier(value))}
                    accessibilityLabel={`${t.readerPrefs.lineSpacing} ${value}`}>
                    <Text
                      style={[
                        styles.optionLabelBold,
                        {
                          color:
                            Math.abs(preferences.lineHeightMultiplier - value) <
                            0.05
                              ? colors.primary
                              : colors.text,
                        },
                      ]}>
                      {value.toFixed(1)}
                    </Text>
                  </PillButton>
                ))}
              </View>
            </Section>

            {/* Text alignment */}
            <Section title={t.readerPrefs.alignment} colors={colors}>
              <View style={styles.row}>
                {alignOptions.map(opt => (
                  <ChoiceCard
                    key={opt.id}
                    active={preferences.textAlign === opt.id}
                    colors={colors}
                    onPress={tap(() => setTextAlign(opt.id))}
                    accessibilityLabel={opt.label}>
                    <Ionicons
                      name={opt.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={
                        preferences.textAlign === opt.id
                          ? colors.primary
                          : colors.text
                      }
                    />
                    <Text style={[styles.choiceLabel, {color: colors.text}]}>
                      {opt.label}
                    </Text>
                  </ChoiceCard>
                ))}
              </View>
            </Section>

            {/* Margins */}
            <Section title={t.readerPrefs.margin} colors={colors}>
              <View style={styles.row}>
                {marginOptions.map(opt => (
                  <PillButton
                    key={opt.id}
                    active={preferences.margin === opt.id}
                    colors={colors}
                    onPress={tap(() => setMargin(opt.id))}
                    accessibilityLabel={opt.label}>
                    <Text
                      style={[
                        styles.optionLabelBold,
                        {
                          color:
                            preferences.margin === opt.id
                              ? colors.primary
                              : colors.text,
                        },
                      ]}>
                      {opt.label}
                    </Text>
                  </PillButton>
                ))}
              </View>
            </Section>

            {/* 🎧 Auto-immersive on listen (Sprint 77, opt-in): tapping the
                reader's Audio button also opens the immersive reader, which
                binds it to the engine before the first ∞ advance. */}
            <Section title={t.readerPrefs.audioSection} colors={colors}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={[styles.optionLabelBold, {color: colors.text}]}>
                    {t.readerPrefs.autoImmersive}
                  </Text>
                  <Text
                    style={[styles.switchHint, {color: colors.textSecondary}]}>
                    {t.readerPrefs.autoImmersiveHint}
                  </Text>
                </View>
                <Switch
                  value={preferences.autoImmersiveOnListen}
                  onValueChange={tap(() =>
                    setAutoImmersiveOnListen(
                      !preferences.autoImmersiveOnListen,
                    ),
                  )}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + '70',
                  }}
                  thumbColor={
                    preferences.autoImmersiveOnListen
                      ? colors.primary
                      : colors.surfaceVariant
                  }
                  accessibilityLabel={t.readerPrefs.autoImmersive}
                  accessibilityHint={t.readerPrefs.autoImmersiveHint}
                />
              </View>
            </Section>

            {/* 👉 Swipe to change chapter (opt-in, default off): the gesture
                only claims the middle band of the screen width so it never
                fights the Android system back-gesture, which owns the outer
                edge strip (see chapterSwipeGesture). */}
            <Section title={t.readerPrefs.navigationSection} colors={colors}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={[styles.optionLabelBold, {color: colors.text}]}>
                    {t.readerPrefs.swipeChapterNav}
                  </Text>
                  <Text
                    style={[styles.switchHint, {color: colors.textSecondary}]}>
                    {t.readerPrefs.swipeChapterNavHint}
                  </Text>
                </View>
                <Switch
                  value={preferences.swipeChapterNavigation}
                  onValueChange={tap(() =>
                    setSwipeChapterNavigation(
                      !preferences.swipeChapterNavigation,
                    ),
                  )}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + '70',
                  }}
                  thumbColor={
                    preferences.swipeChapterNavigation
                      ? colors.primary
                      : colors.surfaceVariant
                  }
                  accessibilityLabel={t.readerPrefs.swipeChapterNav}
                  accessibilityHint={t.readerPrefs.swipeChapterNavHint}
                />
              </View>
            </Section>

            {/* ✝️ Red-letter words (opt-out, default on — a well-known
                Bible convention). Only visibly takes effect on WEB and
                RVR1960, the reading versions with the underlying marking
                today — disabled (not hidden, so it stays discoverable) on
                every other version, with a hint that says how to enable it. */}
            <Section title={t.readerPrefs.redLetterSection} colors={colors}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={[styles.optionLabelBold, {color: colors.text}]}>
                    {t.readerPrefs.redLetterWords}
                  </Text>
                  <Text
                    style={[styles.switchHint, {color: colors.textSecondary}]}>
                    {isRedLetterAvailable
                      ? t.readerPrefs.redLetterWordsHint
                      : t.readerPrefs.redLetterWordsUnavailableHint}
                  </Text>
                </View>
                <Switch
                  value={preferences.redLetterWords}
                  onValueChange={tap(() =>
                    setRedLetterWords(!preferences.redLetterWords),
                  )}
                  disabled={!isRedLetterAvailable}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + '70',
                  }}
                  thumbColor={
                    preferences.redLetterWords
                      ? colors.primary
                      : colors.surfaceVariant
                  }
                  accessibilityLabel={t.readerPrefs.redLetterWords}
                  accessibilityHint={
                    isRedLetterAvailable
                      ? t.readerPrefs.redLetterWordsHint
                      : t.readerPrefs.redLetterWordsUnavailableHint
                  }
                  accessibilityState={{disabled: !isRedLetterAvailable}}
                />
              </View>
            </Section>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Resolve a reader `fontFamily` value to set on RN Text. Thin wrapper over the
 * pure, tested `resolveTypeface` catalog — kept here so existing importers (the
 * reader screen) need no change. Since Sprint 82 every face is a bundled font
 * (the family name is identical on iOS and Android), so there is no platform
 * branch and the result is always a defined family.
 */
export function resolveFontFamily(family: ReaderFontFamily): string {
  return resolveTypeface(family);
}

/** The bold-weight (700) `fontFamily` for a face — for verse numbers/samples. */
export function resolveFontFamilyBold(family: ReaderFontFamily): string {
  return resolveTypefaceBold(family);
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  colors: {textSecondary: string};
}
const Section: React.FC<SectionProps> = ({title, children, colors}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
      {title}
    </Text>
    {children}
  </View>
);

interface ChoiceCardProps {
  active: boolean;
  colors: {primary: string; background: string; border: string};
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  /** Optional per-instance layout override (e.g. a 2-per-row basis). */
  cardStyle?: StyleProp<ViewStyle>;
}
const ChoiceCard: React.FC<ChoiceCardProps> = ({
  active,
  colors,
  onPress,
  accessibilityLabel,
  children,
  cardStyle,
}) => (
  <TouchableOpacity
    style={[
      styles.choiceCard,
      active ? styles.borderActive : styles.borderInactive,
      cardStyle,
      {
        backgroundColor: colors.background,
        borderColor: active ? colors.primary : colors.border,
      },
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{selected: active}}>
    {children}
  </TouchableOpacity>
);

interface PillButtonProps {
  active: boolean;
  colors: {primary: string; background: string; border: string};
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}
const PillButton: React.FC<PillButtonProps> = ({
  active,
  colors,
  onPress,
  accessibilityLabel,
  children,
}) => (
  <TouchableOpacity
    style={[
      styles.pill,
      active ? styles.borderActive : styles.borderInactive,
      {
        backgroundColor: colors.background,
        borderColor: active ? colors.primary : colors.border,
      },
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{selected: active}}>
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  borderActive: {borderWidth: 2},
  borderInactive: {borderWidth: 1},
  fontPreviewText: {fontSize: 24, fontWeight: '700'},
  optionLabelBold: {fontWeight: '700'},
  overlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: staticColors.glassWhite25,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resetText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  preview: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  previewNumber: {
    fontWeight: '700',
  },
  options: {
    flexGrow: 0,
  },
  optionsContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchTextWrap: {
    flex: 1,
    gap: 2,
  },
  switchHint: {
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceCard: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  choiceLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  // Typeface cards: a ~half-width basis so the six reading faces (Sprint 83)
  // wrap into a clean 2-per-row grid (the shared flex:1 choiceCard packed them
  // onto one line and pushed the rest off-screen). flexBasis overrides the
  // basis:0 from flex:1.
  fontFamilyCard: {
    position: 'relative',
    flexBasis: '47%',
    minWidth: 0,
  },
  // Small leaf marker on a locked premium typeface — same "unlockable with
  // an offering" glyph used everywhere else, never a padlock/crown.
  fontLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Quiet "Exclusivo"/"Exclusive" tag, shared by the theme and typeface
  // grids — reads as special whether the option is still locked or already
  // unlocked.
  exclusiveBadge: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  exclusiveText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  themeCard: {
    position: 'relative',
    // A narrower basis (T6.3) so the 8 reading surfaces sit in 2 tidy rows of
    // 4 instead of 3 taller rows of ~3 — also just more compact overall.
    flexBasis: '22%',
    minWidth: 0,
    height: 76,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  // Same glyph/position as fontLockBadge, sized down slightly for the
  // smaller theme card.
  themeLockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreview: {
    textAlign: 'center',
    marginBottom: 1,
  },
  themeSwatchNumber: {
    fontSize: 10,
    fontWeight: '800',
  },
  themeSwatchText: {
    fontSize: 15,
    fontWeight: '700',
  },
  themeChoiceLabel: {
    fontSize: 9,
  },
  pill: {
    minWidth: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },
});
