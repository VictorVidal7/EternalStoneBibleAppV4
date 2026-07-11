/**
 * OfferingSheet — the "ofrenda" unlock flow (plan section C3).
 *
 * A single reverent screen: what unlocks, three fixed-amount tiers (all
 * granting the identical entitlement), the store-requirement legend, a
 * transparency line, and a restore link. Renders nothing (returns null)
 * whenever there's nothing useful to show a free user — already-unlocked and
 * billing-unavailable both degrade quietly rather than showing broken UI,
 * per the plan's sideload-degradation decision.
 *
 * Follows this codebase's established sheet pattern (a plain RN `Modal`
 * sliding from the bottom, not @gorhom/bottom-sheet, which is installed but
 * unused elsewhere) — see AddToCollectionSheet.tsx.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type {PurchasesPackage} from 'react-native-purchases';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {usePremium} from '@context/PremiumContext';
import {haptics} from '@lib/haptics';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {
  isBillingAvailable,
  getUnlockPackages,
  purchaseUnlock,
  restore as restoreOffering,
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
  | {kind: 'alreadyUnlocked'}
  | {kind: 'available'; packages: PurchasesPackage[]}
  | {kind: 'purchasing'}
  | {kind: 'restoring'}
  | {kind: 'success'};

export const OfferingSheet: React.FC<Props> = ({visible, onClose}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const {isPremium, isLoading: premiumLoading} = usePremium();
  const [state, setState] = useState<SheetState>({kind: 'loading'});

  const load = useCallback(async () => {
    if (isPremium) {
      setState({kind: 'alreadyUnlocked'});
      return;
    }
    setState({kind: 'loading'});
    const available = await isBillingAvailable();
    if (!available) {
      setState({kind: 'unavailable'});
      return;
    }
    const packages = await getUnlockPackages();
    if (packages.length === 0) {
      setState({kind: 'unavailable'});
      return;
    }
    setState({kind: 'available', packages});
  }, [isPremium]);

  // `load` closes over `isPremium`, which changes the instant a purchase
  // succeeds (the entitlement listener flips it before `handlePurchase`
  // finishes setting the 'success' state). Keying this effect on `load`
  // itself would re-run it right then and clobber 'success' with
  // 'alreadyUnlocked' — a ref keeps the effect scoped to visibility changes
  // only, while still calling the latest `load` whenever it does run.
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    // Also wait out PremiumContext's own initial cache read — otherwise an
    // already-unlocked reader briefly sees the tier picker before `isPremium`
    // resolves to true. `premiumLoading` only ever flips once, at mount, so
    // (unlike `load`) it's safe to depend on without re-triggering later.
    if (visible && !premiumLoading) {
      loadRef.current().catch(() => setState({kind: 'unavailable'}));
    }
  }, [visible, premiumLoading]);

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      haptics.tap();
      setState({kind: 'purchasing'});
      const outcome = await purchaseUnlock(pkg);
      if (outcome.status === 'success') {
        haptics.success();
        setState({kind: 'success'});
      } else if (outcome.status === 'cancelled') {
        // Silence, no guilt — just return to the tier picker.
        await load();
      } else {
        toast.error(t.offering.purchaseError);
        await load();
      }
    },
    [load, t, toast],
  );

  const handleRestore = useCallback(async () => {
    haptics.tap();
    setState({kind: 'restoring'});
    const {unlocked} = await restoreOffering();
    if (unlocked) {
      toast.success(t.offering.restoreSuccess);
      setState({kind: 'success'});
    } else {
      toast.info(t.offering.restoreNotFound);
      await load();
    }
  }, [load, t, toast]);

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
          style={[styles.sheet, {backgroundColor: colors.card}]}
          {...focusTrapProps()}>
          <View style={styles.handle} />

          {state.kind === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {state.kind === 'alreadyUnlocked' && (
            <View style={styles.centerState}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: colors.primary + '22'},
                ]}>
                <Ionicons name="leaf" size={28} color={colors.primary} />
              </View>
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {t.offering.settingsUnlockedTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.message, {color: colors.textSecondary}]}>
                {t.offering.settingsUnlockedDesc}
              </AppText>
              <TouchableOpacity
                style={[styles.doneButton, {backgroundColor: colors.primary}]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t.offering.close}>
                <AppText scaleRole="compact" style={styles.doneText}>
                  {t.offering.close}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {state.kind === 'success' && (
            <View style={styles.centerState}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: colors.primary + '22'},
                ]}>
                <Ionicons name="leaf" size={28} color={colors.primary} />
              </View>
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {t.offering.thankYouTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.message, {color: colors.textSecondary}]}>
                {t.offering.thankYouMessage}
              </AppText>
              <TouchableOpacity
                style={[styles.doneButton, {backgroundColor: colors.primary}]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t.offering.close}>
                <AppText scaleRole="compact" style={styles.doneText}>
                  {t.offering.close}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {(state.kind === 'available' ||
            state.kind === 'purchasing' ||
            state.kind === 'restoring') && (
            <>
              <AppText
                scaleRole="display"
                style={[styles.title, {color: colors.text}]}>
                {t.offering.sheetTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.intro, {color: colors.textSecondary}]}>
                {t.offering.sheetIntro}
              </AppText>

              <AppText
                scaleRole="compact"
                style={[styles.extrasListTitle, {color: colors.text}]}>
                {t.offering.extrasListTitle}
              </AppText>
              <View style={styles.extrasList}>
                {t.offering.extras.map((extra, index) => (
                  <View key={index} style={styles.extraRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color={colors.primary}
                      style={styles.extraIcon}
                    />
                    <View style={styles.extraTextCol}>
                      <AppText
                        scaleRole="compact"
                        style={[styles.extraTitle, {color: colors.text}]}>
                        {extra.title}
                      </AppText>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.extraText,
                          {color: colors.textSecondary},
                        ]}>
                        {extra.desc}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>

              {state.kind === 'available' && (
                <View style={styles.tierRow}>
                  {state.packages.map((pkg, index) => (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => handlePurchase(pkg)}
                      accessibilityRole="button"
                      accessibilityLabel={pkg.product.priceString}
                      style={[
                        styles.tierCard,
                        {borderColor: colors.border},
                        index === 1 && [
                          styles.tierCardSuggested,
                          {borderColor: colors.primary},
                        ],
                      ]}>
                      {index === 1 && (
                        <AppText
                          scaleRole="compact"
                          style={[styles.suggested, {color: colors.primary}]}>
                          {t.offering.tierSuggested}
                        </AppText>
                      )}
                      <AppText
                        scaleRole="display"
                        style={[styles.tierPrice, {color: colors.text}]}>
                        {pkg.product.priceString}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}

              {(state.kind === 'purchasing' || state.kind === 'restoring') && (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText
                    scaleRole="compact"
                    style={[styles.message, {color: colors.textSecondary}]}>
                    {state.kind === 'purchasing'
                      ? t.offering.purchasing
                      : t.offering.restoring}
                  </AppText>
                </View>
              )}

              <AppText
                scaleRole="compact"
                style={[styles.legend, {color: colors.textTertiary}]}>
                {t.offering.legend}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.legend, {color: colors.textTertiary}]}>
                {t.offering.transparency}
              </AppText>

              <Pressable
                onPress={handleRestore}
                disabled={state.kind !== 'available'}
                accessibilityRole="button"
                accessibilityLabel={t.offering.restoreLink}
                style={styles.restoreLink}>
                <AppText
                  scaleRole="compact"
                  style={[styles.restoreLinkText, {color: colors.primary}]}>
                  {t.offering.restoreLink}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default OfferingSheet;

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
  extrasListTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  extrasList: {gap: spacing.sm},
  extraRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  extraIcon: {marginTop: 2},
  extraTextCol: {flex: 1, gap: 1},
  extraTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  extraText: {fontSize: fontSizes.sm, lineHeight: 19},
  tierRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tierCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tierCardSuggested: {borderWidth: 2},
  suggested: {fontSize: fontSizes.xs, fontWeight: '700'},
  tierPrice: {fontSize: fontSizes.md, fontWeight: '800'},
  legend: {
    fontSize: fontSizes.xs,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  restoreLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  restoreLinkText: {fontSize: fontSizes.sm, fontWeight: '600'},
  doneButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  doneText: {
    color: staticColors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
