/**
 * 🎨 MY HIGHLIGHTS SCREEN
 *
 * Lists every verse the user has highlighted. Highlights can be filtered by
 * colour, opened in the reader, given a note and a category, or removed.
 */

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import {useCallback, useMemo, useState} from 'react';
import {useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useServices} from '@context/ServicesContext';
import {useToast} from '@context/ToastContext';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {Highlight, HighlightCategory, HighlightColor} from '@lib/highlights';
import {
  groupHighlightsByColor,
  highlightGalleryStats,
  searchHighlights,
} from '@lib/highlights/highlightGallery';
import {HighlightsImageModal} from '@components/insights/HighlightsImageModal';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {logger} from '@lib/utils/logger';
import {getSyncEngine} from '@lib/sync';
import {buildHighlightRemotePayload} from '@lib/sync/adapters/highlights';

interface HighlightItem extends Highlight {
  text: string;
  bookName: string;
}

/** A FlatList row: either a color-group header or a highlight (Sprint 86). */
type HighlightRow =
  | {kind: 'group'; color: HighlightColor; count: number}
  | {kind: 'item'; item: HighlightItem};

const CATEGORY_KEYS: HighlightCategory[] = Object.values(HighlightCategory);

export default function HighlightsScreen() {
  const router = useRouter();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {highlightService} = useServices();
  const toast = useToast();

  const [items, setItems] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<HighlightCategory | null>(null);
  const [editing, setEditing] = useState<HighlightItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HighlightItem | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState<
    HighlightCategory | undefined
  >(undefined);
  const [query, setQuery] = useState('');
  const [grouped, setGrouped] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  const load = useCallback(async () => {
    if (!highlightService) {
      setLoading(false);
      return;
    }
    try {
      const highlights = await highlightService.getAllHighlights();
      const resolved: HighlightItem[] = [];
      for (const h of highlights) {
        const book = getBookByName(h.bookId);
        let text = '';
        if (book) {
          const v = await bibleDB
            .getVerse(book.id, h.chapter, h.verse, selectedVersion.id)
            .catch(() => null);
          text = v?.text ?? '';
        }
        const bookName = book
          ? selectedVersion.language === 'es'
            ? book.name
            : book.nameEn
          : h.bookId;
        resolved.push({...h, text, bookName});
      }
      setItems(resolved);
    } catch (err) {
      logger.error('Error loading highlights', err as Error, {
        component: 'HighlightsScreen',
      });
    } finally {
      setLoading(false);
    }
  }, [highlightService, selectedVersion.id, selectedVersion.language]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const usedColors = Array.from(new Set(items.map(i => i.color)));
  // Categories actually present on the user's highlights, in enum order.
  const usedCategories = CATEGORY_KEYS.filter(cat =>
    items.some(i => i.category === cat),
  );

  // color/category chips → text search → optional group-by-color (Sprint 86).
  const filtered = useMemo(
    () =>
      items.filter(
        i =>
          (!colorFilter || i.color === colorFilter) &&
          (!categoryFilter || i.category === categoryFilter),
      ),
    [items, colorFilter, categoryFilter],
  );
  const searched = useMemo(
    () =>
      searchHighlights(
        filtered,
        query,
        i => `${i.bookName} ${i.chapter}:${i.verse} ${i.text} ${i.note ?? ''}`,
      ),
    [filtered, query],
  );
  const galleryStats = useMemo(() => highlightGalleryStats(items), [items]);
  // Flatten into one FlatList: in grouped mode, a color-header row precedes
  // each color's highlights; otherwise just the highlights.
  const rows = useMemo<HighlightRow[]>(() => {
    if (!grouped) return searched.map(item => ({kind: 'item', item}));
    return groupHighlightsByColor(searched).flatMap(g => [
      {kind: 'group' as const, color: g.color, count: g.count},
      ...g.items.map(item => ({kind: 'item' as const, item})),
    ]);
  }, [grouped, searched]);

  function handleDelete(item: HighlightItem) {
    setDeleteTarget(item);
  }

  async function confirmDelete() {
    const item = deleteTarget;
    if (!item || !highlightService) return;
    await highlightService.removeHighlight(item.verseId);
    setItems(prev => prev.filter(i => i.verseId !== item.verseId));
    getSyncEngine()?.queueDelete(
      'highlights',
      item.verseId,
      buildHighlightRemotePayload(item),
    );
    toast.success(t.highlights.removed);
    setDeleteTarget(null);
  }

  function openEditor(item: HighlightItem) {
    setEditing(item);
    setNoteDraft(item.note ?? '');
    setCategoryDraft(item.category);
  }

  async function saveEditor() {
    if (!highlightService || !editing) return;
    const note = noteDraft.trim();
    await highlightService.updateHighlight(editing.verseId, {
      note: note || undefined,
      category: categoryDraft,
    });
    const updated = {
      ...editing,
      note: note || undefined,
      category: categoryDraft,
      updatedAt: Date.now(),
    };
    setItems(prev =>
      prev.map(i => (i.verseId === editing.verseId ? updated : i)),
    );
    getSyncEngine()?.queueWrite(
      'highlights',
      editing.verseId,
      buildHighlightRemotePayload(updated),
    );
    setEditing(null);
    toast.success(t.highlights.saved);
  }

  function goToVerse(item: HighlightItem) {
    router.push(
      `/verse/${item.bookId}/${item.chapter}?verse=${item.verse}` as never,
    );
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
            <Ionicons name="color-palette" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.highlights.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {(items.length === 1
                ? t.highlights.countSingular
                : t.highlights.count
              ).replace('{{count}}', String(items.length))}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Colour filter */}
      {usedColors.length > 0 && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setColorFilter(null)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: !colorFilter
                    ? colors.primary
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: !colorFilter
                      ? colors.onPrimary
                      : colors.textSecondary,
                  },
                ]}>
                {t.highlights.all}
              </Text>
            </TouchableOpacity>
            {usedColors.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColorFilter(c === colorFilter ? null : c)}
                style={[
                  styles.filterSwatch,
                  {
                    backgroundColor: c,
                    borderColor:
                      c === colorFilter
                        ? colors.primary
                        : staticColors.transparent,
                  },
                ]}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category filter */}
      {usedCategories.length > 0 && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setCategoryFilter(null)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: !categoryFilter
                    ? colors.primary
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: !categoryFilter
                      ? colors.onPrimary
                      : colors.textSecondary,
                  },
                ]}>
                {t.highlights.all}
              </Text>
            </TouchableOpacity>
            {usedCategories.map(cat => {
              const active = cat === categoryFilter;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategoryFilter(active ? null : cat)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: active ? colors.onPrimary : colors.textSecondary,
                      },
                    ]}>
                    {t.highlights.categories[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search + gallery toolbar (Sprint 86) */}
      {items.length > 0 && (
        <>
          <View style={[styles.searchRow, {borderColor: colors.border}]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.highlights.searchPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, {color: colors.text}]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t.cancel}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              onPress={() => setGrouped(g => !g)}
              accessibilityRole="button"
              accessibilityState={{selected: grouped}}
              accessibilityLabel={t.highlights.groupByColor}
              style={[
                styles.toolbarChip,
                {
                  backgroundColor: grouped ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Ionicons
                name={grouped ? 'apps' : 'list'}
                size={15}
                color={grouped ? colors.onPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toolbarChipText,
                  {color: grouped ? colors.onPrimary : colors.textSecondary},
                ]}>
                {grouped ? t.highlights.groupByColor : t.highlights.listView}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShareVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t.highlights.galleryShare}
              style={[
                styles.toolbarChip,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <Ionicons
                name="share-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.toolbarChipText, {color: colors.textSecondary}]}>
                {t.share}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={row =>
            row.kind === 'group' ? `g-${row.color}` : row.item.id
          }
          contentContainerStyle={styles.listContent}
          renderItem={({item: row}) => {
            if (row.kind === 'group') {
              return (
                <View style={styles.groupHeader}>
                  <View
                    style={[styles.groupSwatch, {backgroundColor: row.color}]}
                  />
                  <Text
                    style={[styles.groupCount, {color: colors.textSecondary}]}>
                    {row.count}
                  </Text>
                </View>
              );
            }
            const item = row.item;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => goToVerse(item)}
                style={[styles.row, {backgroundColor: colors.surface}]}>
                <View
                  style={[styles.colorStripe, {backgroundColor: item.color}]}
                />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowRef, {color: colors.primary}]}>
                    {item.bookName} {item.chapter}:{item.verse}
                  </Text>
                  <Text
                    style={[styles.rowText, {color: colors.text}]}
                    numberOfLines={2}>
                    {item.text}
                  </Text>
                  {!!item.note && (
                    <View style={styles.noteRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[styles.noteText, {color: colors.textSecondary}]}
                        numberOfLines={2}>
                        {item.note}
                      </Text>
                    </View>
                  )}
                  {!!item.category && (
                    <View
                      style={[
                        styles.categoryChip,
                        // Fondo teñido (primary translúcido): legible en cualquier
                        // tema, claro u oscuro — primaryLight es siempre claro y
                        // dejaba el texto ilegible en modo oscuro.
                        {backgroundColor: colors.primary + '22'},
                      ]}>
                      <Text
                        style={[styles.categoryText, {color: colors.primary}]}>
                        {t.highlights.categories[item.category]}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openEditor(item)}
                    accessibilityRole="button"
                    accessibilityLabel={t.edit}>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel={t.delete}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons
                name={
                  items.length > 0 ? 'funnel-outline' : 'color-palette-outline'
                }
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {items.length > 0 ? t.highlights.noMatch : t.highlights.empty}
              </Text>
              {items.length === 0 && (
                <Text style={[styles.emptyHint, {color: colors.textSecondary}]}>
                  {t.highlights.emptyHint}
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Edit modal */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardSolid,
                borderTopColor: colors.border,
              },
            ]}
            {...focusTrapProps()}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              {editing?.bookName} {editing?.chapter}:{editing?.verse}
            </Text>
            <Text
              style={[styles.modalVerse, {color: colors.textSecondary}]}
              numberOfLines={3}>
              {editing?.text}
            </Text>

            <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>
              {t.notes.note}
            </Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder={t.highlights.notePlaceholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.noteInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>
              {t.highlights.category}
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_KEYS.map(cat => {
                const active = categoryDraft === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategoryDraft(active ? undefined : cat)}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterChipTextSmall,
                        {
                          color: active
                            ? colors.onPrimary
                            : colors.textSecondary,
                        },
                      ]}>
                      {t.highlights.categories[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, {borderColor: colors.border}]}
                onPress={() => setEditing(null)}>
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
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={saveEditor}>
                <Text
                  style={[
                    styles.modalButtonTextSave,
                    {color: colors.onPrimary},
                  ]}>
                  {t.highlights.save}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share my highlights gallery (Sprint 86) */}
      <HighlightsImageModal
        visible={shareVisible}
        stats={galleryStats}
        onClose={() => setShareVisible(false)}
      />

      {/* Themed delete confirm (UX audit, replaces native Alert.alert) */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={t.highlights.deleteTitle}
        message={t.highlights.deleteMessage}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {flex: 1, fontSize: 15, paddingVertical: 0},
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  toolbarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  toolbarChipText: {fontWeight: '700', fontSize: 13},
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  groupSwatch: {width: 18, height: 18, borderRadius: 9},
  groupCount: {fontSize: 13, fontWeight: '700'},
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {flexDirection: 'row', alignItems: 'center'},
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: staticColors.glassWhite30,
  },
  headerTextContainer: {flex: 1},
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: staticColors.glassWhite90,
    fontWeight: '500',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterChipText: {fontWeight: '600', fontSize: 13},
  filterChipTextSmall: {fontWeight: '600', fontSize: 12},
  modalButtonText: {fontWeight: '600'},
  modalButtonTextSave: {fontWeight: '700'},
  filterSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    marginRight: 8,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', marginTop: 12},
  emptyHint: {fontSize: 14, textAlign: 'center', paddingHorizontal: 40},
  listContent: {padding: 16, paddingBottom: 110, ...centeredMaxWidth()},
  row: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  colorStripe: {width: 6},
  rowContent: {flex: 1, padding: 14},
  rowRef: {fontSize: 15, fontWeight: '700', marginBottom: 4},
  rowText: {fontSize: 14, lineHeight: 20},
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  noteText: {fontSize: 13, fontStyle: 'italic', flex: 1},
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  categoryText: {fontSize: 11, fontWeight: '700'},
  rowActions: {justifyContent: 'center', paddingRight: 6},
  iconButton: {padding: 8},
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalVerse: {fontSize: 14, fontStyle: 'italic', marginTop: 6},
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  noteInput: {
    minHeight: 70,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalActions: {flexDirection: 'row', gap: 12, marginTop: 24},
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
