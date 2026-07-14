/**
 * 🖼️ IMAGE SHARE MODAL
 *
 * Full-screen modal that lets the user compose a shareable image of the
 * currently selected verses — theme, font size, alignment and font style
 * are picked in-modal, then captured with react-native-view-shot and
 * handed to the system share sheet via expo-sharing.
 *
 * Extracted from `verse/[book]/[chapter].tsx` (Sprint 28, the cleanup
 * deferred from Sprint 21 #13) so the reader file stays under control.
 * Owns its own styles, theme glue, the imagePreviewRef + capture/share
 * pipeline, and all the rendering-tweak state (theme/font/alignment/
 * serif). The parent only feeds in the verse text + reference and gets
 * a single `onClose` callback.
 */
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {haptics} from '@lib/haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';
import {staticColors} from '../../styles/designTokens';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useLanguage} from '../../hooks/useLanguage';
import {useToast} from '../../context/ToastContext';
import {usePremium} from '../../context/PremiumContext';
import {useOfferingSheet} from '../../context/OfferingSheetContext';
import {useReaderPreferences} from '../../context/ReaderPreferencesContext';
import {logger} from '../../lib/utils/logger';
import {
  SHARE_TEMPLATES,
  SHARE_ASPECTS,
  isTemplateUnlocked,
  aspectHeight,
  type ShareAspect,
  type ShareTemplate,
} from '../../features/share/imageTemplates';
import {
  SHARE_TEXTURES,
  isTextureUnlocked,
  type ShareTexture,
} from '@/features/share/textures';
import {ShareTextureOverlay} from './ShareTextureOverlay';
import {
  getStylePresets,
  saveStylePreset,
  deleteStylePreset,
} from '@/features/share/stylePresetsStore';
import type {SharedStylePreset} from '@/features/share/stylePresets';
import {passageMetaLine} from '@lib/reading/passageReference';
import {
  READER_FONT_FAMILY_ORDER,
  READER_TYPEFACES,
  PREMIUM_READER_FONTS,
  resolveTypeface,
  isReaderFontFamily,
  type ReaderFontFamily,
} from '@lib/reader/typefaces';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
} from '../../styles/designTokens';

export interface ImageShareModalProps {
  visible: boolean;
  /** The verse body text already composed by the parent (verses joined). */
  verseText: string;
  /** Pretty reference shown under the verse text (e.g. "John 3:16"). */
  verseReference: string;
  /** Version abbreviation credited on the card (e.g. "RVR1960"). */
  versionAbbr?: string;
  /** How many verses are selected — appended to the version when > 1. */
  verseCount?: number;
  /** True when the user has at least one verse selected — drives the preview. */
  hasSelection: boolean;
  /** Inner card width (in px) used for the verse preview minHeight. */
  cardSize: number;
  onClose: () => void;
}

