/**
 * 📖 DICTIONARY BROWSE — flat alphabetical list + live search (Tanda 5, v1)
 *
 * Lists the 10 v1 Bible-dictionary entries (`getAllDictionaryEntries`) as
 * tappable rows. Picking one opens the detail screen
 * (`/features/dictionary/[slug]`) with its free gloss + gated premium
 * article. Reached from Home's "Explorar" grid.
 *
 * Mirrors `app/features/themes/index.tsx`'s header/layout and
 * `app/(tabs)/notes.tsx`'s search bar — no new UI patterns introduced.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {
  filterDictionaryEntries,
  titleCaseHeadword,
  type DictionaryListEntry,
} from '@/features/study/dictionary';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function DictionaryBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const dt = t.dictionary;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [entries, setEntries] = useState<DictionaryListEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bibleDB.initialize();
        const rows = await bibleDB.getAllDictionaryEntries();
        if (!cancelled) {
          setEntries(rows);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayed = useMemo(
    () => filterDictionaryEntries(entries, query),
    [entries, query],
  );

  const handleOpen = useCallback(
    (slug: string) => {
      haptics.tap();
      router.push(`/features/dictionary/${slug}` as never);
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="book" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {dt.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {dt.title}
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: staticColors.glassWhite25,
                borderColor: staticColors.glassWhite25,
              },
            ]}>
            <Ionicons
              name="search"
              size={18}
              color={staticColors.glassWhite95}
            />
            <TextInput
              style={[styles.searchInput, {color: staticColors.white}]}
              value={query}
              onChangeText={setQuery}
              placeholder={dt.searchPlaceholder}
              placeholderTextColor={staticColors.glassWhite95}
              returnKeyType="search"
              accessibilityLabel={dt.searchPlaceholder}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                accessibilityRole="button"
                accessibilityLabel={t.cancel}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={staticColors.glassWhite95}
                />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {status === 'error' && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {dt.error}
              </AppText>
            </View>
          )}

          {status === 'ready' && (
            <>
              <AppText
                scaleRole="compact"
                style={[styles.browseHint, {color: colors.textTertiary}]}>
                {dt.browseHint}
              </AppText>

              {displayed.length === 0 ? (
                <View style={styles.centerState}>
                  <Ionicons
                    name="search"
                    size={36}
                    color={colors.textTertiary}
                  />
                  <AppText
                    style={[styles.stateText, {color: colors.textSecondary}]}>
                    {dt.noResults}
                  </AppText>
                </View>
              ) : (
                displayed.map(entry => {
                  const title = titleCaseHeadword(entry.headword_es);
                  return (
                    <TouchableOpacity
                      key={entry.slug}
                      style={[
                        styles.entryCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleOpen(entry.slug)}
                      accessibilityRole="button"
                      accessibilityLabel={title}
                      accessibilityHint={dt.openHint}>
                      <View style={styles.entryInfo}>
                        <AppText
                          scaleRole="display"
                          style={[styles.entryTitle, {color: colors.text}]}>
                          {title}
                        </AppText>
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.entryGloss,
                            {color: colors.textSecondary},
                          ]}
                          numberOfLines={1}>
                          {entry.gloss_es}
                        </AppText>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    paddingVertical: 0,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  browseHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  entryInfo: {flex: 1, gap: 2},
  entryTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  entryGloss: {
    fontSize: fontSizes.sm,
  },
});
