/**
 * 💡 BANCO DE ILUSTRACIONES — Tanda 4, a slice of the premium pastors/
 * teachers "Mesa de preparación" track.
 *
 * Lists every illustration/quote/anecdote the preacher has saved (device-
 * local, from [[prepIllustrationsStore]]), most-recently-updated first,
 * searchable by title/body substring and filterable by ONE of the 7 fixed
 * categories ([[prepIllustrations]]'s `ILLUSTRATION_CATEGORY_ORDER`). Tapping
 * a row opens its editor (`[id].tsx`); the "+" button creates a fresh BLANK
 * illustration and navigates straight to the editor (no "name required"
 * modal, unlike the sibling "Series de predicación" list) — the editor's own
 * autosave fills it in.
 *
 * Doubles as the "insert into my current preparation" target picker (Tanda
 * 4, Phase B): when opened with an `insertPassageKey` param (from the
 * "Banco de ilustraciones" button on the single-passage Mesa de
 * preparación), a banner offers to insert whichever illustration is tapped
 * next into that passage's notes — "Ahora no" dismisses back to normal
 * browsing without losing the list underneath it. Mirrors "Series de
 * predicación"'s own `passageKey` attach-mode almost exactly. Every insert
 * lands in the SAME fixed section (`application`) — this entry point has no
 * natural per-section target since the bank is one flat list, not scoped to
 * an outline section; a lightweight section picker is a reasonable v2 if
 * that default proves wrong in practice.
 *
 * PURE organization over material the preacher wrote themselves — nothing
 * here generates or suggests content, so the app's guardrail (the app never
 * writes the sermon, cf. Jeremías 23:30-32) isn't at stake in this screen.
 *
 * Premium-gated (offering-unlocked, never framed as a purchase): a free
 * reader sees a quiet locked teaser instead of the list, same discipline as
 * "Series de predicación".
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
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
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {
  createPrepIllustration,
  deletePrepIllustration,
  getAllPrepIllustrations,
} from '@/features/study/prepIllustrationsStore';
import {
  ILLUSTRATION_CATEGORY_META,
  ILLUSTRATION_CATEGORY_ORDER,
  canCreateIllustration,
  filterIllustrationsByCategory,
  isIllustrationEmpty,
  listIllustrations,
  searchIllustrations,
  type IllustrationCategory,
  type PrepIllustration,
  type PrepIllustrationsMap,
} from '@/features/study/prepIllustrations';
import {parsePassageKey} from '@/features/study/prepHistory';
import {
  buildPrepTable,
  formatPassageLabel,
  type PrepSection,
} from '@/features/study/prepTable';
import {rankIllustrationsByRelevance} from '@/features/study/prepRelevance';
import {getPrepNotes, savePrepNote} from '@/features/study/prepNotesStore';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready';
type CategoryFilter = IllustrationCategory | 'all';

/**
 * Tanda 4 insert-flow judgment call: this entry point has no natural
 * per-section target — the bank is one flat list, not scoped to a specific
 * outline section of the passage being prepared — so every insert lands in
 * 'application', the section an illustration most naturally supports. A
 * lightweight section picker is a reasonable v2 if this default proves
 * wrong in practice.
 */
const INSERT_TARGET_SECTION: PrepSection = 'application';

