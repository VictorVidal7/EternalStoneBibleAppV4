/**
 * DonationSheet — the "Donación" flow (plan section C5).
 *
 * Fully separate from the offering/unlock flow: giving here never unlocks
 * anything, is repeatable (the same reader can give more than once, in the
 * same or different amounts), and only ever thanks the giver — with a
 * verse — after they've given, never as a nudge beforehand. No counters,
 * no goals, no reminders, per the plan's explicit constraints.
 *
 * Follows this codebase's established sheet pattern (a plain RN `Modal`
 * sliding from the bottom) — mirrors OfferingSheet.tsx.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  Modal,
  View,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type {PurchasesStoreProduct} from 'react-native-purchases';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {
  isBillingAvailable,
  getDonationProducts,
  purchaseDonation,
} from '@lib/offering/offeringService';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type SheetState =
  | {kind: 'loading'}
  | {kind: 'unavailable'}
  | {kind: 'available'; products: PurchasesStoreProduct[]}
  | {kind: 'purchasing'}
  | {kind: 'success'};

export const DonationSheet: React.FC<Props> = ({visible, onClose}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const [state, setState] = useState<SheetState>({kind: 'loading'});

  const load = useCallback(async () => {
    setState({kind: 'loading'});
    const available = await isBillingAvailable();
    if (!available) {
      setState({kind: 'unavailable'});
      return;
    }
    const products = await getDonationProducts();
    if (products.length === 0) {
      setState({kind: 'unavailable'});
      return;
    }
    setState({kind: 'available', products});
  }, []);

  useEffect(() => {
    if (visible) load().catch(() => setState({kind: 'unavailable'}));
  }, [visible, load]);

  const handlePurchase = useCallback(
    async (product: PurchasesStoreProduct) => {
      haptics.tap();
      setState({kind: 'purchasing'});
      const outcome = await purchaseDonation(product);
      if (outcome.status === 'success') {
        haptics.success();
        setState({kind: 'success'});
      } else if (outcome.status === 'cancelled') {
        // Silence, no guilt — just return to the amount picker.
        await load();
      } else {
        toast.error(t.donation.purchaseError);
        await load();
      }
    },
    [load, t, toast],
  );

  const handleClose = useCallback(() => {
    haptics.tap();
    onClose();
  }, [onClose]);

  // Nothing useful to show — degrade quietly instead of a broken empty sheet.
  if (visible && state.kind === 'unavailable') {
    return null;
  }

  return (
    <Modal
      visible={visible && state.kind !== 'unavailable'}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTouch}
          onPress={handleClose}
          {...a11yHiddenProps()}
        />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.card, borderTopColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.handle} />

          {state.kind === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {state.kind === 'success' && (
            <View style={styles.centerState}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: colors.primary + '22'},
                ]}>
                <Ionicons name="heart" size={28} color={colors.primary} />
              </View>
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {t.donation.thankYouTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.message, {color: colors.textSecondary}]}>
                {t.donation.thankYouMessage}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.verse, {color: colors.text}]}>
                {`“${t.donation.thankYouVerse}”`}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.verseRef, {color: colors.textTertiary}]}>
                {t.donation.thankYouVerseRef}
              </AppText>
              <TouchableOpacity
                style={[styles.doneButton, {backgroundColor: colors.primary}]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t.donation.close}>
                <AppText
                  scaleRole="compact"
                  style={[styles.doneText, {color: colors.onPrimary}]}>
                  {t.donation.close}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {(state.kind === 'available' || state.kind === 'purchasing') && (
            <>
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {t.donation.sheetTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.intro, {color: colors.textSecondary}]}>
                {t.donation.sheetIntro}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.amountsHint, {color: colors.textSecondary}]}>
                {t.donation.amountsHint}
              </AppText>

              {state.kind === 'available' && (
                <View style={styles.amountsGrid}>
                  {state.products.map(product => (
                    <Pressable
                      key={product.identifier}
                      onPress={() => handlePurchase(product)}
                      accessibilityRole="button"
                      accessibilityLabel={product.priceString}
                      style={[styles.amountCard, {borderColor: colors.border}]}>
                      <AppText
                        scaleRole="display"
                        style={[styles.amountPrice, {color: colors.text}]}>
                        {product.priceString}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}

              {state.kind === 'purchasing' && (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText
                    scaleRole="compact"
                    style={[styles.message, {color: colors.textSecondary}]}>
                    {t.donation.purchasing}
                  </AppText>
                </View>
              )}

              <AppText
                scaleRole="compact"
                style={[styles.legend, {color: colors.textTertiary}]}>
                {t.donation.transparency}
              </AppText>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DonationSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack30,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: staticColors.glassWhite25,
    marginBottom: spacing.xs,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {fontSize: fontSizes.lg, fontWeight: '800', textAlign: 'center'},
  intro: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  verse: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  verseRef: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  amountsHint: {
    fontSize: fontSizes.sm,
    lineHeight: 19,
    textAlign: 'center',
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  amountCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountPrice: {fontSize: fontSizes.md, fontWeight: '800'},
  legend: {
    fontSize: fontSizes.xs,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  doneButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  doneText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
