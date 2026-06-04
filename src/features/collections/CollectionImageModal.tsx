/**
 * 🖼️ CollectionImageModal — share a whole collection as a designer image card.
 *
 * Sprint 68. Reuses the Sprint 56 view-shot pipeline (`captureRef` →
 * `expo-sharing`, `collapsable={false}` on Android) and the `imageTemplates`
 * gradient catalog, but draws a COLLECTION card (name + verse count + a few
 * preview verses) instead of a single verse. The card model is the pure
 * [[collectionCard]] builder; the gradient is picked from the FREE templates.
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
import {type CollectionCardModel} from './collectionCard';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
  staticColors,
} from '@/styles/designTokens';

export interface CollectionImageModalProps {
  visible: boolean;
  /** The render-ready card (name + count + preview verses), built by the screen. */
  card: CollectionCardModel;
  /** Inner card width (px) used for the preview min height. */
  cardSize: number;
  onClose: () => void;
}

export const CollectionImageModal: React.FC<CollectionImageModalProps> = ({
  visible,
  card,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const tc = t.collections;

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
      logger.error('Error sharing collection image', error as Error, {
        component: 'CollectionImageModal',
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
            style={isSharing ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={tc.shareImage}
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
                style={[styles.cardName, {color: template.textColor}]}
                numberOfLines={2}>
                {card.name}
              </Text>
              <Text style={[styles.cardCount, {color: template.textColor}]}>
                {`${card.count} ${tc.verses}`}
              </Text>

              <View style={styles.cardVerses}>
                {card.verses.map((v, i) => (
                  <View key={`${v.reference}-${i}`} style={styles.cardVerse}>
                    <Text
                      style={[styles.cardRef, {color: template.textColor}]}
                      numberOfLines={1}>
                      {v.reference}
                    </Text>
                    <Text
                      style={[styles.cardText, {color: template.textColor}]}
                      numberOfLines={3}>
                      {v.text}
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

export default CollectionImageModal;

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
  cardName: {fontSize: fontSizes['3xl'], fontWeight: '800'},
  cardCount: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.85,
    marginTop: 4,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardVerses: {gap: spacing.md},
  cardVerse: {gap: 2},
  cardRef: {fontSize: fontSizes.sm, fontWeight: '700', opacity: 0.9},
  cardText: {fontSize: fontSizes.base, fontStyle: 'italic', lineHeight: 24},
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
