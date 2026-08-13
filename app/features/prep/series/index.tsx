/**
 * 📚 SERIES DE PREDICACIÓN — T8.4.4, the fourth slice of the premium "Mesa
 * de preparación" tanda (T8.4).
 *
 * Lists every series the preparer has created (device-local, from
 * prepSeriesStore), most-recently-updated first, each with its progress —
 * how many of its passages already have prep notes started ([[prepSeries]]'s
 * `computeSeriesProgress`, which only READS the existing per-passage notes;
 * this screen invents no new tracking). Tapping a series opens its detail
 * screen (`[id].tsx`).
 *
 * Doubles as the "add this passage to a series" target picker: when opened
 * with a `passageKey` param (from the "Series de predicación" button on the
 * single-passage Mesa de preparación), a banner offers to add THAT passage
 * to whichever series is tapped next, or to a brand-new one — "Ahora no"
 * cancels back to normal browsing without losing the list underneath it.
 *
 * PURE navigation/organization over passages and notes the preparer already
 * has — nothing here generates or suggests sermon content, so the app's
 * guardrail (the app never writes the sermon, cf. Jeremías 23:30-32) isn't
 * at stake in this screen.
 *
 * Premium-gated (offering-unlocked, never framed as a purchase): a free
 * reader sees a quiet locked teaser instead of the list. The single-passage
 * "Mesa de preparación" screen itself stays 100% free and unchanged — this
 * is a pure addition on top of it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import {AppText} from '@components/ui/AppText';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useToast} from '@context/ToastContext';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {
  getAllPrepSeries,
  createPrepSeries,
  addPrepSeriesPassage,
} from '@/features/study/prepSeriesStore';
import {getAllPrepNotes} from '@/features/study/prepNotesStore';
import {
  canCreateSeries,
  computeSeriesProgress,
  listSeries,
  type PrepSeries,
  type PrepSeriesMap,
} from '@/features/study/prepSeries';
import {parsePassageKey} from '@/features/study/prepHistory';
import {formatPassageLabel} from '@/features/study/prepTable';
import type {PrepNotesMap} from '@/features/study/prepNotes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready';

export default function PrepSeriesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const toast = useToast();
  const h = t.prepSeries;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{passageKey?: string}>();

  const [status, setStatus] = useState<Status>('loading');
  const [seriesMap, setSeriesMap] = useState<PrepSeriesMap>({});
  const [notesMap, setNotesMap] = useState<PrepNotesMap>({});
  const [creating, setCreating] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [attachDismissed, setAttachDismissed] = useState(false);

  const load = useCallback(async () => {
    const [series, notes] = await Promise.all([
      getAllPrepSeries(),
      getAllPrepNotes(),
    ]);
    setSeriesMap(series);
    setNotesMap(notes);
    setStatus('ready');
  }, []);

  // Free readers never even read the store — premium stays a pure addition.
  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return;
      load();
    }, [isPremium, load]),
  );

  const seriesList = useMemo(() => listSeries(seriesMap), [seriesMap]);

  const pendingPassage = useMemo(
    () => (params.passageKey ? parsePassageKey(params.passageKey) : null),
    [params.passageKey],
  );
  const attachActive = Boolean(pendingPassage) && !attachDismissed;
  const pendingLabel = pendingPassage
    ? formatPassageLabel(pendingPassage, bookLang)
    : '';

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const handleOpenCreate = useCallback(() => {
    haptics.tap();
    if (!canCreateSeries(seriesMap)) {
      toast.warning(`${h.limitReachedTitle}. ${h.limitReachedBody}`);
      return;
    }
    setNameDraft('');
    setCreating(true);
  }, [seriesMap, toast, h.limitReachedTitle, h.limitReachedBody]);

  const handleSubmitCreate = useCallback(async () => {
    const name = nameDraft.trim();
    if (!name) return;
    const created = await createPrepSeries(name);
    if (!created) return;
    setCreating(false);
    setNameDraft('');
    if (attachActive && params.passageKey) {
      await addPrepSeriesPassage(created.id, params.passageKey);
      haptics.success();
      toast.success(h.addedToast.replace('{{name}}', created.name));
      router.back();
      return;
    }
    await load();
    router.push(`/features/prep/series/${created.id}` as never);
  }, [
    nameDraft,
    attachActive,
    params.passageKey,
    load,
    router,
    toast,
    h.addedToast,
  ]);

  const handleOpenSeries = useCallback(
    async (item: PrepSeries) => {
      haptics.tap();
      if (attachActive && params.passageKey) {
        await addPrepSeriesPassage(item.id, params.passageKey);
        haptics.success();
        toast.success(h.addedToast.replace('{{name}}', item.name));
        router.back();
        return;
      }
      router.push(`/features/prep/series/${item.id}` as never);
    },
    [attachActive, params.passageKey, router, toast, h.addedToast],
  );

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            {isPremium && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleOpenCreate}
                accessibilityRole="button"
                accessibilityLabel={h.newSeries}>
                <Ionicons name="add" size={24} color={staticColors.white} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="albums" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.headerTitleRow}>
                <AppText scaleRole="display" style={styles.headerTitle}>
                  {h.title}
                </AppText>
                <View style={styles.exclusiveBadge}>
                  <AppText scaleRole="compact" style={styles.exclusiveText}>
                    {h.exclusiveLabel}
                  </AppText>
                </View>
              </View>
              <AppText scaleRole="compact" style={styles.headerSubtitle}>
                {h.subtitle}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        {!isPremium ? (
          <View style={styles.lockedWrap}>
            <View
              style={[
                styles.lockedIconCircle,
                {backgroundColor: colors.primary + '1a'},
              ]}>
              <Ionicons name="leaf-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.lockedTitle, {color: colors.text}]}>
              {h.lockedTitle}
            </Text>
            <Text style={[styles.lockedBody, {color: colors.textSecondary}]}>
              {h.lockedBody}
            </Text>
            <TouchableOpacity
              style={[styles.unlockButton, {backgroundColor: colors.primary}]}
              onPress={handleUnlock}
              accessibilityRole="button"
              accessibilityLabel={`${h.title} — ${t.offering.badgeA11y}`}>
              <Ionicons
                name="leaf-outline"
                size={18}
                color={colors.onPrimary}
              />
              <AppText
                scaleRole="compact"
                style={[styles.unlockButtonText, {color: colors.onPrimary}]}>
                {t.offering.settingsCta}
              </AppText>
            </TouchableOpacity>
          </View>
        ) : status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.body}>
            {attachActive && (
              <View
                style={[
                  styles.attachBanner,
                  {
                    backgroundColor: colors.primary + '0F',
                    borderColor: colors.primary + '33',
                  },
                ]}>
                <TouchableOpacity
                  onPress={handleOpenCreate}
                  accessibilityRole="button"
                  accessibilityLabel={h.newSeries}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachTextWrap}
                  onPress={handleOpenCreate}
                  accessibilityRole="button"
                  accessibilityLabel={h.newSeries}>
                  <Text style={[styles.attachTitle, {color: colors.text}]}>
                    {h.attachTitle.replace('{{passage}}', pendingLabel)}
                  </Text>
                  <Text
                    style={[styles.attachBody, {color: colors.textSecondary}]}>
                    {h.attachBody}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAttachDismissed(true)}
                  accessibilityRole="button"
                  accessibilityLabel={h.attachDismiss}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={[styles.attachDismiss, {color: colors.primary}]}>
                    {h.attachDismiss}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={seriesList}
              keyExtractor={item => item.id}
              contentContainerStyle={[styles.listContent, centeredMaxWidth()]}
              renderItem={({item}) => {
                const progress = computeSeriesProgress(item, notesMap);
                const progressLabel =
                  progress.total === 0
                    ? h.progressEmpty
                    : h.progress
                        .replace('{{started}}', String(progress.started))
                        .replace('{{total}}', String(progress.total));
                return (
                  <TouchableOpacity
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleOpenSeries(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityHint={h.openHint}>
                    <View style={styles.rowMain}>
                      <Text
                        style={[styles.rowLabel, {color: colors.primary}]}
                        numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.rowMeta, {color: colors.textSecondary}]}>
                        {progressLabel}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerState}>
                  <Ionicons
                    name="albums-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.stateTitle, {color: colors.text}]}>
                    {h.emptyTitle}
                  </Text>
                  <Text
                    style={[styles.stateText, {color: colors.textSecondary}]}>
                    {h.emptyBody}
                  </Text>
                </View>
              }
            />
          </View>
        )}

        <Modal
          visible={creating}
          transparent
          animationType="fade"
          onRequestClose={() => setCreating(false)}>
          <View
            style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
            <View
              style={[
                styles.modalCard,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}
              {...focusTrapProps()}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {h.newSeriesModalTitle}
              </Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder={h.namePlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                autoFocus
                maxLength={80}
                returnKeyType="done"
                onSubmitEditing={handleSubmitCreate}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, {borderColor: colors.border}]}
                  onPress={() => setCreating(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t.cancel}>
                  <Text
                    style={[
                      styles.modalButtonText,
                      {color: colors.textSecondary},
                    ]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {backgroundColor: colors.primary},
                    !nameDraft.trim() && styles.modalButtonDisabled,
                  ]}
                  onPress={handleSubmitCreate}
                  accessibilityRole="button"
                  accessibilityState={{disabled: !nameDraft.trim()}}
                  accessibilityLabel={h.create}>
                  <Text
                    style={[styles.modalButtonText, {color: colors.onPrimary}]}>
                    {h.create}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {},
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRow: {flexDirection: 'row', alignItems: 'center'},
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {flex: 1},
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: staticColors.white,
    opacity: 0.85,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: staticColors.glassWhite25,
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: staticColors.white,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateTitle: {fontSize: fontSizes.lg, fontWeight: '700', textAlign: 'center'},
  stateText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.4,
  },
  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  lockedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  lockedTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedBody: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.45,
    maxWidth: 320,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  unlockButtonText: {
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  body: {flex: 1},
  attachBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  attachTextWrap: {flex: 1, gap: 2},
  attachTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  attachBody: {fontSize: fontSizes.xs, lineHeight: fontSizes.xs * 1.4},
  attachDismiss: {fontSize: fontSizes.xs, fontWeight: '700'},
  listContent: {padding: spacing.lg, flexGrow: 1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: {flex: 1, gap: 2},
  rowLabel: {fontWeight: '700', fontSize: fontSizes.md},
  rowMeta: {fontSize: fontSizes.sm},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    marginBottom: spacing.lg,
  },
  modalActions: {flexDirection: 'row', gap: spacing.sm},
  modalButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: staticColors.transparent,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalButtonDisabled: {opacity: 0.5},
  modalButtonText: {fontWeight: '700', fontSize: fontSizes.md},
});
