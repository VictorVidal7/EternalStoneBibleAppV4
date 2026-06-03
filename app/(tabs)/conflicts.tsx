/**
 * Sprint 43 — pending conflicts screen.
 *
 * Lists ConflictRecords detected by SyncEngine. For each conflict the
 * user sees the local vs remote values side-by-side and picks one of:
 *  - Keep mine: re-stamps local with now and pushes to Firestore.
 *  - Keep theirs: applies remote locally.
 *  - Merge: opens a modal with editable fields for the differing keys.
 *
 * The screen has no entry in the bottom tab bar — it's pushed from the
 * Settings → Cuenta badge when conflicts > 0.
 */

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import {useMemo, useState} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useToast} from '@context/ToastContext';
import {useSyncEngineOptional, useConflicts} from '@context/SyncEngineContext';
import type {ConflictChoice, ConflictRecord} from '@lib/sync';
import {logger} from '@lib/utils/logger';
import {staticColors} from '@/styles/designTokens';

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.length === 0 ? '[]' : value.join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function ConflictsScreen() {
  const router = useRouter();
  const {colors, gradient} = useTheme();
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#dc2626', '#ea580c', '#f59e0b']) as [string, string, string],
    [gradient?.headerColors],
  );
  const {t} = useLanguage();
  const toast = useToast();
  const syncCtx = useSyncEngineOptional();
  const conflicts = useConflicts();
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeDraft, setMergeDraft] = useState<Record<string, string>>({});

  const mergingConflict = useMemo(
    () => conflicts.find(c => c.id === mergingId) ?? null,
    [conflicts, mergingId],
  );

  function openMerge(c: ConflictRecord): void {
    const draft: Record<string, string> = {};
    for (const f of c.differingFields) {
      draft[f] = formatValue(c.localVersion[f]);
    }
    setMergeDraft(draft);
    setMergingId(c.id);
  }

  function closeMerge(): void {
    setMergingId(null);
    setMergeDraft({});
  }

  async function applyChoice(
    c: ConflictRecord,
    choice: ConflictChoice,
  ): Promise<void> {
    if (!syncCtx) return;
    try {
      await syncCtx.engine.resolveConflict(c.id, choice);
      toast.success(t.conflicts.resolvedToast);
    } catch (err) {
      logger.error(
        'ConflictsScreen: resolveConflict failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'ConflictsScreen', conflictId: c.id, choice},
      );
      toast.error(t.conflicts.resolveError);
    }
  }

  async function applyMerge(): Promise<void> {
    if (!syncCtx || !mergingConflict) return;
    const merged: Record<string, unknown> = {...mergingConflict.localVersion};
    for (const [k, v] of Object.entries(mergeDraft)) {
      const original = mergingConflict.localVersion[k];
      if (Array.isArray(original)) {
        // Comma-separated string back to array (trims empties).
        merged[k] = v
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      } else if (typeof original === 'number') {
        const n = Number(v);
        merged[k] = Number.isNaN(n) ? original : n;
      } else {
        merged[k] = v;
      }
    }
    try {
      await syncCtx.engine.resolveConflict(
        mergingConflict.id,
        'merge',
        merged as ConflictRecord['localVersion'],
      );
      toast.success(t.conflicts.resolvedToast);
      closeMerge();
    } catch (err) {
      logger.error(
        'ConflictsScreen: merge resolve failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'ConflictsScreen', conflictId: mergingConflict.id},
      );
      toast.error(t.conflicts.resolveError);
    }
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="git-merge" size={28} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.conflicts.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {conflicts.length === 0
                ? t.conflicts.empty
                : conflicts.length === 1
                  ? t.conflicts.badgeSingular
                  : t.conflicts.badge.replace(
                      '{{count}}',
                      String(conflicts.length),
                    )}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={conflicts}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <View
            style={[styles.card, {backgroundColor: colors.surface}]}
            accessibilityRole="summary">
            <View style={styles.cardHeader}>
              <Text
                style={[styles.collection, {color: colors.primary}]}
                numberOfLines={1}>
                {item.collection}
              </Text>
              <Text
                style={[styles.docId, {color: colors.textTertiary}]}
                numberOfLines={1}>
                {item.docId}
              </Text>
            </View>

            <View style={styles.versionsRow}>
              <View
                style={[
                  styles.versionCol,
                  {backgroundColor: colors.background},
                ]}>
                <Text style={[styles.versionLabel, {color: colors.primary}]}>
                  {t.conflicts.mine}
                </Text>
                {item.differingFields.map(f => (
                  <View key={`mine-${f}`} style={styles.fieldRow}>
                    <Text
                      style={[styles.fieldName, {color: colors.textTertiary}]}>
                      {f}
                    </Text>
                    <Text
                      style={[styles.fieldValue, {color: colors.text}]}
                      numberOfLines={3}>
                      {formatValue(item.localVersion[f])}
                    </Text>
                  </View>
                ))}
              </View>
              <View
                style={[
                  styles.versionCol,
                  {backgroundColor: colors.background},
                ]}>
                <Text
                  style={[
                    styles.versionLabel,
                    {color: colors.warning ?? colors.error},
                  ]}>
                  {t.conflicts.theirs}
                </Text>
                {item.differingFields.map(f => (
                  <View key={`theirs-${f}`} style={styles.fieldRow}>
                    <Text
                      style={[styles.fieldName, {color: colors.textTertiary}]}>
                      {f}
                    </Text>
                    <Text
                      style={[styles.fieldValue, {color: colors.text}]}
                      numberOfLines={3}>
                      {formatValue(item.remoteVersion[f])}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, {borderColor: colors.primary}]}
                onPress={() => applyChoice(item, 'keepMine')}
                accessibilityRole="button"
                accessibilityLabel={t.conflicts.keepMine}>
                <Text style={[styles.actionBtnText, {color: colors.primary}]}>
                  {t.conflicts.keepMine}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {borderColor: colors.warning ?? colors.error},
                ]}
                onPress={() => applyChoice(item, 'keepTheirs')}
                accessibilityRole="button"
                accessibilityLabel={t.conflicts.keepTheirs}>
                <Text
                  style={[
                    styles.actionBtnText,
                    {color: colors.warning ?? colors.error},
                  ]}>
                  {t.conflicts.keepTheirs}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    borderColor: colors.text,
                    backgroundColor: colors.primary + '12',
                  },
                ]}
                onPress={() => openMerge(item)}
                accessibilityRole="button"
                accessibilityLabel={t.conflicts.merge}>
                <Text style={[styles.actionBtnText, {color: colors.text}]}>
                  {t.conflicts.merge}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, {color: colors.text}]}>
              {t.conflicts.emptyTitle}
            </Text>
            <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
              {t.conflicts.emptyBody}
            </Text>
          </View>
        }
      />

      <Modal
        visible={mergingConflict !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMerge}>
        <View style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
          <View
            style={[styles.modalCard, {backgroundColor: colors.surface}]}
            {...focusTrapProps()}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              {t.conflicts.mergeTitle}
            </Text>
            <Text
              style={[styles.modalBody, {color: colors.textSecondary}]}
              numberOfLines={2}>
              {t.conflicts.mergeBody}
            </Text>
            <ScrollView style={styles.modalScroll}>
              {mergingConflict?.differingFields.map(f => (
                <View key={`merge-${f}`} style={styles.mergeField}>
                  <Text
                    style={[styles.fieldName, {color: colors.textTertiary}]}>
                    {f}
                  </Text>
                  <TextInput
                    value={mergeDraft[f] ?? ''}
                    onChangeText={v =>
                      setMergeDraft(prev => ({...prev, [f]: v}))
                    }
                    multiline
                    placeholder={t.conflicts.mergePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.mergeInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  />
                  <Text
                    style={[styles.fieldHint, {color: colors.textTertiary}]}>
                    {t.conflicts.mineHint}:{' '}
                    {formatValue(mergingConflict.localVersion[f])}
                    {'\n'}
                    {t.conflicts.theirsHint}:{' '}
                    {formatValue(mergingConflict.remoteVersion[f])}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, {borderColor: colors.border}]}
                onPress={closeMerge}
                accessibilityRole="button">
                <Text style={{color: colors.textSecondary}}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={applyMerge}
                accessibilityRole="button">
                <Text style={styles.mergeButtonText}>
                  {t.conflicts.saveMerge}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerBackButton: {
    position: 'absolute',
    top: 56,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 56,
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: staticColors.glassWhite18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {flex: 1},
  headerTitle: {
    color: staticColors.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: staticColors.glassWhite85,
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {padding: 16, paddingBottom: 120},
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: staticColors.black,
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  mergeButtonText: {
    color: staticColors.white,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  collection: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docId: {fontSize: 11, marginLeft: 8, flexShrink: 1},
  versionsRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  versionCol: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldRow: {marginBottom: 6},
  fieldName: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {fontSize: 13, marginTop: 2},
  fieldHint: {fontSize: 11, marginTop: 4, lineHeight: 16},
  actions: {flexDirection: 'row', gap: 8},
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {fontSize: 12, fontWeight: '600'},
  empty: {alignItems: 'center', paddingTop: 80, paddingHorizontal: 32},
  emptyTitle: {fontSize: 18, fontWeight: '700', marginTop: 16},
  emptyBody: {fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalBody: {fontSize: 13, marginTop: 6, lineHeight: 18},
  modalScroll: {marginTop: 12, maxHeight: 380},
  mergeField: {marginBottom: 14},
  mergeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
