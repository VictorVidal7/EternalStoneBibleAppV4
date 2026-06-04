/**
 * 🖼️ CompareImageModal — share a version comparison as a designer image card.
 *
 * Sprint 69. Reuses the Sprint 56 view-shot pipeline (`captureRef` →
 * `expo-sharing`, `collapsable={false}` on Android) and the `imageTemplates`
 * gradient catalog (like CollectionImageModal), but draws a COMPARISON card:
 * the verse reference, the similarity score, and each version's verse with its
 * DIVERGENT words bolded inline — the same word-contrast the user saw on screen,
 * baked into a shareable PNG. The card model is the pure [[comparisonCard]]
 * builder.
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
import {type ComparisonCardModel} from '@/lib/comparison/comparisonCard';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface CompareImageModalProps {
  visible: boolean;
  /** The render-ready card (reference + similarity + tokenized versions). */
  card: ComparisonCardModel | null;
  /** Inner card width (px) used for the preview min height. */
  cardSize: number;
  onClose: () => void;
}

export const CompareImageModal: React.FC<CompareImageModalProps> = ({
  visible,
  card,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // captureRef accepts a ref to any host component; LinearGradient's generated
  // ref type doesn't match useRef<View>, so we widen (as in ImageShareModal).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewRef = useRef<any>(null);
  const template = FREE_TEMPLATES[templateIndex];

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
      logger.error('Error sharing comparison image', error as Error, {
        component: 'CompareImageModal',
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
            disabled={isSharing || !card}
            style={isSharing || !card ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t.versionComparison.shareImage}
            accessibilityState={{disabled: isSharing || !card}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          {card && (
            <View style={styles.previewContainer}>
              <LinearGradient
                colors={template.colors}
                style={[styles.card, {minHeight: cardSize}]}
                ref={previewRef}
                collapsable={false}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <Ionicons
                  name={template.icon as keyof typeof Ionicons.glyphMap}
                  size={30}
                  color={template.textColor}
                  style={styles.watermark}
                />
                <Text
                  style={[styles.cardRef, {color: template.textColor}]}
                  numberOfLines={2}>
                  {card.reference}
                </Text>
                <Text
                  style={[styles.cardSimilarity, {color: template.textColor}]}>
                  {`${card.similarity}% ${t.versionComparison.similarity}`}
                </Text>

                <View style={styles.cardVersions}>
                  {card.versions.map((v, vi) => (
                    <View key={`${v.abbr}-${vi}`} style={styles.cardVersion}>
                      <View
                        style={[
                          styles.abbrBadge,
                          {borderColor: template.textColor},
                        ]}>
                        <Text
                          style={[
                            styles.abbrText,
                            {color: template.textColor},
                          ]}>
                          {v.abbr}
                        </Text>
                      </View>
                      <Text
                        style={[styles.cardText, {color: template.textColor}]}
                        numberOfLines={4}>
                        {v.tokens.map((tok, i) =>
                          card.highlight && tok.divergent ? (
                            <Text key={i} style={styles.divergent}>
                              {tok.text}
                            </Text>
                          ) : (
                            tok.text
                          ),
                        )}
                      </Text>
                    </View>
                  ))}
                </View>

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
          )}

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

export default CompareImageModal;

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  cardRef: {fontSize: fontSizes['3xl'], fontWeight: '800'},
  cardSimilarity: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.85,
    marginTop: 4,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardVersions: {gap: spacing.lg},
  cardVersion: {gap: spacing.xs},
  abbrBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    opacity: 0.9,
  },
  abbrText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardText: {fontSize: fontSizes.base, fontStyle: 'italic', lineHeight: 24},
  divergent: {fontWeight: '900', textDecorationLine: 'underline'},
  brand: {marginTop: spacing.xl, alignItems: 'flex-start'},
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
  options: {paddingHorizontal: spacing.xl, paddingTop: spacing.md},
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
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
