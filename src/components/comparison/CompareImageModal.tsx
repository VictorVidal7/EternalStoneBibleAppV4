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
 * Tanda M Phase B: wired to `PremiumShareExtras` (offering-unlocked premium
 * templates + textures + "Mis estilos" presets), same as the other 11
 * non-verse share screens — the two `CompareCard` render sites (carousel +
 * off-screen "share all" collage) both stay in sync since they share this
 * component's own `texture`/`templateIndex` state.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {
  SHARE_TEMPLATES,
  type ShareTemplate,
} from '@/features/share/imageTemplates';
import {type ShareTexture} from '@/features/share/textures';
import {ShareCardHost} from '@/features/share/ShareCardHost';
import {PremiumShareExtras} from '@/features/share/PremiumShareExtras';
import {type ComparisonCardModel} from '@/lib/comparison/comparisonCard';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
} from '@/styles/designTokens';

export interface CompareImageModalProps {
  visible: boolean;
  /**
   * The render-ready cards (reference + similarity + tokenized versions). One
   * per selected verse — a single-element array in single-verse mode (no
   * carousel chrome), a swipeable carousel when there are ≥2 (Sprint 70).
   */
  cards: ComparisonCardModel[];
  /** Inner card width (px) used for the preview min height. */
  cardSize: number;
  onClose: () => void;
}

interface CompareCardProps {
  card: ComparisonCardModel;
  template: ShareTemplate;
  texture: ShareTexture;
  similarityLabel: string;
  /** Min height — the full preview height in the carousel, 0 (natural) in the collage. */
  minHeight: number;
}

/**
 * One comparison card (reference + similarity + each version's tokenized verse,
 * divergent words highlighted). Forwards its ref to the capturable LinearGradient
 * host so the same card renders in the swipeable carousel AND, with natural
 * height, in the off-screen "share all" collage (Sprint 71).
 */
