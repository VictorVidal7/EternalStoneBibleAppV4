/**
 * 🕊️ EDITOR DE MI TESTIMONIO — free-tier session editor ("Comparte tu fe"
 * Part 3).
 *
 * A guided-but-NOT-scripted writing surface: three structured prompts give
 * the writer STRUCTURE only ("¿Cómo era tu vida antes?" / "¿Qué cambió?" /
 * "¿Cómo es tu vida ahora?") — never a suggested sentence or example phrase.
 * See the [[faithTestimony]] module header for the full guardrail; this
 * screen never renders example wording anywhere, including placeholders
 * (each placeholder is the same neutral "Escribe aquí…" invitation, not a
 * sample answer).
 *
 * Autosaves shortly after typing stops (mirrors "Notas de sermón"'s editor),
 * and flushes any pending save on unmount so the Android hardware back
 * button never silently drops the last edit. "Compartir como imagen" hands
 * the writer's own composed text to the ALREADY-SHIPPED, ALREADY-FREE
 * [[TestimonyImageModal]] share pipeline — the exact same
 * captureRef → expo-sharing pipeline + free/premium template picker every
 * other share surface in this app already uses; nothing new is built for
 * sharing itself.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in THIS
 * screen (the reused `TestimonyImageModal` carries its own pre-existing
 * free-10/premium-9 template picker, same as every other share surface in
 * the app — that is shared infrastructure, not gating added by this
 * feature).
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
import {TestimonyImageModal} from '@components/insights/TestimonyImageModal';
import {
  getFaithTestimony,
  saveFaithTestimonySession,
  deleteFaithTestimonySession,
} from '@/features/study/faithTestimonyStore';
import {
  buildTestimonyText,
  formatTestimonyDateLabel,
  hasTestimonyContent,
  type FaithTestimonySession,
} from '@/features/study/faithTestimony';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready' | 'notFound';

export default function FaithTestimonyEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const h = t.shareFaith.testimony;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{id?: string}>();
  const id = params.id ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<FaithTestimonySession | null>(null);
  const [title, setTitle] = useState('');
  const [before, setBefore] = useState('');
  const [change, setChange] = useState('');
  const [now, setNow] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Loaded ONCE per id — not on every focus, same guard as the sermon-notes
  // editor (re-focusing this screen must never refetch over in-flight,
  // not-yet-flushed local edits).
  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setStatus('notFound');
      return;
    }
    (async () => {
      const found = await getFaithTestimony(id);
      if (cancelled) return;
      if (found) {
        setSession(found);
        setTitle(found.title);
        setBefore(found.before);
        setChange(found.change);
        setNow(found.now);
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
    saveFaithTestimonySession(id, {title: value});
  }, 700);
  const debouncedSaveBefore = useDebouncedCallback((value: string) => {
    saveFaithTestimonySession(id, {before: value});
  }, 700);
  const debouncedSaveChange = useDebouncedCallback((value: string) => {
    saveFaithTestimonySession(id, {change: value});
  }, 700);
  const debouncedSaveNow = useDebouncedCallback((value: string) => {
    saveFaithTestimonySession(id, {now: value});
  }, 700);

  // Flush any pending saves on unmount — same Android
  // back-button-skips-onBlur race the sermon-notes editor guards against.
  useEffect(
    () => () => {
      debouncedSaveTitle.flush();
      debouncedSaveBefore.flush();
      debouncedSaveChange.flush();
      debouncedSaveNow.flush();
    },
    [
      debouncedSaveTitle,
      debouncedSaveBefore,
      debouncedSaveChange,
      debouncedSaveNow,
    ],
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      debouncedSaveTitle(value);
    },
    [debouncedSaveTitle],
  );
  const handleBeforeChange = useCallback(
    (value: string) => {
      setBefore(value);
      debouncedSaveBefore(value);
    },
    [debouncedSaveBefore],
  );
  const handleChangeChange = useCallback(
    (value: string) => {
      setChange(value);
      debouncedSaveChange(value);
    },
    [debouncedSaveChange],
  );
  const handleNowChange = useCallback(
    (value: string) => {
      setNow(value);
      debouncedSaveNow(value);
    },
    [debouncedSaveNow],
  );

  const draftSession: FaithTestimonySession | null = useMemo(() => {
    if (!session) return null;
    return {...session, title, before, change, now};
  }, [session, title, before, change, now]);

  const canShare = draftSession ? hasTestimonyContent(draftSession) : false;
  const testimonyText = draftSession ? buildTestimonyText(draftSession) : '';
  const dateLine = session
    ? h.dateLine.replace(
        '{{date}}',
        formatTestimonyDateLabel(session.createdAt, bookLang),
      )
    : '';

  const handleShare = useCallback(() => {
    if (!canShare) return;
    haptics.tap();
    setShareOpen(true);
  }, [canShare]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteFaithTestimonySession(id);
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
                  style={[
                    styles.headerButton,
                    !canShare && styles.headerButtonDisabled,
                  ]}
                  onPress={handleShare}
                  disabled={!canShare}
                  accessibilityRole="button"
                  accessibilityLabel={h.shareButton}
                  accessibilityState={{disabled: !canShare}}>
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

            <Text style={[styles.structureHint, {color: colors.textTertiary}]}>
              {h.structureHint}
            </Text>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, {color: colors.text}]}>
                {h.beforeLabel}
              </Text>
              <TextInput
                value={before}
                onChangeText={handleBeforeChange}
                placeholder={h.beforePlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.sectionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                multiline
                textAlignVertical="top"
                maxLength={6000}
                accessibilityLabel={h.beforeLabel}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, {color: colors.text}]}>
                {h.changeLabel}
              </Text>
              <TextInput
                value={change}
                onChangeText={handleChangeChange}
                placeholder={h.changePlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.sectionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                multiline
                textAlignVertical="top"
                maxLength={6000}
                accessibilityLabel={h.changeLabel}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, {color: colors.text}]}>
                {h.nowLabel}
              </Text>
              <TextInput
                value={now}
                onChangeText={handleNowChange}
                placeholder={h.nowPlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.sectionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                multiline
                textAlignVertical="top"
                maxLength={6000}
                accessibilityLabel={h.nowLabel}
              />
            </View>

            {!canShare && (
              <Text style={[styles.shareHint, {color: colors.textTertiary}]}>
                {h.shareEmptyHint}
              </Text>
            )}
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

        <TestimonyImageModal
          visible={shareOpen}
          title={title.trim() || h.untitled}
          testimony={testimonyText || undefined}
          answeredLine={dateLine}
          onClose={() => setShareOpen(false)}
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
  headerButtonDisabled: {opacity: 0.5},
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
  structureHint: {
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  section: {marginTop: spacing.md, gap: spacing.xs},
  sectionLabel: {fontSize: fontSizes.md, fontWeight: '700'},
  sectionInput: {
    minHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  shareHint: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
