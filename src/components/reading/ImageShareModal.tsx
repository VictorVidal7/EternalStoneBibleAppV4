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
  Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';
import {staticColors} from '../../styles/designTokens';
import {useLanguage} from '../../hooks/useLanguage';
import {useToast} from '../../context/ToastContext';
import {usePremium} from '../../context/PremiumContext';
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
  hasSelection,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const {isPremium} = usePremium();
  const {preferences} = useReaderPreferences();

  const [themeIndex, setThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>(
    'center',
  );
  const [useSerif, setUseSerif] = useState(true);
  const [aspect, setAspect] = useState<ShareAspect>('square');
  const [isSharing, setIsSharing] = useState(false);

  // Seed the card's typography from how the user actually reads (their
  // reader preferences) each time the modal opens — the closest size preset
  // and serif/sans. Depending only on `visible` re-seeds on every open while
  // letting the user override within the session.
  useEffect(() => {
    if (!visible) return;
    const presets = [16, 20, 24, 28];
    const closest = presets.reduce((a, b) =>
      Math.abs(b - preferences.fontSize) < Math.abs(a - preferences.fontSize)
        ? b
        : a,
    );
    setFontSize(closest);
    setUseSerif(preferences.fontFamily === 'serif');
  }, [visible]);

  // `captureRef` accepts a ref to any host component; LinearGradient's
  // generated ref type doesn't quite match `useRef<View>`, so we widen.
  const previewRef = useRef<any>(null);
  const selectedTextColor = isDark ? colors.primaryDark : colors.primary;
  const activeTheme = SHARE_TEMPLATES[themeIndex];
  const cardHeight = aspectHeight(aspect, cardSize);

  function handleSelectTemplate(template: ShareTemplate, index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isTemplateUnlocked(template, isPremium)) {
      // Locked premium design → send the user to the Settings upsell,
      // mirroring the S50 verse-scrubber gate. Don't select it.
      toast.info(`${t.premium.badge} · ${t.premium.upsellTap}`);
      onClose();
      router.push('/(tabs)/settings');
      return;
    }
    setThemeIndex(index);
  }

  async function handleShare() {
    if (isSharing || !previewRef.current) return;

    try {
      setIsSharing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      <View style={[styles.container, {backgroundColor: colors.background}]}>
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
                      fontFamily: useSerif
                        ? Platform.OS === 'ios'
                          ? 'Georgia'
                          : 'serif'
                        : undefined,
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
                      ) + (unlocked ? '' : ` · ${t.premium.badge}`)
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
                          name="lock-closed"
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
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  onPress={() => setUseSerif(true)}
                  accessibilityRole="button"
                  accessibilityState={{selected: useSerif}}
                  style={[
                    styles.sizeButton,
                    styles.flex1,
                    useSerif && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.fontStyleText,
                      styles.serifFont,
                      {color: useSerif ? selectedTextColor : colors.text},
                    ]}>
                    Serif
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUseSerif(false)}
                  accessibilityRole="button"
                  accessibilityState={{selected: !useSerif}}
                  style={[
                    styles.sizeButton,
                    styles.flex1,
                    !useSerif && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.fontStyleText,
                      {color: !useSerif ? selectedTextColor : colors.text},
                    ]}>
                    Sans
                  </Text>
                </TouchableOpacity>
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
  serifFont: {fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'},
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
    fontStyle: 'italic',
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
  fontStyleText: {
    fontWeight: 'bold',
  },
  formatButton: {
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
});