export default function PrepIllustrationsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const toast = useToast();
  const h = t.prepIllustrations;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{insertPassageKey?: string}>();

  const [status, setStatus] = useState<Status>('loading');
  const [illustrationsMap, setIllustrationsMap] =
    useState<PrepIllustrationsMap>({});
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<PrepIllustration | null>(
    null,
  );
  const [insertDismissed, setInsertDismissed] = useState(false);

  const load = useCallback(async () => {
    const map = await getAllPrepIllustrations();
    setIllustrationsMap(map);
    setStatus('ready');
  }, []);

  // Free readers never even read the store — premium stays a pure addition.
  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return;
      load();
    }, [isPremium, load]),
  );

  // Tanda 4 — "insert mode", mirroring prepSeries' own passageKey attach
  // mode: opened with `insertPassageKey` from the single-passage Mesa de
  // preparación, tapping an illustration inserts it there instead of
  // opening the editor. `insertDismissed` lets the reader fall back to
  // normal browsing without losing the param (same "Ahora no" idiom).
  const pendingInsertPassage = useMemo(
    () =>
      params.insertPassageKey ? parsePassageKey(params.insertPassageKey) : null,
    [params.insertPassageKey],
  );
  const insertActive = Boolean(pendingInsertPassage) && !insertDismissed;
  const insertLabel = pendingInsertPassage
    ? formatPassageLabel(pendingInsertPassage, bookLang)
    : '';

  // Relevance re-ranking — ONLY when opened in insert mode with a real
  // target passage: the theme ids that passage's own Mesa de preparación
  // already computes (`buildPrepTable`'s `themeIds`), reused here purely to
  // score the preacher's OWN saved illustrations by keyword relevance (see
  // prepRelevance.ts). Pure lookup, no AI — and a no-op (browsing keeps its
  // existing most-recently-updated order) whenever there's no target passage.
  const targetThemeIds = useMemo(() => {
    if (!pendingInsertPassage) return [];
    const targetTable = buildPrepTable(
      pendingInsertPassage.bookNameEn,
      pendingInsertPassage.chapter,
      pendingInsertPassage.startVerse,
      pendingInsertPassage.endVerse,
    );
    return targetTable?.themeIds ?? [];
  }, [pendingInsertPassage]);

  const visible = useMemo(() => {
    const all = listIllustrations(illustrationsMap);
    const byCategory = filterIllustrationsByCategory(all, categoryFilter);
    const searched = searchIllustrations(byCategory, query);
    return targetThemeIds.length > 0
      ? rankIllustrationsByRelevance(searched, targetThemeIds)
      : searched;
  }, [illustrationsMap, categoryFilter, query, targetThemeIds]);

  const hasAny = Object.keys(illustrationsMap).length > 0;

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const handleCreate = useCallback(async () => {
    haptics.tap();
    if (!canCreateIllustration(illustrationsMap)) {
      toast.warning(`${h.limitReachedTitle}. ${h.limitReachedBody}`);
      return;
    }
    const category =
      categoryFilter === 'all'
        ? undefined
        : (categoryFilter as IllustrationCategory | undefined);
    const created = await createPrepIllustration(category);
    if (!created) return;
    router.push(`/features/prep/illustrations/${created.id}` as never);
  }, [illustrationsMap, categoryFilter, toast, h, router]);

  // Tanda 4 — append the tapped illustration's title + body to the pending
  // passage's `application` section (see INSERT_TARGET_SECTION above) and
  // return. Reads the CURRENT saved text first (savePrepNote overwrites a
  // whole section, it doesn't append) so this adds to whatever the preparer
  // already wrote rather than replacing it.
  const handleInsert = useCallback(
    async (item: PrepIllustration) => {
      const passageKey = params.insertPassageKey;
      if (!passageKey) return;
      haptics.tap();
      const existing = await getPrepNotes(passageKey);
      const pieces = [item.title.trim(), item.body.trim()].filter(Boolean);
      const addition = pieces.join('\n');
      const current = existing.sections[INSERT_TARGET_SECTION] ?? '';
      const next =
        current.trim().length > 0 ? `${current}\n\n${addition}` : addition;
      await savePrepNote(passageKey, INSERT_TARGET_SECTION, next);
      haptics.success();
      toast.success(h.insertedToast);
      router.back();
    },
    [params.insertPassageKey, toast, h.insertedToast, router],
  );

  const handleOpen = useCallback(
    (item: PrepIllustration) => {
      if (insertActive) {
        handleInsert(item);
        return;
      }
      haptics.tap();
      router.push(`/features/prep/illustrations/${item.id}` as never);
    },
    [insertActive, handleInsert, router],
  );

  const handleRequestDelete = useCallback((item: PrepIllustration) => {
    haptics.tap();
    setDeleteTarget(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deletePrepIllustration(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }, [deleteTarget, load]);

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
                onPress={handleCreate}
                accessibilityRole="button"
                accessibilityLabel={h.newIllustration}>
                <Ionicons name="add" size={24} color={staticColors.white} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="bulb" size={22} color={staticColors.white} />
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
              <Ionicons name="bulb-outline" size={36} color={colors.primary} />
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
            {insertActive && (
              <View style={centeredMaxWidth()}>
                <View
                  style={[
                    styles.insertBanner,
                    {
                      backgroundColor: colors.primary + '0F',
                      borderColor: colors.primary + '33',
                    },
                  ]}>
                  <Ionicons
                    name="arrow-undo-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.insertTextWrap}>
                    <Text style={[styles.insertTitle, {color: colors.text}]}>
                      {h.insertTitle.replace('{{passage}}', insertLabel)}
                    </Text>
                    <Text
                      style={[
                        styles.insertBody,
                        {color: colors.textSecondary},
                      ]}>
                      {h.insertBody}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setInsertDismissed(true)}
                    accessibilityRole="button"
                    accessibilityLabel={h.insertDismiss}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text
                      style={[styles.insertDismiss, {color: colors.primary}]}>
                      {h.insertDismiss}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={centeredMaxWidth()}>
              <View
                style={[
                  styles.searchRow,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={h.searchPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, {color: colors.text}]}
                  returnKeyType="search"
                  accessibilityLabel={h.searchPlaceholder}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    accessibilityRole="button"
                    accessibilityLabel={t.cancel}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroller}
                contentContainerStyle={styles.filterRow}>
                {(['all', ...ILLUSTRATION_CATEGORY_ORDER] as const).map(
                  value => {
                    const selected = categoryFilter === value;
                    const meta =
                      value === 'all'
                        ? null
                        : ILLUSTRATION_CATEGORY_META[value];
                    const label =
                      value === 'all' ? h.filterAll : h.categories[value];
                    // The 'all' chip has no fixed category accent, so its
                    // selected fill falls back to the theme-reactive
                    // `colors.primary` — unlike every other chip's fixed,
                    // theme-independent `meta.accent`. That fallback needs
                    // `colors.onPrimary` ink (dark-mode/amber `colors.primary`
                    // resolves to a LIGHT hue, where literal white would be
                    // low-contrast); the fixed accents stay safely white.
                    const selectedInk = meta
                      ? staticColors.white
                      : colors.onPrimary;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => {
                          haptics.tap();
                          setCategoryFilter(value);
                        }}
                        style={[
                          styles.chip,
                          {
                            borderColor: selected
                              ? (meta?.accent ?? colors.primary)
                              : colors.border,
                            backgroundColor: selected
                              ? (meta?.accent ?? colors.primary)
                              : colors.card,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        accessibilityLabel={label}>
                        {meta && (
                          <Ionicons
                            name={meta.icon as keyof typeof Ionicons.glyphMap}
                            size={13}
                            color={selected ? selectedInk : colors.text}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: selected ? selectedInk : colors.text,
                            },
                          ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </ScrollView>
            </View>

            <FlatList
              data={visible}
              keyExtractor={item => item.id}
              contentContainerStyle={[styles.listContent, centeredMaxWidth()]}
              renderItem={({item}) => {
                const meta = ILLUSTRATION_CATEGORY_META[item.category];
                const blank = isIllustrationEmpty(item.title, item.body);
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
                      onPress={() => handleOpen(item)}
                      accessibilityRole="button"
                      accessibilityLabel={blank ? h.untitled : item.title}
                      accessibilityHint={h.openHint}>
                      <View style={styles.rowTitleLine}>
                        <Text
                          style={[
                            styles.rowLabel,
                            {
                              color: blank
                                ? colors.textTertiary
                                : colors.primary,
                            },
                          ]}
                          numberOfLines={1}>
                          {blank ? h.untitled : item.title}
                        </Text>
                        <View
                          style={[
                            styles.categoryBadge,
                            {backgroundColor: meta.accent + '1a'},
                          ]}>
                          <Ionicons
                            name={meta.icon as keyof typeof Ionicons.glyphMap}
                            size={11}
                            color={meta.accent}
                          />
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              {color: meta.accent},
                            ]}
                            numberOfLines={1}>
                            {h.categories[item.category]}
                          </Text>
                        </View>
                      </View>
                      {item.body.length > 0 && (
                        <Text
                          style={[
                            styles.rowPreview,
                            {color: colors.textSecondary},
                          ]}
                          numberOfLines={2}>
                          {item.body}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rowActionButton}
                      onPress={() => handleRequestDelete(item)}
                      accessibilityRole="button"
                      accessibilityLabel={h.deleteLabel}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerState}>
                  <Ionicons
                    name={hasAny ? 'search-outline' : 'bulb-outline'}
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.stateTitle, {color: colors.text}]}>
                    {hasAny ? h.emptySearchTitle : h.emptyTitle}
                  </Text>
                  <Text
                    style={[styles.stateText, {color: colors.textSecondary}]}>
                    {hasAny ? h.emptySearchBody : h.emptyBody}
                  </Text>
                </View>
              }
            />
          </View>
        )}

        <ConfirmDialog
          visible={deleteTarget !== null}
          title={h.deleteConfirmTitle}
          message={h.deleteConfirmBody}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
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
  insertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  insertTextWrap: {flex: 1, gap: 2},
  insertTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  insertBody: {fontSize: fontSizes.xs, lineHeight: fontSizes.xs * 1.4},
  insertDismiss: {fontSize: fontSizes.xs, fontWeight: '700'},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {flex: 1, fontSize: fontSizes.md, paddingVertical: 0},
  filterScroller: {marginTop: spacing.sm},
  filterRow: {gap: spacing.xs, paddingVertical: spacing.xs},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipText: {fontSize: fontSizes.xs, fontWeight: '600'},
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
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowLabel: {fontWeight: '700', fontSize: fontSizes.md, flexShrink: 1},
  rowPreview: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.35},
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    maxWidth: 160,
  },
  categoryBadgeText: {fontSize: 10, fontWeight: '700'},
  rowActionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
