/**
 * 🤝 ShareCustomPlanModal — share a user-built plan by link (Sprint 108).
 *
 * A custom plan carries its WHOLE content inside the link (a together `cplan`
 * bundle), so unlike a curated plan there is no short code — and no group/start
 * alignment here; the recipient imports it and reads at their own pace. 100%
 * peer-to-peer: it travels through the user's OWN channels (Share sheet /
 * clipboard); nothing is stored or relayed (DOCS/COMMUNITY_DESIGN §9.1).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {Modal, Share, StyleSheet, TouchableOpacity, View} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {Ionicons} from '@expo/vector-icons';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {staticColors} from '@/styles/designTokens';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {encodeHttpsLink} from '@lib/together';
import {bundleFromCustomPlan} from '@lib/reading/customPlans';
import type {ReadingPlan} from '@/constants/reading-plans';

interface Props {
  visible: boolean;
  plan: ReadingPlan;
  onClose: () => void;
}

export function ShareCustomPlanModal({visible, plan, onClose}: Props) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tt = t.together;
  const toast = useToast();

  const link = useMemo(
    () => encodeHttpsLink(bundleFromCustomPlan(plan)),
    [plan],
  );
  const message = tt.shareCustomMessage
    .replace('{{plan}}', plan.name)
    .replace('{{link}}', link);

  const onShare = () => {
    haptics.tap();
    Share.share({message}).catch(() => undefined);
  };
  const copy = async () => {
    haptics.tap();
    await Clipboard.setStringAsync(link);
    toast.success(tt.copied);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[styles.card, {backgroundColor: colors.card}]}
          {...focusTrapProps()}>
          <View style={styles.headerRow}>
            <Ionicons
              name="share-social-outline"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.title, {color: colors.text}]}>
              {tt.shareCustomTitle}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.planName, {color: colors.primary}]}>
            {plan.name}
          </Text>
          <Text style={[styles.intro, {color: colors.textSecondary}]}>
            {tt.shareCustomIntro}
          </Text>
          <Text style={[styles.note, {color: colors.textSecondary}]}>
            {tt.customLinkNote}
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={tt.share}>
            <Ionicons
              name="share-social-outline"
              size={20}
              color={staticColors.white}
            />
            <Text style={styles.primaryBtnText}>{tt.share}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, {borderColor: colors.border}]}
            onPress={copy}
            accessibilityRole="button"
            accessibilityLabel={tt.copyLink}>
            <Ionicons name="link-outline" size={18} color={colors.text} />
            <Text style={[styles.secondaryText, {color: colors.text}]}>
              {tt.copyLink}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack60,
    justifyContent: 'center',
    padding: 20,
  },
  card: {borderRadius: 20, padding: 18},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {flex: 1, fontSize: 19, fontWeight: '700'},
  planName: {fontSize: 16, fontWeight: '700', marginTop: 4},
  intro: {fontSize: 13.5, lineHeight: 20, marginTop: 6},
  note: {fontSize: 12.5, fontStyle: 'italic', marginTop: 8, marginBottom: 4},
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  primaryBtnText: {color: staticColors.white, fontSize: 16, fontWeight: '700'},
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 10,
  },
  secondaryText: {fontSize: 14, fontWeight: '600'},
});
