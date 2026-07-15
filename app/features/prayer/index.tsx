/**
 * 🙏 PRAYER JOURNAL — "Mi diario de oración" (Sprint 93)
 *
 * A private, device-local journal of what the reader brings to God: requests by
 * category (the ACTS shape + intercession), each markable "answered" with a
 * date and an optional testimony so the journal becomes a record of God's
 * faithfulness, not a to-do list. From here the reader can also begin the
 * guided ACTS prayer.
 *
 * Reached from the Home prayer card / study-tools and the deep link
 * eternalbible://features/prayer. Pure model in [[prayer]]; persistence in
 * [[prayerStore]] via [[usePrayerJournal]]. 100% JS, zero Firestore — never
 * synced.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {TestimonyImageModal} from '@components/insights/TestimonyImageModal';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {usePrayerJournal} from '@hooks/usePrayerJournal';
import {
  activeRequests,
  answeredRequests,
  filterByCategory,
  isBlankTitle,
  prayerStats,
  PRAYER_CATEGORY_META,
  PRAYER_CATEGORY_ORDER,
  PRAYER_TITLE_MAX,
  PRAYER_DETAIL_MAX,
  type PrayerCategory,
  type PrayerRequest,
} from '@/features/prayer/prayer';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Filter = PrayerCategory | 'all';

export default function PrayerJournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const tp = t.prayer;
  const {loaded, requests, add, edit, answer, reopen, remove} =
    usePrayerJournal();

  const [filter, setFilter] = useState<Filter>('all');
  // Add/edit form modal.
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDetail, setDraftDetail] = useState('');
  const [draftCategory, setDraftCategory] =
    useState<PrayerCategory>('supplication');
  // Answer modal.
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [answerNote, setAnswerNote] = useState('');
  // Share-as-testimony modal (Sprint 94) — the answered request being shared.
  const [shareReq, setShareReq] = useState<PrayerRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrayerRequest | null>(null);

  const stats = useMemo(() => prayerStats(requests), [requests]);
  const active = useMemo(
    () => filterByCategory(activeRequests(requests), filter),
    [requests, filter],
  );
  const answered = useMemo(
    () => filterByCategory(answeredRequests(requests), filter),
    [requests, filter],
  );

  const categoryLabel = (c: PrayerCategory) => tp.categories[c];

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const openAdd = () => {
    haptics.tap();
    setEditingId(null);
    setDraftTitle('');
    setDraftDetail('');
    setDraftCategory(filter === 'all' ? 'supplication' : filter);
    setFormOpen(true);
  };

  const openEdit = (r: PrayerRequest) => {
    haptics.tap();
    setEditingId(r.id);
    setDraftTitle(r.title);
    setDraftDetail(r.detail ?? '');
    setDraftCategory(r.category);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (isBlankTitle(draftTitle)) return;
    const fields = {
      title: draftTitle,
      detail: draftDetail,
      category: draftCategory,
    };
    setFormOpen(false);
    haptics.success();
    if (editingId) {
      await edit(editingId, fields);
    } else {
      await add(fields);
      toast.success(tp.addedToast);
    }
  };

  const confirmDelete = (r: PrayerRequest) => {
    haptics.tap();
    setDeleteTarget(r);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    void remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openAnswer = (r: PrayerRequest) => {
    haptics.tap();
    setAnswerId(r.id);
    setAnswerNote('');
  };

  const saveAnswer = async () => {
    if (!answerId) return;
    const id = answerId;
    const note = answerNote;
    setAnswerId(null);
    haptics.success();
    await answer(id, note);
    toast.success(tp.answeredCelebrate);
  };

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  /** A category chip in the horizontal filter row. */
  const renderFilterChip = (value: Filter) => {
    const selected = filter === value;
    const meta = value === 'all' ? null : PRAYER_CATEGORY_META[value];
    const label = value === 'all' ? tp.filterAll : categoryLabel(value);
    const count =
      value === 'all' ? stats.active : stats.activeByCategory[value];
    return (
      <TouchableOpacity
        key={value}
        onPress={() => {
          haptics.tap();
          setFilter(value);
        }}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.card,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{selected}}
        accessibilityLabel={`${label}${count ? `, ${count}` : ''}`}>
        {meta && (
          <Ionicons
            name={meta.icon as never}
            size={14}
            color={selected ? staticColors.white : meta.accent}
          />
        )}
        <AppText
          scaleRole="compact"
          style={[
            styles.chipText,
            {color: selected ? staticColors.white : colors.text},
          ]}>
          {label}
        </AppText>
        {count > 0 && (
          <View
            style={[
              styles.chipCount,
              {
                backgroundColor: selected
                  ? staticColors.glassWhite25
                  : colors.primary + '22',
              },
            ]}>
            <AppText
              scaleRole="compact"
              style={[
                styles.chipCountText,
                {color: selected ? staticColors.white : colors.primary},
              ]}>
              {String(count)}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderActiveCard = (r: PrayerRequest) => {
    const meta = PRAYER_CATEGORY_META[r.category];
    return (
      <View
        key={r.id}
        style={[
          styles.card,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <View style={styles.cardHead}>
          <View style={[styles.catDot, {backgroundColor: meta.accent + '22'}]}>
            <Ionicons name={meta.icon as never} size={16} color={meta.accent} />
          </View>
          <AppText
            scaleRole="compact"
            style={[styles.catLabel, {color: meta.accent}]}>
            {categoryLabel(r.category)}
          </AppText>
        </View>
        <AppText style={[styles.cardTitle, {color: colors.text}]}>
          {r.title}
        </AppText>
        {!!r.detail && (
          <AppText
            scaleRole="compact"
            style={[styles.cardDetail, {color: colors.textSecondary}]}>
            {r.detail}
          </AppText>
        )}
        <View style={[styles.actions, {borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openAnswer(r)}
            accessibilityRole="button"
            accessibilityLabel={tp.markAnswered}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.primary}
            />
            <AppText
              scaleRole="compact"
              style={[styles.actionText, {color: colors.primary}]}>
              {tp.markAnswered}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={() => openEdit(r)}
            accessibilityRole="button"
            accessibilityLabel={tp.editTitle}>
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={() => confirmDelete(r)}
            accessibilityRole="button"
            accessibilityLabel={tp.delete}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnsweredCard = (r: PrayerRequest) => {
    const meta = PRAYER_CATEGORY_META[r.category];
    return (
      <View
        key={r.id}
        style={[
          styles.card,
          styles.answeredCard,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <View style={styles.cardHead}>
          <Ionicons name="checkmark-circle" size={18} color={meta.accent} />
          <AppText
            scaleRole="compact"
            style={[styles.catLabel, {color: colors.textSecondary}]}>
            {r.answeredAt
              ? tp.answeredOn.replace('{{date}}', formatDate(r.answeredAt))
              : categoryLabel(r.category)}
          </AppText>
        </View>
        <AppText style={[styles.answeredTitle, {color: colors.text}]}>
          {r.title}
        </AppText>
        {!!r.answeredNote && (
          <AppText
            scaleRole="compact"
            style={[styles.cardDetail, {color: colors.textSecondary}]}>
            {r.answeredNote}
          </AppText>
        )}
        <View style={styles.answeredFooter}>
          <TouchableOpacity
            style={styles.reopenBtn}
            onPress={() => {
              haptics.tap();
              void reopen(r.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={tp.reopen}>
            <Ionicons
              name="refresh-outline"
              size={15}
              color={colors.textTertiary}
            />
            <AppText
              scaleRole="compact"
              style={[styles.reopenText, {color: colors.textTertiary}]}>
              {tp.reopen}
            </AppText>
          </TouchableOpacity>
          {/* Share this answer as a testimony image (Sprint 94) — turning a
              private record of God's faithfulness into a witness. */}
          <TouchableOpacity
            style={styles.reopenBtn}
            onPress={() => {
              haptics.tap();
              setShareReq(r);
            }}
            accessibilityRole="button"
            accessibilityLabel={tp.testimony.share}>
            <Ionicons name="share-outline" size={15} color={meta.accent} />
            <AppText
              scaleRole="compact"
              style={[styles.reopenText, {color: meta.accent}]}>
              {tp.testimony.share}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="rose" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tp.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tp.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Primary actions */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaPrimary, {backgroundColor: colors.primary}]}
              onPress={() => {
                haptics.tap();
                router.push('/features/prayer/acts' as never);
              }}
              accessibilityRole="button"
              accessibilityLabel={tp.prayNow}>
              <Ionicons name="sparkles" size={18} color={staticColors.white} />
              <AppText
                scaleRole="compact"
                style={[styles.ctaPrimaryText, {color: staticColors.white}]}>
                {tp.prayNow}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ctaSecondary,
                {borderColor: colors.primary, backgroundColor: colors.card},
              ]}
              onPress={openAdd}
              accessibilityRole="button"
              accessibilityLabel={tp.add}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <AppText
                scaleRole="compact"
                style={[styles.ctaSecondaryText, {color: colors.primary}]}>
                {tp.add}
              </AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.scriptureCta,
              {borderColor: colors.primary, backgroundColor: colors.card},
            ]}
            onPress={() => {
              haptics.tap();
              router.push('/features/prayer/scripture' as never);
            }}
            accessibilityRole="button"
            accessibilityLabel={tp.scriptureCta}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <View style={styles.scriptureCtaText}>
              <AppText
                scaleRole="compact"
                style={[styles.scriptureCtaTitle, {color: colors.primary}]}>
                {tp.scriptureCta}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[
                  styles.scriptureCtaSubtitle,
                  {color: colors.textSecondary},
                ]}>
                {tp.scriptureCtaSubtitle}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Filter row — horizontal ScrollView, no flex (no Fabric stretch) */}
          {requests.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroller}
              contentContainerStyle={styles.filterRow}>
              {(['all', ...PRAYER_CATEGORY_ORDER] as Filter[]).map(
                renderFilterChip,
              )}
            </ScrollView>
          )}

          {!loaded && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {loaded && requests.length === 0 && (
            <View style={styles.centerState}>
              <Ionicons
                name="rose-outline"
                size={44}
                color={colors.textTertiary}
              />
              <AppText style={[styles.emptyTitle, {color: colors.text}]}>
                {tp.empty}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.emptyHint, {color: colors.textSecondary}]}>
                {tp.emptyHint}
              </AppText>
            </View>
          )}

          {loaded && active.length > 0 && (
            <View style={styles.section}>
              <AppText
                scaleRole="compact"
                style={[styles.sectionTitle, {color: colors.textTertiary}]}>
                {tp.activeSection.toUpperCase()}
              </AppText>
              {active.map(renderActiveCard)}
            </View>
          )}

          {loaded && answered.length > 0 && (
            <View style={styles.section}>
              <AppText
                scaleRole="compact"
                style={[styles.sectionTitle, {color: colors.textTertiary}]}>
                {tp.answeredCount.replace('{{n}}', String(answered.length))}
              </AppText>
              {answered.map(renderAnsweredCard)}
            </View>
          )}
        </ScrollView>

        {/* Add / edit form modal */}
        <Modal
          visible={formOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFormOpen(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}>
              <AppText
                scaleRole="display"
                style={[styles.modalTitle, {color: colors.text}]}>
                {editingId ? tp.editTitle : tp.addTitle}
              </AppText>
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                placeholder={tp.titlePlaceholder}
                placeholderTextColor={colors.textTertiary}
                maxLength={PRAYER_TITLE_MAX}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel={tp.titleLabel}
              />
              <TextInput
                value={draftDetail}
                onChangeText={setDraftDetail}
                placeholder={tp.detailPlaceholder}
                placeholderTextColor={colors.textTertiary}
                maxLength={PRAYER_DETAIL_MAX}
                multiline
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel={tp.detailLabel}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroller}
                contentContainerStyle={styles.filterRow}>
                {PRAYER_CATEGORY_ORDER.map(c => {
                  const selected = draftCategory === c;
                  const meta = PRAYER_CATEGORY_META[c];
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        haptics.tap();
                        setDraftCategory(c);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? meta.accent : colors.card,
                          borderColor: selected ? meta.accent : colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{selected}}
                      accessibilityLabel={categoryLabel(c)}>
                      <Ionicons
                        name={meta.icon as never}
                        size={14}
                        color={selected ? staticColors.white : meta.accent}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.chipText,
                          {color: selected ? staticColors.white : colors.text},
                        ]}>
                        {categoryLabel(c)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setFormOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel={tp.cancel}>
                  <AppText style={{color: colors.textSecondary}}>
                    {tp.cancel}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSave,
                    {
                      backgroundColor: isBlankTitle(draftTitle)
                        ? colors.border
                        : colors.primary,
                    },
                  ]}
                  disabled={isBlankTitle(draftTitle)}
                  onPress={saveForm}
                  accessibilityRole="button"
                  accessibilityState={{disabled: isBlankTitle(draftTitle)}}
                  accessibilityLabel={tp.save}>
                  <AppText
                    style={[styles.modalSaveText, {color: colors.onPrimary}]}>
                    {tp.save}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Answer modal */}
        <Modal
          visible={answerId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setAnswerId(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}>
              <AppText
                scaleRole="display"
                style={[styles.modalTitle, {color: colors.text}]}>
                {tp.answeredPrompt}
              </AppText>
              <TextInput
                value={answerNote}
                onChangeText={setAnswerNote}
                placeholder={tp.answeredNotePlaceholder}
                placeholderTextColor={colors.textTertiary}
                maxLength={PRAYER_DETAIL_MAX}
                multiline
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel={tp.answeredNotePlaceholder}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setAnswerId(null)}
                  accessibilityRole="button"
                  accessibilityLabel={tp.cancel}>
                  <AppText style={{color: colors.textSecondary}}>
                    {tp.cancel}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, {backgroundColor: colors.primary}]}
                  onPress={saveAnswer}
                  accessibilityRole="button"
                  accessibilityLabel={tp.markAnswered}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.onPrimary}
                  />
                  <AppText
                    style={[styles.modalSaveText, {color: colors.onPrimary}]}>
                    {tp.markAnswered}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Share an answered prayer as a testimony image (Sprint 94) */}
        <TestimonyImageModal
          visible={shareReq !== null}
          title={shareReq?.title ?? ''}
          testimony={shareReq?.answeredNote || undefined}
          answeredLine={tp.answeredOn.replace(
            '{{date}}',
            formatDate(
              shareReq?.answeredAt ?? shareReq?.createdAt ?? Date.now(),
            ),
          )}
          onClose={() => setShareReq(null)}
        />

        {/* Themed delete confirm (UX audit, replaces native Alert.alert) */}
        <ConfirmDialog
          visible={!!deleteTarget}
          title={tp.deleteConfirmTitle}
          message={tp.deleteConfirmBody}
          confirmLabel={tp.delete}
          cancelLabel={tp.cancel}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {padding: spacing.lg, gap: spacing.lg},
  ctaRow: {flexDirection: 'row', gap: spacing.sm},
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ctaPrimaryText: {fontSize: fontSizes.md, fontWeight: '700'},
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  ctaSecondaryText: {fontSize: fontSizes.md, fontWeight: '700'},
  scriptureCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  scriptureCtaText: {flex: 1},
  scriptureCtaTitle: {fontSize: fontSizes.md, fontWeight: '700'},
  scriptureCtaSubtitle: {fontSize: fontSizes.xs, marginTop: 1},
  filterScroller: {flexGrow: 0},
  filterRow: {gap: spacing.sm, paddingVertical: spacing.xs},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {fontSize: fontSizes.sm, fontWeight: '600'},
  chipCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  chipCountText: {fontSize: fontSizes.xs, fontWeight: '800'},
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyTitle: {fontSize: fontSizes.lg, fontWeight: '800', textAlign: 'center'},
  emptyHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  section: {gap: spacing.sm},
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  answeredCard: {opacity: 0.92},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  catDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitle: {fontSize: fontSizes.md, fontWeight: '700'},
  answeredTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  cardDetail: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.45},
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {fontSize: fontSizes.sm, fontWeight: '700'},
  iconAction: {padding: spacing.xs},
  answeredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reopenText: {fontSize: fontSizes.xs, fontWeight: '600'},
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack60,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {fontSize: fontSizes.xl, fontWeight: '800'},
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
  },
  inputMultiline: {minHeight: 80, textAlignVertical: 'top'},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalCancel: {paddingVertical: spacing.sm, paddingHorizontal: spacing.md},
  modalSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  modalSaveText: {fontWeight: '700'},
});
