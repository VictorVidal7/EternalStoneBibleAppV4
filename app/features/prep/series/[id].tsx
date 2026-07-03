/**
 * 📚 DETALLE DE SERIE — T8.4.4, the fourth slice of the premium "Mesa de
 * preparación" tanda (T8.4).
 *
 * One series' ordered passage list: each row shows its own progress (read
 * from the SAME prep notes the single-passage Mesa de preparación already
 * saves — [[prepNotes]]'s `isPrepNotesEmpty`, no new tracking invented),
 * lets the preparer reorder ("week 1, week 2, …") without a drag gesture,
 * remove a passage (never deletes its prep notes — only the grouping),
 * rename or delete the whole series, and add a new passage by typing a
 * reference ("Juan 3:16-21") — resolved to the SAME canonical `passageKey`
 * format the rest of "Mesa de preparación" uses
 * ([[prepSeries]]'s `passageKeyFromReference`).
 *
 * Tapping a passage row opens it in the single-passage Mesa de preparación
 * (`/features/prep`), parsed from its `passageKey` the same way
 * `history.tsx` (T8.4.1) already does.
 *
 * PURE navigation/organization — nothing here generates or suggests sermon
 * content, so the app's guardrail (the app never writes the sermon, cf.
 * Jeremías 23:30-32) isn't at stake in this screen.
 *
 * Premium-gated independently of the list screen (defense in depth against
 * a direct deep link) — a free reader sees the same quiet locked teaser.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo, useState} from 'react';
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
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {
  getPrepSeries,
  renamePrepSeries,
  addPrepSeriesPassage,
  removePrepSeriesPassage,
  movePrepSeriesPassage,
  deletePrepSeries,
} from '@/features/study/prepSeriesStore';
import {getAllPrepNotes} from '@/features/study/prepNotesStore';
import {
  canAddPassage,
  computeSeriesProgress,
  passageKeyFromReference,
  type PrepSeries,
} from '@/features/study/prepSeries';
import {isPrepNotesEmpty} from '@/features/study/prepNotes';
import type {PrepNotesMap} from '@/features/study/prepNotes';
import {parsePassageKey} from '@/features/study/prepHistory';
import {formatPassageLabel} from '@/features/study/prepTable';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready' | 'notFound';

export default function PrepSeriesDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const h = t.prepSeries;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{id?: string}>();
  const id = params.id ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [series, setSeries] = useState<PrepSeries | null>(null);
  const [notesMap, setNotesMap] = useState<PrepNotesMap>({});
  const [addDraft, setAddDraft] = useState('');
  const [addError, setAddError] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setStatus('notFound');
      return;
    }
    const [found, notes] = await Promise.all([
      getPrepSeries(id),
      getAllPrepNotes(),
    ]);
    setSeries(found);
    setNotesMap(notes);
    setStatus(found ? 'ready' : 'notFound');
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return;
      load();
    }, [isPremium, load]),
  );

  const progress = useMemo(
    () => (series ? computeSeriesProgress(series, notesMap) : null),
    [series, notesMap],
  );

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const handleOpenPassage = useCallback(
    (key: string) => {
      const parsed = parsePassageKey(key);
      if (!parsed) return;
      haptics.tap();
      router.push({
        pathname: '/features/prep' as never,
        params: {
          book: parsed.bookNameEn,
          chapter: String(parsed.chapter),
          startVerse: String(parsed.startVerse),
          endVerse: String(parsed.endVerse),
        },
      });
    },
    [router],
  );

  const handleAddPassage = useCallback(async () => {
    if (!series) return;
    const key = passageKeyFromReference(addDraft);
    if (!key) {
      setAddError(h.addPassageInvalid);
      return;
    }
    if (series.passageKeys.includes(key)) {
      setAddError(h.addPassageDuplicate);
      return;
    }
    if (!canAddPassage(series)) {
      setAddError(h.addPassageLimit);
      return;
    }
    haptics.tap();
    await addPrepSeriesPassage(series.id, key);
    setAddDraft('');
    setAddError('');
    await load();
  }, [series, addDraft, h, load]);

  const handleRemovePassage = useCallback(
    async (key: string) => {
      if (!series) return;
      haptics.tap();
      await removePrepSeriesPassage(series.id, key);
      await load();
    },
    [series, load],
  );

  const handleMovePassage = useCallback(
    async (key: string, direction: 'up' | 'down') => {
      if (!series) return;
      haptics.tap();
      await movePrepSeriesPassage(series.id, key, direction);
      await load();
    },
    [series, load],
  );

  const handleOpenRename = useCallback(() => {
    if (!series) return;
    haptics.tap();
    setNameDraft(series.name);
    setRenaming(true);
  }, [series]);

  const handleSubmitRename = useCallback(async () => {
    if (!series) return;
    const name = nameDraft.trim();
    if (!name) return;
    await renamePrepSeries(series.id, name);
    setRenaming(false);
    await load();
  }, [series, nameDraft, load]);

  const handleDelete = useCallback(async () => {
    if (!series) return;
    await deletePrepSeries(series.id);
    setDeleteConfirmOpen(false);
    router.back();
  }, [series, router]);

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

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
            {isPremium && series && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={handleOpenRename}
                  accessibilityRole="button"
                  accessibilityLabel={h.renameLabel}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={() => setDeleteConfirmOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={h.deleteLabel}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="albums" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText
                scaleRole="display"
                style={styles.headerTitle}
                numberOfLines={2}>
                {series ? series.name : h.title}
              </AppText>
              {progress && (
                <AppText scaleRole="compact" style={styles.headerSubtitle}>
                  {progress.total === 0
                    ? h.progressEmpty
                    : h.progress
                        .replace('{{started}}', String(progress.started))
                        .replace('{{total}}', String(progress.total))}
                </AppText>
              )}
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
                color={staticColors.white}
              />
              <AppText scaleRole="compact" style={styles.unlockButtonText}>
                {t.offering.settingsCta}
              </AppText>
            </TouchableOpacity>
          </View>
        ) : status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : status === 'notFound' || !series ? (
          <View style={styles.centerState}>
            <Ionicons
              name="albums-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {h.notFound}
            </Text>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={centeredMaxWidth()}>
              <View style={styles.addRow}>
                <TextInput
                  value={addDraft}
                  onChangeText={value => {
                    setAddDraft(value);
                    if (addError) setAddError('');
                  }}
                  placeholder={h.addPassagePlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.addInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  returnKeyType="done"
                  onSubmitEditing={handleAddPassage}
                  accessibilityLabel={h.addPassagePlaceholder}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {backgroundColor: colors.primary},
                    !addDraft.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddPassage}
                  accessibilityRole="button"
                  accessibilityState={{disabled: !addDraft.trim()}}
                  accessibilityLabel={h.addPassage}>
                  <Ionicons name="add" size={22} color={staticColors.white} />
                </TouchableOpacity>
              </View>
              {addError.length > 0 && (
                <Text style={[styles.addErrorText, {color: colors.error}]}>
                  {addError}
                </Text>
              )}
            </View>

            <FlatList
              data={series.passageKeys}
              keyExtractor={key => key}
              contentContainerStyle={[styles.listContent, centeredMaxWidth()]}
              renderItem={({item: key, index}) => {
                const parsed = parsePassageKey(key);
                const label = parsed
                  ? formatPassageLabel(parsed, bookLang)
                  : key;
                const started = !isPrepNotesEmpty(notesMap[key]);
                const canMoveUp = index > 0;
                const canMoveDown = index < series.passageKeys.length - 1;
                return (
                  <View
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <TouchableOpacity
                      style={styles.rowMain}
                      onPress={() => handleOpenPassage(key)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityHint={h.openPassageHint}>
                      <Text
                        style={[styles.rowLabel, {color: colors.primary}]}
                        numberOfLines={1}>
                        {label}
                      </Text>
                      <View style={styles.rowStatusLine}>
                        <Ionicons
                          name={
                            started ? 'checkmark-circle' : 'ellipse-outline'
                          }
                          size={14}
                          color={started ? colors.primary : colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.rowStatusText,
                            {color: colors.textSecondary},
                          ]}>
                          {started ? h.passageStarted : h.passageNotStarted}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.rowActionButton}
                        onPress={() => handleMovePassage(key, 'up')}
                        accessibilityRole="button"
                        accessibilityLabel={h.moveUp}
                        accessibilityState={{disabled: !canMoveUp}}>
                        <Ionicons
                          name="chevron-up"
                          size={18}
                          color={
                            canMoveUp ? colors.textSecondary : colors.border
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rowActionButton}
                        onPress={() => handleMovePassage(key, 'down')}
                        accessibilityRole="button"
                        accessibilityLabel={h.moveDown}
                        accessibilityState={{disabled: !canMoveDown}}>
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={
                            canMoveDown ? colors.textSecondary : colors.border
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rowActionButton}
                        onPress={() => handleRemovePassage(key)}
                        accessibilityRole="button"
                        accessibilityLabel={h.removePassage}>
                        <Ionicons
                          name="close"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerState}>
                  <Ionicons
                    name="reader-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.stateTitle, {color: colors.text}]}>
                    {h.emptyPassagesTitle}
                  </Text>
                  <Text
                    style={[styles.stateText, {color: colors.textSecondary}]}>
                    {h.emptyPassagesBody}
                  </Text>
                </View>
              }
            />
          </View>
        )}

        <Modal
          visible={renaming}
          transparent
          animationType="fade"
          onRequestClose={() => setRenaming(false)}>
          <View
            style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
            <View
              style={[styles.modalCard, {backgroundColor: colors.surface}]}
              {...focusTrapProps()}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {h.renameModalTitle}
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
                onSubmitEditing={handleSubmitRename}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, {borderColor: colors.border}]}
                  onPress={() => setRenaming(false)}
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
                  onPress={handleSubmitRename}
                  accessibilityRole="button"
                  accessibilityState={{disabled: !nameDraft.trim()}}
                  accessibilityLabel={t.save}>
                  <Text
                    style={[
                      styles.modalButtonText,
                      {color: staticColors.white},
                    ]}>
                    {t.save}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ConfirmDialog
          visible={deleteConfirmOpen}
          title={h.deleteConfirmTitle}
          message={h.deleteConfirmBody}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
          destructive
        />
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
  headerActions: {flexDirection: 'row', gap: spacing.xs},
  headerActionButton: {
    width: 36,
    height: 36,
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
    color: staticColors.white,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  body: {flex: 1},
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  addInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {opacity: 0.5},
  addErrorText: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
  },
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
  rowMain: {flex: 1, gap: 4},
  rowLabel: {fontWeight: '700', fontSize: fontSizes.md},
  rowStatusLine: {flexDirection: 'row', alignItems: 'center', gap: 4},
  rowStatusText: {fontSize: fontSizes.xs},
  rowActions: {flexDirection: 'row', alignItems: 'center'},
  rowActionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