const CompareCard = forwardRef<LinearGradient, CompareCardProps>(
  ({card, template, texture, similarityLabel, minHeight}, ref) => (
    <ShareCardHost
      ref={ref}
      template={template}
      texture={texture}
      style={{minHeight}}>
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
      <Text style={[styles.cardSimilarity, {color: template.textColor}]}>
        {`${card.similarity}% ${similarityLabel}`}
      </Text>

      <View style={styles.cardVersions}>
        {card.versions.map((v, vi) => (
          <View key={`${v.abbr}-${vi}`} style={styles.cardVersion}>
            <View style={[styles.abbrBadge, {borderColor: template.textColor}]}>
              <Text style={[styles.abbrText, {color: template.textColor}]}>
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
          style={[styles.brandDivider, {backgroundColor: template.textColor}]}
        />
        <Text style={[styles.brandText, {color: template.textColor}]}>
          Eternal Stone Bible
        </Text>
      </View>
    </ShareCardHost>
  ),
);
CompareCard.displayName = 'CompareCard';

export const CompareImageModal: React.FC<CompareImageModalProps> = ({
  visible,
  cards,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {width: screenWidth} = useWindowDimensions();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [texture, setTexture] = useState<ShareTexture>('none');
  const [isSharing, setIsSharing] = useState(false);
  // Which verse's card is currently centered in the carousel (Sprint 70) — the
  // one captured + shared. Reset to the first card whenever the modal opens.
  const [currentPage, setCurrentPage] = useState(0);

  // One capturable LinearGradient ref PER card so we share exactly the card
  // currently on screen.
  const cardRefs = useRef<(LinearGradient | null)[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  // The off-screen vertical collage of every card — one capturable View host
  // for the "share all" action (Sprint 71).
  const collageRef = useRef<View>(null);
  const template = SHARE_TEMPLATES[templateIndex];
  const hasCarousel = cards.length > 1;

  // Reopen always starts on the first verse (the carousel retains scroll
  // position across opens otherwise).
  useEffect(() => {
    if (visible) {
      setCurrentPage(0);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({x: 0, animated: false}),
      );
    }
  }, [visible]);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCurrentPage(Math.max(0, Math.min(page, cards.length - 1)));
  }

  // Capture a single host view → PNG → system share sheet. Shared by the
  // single-card share (the centered carousel card) and the "share all" collage.
  async function shareTarget(target: LinearGradient | View | null) {
    if (isSharing || !target) return;
    try {
      setIsSharing(true);
      haptics.press();

      const uri = await captureRef(target, {
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

  // Share the card currently centered in the carousel (or the only card).
  const handleShare = () => shareTarget(cardRefs.current[currentPage]);

  // Share ALL verses as one tall PNG — the off-screen collage stacking every
  // card vertically (Sprint 71). Only offered in multi-verse mode.
  const handleShareAll = () => shareTarget(collageRef.current);

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
            disabled={isSharing || cards.length === 0}
            style={
              isSharing || cards.length === 0 ? styles.disabled : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={t.versionComparison.shareImage}
            accessibilityState={{disabled: isSharing || cards.length === 0}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          {cards.length > 0 && (
            <>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                scrollEnabled={hasCarousel}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}>
                {cards.map((card, ci) => (
                  <View
                    key={`${card.reference}-${ci}`}
                    style={[styles.previewContainer, {width: screenWidth}]}>
                    <CompareCard
                      ref={el => {
                        cardRefs.current[ci] = el;
                      }}
                      card={card}
                      template={template}
                      texture={texture}
                      similarityLabel={t.versionComparison.similarity}
                      minHeight={cardSize}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Carousel page indicator — only when there's more than one
                  verse. The dots track the centered card; the share button
                  captures whichever card is in view. */}
              {hasCarousel && (
                <View
                  style={styles.pager}
                  accessibilityRole="adjustable"
                  accessible
                  accessibilityLabel={`${currentPage + 1} / ${cards.length}`}>
                  {cards.map((card, ci) => (
                    <View
                      key={`dot-${card.reference}-${ci}`}
                      style={[
                        styles.dot,
                        ci === currentPage && styles.dotActive,
                        {
                          backgroundColor:
                            ci === currentPage ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Share EVERY verse as one tall PNG (the off-screen collage),
                  in addition to the single-card share in the header. */}
              {hasCarousel && (
                <TouchableOpacity
                  onPress={handleShareAll}
                  disabled={isSharing}
                  style={[
                    styles.shareAllBtn,
                    {borderColor: colors.primary},
                    isSharing && styles.disabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t.versionComparison.shareAllImage}
                  accessibilityState={{disabled: isSharing}}>
                  <Ionicons
                    name="images-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.shareAllText, {color: colors.primary}]}>
                    {`${t.versionComparison.shareAllImage} (${cards.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <PremiumShareExtras
            templates={SHARE_TEMPLATES}
            templateIndex={templateIndex}
            onSelectTemplate={setTemplateIndex}
            texture={texture}
            onSelectTexture={setTexture}
            isPremium={isPremium}
            onLockedAction={openOfferingSheet}
          />
        </ScrollView>

        {/* Off-screen collage: every card stacked vertically, captured as one
            tall PNG by "share all". Laid out at full size but positioned off the
            visible area (full opacity so the capture isn't transparent). */}
        {hasCarousel && (
          <View style={styles.collageWrap} pointerEvents="none">
            <View
              ref={collageRef}
              collapsable={false}
              style={[
                styles.collageInner,
                {width: screenWidth, backgroundColor: colors.background},
              ]}>
              {cards.map((card, ci) => (
                <CompareCard
                  key={`collage-${card.reference}-${ci}`}
                  card={card}
                  template={template}
                  texture={texture}
                  similarityLabel={t.versionComparison.similarity}
                  minHeight={0}
                />
              ))}
            </View>
          </View>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
  },
  shareAllBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  shareAllText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  collageWrap: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
  collageInner: {
    padding: spacing.xl,
    gap: spacing.lg,
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
});
