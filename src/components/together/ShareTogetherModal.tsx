/**
 * 🤝 ShareTogetherModal — create a "read together" invitation (Sprint 107).
 *
 * Lets the user pick a start date (+ optional group label) and share a curated
 * reading plan as a self-contained deep link AND a short code. 100% offline:
 * the invitation travels through the user's OWN channels (Share sheet /
 * clipboard); we never store or relay it (DOCS/COMMUNITY_DESIGN.md §9.1).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {Ionicons} from '@expo/vector-icons';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {
  GROUP_NAME_MAX,
  addDaysISO,
  encodeHttpsLink,
  encodePlanCode,
  makePlanBundle,
  todayDateISO,
} from '@lib/together';

interface Props {
  visible: boolean;
  planId: string;
  planName: string;
  onClose: () => void;
  /**
   * Pre-fill the start date when re-sharing a plan the user is ALREADY reading
   * with a group (Sprint 108) — keep the group's agreed start so a late joiner
   * lands on the same "Day N". May be in the past; the stepper's floor relaxes
   * to honor it.
   */
  initialStartDate?: string;
  /** Pre-fill the group label from the existing membership (Sprint 108). */
  initialGroupName?: string;
}

/** Format an ISO calendar date `YYYY-MM-DD` as a friendly localized string. */
function formatDate(iso: string, language: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  try {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return iso;
  }
}

export function ShareTogetherModal({
  visible,
  planId,
  planName,
  onClose,
  initialStartDate,
  initialGroupName,
}: Props) {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const tt = t.together;

  const today = todayDateISO();
  const [startDate, setStartDate] = useState(initialStartDate ?? today);
  const [groupName, setGroupName] = useState(initialGroupName ?? '');

  // Re-seed each time the sheet opens so it reflects the CURRENT membership
  // (the user may have joined/changed groups since it was last mounted). Keyed
  // on `visible` only, so it never clobbers edits made while the sheet is open.
  useEffect(() => {
    if (!visible) return;
    setStartDate(initialStartDate ?? today);
    setGroupName(initialGroupName ?? '');
    // Keyed on `visible` only (this eslint config has no exhaustive-deps rule):
    // re-seeding on every prop change would fight the user's in-sheet edits.
  }, [visible]);

  // The earliest selectable date. Normally "today", but if we pre-filled an
  // already-agreed start in the PAST, relax the floor to it so re-sharing keeps
  // the group aligned instead of silently jumping the date forward.
  const floor =
    initialStartDate && initialStartDate < today ? initialStartDate : today;

  const bundle = useMemo(
    () => makePlanBundle(planId, startDate, groupName),
    [planId, startDate, groupName],
  );
  const link = useMemo(() => encodeHttpsLink(bundle), [bundle]);
  const code = useMemo(
    () => encodePlanCode(planId, startDate),
    [planId, startDate],
  );

  const dateLabel = formatDate(startDate, language);
  const canGoBack = startDate > floor;

  const message = useMemo(
    () =>
      tt.inviteMessage
        .replace('{{plan}}', planName)
        .replace('{{date}}', dateLabel)
        .replace('{{link}}', link)
        .replace('{{code}}', code ?? ''),
    [tt.inviteMessage, planName, dateLabel, link, code],
  );

  const onShare = () => {
    haptics.tap();
    Share.share({message}).catch(() => undefined);
  };

  const copy = async (value: string) => {
    haptics.tap();
    await Clipboard.setStringAsync(value);
    toast.success(tt.copied);
  };

  const stepDate = (delta: number) => {
    haptics.tap();
    setStartDate(prev => {
      const next = addDaysISO(prev, delta);
      return next < floor ? floor : next;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View
          style={[
            styles.card,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.headerRow}>
            <Ionicons
              name="people-circle-outline"
              size={26}
              color={colors.primary}
            />
            <Text style={[styles.title, {color: colors.text}]}>
              {tt.shareTitle}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled">
            <Text style={[styles.planName, {color: colors.primary}]}>
              {planName}
            </Text>
            <Text style={[styles.intro, {color: colors.textSecondary}]}>
              {tt.shareIntro}
            </Text>

            {/* Start date stepper */}
            <Text style={[styles.fieldLabel, {color: colors.text}]}>
              {tt.startsOn}
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  {borderColor: colors.border},
                  !canGoBack && styles.stepBtnDisabled,
                ]}
                disabled={!canGoBack}
                onPress={() => stepDate(-1)}
                accessibilityRole="button"
                accessibilityLabel="−1">
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.dateBox}>
                <Text style={[styles.dateText, {color: colors.text}]}>
                  {dateLabel}
                </Text>
                {startDate === today ? (
                  <Text
                    style={[styles.todayTag, {color: colors.textSecondary}]}>
                    {tt.today}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, {borderColor: colors.border}]}
                onPress={() => stepDate(1)}
                accessibilityRole="button"
                accessibilityLabel="+1">
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Optional group name */}
            <Text style={[styles.fieldLabel, {color: colors.text}]}>
              {tt.groupNameLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder={tt.groupNamePlaceholder}
              placeholderTextColor={colors.textSecondary}
              maxLength={GROUP_NAME_MAX}
              returnKeyType="done"
            />

            {/* Code */}
            {code ? (
              <TouchableOpacity
                style={[styles.codeBox, {borderColor: colors.border}]}
                onPress={() => copy(code)}
                accessibilityRole="button"
                accessibilityLabel={`${tt.yourCode}: ${code}`}>
                <Text style={[styles.codeLabel, {color: colors.textSecondary}]}>
                  {tt.yourCode}
                </Text>
                <Text style={[styles.codeText, {color: colors.text}]}>
                  {code}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel={tt.share}>
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.onPrimary}
              />
              <Text style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
                {tt.share}
              </Text>
            </TouchableOpacity>
            <View style={styles.secondaryRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, {borderColor: colors.border}]}
                onPress={() => copy(link)}
                accessibilityRole="button"
                accessibilityLabel={tt.copyLink}>
                <Ionicons name="link-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryText, {color: colors.text}]}>
                  {tt.copyLink}
                </Text>
              </TouchableOpacity>
              {code ? (
                <TouchableOpacity
                  style={[styles.secondaryBtn, {borderColor: colors.border}]}
                  onPress={() => copy(code)}
                  accessibilityRole="button"
                  accessibilityLabel={tt.copyCode}>
                  <Ionicons name="key-outline" size={18} color={colors.text} />
                  <Text style={[styles.secondaryText, {color: colors.text}]}>
                    {tt.copyCode}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  title: {flex: 1, fontSize: 19, fontWeight: '700'},
  body: {paddingHorizontal: 18},
  bodyContent: {paddingBottom: 8},
  planName: {fontSize: 16, fontWeight: '700', marginTop: 4},
  intro: {fontSize: 13.5, lineHeight: 20, marginTop: 6, marginBottom: 4},
  fieldLabel: {fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8},
  stepperRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {opacity: 0.35},
  dateBox: {flex: 1, alignItems: 'center'},
  dateText: {fontSize: 15, fontWeight: '600', textAlign: 'center'},
  todayTag: {fontSize: 11.5, marginTop: 2},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  codeLabel: {fontSize: 12},
  codeText: {flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: 1},
  actions: {paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, gap: 10},
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnText: {fontSize: 16, fontWeight: '700'},
  secondaryRow: {flexDirection: 'row', gap: 10},
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryText: {fontSize: 14, fontWeight: '600'},
});
