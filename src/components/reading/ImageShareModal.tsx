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
import React, {useRef, useState} from 'react';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {useToast} from '../../context/ToastContext';
import {logger} from '../../lib/utils/logger';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
} from '../../styles/designTokens';

const IMAGE_THEMES = [
  {
    id: 'classic',
    colors: ['#1A1D2E', '#2A2E45'] as const,
    textColor: '#D4AF37',
    icon: 'book-outline',
  },
  {
    id: 'sunrise',
    colors: ['#FF8C00', '#F27121'] as const,
    textColor: '#FFFFFF',
    icon: 'sunny-outline',
  },
  {
    id: 'nature',
    colors: ['#234D20', '#36802D'] as const,
    textColor: '#FFFFFF',
    icon: 'leaf-outline',
  },
  {
    id: 'spiritual',
    colors: ['#4E006E', '#8E24AA'] as const,
    textColor: '#FFFFFF',
    icon: 'sparkles-outline',
  },
  {
    id: 'ocean',
    colors: ['#0F2027', '#203A43', '#2C5364'] as const,
    textColor: '#00D2FF',
    icon: 'water-outline',
  },
  {
    id: 'royal',
    colors: ['#600000', '#C41E3A'] as const,
    textColor: '#FFD700',
    icon: 'ribbon-outline',
  },
  {
    id: 'midnight',
    colors: ['#000000', '#1C1C1C'] as const,
    textColor: '#E0E0E0',
    icon: 'moon-outline',
  },
  {
    id: 'minimal',
    colors: ['#FFFFFF', '#F5F5F7'] as const,
    textColor: '#2C3E50',
    icon: 'document-text-outline',
  },
  {
    id: 'aura',
    colors: ['#3A1C71', '#D76D77', '#FFAF7B'] as const,
    textColor: '#FFFFFF',
    icon: 'color-palette-outline',
  },
  {
    id: 'rose',
    colors: ['#F7CAC9', '#92A8D1'] as const,
    textColor: '#5D4037',
    icon: 'heart-outline',
  },
];

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

  const [themeIndex, setThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>(
    'center',
  );
  const [useSerif, setUseSerif] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // `captureRef` accepts a ref to any host component; LinearGradient's
  // generated ref type doesn't quite match `useRef<View>`, so we widen.
  const previewRef = useRef<any>(null);
  const selectedTextColor = isDark ? colors.primaryDark : colors.primary;
  const activeTheme = IMAGE_THEMES[themeIndex];

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
            accessibilityLabel={t.verse.shareVerse}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={activeTheme.colors}
              style={[styles.card, {minHeight: cardSize}]}
              ref={previewRef}
              collapsable={false}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <View style={styles.headerArea}>
                <Ionicons
                  name={activeTheme.icon as any}
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
              {IMAGE_THEMES.map((theme, index) => (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setThemeIndex(index);
                  }}
                  style={[
                    styles.styleCircle,
                    index === themeIndex && {
                      borderColor: colors.primary,
                      borderWidth: 3,
                    },
                  ]}>
                  <LinearGradient
                    colors={theme.colors}
                    style={styles.styleCircleGradient}>
                    <Ionicons
                      name={theme.icon as any}
                      size={20}
                      color={theme.textColor}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
                      {
                        color: useSerif ? selectedTextColor : colors.text,
                        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                      },
                    ]}>
                    Serif
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUseSerif(false)}
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
    borderColor: 'transparent',
  },
  styleCircleGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  flex1: {
    flex: 1,
  },
});
