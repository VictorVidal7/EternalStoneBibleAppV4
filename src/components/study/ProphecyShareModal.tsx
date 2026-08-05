/**
 * 🖼️ ProphecyShareModal — share a Hilo-profético prophecy as an image card.
 *
 * Renders a clean OT→NT card (theme label · prophecy verse · "fulfilled in" · NT
 * verse · note · signature), captured with react-native-view-shot and handed to
 * the system share sheet via expo-sharing — the same pipeline as the verse
 * ImageShareModal. The card follows the active theme + the movement's accent, so
 * it never hardcodes colors. Content arrives as props (the screen already has it
 * resolved), so this stays a thin presentational + capture shell.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useRef, useState} from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {captureRef} from 'react-native-view-shot';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText} from '@components/ui/AppText';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {logger} from '@lib/utils/logger';
import {shareOrDownloadImage} from '@/features/share/shareOrDownloadImage';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  verseTextRightSlack,
} from '@/styles/designTokens';

export interface ProphecyShareContent {
  accent: string;
  groupTitle: string;
  label: string;
  note: string;
  prophecyLabel: string;
  prophecyRef: string;
  prophecyText: string;
  fulfilledLabel: string;
  fulfillmentRef: string;
  fulfillmentText: string;
  quoted: boolean;
  quotedLabel: string;
  signature: string;
}

interface ProphecyShareModalProps {
  visible: boolean;
  onClose: () => void;
  content: ProphecyShareContent | null;
}

export function ProphecyShareModal({
  visible,
  onClose,
  content,
}: ProphecyShareModalProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing || !cardRef.current) return;
    try {
      setSharing(true);
      haptics.press();
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const result = await shareOrDownloadImage(uri, {dialogTitle: t.share});
      if (result === 'unavailable') {
        toast.error(t.verse.imageShareError);
        return;
      }
      // No success toast on the native "shared" path — the OS share sheet's
      // own UI is confirmation enough (matches the prior behavior). A web
      // download is silent by default though, so it gets an explicit toast.
      if (result === 'downloaded') {
        toast.success(t.verse.imageDownloaded);
      }
      onClose();
    } catch (error) {
      logger.error('Error sharing prophecy image', error as Error, {
        component: 'ProphecyShareModal',
        action: 'handleShare',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          <View style={styles.sheetHeader}>
            <AppText style={[styles.sheetTitle, {color: colors.text}]}>
              {t.prophecies.share}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {content ? (
            <>
              {/* The capturable card. */}
              <View
                ref={cardRef}
                collapsable={false}
                style={[
                  styles.card,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                ]}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.groupChip,
                      {backgroundColor: content.accent + '22'},
                    ]}>
                    <AppText
                      style={[styles.groupChipText, {color: content.accent}]}>
                      {content.groupTitle}
                    </AppText>
                  </View>
                  <Ionicons name="sparkles" size={16} color={content.accent} />
                </View>

                <AppText style={[styles.cardLabel, {color: colors.text}]}>
                  {content.label}
                </AppText>

                <AppText style={[styles.cardRole, {color: content.accent}]}>
                  {`${content.prophecyLabel} · ${content.prophecyRef}`}
                </AppText>
                <AppText style={[styles.cardVerse, {color: colors.text}]}>
                  {content.prophecyText}
                </AppText>

                <View style={styles.cardArrow}>
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={colors.textTertiary}
                  />
                </View>

                <AppText style={[styles.cardRole, {color: colors.primary}]}>
                  {`${content.fulfilledLabel} · ${content.fulfillmentRef}`}
                </AppText>
                <AppText style={[styles.cardVerse, {color: colors.text}]}>
                  {content.fulfillmentText}
                </AppText>
                {content.quoted ? (
                  <View
                    style={[
                      styles.quotedBadge,
                      {backgroundColor: colors.primary + '18'},
                    ]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={11}
                      color={colors.primary}
                    />
                    <AppText
                      style={[styles.quotedText, {color: colors.primary}]}>
                      {content.quotedLabel}
                    </AppText>
                  </View>
                ) : null}

                <AppText
                  style={[styles.cardNote, {color: colors.textSecondary}]}>
                  {content.note}
                </AppText>

                <View
                  style={[styles.cardFooter, {borderTopColor: colors.border}]}>
                  <Ionicons
                    name="git-network"
                    size={13}
                    color={colors.textTertiary}
                  />
                  <AppText
                    style={[
                      styles.cardSignature,
                      {color: colors.textTertiary},
                    ]}>
                    {content.signature}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.shareBtn, {backgroundColor: colors.primary}]}
                onPress={() => void handleShare()}
                disabled={sharing}
                accessibilityRole="button"
                accessibilityLabel={t.prophecies.share}>
                {sharing ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={colors.onPrimary}
                    />
                    <AppText
                      style={[styles.shareBtnText, {color: colors.onPrimary}]}>
                      {t.prophecies.share}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {fontSize: fontSizes.lg, fontWeight: '800'},
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  groupChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  groupChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardLabel: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  cardRole: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  cardVerse: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  cardArrow: {alignItems: 'center', paddingVertical: 2},
  quotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  quotedText: {fontSize: fontSizes.xs, fontWeight: '700'},
  cardNote: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  cardSignature: {fontSize: fontSizes.xs, fontWeight: '600'},
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  shareBtnText: {fontSize: fontSizes.md, fontWeight: '800'},
});
