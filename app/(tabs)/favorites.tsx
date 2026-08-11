import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {spacing, staticColors} from '@/styles/designTokens';

import React, {useCallback, useMemo, useState} from 'react';
import {useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {ContextualHintBanner} from '@components/hints/ContextualHintBanner';
import {useContextualHint} from '@hooks/useContextualHint';
import {useToast} from '@context/ToastContext';
import {logger} from '@lib/utils/logger';
import {haptics} from '@lib/haptics';
import {useFavorites} from '@context/FavoritesContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {AddToCollectionSheet} from '@/features/collections/AddToCollectionSheet';
import {getBookByName} from '@/constants/bible';
import {buildVerseKey} from '@lib/memory/srs';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {buildVersePlaylist, useAudioPlayer} from '@/features/audio';
import bibleDB from '@lib/database';

export default function FavoritesScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {favorites, removeFavorite, refreshFavorites, loading} = useFavorites();
  const {hasCard, addCard, removeCard} = useMemoryDeck();
  // Contextual hint (T: contextual-hints-expansion) — the "Colecciones"
  // header icon is icon-only, easy to overlook, and it's the entry point to
  // organizing favorites into named lists (a feature `collections.emptyHint`
  // already teaches once the user gets there — this hint's only job is
  // getting them to tap the icon in the first place).
  const collectionsHint = useContextualHint('favoritesCollections');
  // The favorite whose collections sheet is open (null = closed).
  const [collectionsFor, setCollectionsFor] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const {selectedVersion} = useBibleVersion();
  const {loadChapter, play} = useAudioPlayer();
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );

  useFocusEffect(
    useCallback(() => {
      refreshFavorites().catch(error => {
        logger.error('Error loading favorites', error as Error, {
          component: 'FavoritesScreen',
          action: 'refreshFavorites',
        });
      });
    }, [refreshFavorites]),
  );

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    await removeFavorite(deleteTargetId);
    toast.success(t.favorites.removedSuccessfully);
    setDeleteTargetId(null);
  }

  function goToVerse(favorite: (typeof favorites)[number]) {
    router.push(
      `/verse/${favorite.book}/${favorite.chapter}?verse=${favorite.verse}` as never,
    );
  }

  function toggleMemory(favorite: (typeof favorites)[number]) {
    const key = buildVerseKey(favorite.book, favorite.chapter, favorite.verse);
    if (hasCard(key)) {
      removeCard(key);
      toast.success(t.memory.removedToast);
    } else {
      addCard({
        bookName: favorite.book,
        chapter: favorite.chapter,
        verse: favorite.verse,
        text: favorite.text,
        version: selectedVersion.id,
      });
      toast.success(t.memory.addedToast);
    }
  }

  // The book name follows the READING version's language (RVR1960 → "Juan"), so
  // saved favorites read the same as the rest of the app, regardless of which
  // version was active when the favorite was created.
  function localizeBook(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return selectedVersion.language === 'es' ? info.name : info.nameEn;
  }

  // 🎧 Listen to your favorites (Sprint 79): re-resolve each verse against the
  // ACTIVE reading version (favorites keep the text of whichever version they
  // were saved in) and queue them as a verse playlist — canonical Bible order,
  // deduped, ∞ never rolls past the end of the list.
  async function handleListenAll() {
    if (favorites.length === 0) return;
    haptics.press();
    try {
      await bibleDB.initialize();
      const resolved = await Promise.all(
        favorites.map(async fav => {
          const info = getBookByName(fav.book);
          const live = info
            ? await bibleDB
                .getVerse(info.id, fav.chapter, fav.verse, selectedVersion.id)
                .catch(() => null)
            : null;
          return {
            book: fav.book,
            chapter: fav.chapter,
            verse: fav.verse,
            text: live?.text ?? fav.text,
          };
        }),
      );
      const playlist = buildVersePlaylist(resolved);
      if (playlist.length === 0) return;
      logger.info('Favorites playlist queued', {count: playlist.length});
      loadChapter(playlist, {
        mode: 'playlist',
        label: t.favorites.playlistLabel,
      });
      // Let loadChapter's eager refs settle before play (the engine idiom).
      setTimeout(() => play(), 150);
      toast.success(
        t.audio.queue.playlistQueued
          .replace('{{label}}', t.favorites.playlistLabel)
          .replace('{{n}}', String(playlist.length)),
      );
    } catch (error) {
      logger.error('Favorites playlist failed', error as Error, {
        component: 'FavoritesScreen',
        action: 'handleListenAll',
      });
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]} />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        {/* Boton de regreso */}
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Entrada a Colecciones (Sprint 67) */}
        <TouchableOpacity
          style={styles.headerCollectionsButton}
          onPress={() => {
            haptics.tap();
            router.push('/features/collections' as never);
          }}
          accessibilityRole="button"
          accessibilityLabel={t.collections.manage}>
          <Ionicons name="bookmarks-outline" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* 🎧 Escuchar favoritos (Sprint 79) */}
        {favorites.length > 0 && (
          <TouchableOpacity
            style={styles.headerListenButton}
            onPress={() => void handleListenAll()}
            accessibilityRole="button"
            accessibilityLabel={t.favorites.listenAll}>
            <Ionicons name="headset-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="heart" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.tabs.favorites}
            </Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length}{' '}
              {favorites.length === 1
                ? t.favorites.verseSaved
                : t.favorites.versesSaved}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Contextual hint (T: contextual-hints-expansion) — see
          collectionsHint above. Sits directly under the header that carries
          the Colecciones icon, above the list, mirroring prepHeaderActions'
          placement for its own icon-only header actions. */}
      <View style={styles.hintWrapper}>
        <ContextualHintBanner
          visible={collectionsHint.visible}
          onDismiss={collectionsHint.dismiss}
          message={t.contextualHints.favoritesCollections}
        />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.favoriteItem, {backgroundColor: colors.surface}]}
            onPress={() => goToVerse(item)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.favoriteIcon,
                {backgroundColor: colors.primaryLight},
              ]}>
              <Ionicons name="heart" size={20} color={colors.primary} />
            </View>

            <View style={styles.favoriteContent}>
              <Text style={[styles.favoriteReference, {color: colors.primary}]}>
                {localizeBook(item.book)} {item.chapter}:{item.verse}
              </Text>
              <Text
                style={[styles.favoriteText, {color: colors.text}]}
                numberOfLines={2}>
                {item.text}
              </Text>
              <Text
                style={[styles.favoriteDate, {color: colors.textSecondary}]}>
                {new Date(item.createdAt).toLocaleDateString(
                  language === 'es' ? 'es-ES' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </Text>
            </View>

            <View style={styles.rowActions}>
              {(() => {
                const inDeck = hasCard(
                  buildVerseKey(item.book, item.chapter, item.verse),
                );
                return (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => toggleMemory(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      inDeck ? t.memory.removeFromDeck : t.memory.addToDeck
                    }
                    accessibilityState={{selected: inDeck}}>
                    <Ionicons
                      name={inDeck ? 'school' : 'school-outline'}
                      size={20}
                      color={inDeck ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })()}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setCollectionsFor(item.id)}
                accessibilityRole="button"
                accessibilityLabel={t.collections.manage}
                accessibilityState={{selected: (item.tags?.length ?? 0) > 0}}>
                <Ionicons
                  name={
                    (item.tags?.length ?? 0) > 0
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                  color={
                    (item.tags?.length ?? 0) > 0
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
                accessibilityRole="button"
                accessibilityLabel={t.delete}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <IllustratedEmptyState
            type="no-favorites"
            colors={colors}
            isDark={isDark}
            onAction={() => router.push('/(tabs)/bible' as never)}
          />
        }
      />

      <AddToCollectionSheet
        favoriteId={collectionsFor}
        onClose={() => setCollectionsFor(null)}
      />

      {/* Themed delete confirm (UX audit, replaces native Alert.alert) */}
      <ConfirmDialog
        visible={!!deleteTargetId}
        title={t.favorites.deleteTitle}
        message={t.favorites.deleteMessage}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTargetId(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Horizontal inset only (no background/border) so this renders as
  // nothing at all while ContextualHintBanner is null.
  hintWrapper: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
  headerCollectionsButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerListenButton: {
    position: 'absolute',
    right: 68,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: staticColors.glassWhite90,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
    ...centeredMaxWidth(),
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.brandBlueBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteReference: {
    fontSize: 15,
    fontWeight: '600',
    color: staticColors.brandBlue,
    marginBottom: 6,
  },
  favoriteText: {
    fontSize: 14,
    lineHeight: 20,
    color: staticColors.slate600,
    marginBottom: 6,
  },
  favoriteDate: {
    fontSize: 12,
    color: staticColors.grayMuted,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
