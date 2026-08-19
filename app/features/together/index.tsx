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

import {useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {useTogether} from '@context/TogetherContext';
import {useCustomPlans} from '@context/CustomPlansContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {
  READING_PLANS,
  getLocalizedPlan,
  getReadingPlanById,
  type ReadingPlan,
} from '@/constants/reading-plans';
import {
  decodePlanCode,
  decodeTogetherParam,
  encodeBundleParam,
  type DecodeFailure,
  type DecodeResult,
  type SharedPlanBundle,
} from '@lib/together';
import {customPlanFromBundle} from '@lib/reading/customPlans';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';

const PLAN_IDS = READING_PLANS.map(p => p.id);

/**
 * Decode whatever the user pasted/typed: a full invite link, a raw `d=`
 * payload, or a short curated code. Returns a normal DecodeResult.
 */
function decodeJoinInput(raw: string): DecodeResult {
  const trimmed = raw.trim();
  // A pasted invite carries its payload after `?d=` (the eternalbible:// scheme
  // link) or `#d=` (the https redirector keeps it in the fragment). Either way
  // everything past the marker is the opaque base64url payload.
  const marker = trimmed.search(/[?#]d=/);
  if (marker >= 0) return decodeTogetherParam(trimmed.slice(marker + 3));
  if (/^eb1[- ]/i.test(trimmed)) return decodePlanCode(trimmed, PLAN_IDS);
  // Try as a raw bundle payload first, then fall back to a curated code.
  const asPayload = decodeTogetherParam(trimmed);
  return asPayload.ok ? asPayload : decodePlanCode(trimmed, PLAN_IDS);
}

/** Total chapters across a plan's days — for the custom-plan meta line. */
function countPlanChapters(plan: ReadingPlan): number {
  return plan.days.reduce((sum, d) => sum + d.readings.length, 0);
}

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
  const {saveCustomPlan} = useCustomPlans();
  const {setPlanStart} = useReadingPlanProgress();

  const params = useLocalSearchParams<{d?: string}>();

  // A confirmation is either a curated shared plan (carries start/group) or a
  // resolved custom plan (carries its own content); at most one is set.
  const [shared, setShared] = useState<SharedPlanBundle | null>(null);
  const [custom, setCustom] = useState<ReadingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [guideVisible, setGuideVisible] = useState(false);

  /** Map a decode failure to a friendly, localized message. */
  const messageFor = (reason: DecodeFailure, fromLink: boolean): string => {
    switch (reason) {
      case 'version':
        return tt.linkVersion;
      case 'unknown-plan':
        return tt.codeUnknownPlan;
      case 'unsupported':
        return tt.linkVersion;
      default:
        return fromLink ? tt.linkInvalid : tt.codeInvalid;
    }
  };

  /** Accept a decoded bundle into the right confirmation state. */
  const applyResult = (res: DecodeResult, fromLink: boolean) => {
    if (!res.ok) {
      setError(messageFor(res.reason, fromLink));
      return;
    }
    if (res.bundle.t === 'plan') {
      if (!getReadingPlanById(res.bundle.p)) {
        setError(tt.codeUnknownPlan);
        return;
      }
      setShared(res.bundle);
      setCustom(null);
      setError(null);
      return;
    }
    if (res.bundle.t === 'cplan') {
      const plan = customPlanFromBundle(res.bundle);
      if (!plan) {
        setError(tt.linkInvalid);
        return;
      }
      setCustom(plan);
      setShared(null);
      setError(null);
      return;
    }
    if (res.bundle.t === 'study') {
      // A shared study isn't a group to join — open the read-only viewer.
      router.replace(
        `/features/study-shared?d=${encodeBundleParam(res.bundle)}` as never,
      );
      return;
    }
    if (res.bundle.t === 'cal') {
      // A baked devotional calendar isn't a group either — open its viewer.
      router.replace(
        `/features/devotional-shared?d=${encodeBundleParam(res.bundle)}` as never,
      );
      return;
    }
    setError(tt.linkInvalid);
  };

  // Decode the deep-link payload once, when present.
  useEffect(() => {
    if (!params.d) return;
    applyResult(decodeTogetherParam(params.d), true);
  }, [params.d]);

  // On the manual code-entry screen, peek the clipboard once: many users land
  // here right after copying a non-clickable `eternalbible://` link from
  // WhatsApp. If it already holds a valid invitation (pasted link, raw payload
  // or EB1 code) offer a one-tap paste so they don't fight the keyboard.
  const [pasteCandidate, setPasteCandidate] = useState<string | null>(null);
  useEffect(() => {
    if (params.d) return; // arrived via deep link — no manual entry needed
    let alive = true;
    (async () => {
      try {
        const clip = (await Clipboard.getStringAsync()).trim();
        if (alive && clip && decodeJoinInput(clip).ok) setPasteCandidate(clip);
      } catch {
        // clipboard unavailable — skip the hint, no harm
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.d]);

  const usePasteCandidate = () => {
    if (!pasteCandidate) return;
    haptics.tap();
    setCodeInput(pasteCandidate);
    setError(null);
    applyResult(decodeJoinInput(pasteCandidate), false);
  };

  const plan = shared ? getReadingPlanById(shared.p) : undefined;
  const planName = useMemo(
    () => (plan ? getLocalizedPlan(plan, t).name : ''),
    [plan, t],
  );

  const submitCode = () => {
    haptics.tap();
    applyResult(decodeJoinInput(codeInput), false);
  };

  const onJoin = async () => {
    if (!shared || !plan) return;
    haptics.success();
    await Promise.all([
      joinPlan(shared.p, {name: shared.g, startDate: shared.s}),
      setPlanStart(shared.p, dateToISO(shared.s)),
    ]);
    toast.success(tt.joinedToast);
    router.replace(`/plan/${shared.p}` as never);
  };

  const onImport = async () => {
    if (!custom) return;
    haptics.success();
    await saveCustomPlan(custom);
    await setPlanStart(custom.id, new Date().toISOString());
    toast.success(tt.importedToast);
    router.replace(`/plan/${custom.id}` as never);
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
          {shared ? tt.importTitle : custom ? tt.customInvitedTo : tt.enterCode}
        </Text>
        <TouchableOpacity
          onPress={() => {
            haptics.tap();
            setGuideVisible(true);
          }}
          style={[styles.backBtn, {borderColor: colors.border}]}
          accessibilityRole="button"
          accessibilityLabel={tt.guide.openLabel}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="help-circle-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">
        {shared && plan ? (
          // ── Curated plan confirmation (date + optional group) ──
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
            {shared.g ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.metaText, {color: colors.text}]}>
                  {tt.withGroup.replace('{{group}}', shared.g)}
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
                  formatDate(shared.s, language),
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
                color={colors.onPrimary}
              />
              <Text style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
                {tt.join}
              </Text>
            </TouchableOpacity>
          </View>
        ) : custom ? (
          // ── Custom plan confirmation (its own content) ──
          <View style={[styles.card, {backgroundColor: colors.card}]}>
            <Ionicons
              name="create-outline"
              size={48}
              color={colors.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.invitedTo, {color: colors.textSecondary}]}>
              {tt.customInvitedTo}
            </Text>
            <Text style={[styles.planName, {color: colors.text}]}>
              {custom.name}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.metaText, {color: colors.text}]}>
                {tt.customMeta
                  .replace('{{days}}', String(custom.duration))
                  .replace('{{chapters}}', String(countPlanChapters(custom)))}
              </Text>
            </View>
            <Text style={[styles.privacyNote, {color: colors.textSecondary}]}>
              {tt.privateProgress}
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
              onPress={onImport}
              accessibilityRole="button"
              accessibilityLabel={tt.importPlan}>
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.onPrimary}
              />
              <Text style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
                {tt.importPlan}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Code / link entry ──
          <View style={[styles.card, {backgroundColor: colors.card}]}>
            <Ionicons
              name="key-outline"
              size={44}
              color={colors.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.intro, {color: colors.textSecondary}]}>
              {tt.pasteOrCodeIntro}
            </Text>
            {pasteCandidate && !codeInput.trim() ? (
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
                accessibilityLabel={tt.pasteDetected}>
                <Ionicons
                  name="clipboard-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.pasteHintText, {color: colors.primary}]}>
                  {tt.pasteDetected}
                </Text>
              </TouchableOpacity>
            ) : null}
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
              placeholder={tt.pasteOrCodePlaceholder}
              placeholderTextColor={colors.textSecondary}
              // A pasted link/payload is case-sensitive (base64url); curated
              // codes are upper-cased on decode anyway, so don't auto-capitalize.
              autoCapitalize="none"
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
              <Text style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
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

      <FeatureGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        {...getFeatureGuideContent('together', t)}
      />
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
  pasteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignSelf: 'stretch',
  },
  pasteHintText: {fontSize: 15, fontWeight: '700'},
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
