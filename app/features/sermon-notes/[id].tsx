/**
 * 📝 EDITOR DE NOTAS DE SERMÓN — free-tier session editor.
 *
 * One free-flowing writing surface for a single sermon: a title, an optional
 * church/preacher note, and a body of prose the listener types WHILE the
 * pastor preaches. Any Bible reference typed inline (e.g. "como dice Juan
 * 3:16") is recognized live via [[getReferencedVerses]] (the same
 * `linkifyReferences` recognizer used elsewhere in the app) and shown as a
 * tappable chip — nothing about that detection is ever stored separately
 * from the prose itself. A small "insert a reference" control resolves what
 * the listener types (via `parseReference`) into a canonical, localized
 * label appended to the body, so a reference the pastor reads aloud can be
 * dropped in without retyping the book name correctly.
 *
 * Autosaves shortly after typing stops (mirrors the premium "Mesa de
 * preparación" screen's per-section debounce), and flushes any pending save
 * on unmount so the Android hardware back button — which dismisses the
 * keyboard WITHOUT firing onBlur — never silently drops the last edit.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow. Export is Markdown-only via the native share sheet; PDF/multi-format
 * export stays exclusive to the premium prep table.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Share,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDebouncedCallback} from 'use-debounce';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {getBookByName} from '@/constants/bible';
import {
  getSermonNote,
  saveSermonNoteSession,
  deleteSermonNoteSession,
} from '@/features/study/sermonNotesStore';
import {
  formatReferenceForInsert,
  formatReferencedVerseLabel,
  formatSessionDateLabel,
  getReferencedVerses,
  insertReferenceText,
  type ReferencedVerse,
  type SermonNoteSession,
} from '@/features/study/sermonNotes';
import {buildSermonNoteMarkdown} from '@/features/study/sermonNotesMarkdown';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready' | 'notFound';

export default function SermonNoteEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const h = t.sermonNotes;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{id?: string}>();
  const id = params.id ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<SermonNoteSession | null>(null);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [insertDraft, setInsertDraft] = useState('');
  const [insertError, setInsertError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Loaded ONCE per id — not on every focus. Re-focusing this screen (e.g.
  // after tapping a referenced-verse chip and coming back) must never
  // refetch over in-flight, not-yet-flushed local edits.
  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setStatus('notFound');
      return;
    }
    (async () => {
      const found = await getSermonNote(id);
      if (cancelled) return;
      if (found) {
        setSession(found);
        setTitle(found.title);
        setSource(found.source ?? '');
        setBodyText(found.bodyText);
        setStatus('ready');
      } else {
        setStatus('notFound');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    saveSermonNoteSession(id, {title: value});
  }, 700);
  const debouncedSaveSource = useDebouncedCallback((value: string) => {
    saveSermonNoteSession(id, {source: value});
  }, 700);
  const debouncedSaveBody = useDebouncedCallback((value: string) => {
    saveSermonNoteSession(id, {bodyText: value});
  }, 700);

  // Flush any pending saves on unmount — the same Android
  // back-button-skips-onBlur race the premium prep table's autosave guards
  // against (see its debouncedSaveNote).
  useEffect(
    () => () => {
      debouncedSaveTitle.flush();
      debouncedSaveSource.flush();
      debouncedSaveBody.flush();
    },
    [debouncedSaveTitle, debouncedSaveSource, debouncedSaveBody],
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      debouncedSaveTitle(value);
    },
    [debouncedSaveTitle],
  );
  const handleSourceChange = useCallback(
    (value: string) => {
      setSource(value);
      debouncedSaveSource(value);
    },
    [debouncedSaveSource],
  );
  const handleBodyChange = useCallback(
    (value: string) => {
      setBodyText(value);
      debouncedSaveBody(value);
    },
    [debouncedSaveBody],
  );

  const referencedVerses = useMemo(
    () => getReferencedVerses(bodyText),
    [bodyText],
  );

  const handleInsertReference = useCallback(() => {
    const formatted = formatReferenceForInsert(insertDraft, bookLang);
    if (!formatted) {
      setInsertError(h.insertReferenceInvalid);
      return;
    }
    haptics.tap();
    const next = insertReferenceText(bodyText, formatted);
    setBodyText(next);
    // Same debounced path as typing — a later, still-pending typing save
    // would otherwise overwrite this insert with stale text; routing both
    // through ONE debounced callback means only the latest value is ever
    // written.
    debouncedSaveBody(next);
    setInsertDraft('');
    setInsertError('');
  }, [
    insertDraft,
    bookLang,
    bodyText,
    debouncedSaveBody,
    h.insertReferenceInvalid,
  ]);

  const handleOpenVerse = useCallback(
    (rv: ReferencedVerse) => {
      const book = getBookByName(rv.bookNameEn);
      if (!book) return;
      haptics.tap();
      const bookDisplay = bookLang === 'es' ? book.name : book.nameEn;
      if (rv.verse === undefined) {
        router.push(`/verse/${bookDisplay}/${rv.chapter}` as never);
      } else {
        router.push(
          `/verse/${bookDisplay}/${rv.chapter}?verse=${rv.verse}` as never,
        );
      }
    },
    [bookLang, router],
  );

  const handleExport = useCallback(() => {
    if (!session) return;
    haptics.tap();
    const labels = referencedVerses.map(rv =>
      formatReferencedVerseLabel(rv, bookLang),
    );
    const markdown = buildSermonNoteMarkdown({
      title: title.trim() || h.untitled,
      source: source.trim() || undefined,
      dateLabel: formatSessionDateLabel(session.createdAt, bookLang),
      bodyText,
      referencedVerseLabels: labels,
      referencedVersesLabel: h.referencedVersesTitle,
      generatedWith: h.generatedWith,
    });
    Share.share({message: markdown}).catch(() => undefined);
  }, [session, referencedVerses, bookLang, title, source, bodyText, h]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteSermonNoteSession(id);
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
              style={styles.headerButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            {status === 'ready' && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleExport}
                  accessibilityRole="button"
                  accessibilityLabel={h.exportLabel}>
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
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
          <AppText scaleRole="compact" style={styles.headerLabel}>
            {h.title}
          </AppText>
        </LinearGradient>

        {status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : status === 'notFound' ? (
          <View style={styles.centerState}>
            <Ionicons
              name="create-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {h.notFound}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, centeredMaxWidth()]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextInput
              value={title}
              onChangeText={handleTitleChange}
              placeholder={h.titlePlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.titleInput, {color: colors.text}]}
              maxLength={100}
              accessibilityLabel={h.titlePlaceholder}
            />
            <TextInput
              value={source}
              onChangeText={handleSourceChange}
              placeholder={h.sourcePlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.sourceInput, {color: colors.textSecondary}]}
              maxLength={100}
              accessibilityLabel={h.sourcePlaceholder}
            />

            <View
              style={[styles.insertRow, {borderColor: colors.border}]}
              accessibilityLabel={h.insertReferenceLabel}>
              <TextInput
                value={insertDraft}
                onChangeText={value => {
                  setInsertDraft(value);
                  if (insertError) setInsertError('');
                }}
                placeholder={h.insertReferencePlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.insertInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                returnKeyType="done"
                onSubmitEditing={handleInsertReference}
                accessibilityLabel={h.insertReferencePlaceholder}
              />
              <TouchableOpacity
                style={[
                  styles.insertButton,
                  {backgroundColor: colors.primary},
                  !insertDraft.trim() && styles.insertButtonDisabled,
                ]}
                onPress={handleInsertReference}
                accessibilityRole="button"
                accessibilityState={{disabled: !insertDraft.trim()}}
                accessibilityLabel={h.insertReferenceButton}>
                <Ionicons name="add" size={20} color={staticColors.white} />
              </TouchableOpacity>
            </View>
            {insertError.length > 0 && (
              <Text style={[styles.insertErrorText, {color: colors.error}]}>
                {insertError}
              </Text>
            )}

            <View style={styles.chipsSection}>
              <Text
                style={[styles.chipsTitle, {color: colors.text}]}
                accessibilityRole="header">
                {h.referencedVersesTitle}
              </Text>
              {referencedVerses.length === 0 ? (
                <Text style={[styles.chipsHint, {color: colors.textTertiary}]}>
                  {h.referencedVersesHint}
                </Text>
              ) : (
                <View style={styles.chipsWrap}>
                  {referencedVerses.map(rv => (
                    <TouchableOpacity
                      key={rv.key}
                      style={[
                        styles.chip,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '14',
                        },
                      ]}
                      onPress={() => handleOpenVerse(rv)}
                      accessibilityRole="button"
                      accessibilityLabel={formatReferencedVerseLabel(
                        rv,
                        bookLang,
                      )}
                      accessibilityHint={h.openVerseHint}>
                      <Ionicons
                        name="book-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={[styles.chipText, {color: colors.primary}]}>
                        {formatReferencedVerseLabel(rv, bookLang)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              value={bodyText}
              onChangeText={handleBodyChange}
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
              maxLength={20000}
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
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {flexDirection: 'row', gap: spacing.xs},
  headerLabel: {
    color: staticColors.white,
    opacity: 0.85,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  titleInput: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    paddingVertical: spacing.xs,
  },
  sourceInput: {
    fontSize: fontSizes.sm,
    paddingBottom: spacing.sm,
  },
  insertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  insertInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
  },
  insertButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insertButtonDisabled: {opacity: 0.5},
  insertErrorText: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  chipsSection: {marginTop: spacing.md, gap: spacing.xs},
  chipsTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  chipsHint: {fontSize: fontSizes.xs},
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {fontSize: fontSizes.xs, fontWeight: '600'},
  bodyInput: {
    minHeight: 260,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: spacing.md,
  },
});
