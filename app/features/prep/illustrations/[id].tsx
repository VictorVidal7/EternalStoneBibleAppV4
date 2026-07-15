/**
 * 💡 EDITAR ILUSTRACIÓN — Tanda 4, a slice of the premium pastors/teachers
 * "Mesa de preparación" track.
 *
 * One saved illustration's editor: a title field, ONE of the 7 fixed
 * categories ([[prepIllustrations]]'s `ILLUSTRATION_CATEGORY_ORDER`), and a
 * body textarea for the illustration/quote/anecdote itself, in the
 * preacher's own words. Title/body autosave shortly after typing stops (same
 * debounce idiom as the single-passage Mesa de preparación's
 * `debouncedSaveNote`), with `onBlur` as a redundant safety net for the
 * common case where it fires; the category chip saves immediately on tap
 * (nothing to debounce there). Flushing on unmount closes the same "type,
 * then back out fast" gap `prep/index.tsx` guards against.
 *
 * A freshly created illustration starts BLANK ([[prepIllustrations]]'s
 * `createIllustration`) — if the preacher backs out having typed nothing at
 * all (or clears everything back to blank), this screen quietly deletes the
 * empty row on the way out so the bank never accumulates abandoned entries.
 * An explicit "delete" action in the header removes a real, filled-in
 * illustration outright.
 *
 * FOUNDATION ONLY (Tanda 4): standalone editor. Inserting this illustration
 * into the passage currently being prepared is a LATER step — nothing here
 * reads or writes that flow.
 *
 * PURE editing of material the preacher wrote themselves — nothing here
 * generates or suggests content, so the app's guardrail (the app never
 * writes the sermon, cf. Jeremías 23:30-32) isn't at stake in this screen.
 *
 * Premium-gated independently of the list screen (defense in depth against a
 * direct deep link) — a free reader sees the same quiet locked teaser.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
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
import {useDebouncedCallback} from 'use-debounce';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {
  deletePrepIllustration,
  getPrepIllustration,
  savePrepIllustrationBody,
  savePrepIllustrationCategory,
  savePrepIllustrationTitle,
} from '@/features/study/prepIllustrationsStore';
import {
  ILLUSTRATION_CATEGORY_META,
  ILLUSTRATION_CATEGORY_ORDER,
  isIllustrationEmpty,
  type IllustrationCategory,
} from '@/features/study/prepIllustrations';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready' | 'notFound';

export default function PrepIllustrationEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const h = t.prepIllustrations;

  const params = useLocalSearchParams<{id?: string}>();
  const id = params.id ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<IllustrationCategory>('analogy');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // True once a REAL (found) illustration has been loaded for this id — the
  // empty-on-exit cleanup below must never fire against a not-yet-loaded or
  // not-found record.
  const loadedRef = useRef(false);
  // Mirror title/body into refs, updated on every keystroke (see
  // handleTitleChange/handleBodyChange below). The unmount cleanup effect is
  // set up once (dep `[id]` only) so its closure over the `title`/`body`
  // STATE would otherwise see whatever they were at mount time, not the
  // latest typed value — these refs are how it reads the current value
  // without re-subscribing the effect on every keystroke.
  const titleRef = useRef('');
  const bodyRef = useRef('');

  const load = useCallback(async () => {
    if (!id) {
      setStatus('notFound');
      return;
    }
    const found = await getPrepIllustration(id);
    if (!found) {
      setStatus('notFound');
      return;
    }
    setTitle(found.title);
    setBody(found.body);
    setCategory(found.category);
    titleRef.current = found.title;
    bodyRef.current = found.body;
    loadedRef.current = true;
    setStatus('ready');
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return;
      load();
    }, [isPremium, load]),
  );

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  // Autosave title/body shortly after typing stops — same idiom as
  // prep/index.tsx's debouncedSaveNote for the single-passage Mesa de
  // preparación.
  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    if (!id) return;
    savePrepIllustrationTitle(id, value);
  }, 700);
  const debouncedSaveBody = useDebouncedCallback((value: string) => {
    if (!id) return;
    savePrepIllustrationBody(id, value);
  }, 700);

  // Flush any pending debounced save on unmount (the exact "type, back,
  // back" gap prep/index.tsx's own flush-on-unmount guards against), then —
  // ONLY for a record that was actually loaded — quietly delete it if it's
  // still fully blank, so a "+" tapped and abandoned never litters the bank.
  useEffect(
    () => () => {
      debouncedSaveTitle.flush();
      debouncedSaveBody.flush();
      if (
        loadedRef.current &&
        id &&
        isIllustrationEmpty(titleRef.current, bodyRef.current)
      ) {
        deletePrepIllustration(id);
      }
    },
    [id, debouncedSaveTitle, debouncedSaveBody],
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      titleRef.current = value;
      debouncedSaveTitle(value);
    },
    [debouncedSaveTitle],
  );

  const handleTitleBlur = useCallback(() => {
    if (!id) return;
    savePrepIllustrationTitle(id, title);
  }, [id, title]);

  const handleBodyChange = useCallback(
    (value: string) => {
      setBody(value);
      bodyRef.current = value;
      debouncedSaveBody(value);
    },
    [debouncedSaveBody],
  );

  const handleBodyBlur = useCallback(() => {
    if (!id) return;
    savePrepIllustrationBody(id, body);
  }, [id, body]);

  // The category chip saves immediately — nothing to debounce for a single
  // discrete pick.
  const handleCategoryPick = useCallback(
    (next: IllustrationCategory) => {
      haptics.tap();
      setCategory(next);
      if (!id) return;
      savePrepIllustrationCategory(id, next);
    },
    [id],
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    loadedRef.current = false; // the unmount cleanup should not race this explicit delete
    await deletePrepIllustration(id);
    setDeleteConfirmOpen(false);
    router.back();
  }, [id, router]);

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
            {isPremium && status === 'ready' && (
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
            )}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="bulb" size={22} color={staticColors.white} />
            </View>
            <AppText
              scaleRole="display"
              style={styles.headerTitle}
              numberOfLines={2}>
              {title.trim().length > 0 ? title : h.untitled}
            </AppText>
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
        ) : status === 'notFound' ? (
          <View style={styles.centerState}>
            <Ionicons
              name="bulb-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {h.notFound}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              centeredMaxWidth(),
              {paddingBottom: insets.bottom + spacing.xl},
            ]}
            keyboardShouldPersistTaps="handled">
            <TextInput
              value={title}
              onChangeText={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder={h.titlePlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.titleInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              maxLength={120}
              returnKeyType="done"
              accessibilityLabel={h.titlePlaceholder}
            />

            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
              {h.categoryLabel}
            </Text>
            <View style={styles.categoryWrap}>
              {ILLUSTRATION_CATEGORY_ORDER.map(c => {
                const selected = category === c;
                const meta = ILLUSTRATION_CATEGORY_META[c];
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => handleCategoryPick(c)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? meta.accent : colors.border,
                        backgroundColor: selected ? meta.accent : colors.card,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    accessibilityLabel={h.categories[c]}>
                    <Ionicons
                      name={meta.icon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={selected ? staticColors.white : colors.text}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        {color: selected ? staticColors.white : colors.text},
                      ]}>
                      {h.categories[c]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={body}
              onChangeText={handleBodyChange}
              onBlur={handleBodyBlur}
              placeholder={h.bodyPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.bodyInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              multiline
              textAlignVertical="top"
              maxLength={4000}
              accessibilityLabel={h.bodyPlaceholder}
            />
          </ScrollView>
        )}

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
  headerTitle: {
    flex: 1,
    color: staticColors.white,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
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
  content: {padding: spacing.lg, flexGrow: 1},
  titleInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
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
  bodyInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.4,
    minHeight: 220,
  },
});
