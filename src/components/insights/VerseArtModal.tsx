/**
 * 🎨 VerseArtModal — compose a verse as typographic art (Sprint 87).
 *
 * A premium "verse card" composer: the verse rendered LARGE in one of the app's
 * six BUNDLED reading faces (Inter / Atkinson Hyperlegible / Lora / EB Garamond
 * / Archivo Narrow / JetBrains Mono — guaranteed identical on every device,
 * S82) over a gradient template, shared through the S56/77 captureRef →
 * expo-sharing pipeline + the FREE imageTemplates catalog. The typeface is the
 * star — a face picker (each swatch shown in its own face) sits beside the
 * template picker. Composes the existing [[typefaces]] + the share pipeline;
 * nothing new computes.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useRef, useState} from 'react';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {FREE_TEMPLATES} from '@/features/share/imageTemplates';
import {
  READER_FONT_FAMILY_ORDER,
  READER_TYPEFACES,
  resolveTypeface,
  resolveTypefaceBold,
} from '@lib/reader/typefaces';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface VerseArtModalProps {
  visible: boolean;
  /** The verse body (already composed by the parent). */
  verseText: string;
  /** Localized reference, e.g. "Juan 3:16". */
  reference: string;
  onClose: () => void;
}

export const VerseArtModal: React.FC<VerseArtModalProps> = ({
  visible,
  verseText,
  reference,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const va = t.verseArt;
  const toast = useToast();

  const [faceIndex, setFaceIndex] = useState(0);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts the host LinearGradient instance ref directly.
  const previewRef = useRef<LinearGradient>(null);
  const template = FREE_TEMPLATES[templateIndex];
  const faceId = READER_FONT_FAMILY_ORDER[faceIndex];
  const fontFamily = resolveTypeface(faceId);
  const fontFamilyBold = resolveTypefaceBold(faceId);

  // Smaller hero size for long verses so the card stays shareable.
  const heroSize =
    verseText.length > 220 ? 20 : verseText.length > 120 ? 24 : 30;

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

      if (!(await Sharing.isAvailableAsync())) {
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
      logger.error('Error sharing verse art', error as Error, {
        component: 'VerseArtModal',
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
          <Text style={[styles.title, {color: colors.text}]}>{va.title}</Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t.share}
            accessibilityState={{disabled: isSharing}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={template.colors}
              style={styles.card}
              ref={previewRef}
              collapsable={false}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <Text
                style={[
                  styles.verse,
                  {color: template.textColor, fontFamily, fontSize: heroSize},
                ]}>
                {verseText.trim()}
              </Text>
              <Text
                style={[
                  styles.reference,
                  {color: template.textColor, fontFamily: fontFamilyBold},
                ]}>
                {reference}
              </Text>
              <View style={styles.brand}>
                <View
                  style={[
                    styles.brandDivider,
                    {backgroundColor: template.textColor},
                  ]}
                />
                <Text style={[styles.brandText, {color: template.textColor}]}>
                  Eternal Stone Bible
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Typeface picker — each swatch shown in its OWN face. */}
          <View style={styles.options}>
            <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
              {va.typeface}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {READER_FONT_FAMILY_ORDER.map((id, index) => {
                const selected = index === faceIndex;
                const spec = READER_TYPEFACES[id];
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => {
                      haptics.tap();
                      setFaceIndex(index);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    accessibilityLabel={t.readerPrefs[spec.labelKey]}
                    style={[
                      styles.faceSwatch,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                      selected && styles.faceSwatchSelected,
                    ]}>
                    <Text
                      style={[
                        styles.faceSample,
                        {color: colors.text, fontFamily: resolveTypeface(id)},
                      ]}>
                      {spec.sample}
                    </Text>
                    <Text
                      style={[styles.faceLabel, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {t.readerPrefs[spec.labelKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Template picker. */}
          <View style={styles.options}>
            <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
              {t.verse.imageStyle}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FREE_TEMPLATES.map((tpl, index) => {
                const selected = index === templateIndex;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    onPress={() => {
                      haptics.tap();
                      setTemplateIndex(index);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    accessibilityLabel={t.verse.imageStyleA11y.replace(
                      '{{n}}',
                      String(index + 1),
                    )}
                    style={[
                      styles.swatch,
                      selected && styles.swatchSelected,
                      selected && {borderColor: colors.primary},
                    ]}>
                    <LinearGradient
                      colors={tpl.colors}
                      style={styles.swatchGradient}>
                      <Ionicons
                        name={tpl.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={tpl.textColor}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default VerseArtModal;

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scrollContent: {paddingBottom: spacing['4xl']},
  disabled: {opacity: 0.6},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {fontSize: fontSizes.lg, fontWeight: '700'},
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    minHeight: 280,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
  },
  verse: {
    fontWeight: '500',
  },
  reference: {
    fontSize: fontSizes.md,
    marginTop: spacing.lg,
    opacity: 0.9,
  },
  brand: {marginTop: spacing['2xl'], alignItems: 'flex-start'},
  brandDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
  options: {paddingHorizontal: spacing.xl, paddingTop: spacing.lg},
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  faceSwatch: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  faceSwatchSelected: {borderWidth: 2.5},
  faceSample: {fontSize: fontSizes.xl, fontWeight: '600'},
  faceLabel: {fontSize: 10, fontWeight: '600'},
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: staticColors.transparent,
  },
  swatchSelected: {borderWidth: 3},
  swatchGradient: {
    flex: 1,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
