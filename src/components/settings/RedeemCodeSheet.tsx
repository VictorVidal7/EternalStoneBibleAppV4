/**
 * RedeemCodeSheet — redeem a one-time gift code for a real premium
 * entitlement (gift-code-redemption feature). Talks to the `redeemGiftCode`
 * Cloud Function via giftCodeService.ts, then forces an immediate
 * offeringService.refreshEntitlement() on success so the rest of the app
 * (usePremium()) reflects the unlock right away instead of waiting on
 * RevenueCat's async listener push.
 *
 * Entry point lives directly in settings.tsx's Account section (NOT inside
 * ExtrasSettings, which hides entirely in exactly the sideload/no-billing
 * scenario a gift code is most useful for — see settings.tsx for the
 * placement + visibility reasoning), shown only to a signed-in,
 * non-anonymous user (redemption requires a stable uid — see
 * giftCodeService.ts / functions/src/index.ts).
 *
 * Follows this codebase's established sheet pattern (a plain RN `Modal`
 * sliding from the bottom) — mirrors OfferingSheet.tsx/DonationSheet.tsx —
 * plus AddToCollectionSheet.tsx's KeyboardAvoidingView + dismiss-keyboard-
 * first-on-back pattern, since this is the one sheet in that family with a
 * TextInput.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  Modal,
  View,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {redeemGiftCode} from '@lib/offering/giftCodeService';
import {refreshEntitlement} from '@lib/offering/offeringService';
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

/** Loose shape check for paste-detection only — the server is the real validator. */
const CODE_SHAPE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Uppercases, strips non-alphanumerics, and auto-inserts the XXXX-XXXX dash as the user types. */
function formatCodeInput(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return cleaned.length <= 4
    ? cleaned
    : `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export const RedeemCodeSheet: React.FC<Props> = ({visible, onClose}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tr = t.redeemCode;
  const toast = useToast();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pasteCandidate, setPasteCandidate] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fresh state + a clipboard peek every time the sheet opens — many users
  // land here right after copying a code from WhatsApp/email/SMS.
  useEffect(() => {
    if (!visible) return;
    setCode('');
    setPasteCandidate(null);
    (async () => {
      try {
        const clip = (await Clipboard.getStringAsync()).trim();
        const formatted = formatCodeInput(clip);
        if (CODE_SHAPE.test(formatted)) setPasteCandidate(formatted);
      } catch {
        // Clipboard unavailable — skip the hint, no harm.
      }
    })();
  }, [visible]);

  const usePasteCandidate = useCallback(() => {
    if (!pasteCandidate) return;
    haptics.tap();
    setCode(pasteCandidate);
  }, [pasteCandidate]);

  const handleRequestClose = useCallback(() => {
    if (keyboardVisible) {
      Keyboard.dismiss();
      return;
    }
    onClose();
  }, [keyboardVisible, onClose]);

  const handleSubmit = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    haptics.tap();
    setSubmitting(true);
    try {
      const outcome = await redeemGiftCode(trimmed);
      switch (outcome.status) {
        case 'success':
          haptics.success();
          await refreshEntitlement();
          toast.success(tr.successToast);
          setCode('');
          onClose();
          return;
        case 'already_redeemed':
          toast.warning(tr.alreadyRedeemedToast);
          return;
        case 'not_found':
          toast.error(tr.notFoundToast);
          return;
        case 'invalid':
          toast.error(tr.invalidToast);
          return;
        case 'error':
          toast.error(tr.errorToast);
          return;
      }
    } finally {
      setSubmitting(false);
    }
  }, [code, submitting, toast, tr, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable
          style={styles.backdropTouch}
          onPress={handleRequestClose}
          {...a11yHiddenProps()}
        />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.card, borderTopColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Ionicons name="gift-outline" size={28} color={colors.primary} />
            <AppText
              scaleRole="display"
              style={[styles.title, {color: colors.text}]}>
              {tr.sheetTitle}
            </AppText>
          </View>
          <AppText
            scaleRole="compact"
            style={[styles.intro, {color: colors.textSecondary}]}>
            {tr.sheetIntro}
          </AppText>

          {pasteCandidate && !code ? (
            <TouchableOpacity
              style={[
                styles.pasteHint,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '14',
                },
              ]}
              onPress={usePasteCandidate}
              accessibilityRole="button"
              accessibilityLabel={tr.pasteDetected}>
              <Ionicons
                name="clipboard-outline"
                size={18}
                color={colors.primary}
              />
              <AppText
                scaleRole="compact"
                style={[styles.pasteHintText, {color: colors.primary}]}>
                {tr.pasteDetected}
              </AppText>
            </TouchableOpacity>
          ) : null}

          <TextInput
            value={code}
            onChangeText={text => setCode(formatCodeInput(text))}
            placeholder={tr.inputPlaceholder}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
            maxLength={9}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            accessibilityLabel={tr.inputPlaceholder}
          />

          <Pressable
            style={({pressed}) => [
              styles.submitButton,
              {backgroundColor: colors.primary},
              (!code.trim() || submitting) && styles.btnDisabled,
              pressed && !submitting && code.trim() && styles.btnPressed,
            ]}
            disabled={!code.trim() || submitting}
            onPress={() => void handleSubmit()}
            accessibilityRole="button"
            accessibilityLabel={tr.submitLabel}>
            {submitting ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <AppText
                scaleRole="compact"
                style={[styles.submitText, {color: colors.onPrimary}]}>
                {tr.submitLabel}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RedeemCodeSheet;

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  title: {fontSize: fontSizes.lg, fontWeight: '800', textAlign: 'center'},
  intro: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pasteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  pasteHintText: {fontSize: fontSizes.sm, fontWeight: '700'},
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    fontSize: fontSizes.lg,
    letterSpacing: 2,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: {opacity: 0.45},
  btnPressed: {opacity: 0.8},
  submitText: {fontSize: fontSizes.md, fontWeight: '700'},
});
