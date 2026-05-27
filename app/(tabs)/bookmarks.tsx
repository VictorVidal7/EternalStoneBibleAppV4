import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import {useMemo, useState} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBookmarks, type Bookmark} from '@context/BookmarksContext';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {getBookByName} from '@/constants/bible';

export default function BookmarksScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );
  const {t, language} = useLanguage();
  const {bookmarks, removeBookmark, renameBookmark, loading} = useBookmarks();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  // Book names are stored in whatever language the source version used;
  // localize to the active UI language so the list reads naturally
  // regardless of which version was active when the user bookmarked.
  function localizeBook(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return language === 'en' ? info.nameEn : info.name;
  }

  function goToVerse(b: Bookmark) {
    router.push(`/verse/${b.book}/${b.chapter}?verse=${b.verse}` as never);
  }

  function handleDelete(b: Bookmark) {
    Alert.alert(t.bookmarks.deleteTitle, t.bookmarks.deleteMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          removeBookmark(b.id);
        },
      },
    ]);
  }

  function openRenameModal(b: Bookmark) {
    setEditingId(b.id);
    setLabelDraft(b.label ?? '');
  }

  async function saveRename() {
    if (editingId !== null) {
      await renameBookmark(editingId, labelDraft.trim());
      setEditingId(null);
      setLabelDraft('');
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]} />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="bookmark" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.bookmarks.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {bookmarks.length}{' '}
              {bookmarks.length === 1
                ? t.bookmarks.countSingular
                : t.bookmarks.count}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={bookmarks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.itemCard, {backgroundColor: colors.surface}]}
            onPress={() => goToVerse(item)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.itemIcon,
                {backgroundColor: colors.primary + '22'},
              ]}>
              <Ionicons name="bookmark" size={20} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[styles.itemReference, {color: colors.primary}]}
                numberOfLines={1}>
                {localizeBook(item.book)} {item.chapter}:{item.verse}
              </Text>
              {item.label ? (
                <Text
                  style={[styles.itemLabel, {color: colors.text}]}
                  numberOfLines={1}>
                  {item.label}
                </Text>
              ) : null}
              <Text
                style={[styles.itemPreview, {color: colors.textSecondary}]}
                numberOfLines={2}>
                "{item.text}"
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => openRenameModal(item)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={t.bookmarks.rename}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={t.delete}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <IllustratedEmptyState
            type="no-bookmarks"
            colors={colors}
            isDark={isDark}
            onAction={() => router.push('/(tabs)/bible' as never)}
            actionLabel={t.bookmarks.openBible}
          />
        }
      />

      <Modal
        visible={editingId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingId(null)}>
        <View style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
          <View style={[styles.modalCard, {backgroundColor: colors.surface}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              {t.bookmarks.renameTitle}
            </Text>
            <TextInput
              value={labelDraft}
              onChangeText={setLabelDraft}
              placeholder={t.bookmarks.labelPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              autoFocus
              maxLength={60}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, {borderColor: colors.border}]}
                onPress={() => setEditingId(null)}>
                <Text style={{color: colors.textSecondary, fontWeight: '600'}}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={saveRename}>
                <Text style={{color: staticColors.white, fontWeight: '600'}}>
                  {t.save}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
  headerContent: {flexDirection: 'row', alignItems: 'center'},
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
  headerTextContainer: {flex: 1},
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: staticColors.glassWhite90,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {flex: 1, minWidth: 0},
  itemReference: {fontSize: 14, fontWeight: '700', marginBottom: 2},
  itemLabel: {fontSize: 14, fontWeight: '600', marginBottom: 4},
  itemPreview: {fontSize: 13, lineHeight: 18, fontStyle: 'italic'},
  itemActions: {flexDirection: 'row', gap: 4},
  iconButton: {padding: 6},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 12},
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: staticColors.transparent,
  },
});
