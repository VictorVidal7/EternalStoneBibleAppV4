/**
 * 🕘 HISTORIAL DE PREPARACIONES — T8.4.1, the first slice of the "Mesa de
 * preparación" premium tanda (T8.4).
 *
 * Lists every "Mesa de preparación" the user has notes for (device-local,
 * from prepNotesStore), most-recently-edited first, with a substring search
 * over both the passage reference and the note content. Tapping a row
 * reopens that passage's preparation table with its notes already there.
 *
 * PURE navigation/search over notes the preparer already wrote — nothing
 * here generates or suggests sermon text, so the app's guardrail (the app
 * never writes the sermon, cf. Jeremías 23:30-32) isn't at stake in this
 * screen; it only helps a preparer find their own past study.
 *
 * Premium-gated (offering-unlocked, never framed as a purchase): a free
 * reader sees a quiet locked teaser instead of the list. The single-passage
 * "Mesa de preparación" screen itself (app/features/prep/index.tsx) stays
 * 100% free and unchanged — this is a pure addition on top of it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {AppText} from '@components/ui/AppText';
import {Stack, useFocusEffect, useRouter} from 'expo-router';
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
import {getAllPrepNotes} from '@/features/study/prepNotesStore';
import {
  buildPrepHistoryEntries,
  formatRelativeUpdatedAt,
  type PrepHistoryEntry,
} from '@/features/study/prepHistory';
import {formatPassageLabel} from '@/features/study/prepTable';
import {searchNotes} from '@lib/notes/noteFilter';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Status = 'loading' | 'ready';

export default function PrepHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const h = t.prepHistory;
  // Passage references follow the reading version's language, same
  // convention as the Notes tab and the prep table itself.
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const [status, setStatus] = useState<Status>('loading');
  const [entries, setEntries] = useState<PrepHistoryEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const map = await getAllPrepNotes();
    setEntries(buildPrepHistoryEntries(map));
    setNow(Date.now());
    setStatus('ready');
  }, []);

  // Free readers never even read the store — premium stays a pure addition,
  // nothing here costs the free path anything. Reloads on every focus so
  // notes edited on the prep screen show up immediately on the way back.
  useFocusEffect(
    useCallback(() => {
      if (!isPremium) return;
      load();
    }, [isPremium, load]),
  );

  const filtered = useMemo(
    () =>
      searchNotes(
        entries,
        query,
        entry =>
          `${formatPassageLabel(entry, bookLang)} ${entry.searchableText}`,
      ),
    [entries, query, bookLang],
  );

  const handleOpen = useCallback(
    (entry: PrepHistoryEntry) => {
      haptics.tap();
      router.push({
        pathname: '/features/prep' as never,
        params: {
          book: entry.bookNameEn,
          chapter: String(entry.chapter),
          startVerse: String(entry.startVerse),
          endVerse: String(entry.endVerse),
        },
      });
    },
    [router],
  );

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

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
              <Ionicons name="time" size={22} color={staticColors.white} />
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
              <Ionicons name="leaf-outline" size={36} color={colors.primary} />
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
            {entries.length > 0 && (
              <View style={styles.controls}>
                <View
                  style={[
                    styles.searchBar,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.searchInput, {color: colors.text}]}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={h.searchPlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="search"
                    accessibilityLabel={h.searchPlaceholder}
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
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={item => item.passageKey}
              contentContainerStyle={[styles.listContent, centeredMaxWidth()]}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => {
                const label = formatPassageLabel(item, bookLang);
                return (
                  <TouchableOpacity
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleOpen(item)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityHint={h.openHint}>
                    <View style={styles.rowMain}>
                      <View style={styles.rowHeaderLine}>
                        <Text
                          style={[styles.rowLabel, {color: colors.primary}]}>
                          {label}
                        </Text>
                        <Text
                          style={[
                            styles.rowDate,
                            {color: colors.textTertiary},
                          ]}>
                          {formatRelativeUpdatedAt(item.updatedAt, now, h)}
                        </Text>
                      </View>
                      {item.preview.length > 0 && (
                        <Text
                          style={[
                            styles.rowPreview,
                            {color: colors.textSecondary},
                          ]}
                          numberOfLines={2}>
                          {item.preview}
                        </Text>
                      )}
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
                query.trim().length > 0 ? (
                  <View style={styles.centerState}>
                    <Ionicons
                      name="search"
                      size={40}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[styles.stateText, {color: colors.textSecondary}]}>
                      {h.noResults}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.centerState}>
                    <Ionicons
                      name="reader-outline"
                      size={48}
                      color={colors.textTertiary}
                    />
                    <Text style={[styles.stateTitle, {color: colors.text}]}>
                      {h.emptyTitle}
                    </Text>
                    <Text
                      style={[styles.stateText, {color: colors.textSecondary}]}>
                      {h.emptyBody}
                    </Text>
                  </View>
                )
              }
            />
          </View>
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
  backButton: {marginBottom: spacing.sm},
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
  controls: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {flex: 1, fontSize: fontSizes.md, paddingVertical: 0},
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
  rowHeaderLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: {fontWeight: '700', fontSize: fontSizes.md},
  rowDate: {fontSize: fontSizes.xs},
  rowPreview: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.4,
  },
});
