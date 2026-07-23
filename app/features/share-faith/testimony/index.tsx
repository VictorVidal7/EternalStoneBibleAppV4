/**
 * 🕊️ MI TESTIMONIO — free-tier list screen ("Comparte tu fe" Part 3).
 *
 * Lists every testimony-writing session the reader has started
 * (device-local, from [[faithTestimonyStore]]), most-recently-updated
 * first. Tapping "+" creates a new session immediately (default title =
 * today's date, editable right away in the editor) — mirrors "Notas de
 * sermón"'s list screen exactly, this feature's closest shape precedent.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo, useState} from 'react';
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
  getAllFaithTestimonies,
  createFaithTestimonySession,
} from '@/features/study/faithTestimonyStore';
import {
  canCreateTestimonySession,
  defaultTestimonyTitle,
  formatTestimonyDateLabel,
  hasTestimonyContent,
  listTestimonySessions,
  type FaithTestimonyMap,
  type FaithTestimonySession,
} from '@/features/study/faithTestimony';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready';

export default function FaithTestimonyListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();
  const h = t.shareFaith.testimony;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const [status, setStatus] = useState<Status>('loading');
  const [sessionsMap, setSessionsMap] = useState<FaithTestimonyMap>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const map = await getAllFaithTestimonies();
    setSessionsMap(map);
    setStatus('ready');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sessions = useMemo(
    () => listTestimonySessions(sessionsMap),
    [sessionsMap],
  );

  const handleCreate = useCallback(async () => {
    if (creating) return;
    haptics.tap();
    if (!canCreateTestimonySession(sessionsMap)) {
      toast.warning(`${h.limitReachedTitle}. ${h.limitReachedBody}`);
      return;
    }
    setCreating(true);
    try {
      const created = await createFaithTestimonySession(
        defaultTestimonyTitle(Date.now(), bookLang),
      );
      if (!created) return;
      router.push(`/features/share-faith/testimony/${created.id}` as never);
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
    (session: FaithTestimonySession) => {
      haptics.tap();
      router.push(`/features/share-faith/testimony/${session.id}` as never);
    },
    [router],
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
              const hasContent = hasTestimonyContent(item);
              const metaParts = [
                formatTestimonyDateLabel(item.updatedAt, bookLang),
              ];
              const snippet = [item.before, item.change, item.now]
                .find(part => part.trim().length > 0)
                ?.trim()
                .replace(/\s+/g, ' ');
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
                    {hasContent && snippet ? (
                      <Text
                        style={[
                          styles.rowSnippet,
                          {color: colors.textTertiary},
                        ]}
                        numberOfLines={1}>
                        {snippet}
                      </Text>
                    ) : null}
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
});
