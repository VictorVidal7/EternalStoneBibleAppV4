/**
 * 📝 NOTAS DE SERMÓN — free-tier list screen.
 *
 * Lists every sermon note-taking session the reader has started
 * (device-local, from [[sermonNotesStore]]), most-recently-updated first,
 * each with its verse count (derived live from its prose via
 * [[getReferencedVerses]] — nothing extra is stored). Tapping "+" creates a
 * new session immediately (default title = today's date, editable right
 * away in the editor) rather than opening a naming modal first — unlike the
 * premium "Series de predicación" planner, a session doesn't need a
 * meaningful name up front; the whole point is to start capturing notes the
 * instant the pastor begins.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow, unlike the premium prep tools this screen's shape was inspired by.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useFocusEffect, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {useToast} from '@context/ToastContext';
import {AppText} from '@components/ui/AppText';
import {
  getAllSermonNotes,
  createSermonNoteSession,
} from '@/features/study/sermonNotesStore';
import {
  canCreateSession,
  defaultSessionTitle,
  formatSessionDateLabel,
  getReferencedVerses,
  listSessions,
  type SermonNoteSession,
  type SermonNotesMap,
} from '@/features/study/sermonNotes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready';

export default function SermonNotesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();
  const h = t.sermonNotes;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const [status, setStatus] = useState<Status>('loading');
  const [sessionsMap, setSessionsMap] = useState<SermonNotesMap>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const map = await getAllSermonNotes();
    setSessionsMap(map);
    setStatus('ready');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sessions = useMemo(() => listSessions(sessionsMap), [sessionsMap]);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    haptics.tap();
    if (!canCreateSession(sessionsMap)) {
      toast.warning(`${h.limitReachedTitle}. ${h.limitReachedBody}`);
      return;
    }
    setCreating(true);
    try {
      const created = await createSermonNoteSession(
        defaultSessionTitle(Date.now(), bookLang),
      );
      if (!created) return;
      router.push(`/features/sermon-notes/${created.id}` as never);
    } finally {
      setCreating(false);
    }
  }, [
    creating,
    sessionsMap,
    toast,
    h.limitReachedTitle,
    h.limitReachedBody,
    bookLang,
    router,
  ]);

  const handleOpen = useCallback(
    (session: SermonNoteSession) => {
      haptics.tap();
      router.push(`/features/sermon-notes/${session.id}` as never);
    },
    [router],
  );

  const verseCountLabel = useCallback(
    (n: number) => {
      if (n === 0) return h.verseCountNone;
      if (n === 1) return h.verseCountOne;
      return h.verseCount.replace('{{n}}', String(n));
    },
    [h.verseCountNone, h.verseCountOne, h.verseCount],
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreate}
              disabled={creating}
              accessibilityRole="button"
              accessibilityLabel={h.newSession}>
              {creating ? (
                <ActivityIndicator size="small" color={staticColors.white} />
              ) : (
                <Ionicons name="add" size={24} color={staticColors.white} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="create" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {h.title}
              </AppText>
              <AppText scaleRole="compact" style={styles.headerSubtitle}>
                {h.subtitle}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        {status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.listContent, centeredMaxWidth()]}
            renderItem={({item}) => {
              const verseCount = getReferencedVerses(item.bodyText).length;
              const metaParts = [
                formatSessionDateLabel(item.updatedAt, bookLang),
                item.source,
              ].filter((part): part is string => Boolean(part));
              const snippet = item.bodyText.trim().replace(/\s+/g, ' ');
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleOpen(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityHint={h.openHint}>
                  <View style={styles.rowMain}>
                    <Text
                      style={[styles.rowTitle, {color: colors.primary}]}
                      numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.rowMeta, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {metaParts.join(' · ')}
                    </Text>
                    {snippet.length > 0 && (
                      <Text
                        style={[
                          styles.rowSnippet,
                          {color: colors.textTertiary},
                        ]}
                        numberOfLines={1}>
                        {snippet}
                      </Text>
                    )}
                    <Text
                      style={[styles.rowVerseCount, {color: colors.primary}]}>
                      {verseCountLabel(verseCount)}
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
                  name="create-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={[styles.stateTitle, {color: colors.text}]}>
                  {h.emptyTitle}
                </Text>
                <Text style={[styles.stateText, {color: colors.textSecondary}]}>
                  {h.emptyBody}
                </Text>
              </View>
            }
          />
        )}
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
  rowTitle: {fontWeight: '700', fontSize: fontSizes.md},
  rowMeta: {fontSize: fontSizes.sm},
  rowSnippet: {fontSize: fontSizes.xs},
  rowVerseCount: {fontSize: fontSizes.xs, fontWeight: '600', marginTop: 2},
});
