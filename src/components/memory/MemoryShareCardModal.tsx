/**
 * 🖼️ MEMORY SHARE CARD MODAL (T8.1 — offering-unlocked)
 *
 * A small, self-contained "share my memorization progress" card: total
 * verses memorized, overall retention, and current streak, captured as an
 * image and handed to the system share sheet — same capture pipeline as
 * `ImageShareModal` (`react-native-view-shot` + `expo-sharing`), but a much
 * simpler fixed layout since there's no theme/font picker here (that
 * customization work is T8.2's, over on the verse-sharing flow).
 *
 * Only rendered while `isPremium` (the insights screen doesn't mount this
 * at all for a free user — see `app/features/memory/insights.tsx`).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useRef, useState} from 'react';
import {Modal, View, TouchableOpacity, StyleSheet} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  totalVerses: number;
  /** [0, 1], or null when there's no retention-eligible review yet. */
  retention: number | null;
  streak: number;
}

const CARD_GRADIENT: readonly [string, string, string] = [
  '#1e293b',
  '#312e81',
  '#4c1d95',
];

export const MemoryShareCardModal: React.FC<Props> = ({
  visible,
  onClose,
  totalVerses,
  retention,
  streak,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const i = t.memory.insights;
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<LinearGradient>(null);

  const retentionPct = retention == null ? null : Math.round(retention * 100);

  async function handleShare() {
    if (isSharing || !cardRef.current) return;
    try {
      setIsSharing(true);
      haptics.press();
      const uri = await captureRef(cardRef, {
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
    } catch (error) {
      logger.error('Error sharing memory progress card', error as Error, {
        component: 'MemoryShareCardModal',
        action: 'handleShare',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
          {...a11yHiddenProps()}
        />
        <View
          style={[styles.sheet, {backgroundColor: colors.surface}]}
          {...focusTrapProps()}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.text}]}>
              {i.shareProgressButton}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewWrap}>
            <LinearGradient
              ref={cardRef}
              collapsable={false}
              colors={CARD_GRADIENT}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.card}>
              <Ionicons
                name="book"
                size={30}
                color={staticColors.white}
                style={styles.cardIcon}
              />
              <Text style={styles.cardHeadline}>{totalVerses}</Text>
              <Text style={styles.cardHeadlineLabel}>
                {totalVerses === 1
                  ? i.shareCardVersesSingular
                  : i.shareCardVerses}
              </Text>

              <View style={styles.cardStatsRow}>
                {retentionPct != null ? (
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatValue}>{retentionPct}%</Text>
                    <Text style={styles.cardStatLabel}>
                      {i.shareCardRetention}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>{streak}</Text>
                  <Text style={styles.cardStatLabel}>
                    {streak === 1
                      ? i.shareCardStreakSingular
                      : i.shareCardStreak}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardFooter}>{i.shareCardFooter}</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={[
              styles.shareButton,
              {backgroundColor: colors.primary},
              isSharing && styles.disabled,
            ]}
            onPress={handleShare}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel={t.share}
            accessibilityState={{disabled: isSharing}}>
            <Ionicons
              name="share-social-outline"
              size={18}
              color={staticColors.white}
            />
            <Text style={styles.shareButtonText}>{t.share}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: staticColors.overlayBlack45,
  },
  backdropTouch: {flex: 1},
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {fontSize: fontSizes.lg, fontWeight: '800'},
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {alignItems: 'center'},
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardIcon: {marginBottom: spacing.sm},
  cardHeadline: {
    fontSize: 56,
    fontWeight: '800',
    color: staticColors.white,
  },
  cardHeadlineLabel: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: staticColors.glassWhite90,
    marginTop: 2,
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: spacing['2xl'],
    marginTop: spacing.xl,
  },
  cardStat: {alignItems: 'center'},
  cardStatValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: staticColors.white,
  },
  cardStatLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: staticColors.glassWhite90,
    marginTop: 2,
  },
  cardFooter: {
    position: 'absolute',
    bottom: spacing.md,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: staticColors.glassWhite80,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  shareButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: staticColors.white,
  },
  disabled: {opacity: 0.6},
});
