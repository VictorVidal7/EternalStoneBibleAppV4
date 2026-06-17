/**
 * 📂 COLLECTIONS — browse your verse collections (Sprint 67)
 *
 * Lists the user's collections — favorite tags, surfaced as first-class named
 * lists (see [[collections]]) — as tappable cards. Picking one opens the detail
 * (`/features/collections/[name]`). The personal counterpart to the curated S63
 * topical themes: a reader's OWN groupings ("Promises", "Comfort", …).
 *
 * Reached from the Favorites header + the deep link
 * eternalbible://features/collections. 100% JS: the grouping is the pure
 * src/features/collections/collections.ts over the existing Favorites store;
 * zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useFavorites} from '@context/FavoritesContext';
import {buildCollections} from '@/features/collections/collections';
import {getBookByName} from '@/constants/bible';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function CollectionsBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const tc = t.collections;
  const {favorites} = useFavorites();
  const collections = buildCollections(favorites);

  const localizeBook = useCallback(
    (book: string): string => {
      const info = getBookByName(book);
      if (!info) return book;
      return language === 'en' ? info.nameEn : info.name;
    },
    [language],
  );

  const handleOpen = useCallback(
    (name: string) => {
      haptics.tap();
      router.push(`/features/collections/${encodeURIComponent(name)}` as never);
    },
    [router],
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

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
              <Ionicons name="bookmarks" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tc.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tc.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[styles.content, centeredMaxWidth()]}
          showsVerticalScrollIndicator={false}>
          {collections.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="bookmarks-outline"
                size={48}
                color={colors.textTertiary}
              />
              <AppText
                scaleRole="display"
                style={[styles.emptyTitle, {color: colors.text}]}>
                {tc.empty}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.emptyHint, {color: colors.textSecondary}]}>
                {tc.emptyHint}
              </AppText>
            </View>
          ) : (
            <>
              <AppText
                scaleRole="compact"
                style={[styles.browseHint, {color: colors.textTertiary}]}>
                {tc.browseHint}
              </AppText>
              {collections.map(col => {
                const preview = col.verses
                  .slice(0, 2)
                  .map(v => `${localizeBook(v.book)} ${v.chapter}:${v.verse}`)
                  .join(' · ');
                return (
                  <TouchableOpacity
                    key={col.name}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleOpen(col.name)}
                    accessibilityRole="button"
                    accessibilityLabel={col.name}
                    accessibilityHint={tc.openHint}>
                    <View
                      style={[
                        styles.cardIcon,
                        {backgroundColor: colors.primary + '22'},
                      ]}>
                      <Ionicons
                        name="bookmark"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <AppText
                        scaleRole="display"
                        style={[styles.cardName, {color: colors.text}]}
                        numberOfLines={1}>
                        {col.name}
                      </AppText>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.cardPreview,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}>
                        {preview}
                      </AppText>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.cardCount,
                          {color: colors.textTertiary},
                        ]}>
                        {col.count} {tc.verses}
                      </AppText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  browseHint: {fontSize: fontSizes.sm, marginBottom: spacing.xs},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardName: {fontSize: fontSizes.md, fontWeight: '700'},
  cardPreview: {fontSize: fontSizes.sm},
  cardCount: {fontSize: fontSizes.xs, fontWeight: '600'},
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyTitle: {fontSize: fontSizes.lg, fontWeight: '700'},
  emptyHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
