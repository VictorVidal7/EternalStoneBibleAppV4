/**
 * 📂 COLLECTION DETAIL — the verses in one collection (Sprint 67)
 *
 * Shows every favorite tagged with this collection, with its reference + text,
 * a tap-through into the reader, a per-verse "remove from collection", and a
 * one-tap share of the whole list as text. Reads the existing Favorites store
 * directly (so it has the favorite ids for removal); the membership test is the
 * pure [[collections]] helper.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  useWindowDimensions,
} from 'react-native';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useFavorites} from '@context/FavoritesContext';
import {
  isInCollection,
  removeFromCollection,
} from '@/features/collections/collections';
import {buildCollectionCard} from '@/features/collections/collectionCard';
import {CollectionImageModal} from '@/features/collections/CollectionImageModal';
import {getBookByName} from '@/constants/bible';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const tc = t.collections;
  const {favorites, updateFavorite} = useFavorites();
  const {width: windowWidth} = useWindowDimensions();
  const [imageVisible, setImageVisible] = useState(false);

  const params = useLocalSearchParams<{name?: string}>();
  const name = useMemo(
    () => decodeURIComponent(params.name ?? ''),
    [params.name],
  );

  const localizeBook = useCallback(
    (book: string): string => {
      const info = getBookByName(book);
      if (!info) return book;
      return language === 'en' ? info.nameEn : info.name;
    },
    [language],
  );

  // The favorites in this collection, newest-first. Reading the store directly
  // (vs buildCollections) keeps the favorite id for removal + navigation.
  const verses = useMemo(
    () =>
      favorites
        .filter(f => isInCollection(f.tags, name))
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [favorites, name],
  );

  // The render-ready card for the share-as-image modal (pure builder: count +
  // a few truncated preview verses with localized references).
  const card = useMemo(
    () =>
      buildCollectionCard(
        name,
        verses.map(v => ({
          reference: `${localizeBook(v.book)} ${v.chapter}:${v.verse}`,
          text: v.text,
        })),
      ),
    [name, verses, localizeBook],
  );

  const goToVerse = useCallback(
    (book: string, chapter: number, verse: number) => {
      haptics.tap();
      router.push(`/verse/${book}/${chapter}?verse=${verse}` as never);
    },
    [router],
  );

  const handleRemove = useCallback(
    (id: string, tags: string[]) => {
      haptics.tap();
      updateFavorite(id, {tags: removeFromCollection(tags, name)}).catch(
        () => undefined,
      );
    },
    [updateFavorite, name],
  );

  const handleShare = useCallback(() => {
    if (verses.length === 0) return;
    haptics.tap();
    const body = verses
      .map(v => `${localizeBook(v.book)} ${v.chapter}:${v.verse}\n"${v.text}"`)
      .join('\n\n');
    const message = `${tc.shareHeader}: ${name}\n\n${body}`;
    Share.share({message}).catch(() => undefined);
  }, [verses, name, localizeBook, tc.shareHeader]);

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
            {verses.length > 0 ? (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    haptics.tap();
                    setImageVisible(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={tc.shareImage}>
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                  accessibilityRole="button"
                  accessibilityLabel={tc.share}>
                  <Ionicons
                    name="share-outline"
                    size={22}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="bookmark" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {`${verses.length} ${tc.verses}`}
              </AppText>
              <AppText
                scaleRole="display"
                style={styles.headerTitle}
                numberOfLines={2}>
                {name}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {verses.map(fav => (
            <View
              key={fav.id}
              style={[
                styles.card,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => goToVerse(fav.book, fav.chapter, fav.verse)}
                accessibilityRole="button"
                accessibilityLabel={`${localizeBook(fav.book)} ${fav.chapter}:${fav.verse}`}>
                <AppText
                  scaleRole="compact"
                  style={[styles.cardRef, {color: colors.primary}]}>
                  {localizeBook(fav.book)} {fav.chapter}:{fav.verse}
                </AppText>
                <AppText
                  scaleRole="body"
                  style={[styles.cardText, {color: colors.text}]}
                  numberOfLines={4}>
                  {fav.text}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(fav.id, fav.tags)}
                accessibilityRole="button"
                accessibilityLabel={tc.removeFromCollection}>
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <CollectionImageModal
          visible={imageVisible}
          card={card}
          cardSize={windowWidth - spacing.lg * 2}
          onClose={() => setImageVisible(false)}
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
  headerActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardMain: {flex: 1, gap: 4},
  cardRef: {fontSize: fontSizes.sm, fontWeight: '700'},
  cardText: {fontSize: fontSizes.base},
  removeButton: {padding: spacing.xs},
});
