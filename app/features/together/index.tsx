/**
 * 🤝 Together — join a shared reading plan (Sprint 107).
 *
 * Two ways in, one screen:
 *   - Deep link `eternalbible://features/together?d=<payload>` (tap the invite).
 *   - No param → a code-entry field (Settings → "Join a group").
 *
 * Decoding is treated as untrusted input (see src/lib/together). Joining seeds
 * the plan's start date so everyone's "Day N" lines up, records a device-local
 * group label, and opens the plan. 100% offline — nothing leaves the device,
 * no content of any other user is ever stored or shown.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {staticColors} from '@/styles/designTokens';
import {useTogether} from '@context/TogetherContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {
  READING_PLANS,
  getLocalizedPlan,
  getReadingPlanById,
} from '@/constants/reading-plans';
import {
  decodePlanCode,
  decodeTogetherParam,
  type DecodeFailure,
  type SharedPlanBundle,
} from '@lib/together';

const PLAN_IDS = READING_PLANS.map(p => p.id);

/** ISO timestamp at LOCAL midnight of a `YYYY-MM-DD` calendar date. */
function dateToISO(calendarDate: string): string {
  const [y, m, d] = calendarDate.split('-').map(Number);
  return new Date(y, m - 1, d).toISOString();
}

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

export default function TogetherJoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const tt = t.together;
  const toast = useToast();
  const {joinPlan} = useTogether();
  const {setPlanStart} = useReadingPlanProgress();

  const params = useLocalSearchParams<{d?: string}>();

  const [bundle, setBundle] = useState<SharedPlanBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');

  /** Map a decode failure to a friendly, localized message. */
  const messageFor = (reason: DecodeFailure): string => {
    switch (reason) {
      case 'version':
        return tt.linkVersion;
      case 'unknown-plan':
        return tt.codeUnknownPlan;
      default:
        return tt.linkInvalid;
    }
  };

  // Decode the deep-link payload once, when present.
  useEffect(() => {
    if (!params.d) return;
    const res = decodeTogetherParam(params.d);
    if (!res.ok) {
      setError(messageFor(res.reason));
      return;
    }
    if (!getReadingPlanById(res.bundle.p)) {
      setError(tt.codeUnknownPlan);
      return;
    }
    setBundle(res.bundle);
    setError(null);
  }, [params.d]);

  const plan = bundle ? getReadingPlanById(bundle.p) : undefined;
  const planName = useMemo(
    () => (plan ? getLocalizedPlan(plan, t).name : ''),
    [plan, t],
  );

  const submitCode = () => {
    haptics.tap();
    const res = decodePlanCode(codeInput, PLAN_IDS);
    if (!res.ok) {
      setError(
        res.reason === 'unknown-plan' ? tt.codeUnknownPlan : tt.codeInvalid,
      );
      return;
    }
    if (!getReadingPlanById(res.bundle.p)) {
      setError(tt.codeUnknownPlan);
      return;
    }
    setBundle(res.bundle);
    setError(null);
  };

  const onJoin = async () => {
    if (!bundle || !plan) return;
    haptics.success();
    await Promise.all([
      joinPlan(bundle.p, {name: bundle.g, startDate: bundle.s}),
      setPlanStart(bundle.p, dateToISO(bundle.s)),
    ]);
    toast.success(tt.joinedToast);
    router.replace(`/plan/${bundle.p}` as never);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, {borderColor: colors.border}]}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.text}]}>
          {bundle ? tt.importTitle : tt.enterCode}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">
        {bundle && plan ? (
          // ── Confirmation ──
          <View style={[styles.card, {backgroundColor: colors.card}]}>
            <Ionicons
              name="people-circle-outline"
              size={48}
              color={colors.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.invitedTo, {color: colors.textSecondary}]}>
              {tt.invitedTo}
            </Text>
            <Text style={[styles.planName, {color: colors.text}]}>
              {planName}
            </Text>
            {bundle.g ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.metaText, {color: colors.text}]}>
                  {tt.withGroup.replace('{{group}}', bundle.g)}
                </Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.metaText, {color: colors.text}]}>
                {tt.willStart.replace(
                  '{{date}}',
                  formatDate(bundle.s, language),
                )}
              </Text>
            </View>
            <Text style={[styles.privacyNote, {color: colors.textSecondary}]}>
              {tt.privateProgress}
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
              onPress={onJoin}
              accessibilityRole="button"
              accessibilityLabel={tt.join}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={staticColors.white}
              />
              <Text
                style={[styles.primaryBtnText, {color: staticColors.white}]}>
                {tt.join}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Code entry ──
          <View style={[styles.card, {backgroundColor: colors.card}]}>
            <Ionicons
              name="key-outline"
              size={44}
              color={colors.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.intro, {color: colors.textSecondary}]}>
              {tt.enterCodeIntro}
            </Text>
            <TextInput
              style={[
                styles.codeInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={codeInput}
              onChangeText={text => {
                setCodeInput(text);
                if (error) setError(null);
              }}
              placeholder={tt.enterCodePlaceholder}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={submitCode}
            />
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {backgroundColor: colors.primary},
                !codeInput.trim() && styles.btnDisabled,
              ]}
              disabled={!codeInput.trim()}
              onPress={submitCode}
              accessibilityRole="button"
              accessibilityLabel={tt.continueLabel}>
              <Text
                style={[styles.primaryBtnText, {color: staticColors.white}]}>
                {tt.continueLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.error}
            />
            <Text style={[styles.errorText, {color: colors.error}]}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 20, fontWeight: '700', flex: 1},
  body: {padding: 16, paddingBottom: 40},
  card: {borderRadius: 20, padding: 24, alignItems: 'center'},
  cardIcon: {marginBottom: 8},
  invitedTo: {fontSize: 14, textAlign: 'center'},
  planName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaText: {fontSize: 15, fontWeight: '600'},
  privacyNote: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 4,
  },
  intro: {fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 18},
  codeInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  btnDisabled: {opacity: 0.45},
  primaryBtnText: {fontSize: 16, fontWeight: '700'},
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  errorText: {flex: 1, fontSize: 14},
});
