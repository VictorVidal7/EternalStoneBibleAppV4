import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import React, {useCallback, useMemo} from 'react';
import {useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {useToast} from '@context/ToastContext';
import {logger} from '@lib/utils/logger';
import {useFavorites} from '@context/FavoritesContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {getBookByName} from '@/constants/bible';
import {buildVerseKey} from '@lib/memory/srs';
import {useBibleVersion} from '@hooks/useBibleVersion';

export default function FavoritesScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {favorites, removeFavorite, refreshFavorites, loading} = useFavorites();
  const {hasCard, addCard, removeCard} = useMemoryDeck();
  const {selectedVersion} = useBibleVersion();
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

  async function handleDelete(id: string) {
    Alert.alert(t.favorites.deleteTitle, t.favorites.deleteMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await removeFavorite(id);
          toast.success(t.favorites.removedSuccessfully);
        },
      },
    ]);
  }

  function goToVerse(favorite: (typeof favorites)[number]) {
    router.push(
      `/verse/${favorite.book}/${favorite.chapter}?verse=${favorite.verse}` as any,
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

  // El nombre del libro se guarda en el idioma activo al crear el favorito;
  // se relocaliza para que la referencia siga al idioma de la app.
  function localizeBook(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return language === 'en' ? info.nameEn : info.name;
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
            onAction={() => router.push('/(tabs)/bible' as any)}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
