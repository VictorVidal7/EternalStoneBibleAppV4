import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

export default function FavoritesScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {favorites, removeFavorite, refreshFavorites, loading} = useFavorites();
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
              {t.favorites.versesSaved || 'Versículos guardados'}
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
                {item.book} {item.chapter}:{item.verse}
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

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
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
    color: '#4A90E2',
    marginBottom: 6,
  },
  favoriteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495E',
    marginBottom: 6,
  },
  favoriteDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