export const ImageShareModal: React.FC<ImageShareModalProps> = ({
  visible,
  verseText,
  verseReference,
  versionAbbr,
  verseCount = 0,
  hasSelection,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const {preferences} = useReaderPreferences();

  const [themeIndex, setThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>(
    'center',
  );
  const [fontFamilyId, setFontFamilyId] = useState<ReaderFontFamily>('serif');
  const [aspect, setAspect] = useState<ShareAspect>('square');
  const [texture, setTexture] = useState<ShareTexture>('none');
  const [isSharing, setIsSharing] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SharedStylePreset[]>([]);

  // T8.2 — load saved style presets (offering-unlocked) each time the
  // modal opens; a free user never sees this state used (the section below
  // is premium-gated), so this load is harmless either way.
  useEffect(() => {
    if (!visible) return;
    getStylePresets().then(setSavedPresets);
  }, [visible]);

  function handleSavePreset() {
    haptics.tap();
    if (!isPremium) {
      onClose();
      openOfferingSheet();
      return;
    }
    saveStylePreset({
      templateId: activeTheme.id,
      texture,
      fontSize,
      textAlign,
      fontFamilyId,
      aspect,
    }).then(next => {
      setSavedPresets(next);
      toast.success(t.verse.imageStyleSaved);
    });
  }

  function handleApplyPreset(preset: SharedStylePreset) {
    haptics.tap();
    const index = SHARE_TEMPLATES.findIndex(
      tpl => tpl.id === preset.templateId,
    );
    if (index >= 0) setThemeIndex(index);
    if (isTextureUnlocked(preset.texture, isPremium))
      setTexture(preset.texture);
    setFontSize(preset.fontSize);
    setTextAlign(preset.textAlign);
    if (isPremium || !PREMIUM_READER_FONTS.includes(preset.fontFamilyId)) {
      setFontFamilyId(preset.fontFamilyId);
    }
    setAspect(preset.aspect);
  }

  function handleDeletePreset(id: string) {
    haptics.tap();
    deleteStylePreset(id).then(setSavedPresets);
  }

  // Seed the card's typography from how the user actually reads (their
  // reader preferences) each time the modal opens — the closest size preset
  // and the chosen reading typeface. Depending only on `visible` re-seeds on
  // every open while letting the user override within the session.
  useEffect(() => {
    if (!visible) return;
    const presets = [16, 20, 24, 28];
    const closest = presets.reduce((a, b) =>
      Math.abs(b - preferences.fontSize) < Math.abs(a - preferences.fontSize)
        ? b
        : a,
    );
    setFontSize(closest);
    setFontFamilyId(
      isReaderFontFamily(preferences.fontFamily)
        ? preferences.fontFamily
        : 'serif',
    );
  }, [visible]);

  // T8.2 — the font picker below reuses the SAME reader typefaces as
  // ReaderPreferencesSheet, including the 3 offering-unlocked exclusives
  // (T6.2). Revert to the default free face if a premium one is selected
  // and the entitlement isn't (or is no longer) active.
  useEffect(() => {
    if (visible && !isPremium && PREMIUM_READER_FONTS.includes(fontFamilyId)) {
      setFontFamilyId('serif');
    }
  }, [visible, isPremium, fontFamilyId]);

  // T8.2 — same revert pattern for the texture overlay (every texture but
  // 'none' is offering-unlocked).
  useEffect(() => {
    if (visible && !isPremium && !isTextureUnlocked(texture, isPremium)) {
      setTexture('none');
    }
  }, [visible, isPremium, texture]);

  // captureRef accepts the host LinearGradient instance ref directly.
  const previewRef = useRef<LinearGradient>(null);
  const selectedTextColor = isDark ? colors.primaryDark : colors.primary;
  const activeTheme = SHARE_TEMPLATES[themeIndex];
  const cardHeight = aspectHeight(aspect, cardSize);

  function handleSelectTemplate(template: ShareTemplate, index: number) {
    haptics.tap();
    if (!isTemplateUnlocked(template, isPremium)) {
      // Locked design → open the offering sheet directly instead of just
      // sending the reader to Settings to go find it themselves.
      onClose();
      openOfferingSheet();
      return;
    }
    setThemeIndex(index);
  }

  async function handleShare() {
    if (isSharing || !previewRef.current) return;

    try {
      setIsSharing(true);
      haptics.press();

      const uri = await captureRef(previewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.error(t.verse.imageShareError);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t.share,
        UTI: 'public.png',
      });

      toast.success(t.verse.imageReady);
      onClose();
    } catch (error) {
      logger.error('Error sharing image', error as Error, {
        component: 'ImageShareModal',
        action: 'handleShare',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.container, {backgroundColor: colors.background}]}
        {...focusTrapProps()}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.close}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]}>
            {t.verse.shareAsImage}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing && styles.disabled}
            accessibilityRole="button"
            accessibilityLabel={t.verse.shareVerse}
            accessibilityHint={t.verse.shareAsImage}
            accessibilityState={{disabled: isSharing}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={activeTheme.colors}
              style={[styles.card, {minHeight: cardHeight || cardSize}]}
              ref={previewRef}
              collapsable={false}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <ShareTextureOverlay
                texture={texture}
                color={activeTheme.textColor}
              />
              <View style={styles.headerArea}>
                <Ionicons
                  name={activeTheme.icon as keyof typeof Ionicons.glyphMap}
                  size={32}
                  color={activeTheme.textColor}
                  style={styles.watermarkIcon}
                />
              </View>

              <View style={styles.mainArea}>
                <Ionicons
                  name="chatbubble-outline"
                  size={24}
                  color={activeTheme.textColor}
                  style={styles.quoteIcon}
                />
                <Text
                  style={[
                    styles.verseText,
                    {
                      color: activeTheme.textColor,
                      fontSize,
                      textAlign,
                      fontFamily: resolveTypeface(fontFamilyId),
                      paddingBottom: spacing.sm,
                    },
                  ]}>
                  {hasSelection ? verseText : t.verse.selectVersesFirst}
                </Text>
              </View>

              <View style={styles.brandContainer}>
                <View
                  style={[
                    styles.brandDivider,
                    {backgroundColor: activeTheme.textColor},
                  ]}
                />
                <Text
                  style={[styles.brandText, {color: activeTheme.textColor}]}>
                  Eternal Stone Bible
                </Text>
                <Text
                  style={[
                    styles.brandReference,
                    {color: activeTheme.textColor},
                  ]}>
                  {verseReference}
                </Text>
                {hasSelection && versionAbbr ? (
                  <Text
                    style={[styles.brandMeta, {color: activeTheme.textColor}]}>
                    {passageMetaLine(
                      versionAbbr,
                      verseCount,
                      t.verse.imageVersesWord,
                    )}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          </View>

          <View style={styles.optionsContainer}>
            <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
              {t.verse.imageStyle}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionsRow}>
              {SHARE_TEMPLATES.map((template, index) => {
                const unlocked = isTemplateUnlocked(template, isPremium);
                const selected = index === themeIndex;
                return (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleSelectTemplate(template, index)}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    accessibilityLabel={
                      t.verse.imageStyleA11y.replace(
                        '{{n}}',
                        String(index + 1),
                      ) + (unlocked ? '' : ` · ${t.offering.badgeA11y}`)
                    }
                    style={[
                      styles.styleCircle,
                      selected && styles.styleCircleSelected,
                      selected && {borderColor: colors.primary},
                    ]}>
                    <LinearGradient
                      colors={template.colors}
                      style={styles.styleCircleGradient}>
                      <Ionicons
                        name={template.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={template.textColor}
                      />
                    </LinearGradient>
                    {!unlocked && (
                      <View style={styles.lockBadge}>
                        <Ionicons
                          name="leaf-outline"
                          size={11}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.optionSection}>
              <View style={styles.optionTitleRow}>
                <Text
                  style={[
                    styles.optionsTitle,
                    styles.noMarginBottom,
                    {color: colors.textSecondary},
                  ]}>
                  {t.verse.imageMyStyles}
                </Text>
                <View
                  style={[
                    styles.exclusiveBadge,
                    {backgroundColor: colors.primary + '1a'},
                  ]}>
                  <Text style={[styles.exclusiveText, {color: colors.primary}]}>
                    {t.verse.exclusiveLabel}
                  </Text>
                </View>
              </View>
              {isPremium && savedPresets.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsRow}>
                  {savedPresets.map(preset => {
                    // Legacy presets saved before BUG-7's fix still carry the
                    // old hardcoded "Estilo N" as their literal `.name`. Only
                    // apply the localized "Style {{n}}" template when `name`
                    // is a plain ordinal (what NEW presets store) — otherwise
                    // render the legacy string as-is, so we don't double it
                    // up into "Estilo Estilo 1". These self-heal as the old
                    // presets age out of the MAX_STYLE_PRESETS cap.
                    const isOrdinal = /^\d+$/.test(preset.name);
                    const presetLabel = isOrdinal
                      ? t.verse.imageStyleA11y.replace('{{n}}', preset.name)
                      : preset.name;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        onPress={() => handleApplyPreset(preset)}
                        accessibilityRole="button"
                        accessibilityLabel={presetLabel}
                        style={[
                          styles.sizeButton,
                          styles.presetChip,
                          {borderColor: colors.border},
                        ]}>
                        <Text
                          style={[styles.formatLabel, {color: colors.text}]}>
                          {presetLabel}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeletePreset(preset.id)}
                          accessibilityRole="button"
                          accessibilityLabel={t.verse.imageDeletePreset}
                          hitSlop={8}
                          style={styles.presetDelete}>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={colors.textTertiary}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
              <TouchableOpacity
                onPress={handleSavePreset}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? t.verse.imageSavePreset
                    : `${t.verse.imageSavePreset} · ${t.offering.badgeA11y}`
                }
                style={[styles.saveStyleButton, {borderColor: colors.primary}]}>
                {!isPremium && (
                  <Ionicons
                    name="leaf-outline"
                    size={14}
                    color={colors.primary}
                  />
                )}
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.saveStyleText, {color: colors.primary}]}>
                  {t.verse.imageSavePreset}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionSection}>
              <Text
                style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                {t.verse.imageFormat}
              </Text>
              <View style={styles.optionsRow}>
                {SHARE_ASPECTS.map(option => {
                  const active = aspect === option;
                  const label =
                    option === 'square'
                      ? t.verse.imageFormatSquare
                      : option === 'portrait'
                        ? t.verse.imageFormatPortrait
                        : t.verse.imageFormatStory;
                  const icon =
                    option === 'square'
                      ? 'square-outline'
                      : option === 'portrait'
                        ? 'tablet-portrait-outline'
                        : 'phone-portrait-outline';
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setAspect(option)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{selected: active}}
                      style={[
                        styles.sizeButton,
                        styles.flex1,
                        styles.formatButton,
                        active && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryLight,
                        },
                      ]}>
                      <Ionicons
                        name={icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={active ? selectedTextColor : colors.text}
                      />
                      <Text
                        style={[
                          styles.formatLabel,
                          {color: active ? selectedTextColor : colors.text},
                        ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.optionSection}>
              <View style={styles.optionTitleRow}>
                <Text
                  style={[
                    styles.optionsTitle,
                    styles.noMarginBottom,
                    {color: colors.textSecondary},
                  ]}>
                  {t.verse.imageTexture}
                </Text>
                <View
                  style={[
                    styles.exclusiveBadge,
                    {backgroundColor: colors.primary + '1a'},
                  ]}>
                  <Text style={[styles.exclusiveText, {color: colors.primary}]}>
                    {t.verse.exclusiveLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.optionsRow}>
                {SHARE_TEXTURES.map(option => {
                  const active = texture === option;
                  const locked = !isTextureUnlocked(option, isPremium);
                  const label =
                    option === 'none'
                      ? t.verse.imageTextureNone
                      : option === 'dots'
                        ? t.verse.imageTextureDots
                        : option === 'lines'
                          ? t.verse.imageTextureLines
                          : t.verse.imageTextureGrain;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        haptics.tap();
                        if (locked) {
                          onClose();
                          openOfferingSheet();
                          return;
                        }
                        setTexture(option);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        locked ? `${label} · ${t.offering.badgeA11y}` : label
                      }
                      accessibilityState={{selected: active}}
                      style={[
                        styles.sizeButton,
                        styles.flex1,
                        styles.formatButton,
                        active && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryLight,
                        },
                      ]}>
                      <Ionicons
                        name={
                          option === 'none'
                            ? 'close-outline'
                            : option === 'dots'
                              ? 'ellipsis-horizontal'
                              : option === 'lines'
                                ? 'reorder-four-outline'
                                : 'sparkles-outline'
                        }
                        size={20}
                        color={active ? selectedTextColor : colors.text}
                      />
                      <Text
                        style={[
                          styles.formatLabel,
                          {color: active ? selectedTextColor : colors.text},
                        ]}>
                        {label}
                      </Text>
                      {locked && (
                        <View style={styles.lockBadge}>
                          <Ionicons
                            name="leaf-outline"
                            size={11}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text
                style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                {t.verse.imageFontSize}
              </Text>
              <View style={styles.optionsRow}>
                {[16, 20, 24, 28].map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setFontSize(size)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.verse.imageFontSize} ${size}`}
                    accessibilityState={{selected: fontSize === size}}
                    style={[
                      styles.sizeButton,
                      fontSize === size && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.sizeButtonText,
                        {
                          color:
                            fontSize === size ? selectedTextColor : colors.text,
                        },
                      ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text
                style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                {t.verse.imageAlignment}
              </Text>
              <View style={styles.optionsRow}>
                {(['left', 'center', 'right'] as const).map(align => (
                  <TouchableOpacity
                    key={align}
                    onPress={() => setTextAlign(align)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      align === 'left'
                        ? t.verse.imageAlignLeft
                        : align === 'center'
                          ? t.verse.imageAlignCenter
                          : t.verse.imageAlignRight
                    }
                    accessibilityState={{selected: textAlign === align}}
                    style={[
                      styles.sizeButton,
                      styles.flex1,
                      textAlign === align && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                      },
                    ]}>
                    <Ionicons
                      name={
                        align === 'left'
                          ? 'list-outline'
                          : align === 'center'
                            ? 'menu-outline'
                            : 'reorder-three-outline'
                      }
                      size={20}
                      color={
                        textAlign === align ? selectedTextColor : colors.text
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text
                style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                {t.verse.imageFontStyle}
              </Text>
              <View style={styles.fontPickerRow}>
                {READER_FONT_FAMILY_ORDER.map(id => {
                  const spec = READER_TYPEFACES[id];
                  const selected = fontFamilyId === id;
                  const locked =
                    PREMIUM_READER_FONTS.includes(id) && !isPremium;
                  const label = (t.readerPrefs as Record<string, string>)[
                    spec.labelKey
                  ];
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        haptics.tap();
                        if (locked) {
                          onClose();
                          openOfferingSheet();
                          return;
                        }
                        setFontFamilyId(id);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        locked ? `${label} · ${t.offering.badgeA11y}` : label
                      }
                      accessibilityState={{selected}}
                      style={[
                        styles.fontSwatch,
                        {borderColor: colors.border},
                        selected && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryLight,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.fontSwatchSample,
                          {
                            fontFamily: spec.family,
                            color: selected ? selectedTextColor : colors.text,
                          },
                        ]}>
                        {spec.sample}
                      </Text>
                      {locked && (
                        <View style={styles.lockBadge}>
                          <Ionicons
                            name="leaf-outline"
                            size={11}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  styleCircleSelected: {borderWidth: 3},
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  headerArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    height: 40,
  },
  watermarkIcon: {
    opacity: 0.4,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
  quoteIcon: {
    opacity: 0.3,
    marginBottom: spacing.xs,
  },
  verseText: {
    fontSize: fontSizes.lg,
    textAlign: 'center',
    // No `fontStyle: 'italic'` here: the bundled reader faces (S82) register only
    // Regular + Bold variants, so on Android pairing a custom family with an
    // italic style finds no italic face and silently falls back to the SYSTEM
    // font — which made every typeface in the picker look identical ("las
    // tipografías no funcionan aquí"). Rendering upright lets the chosen face
    // actually show, matching the Verse-art composer.
    lineHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  brandContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  brandDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.md,
    opacity: 0.2,
  },
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  brandReference: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.7,
  },
  brandMeta: {
    fontSize: fontSizes.xs,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.55,
  },
  optionsContainer: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  optionSection: {
    marginTop: spacing.lg,
  },
  styleCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: staticColors.transparent,
  },
  styleCircleGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: staticColors.overlayBlack65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: staticColors.transparent,
    backgroundColor: staticColors.overlayBlack05,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  sizeButtonText: {
    fontWeight: 'bold',
  },
  fontPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fontSwatch: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSwatchSample: {
    fontSize: fontSizes.lg,
  },
  formatButton: {
    position: 'relative',
    flexDirection: 'column',
    paddingVertical: spacing.md,
  },
  formatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  flex1: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  noMarginBottom: {
    marginBottom: 0,
  },
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  presetDelete: {
    marginLeft: 2,
  },
  saveStyleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  saveStyleText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});
