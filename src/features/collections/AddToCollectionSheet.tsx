/**
 * 📂 AddToCollectionSheet — manage a favorite's collections (Sprint 67)
 *
 * A bottom sheet that toggles which collections a favorite belongs to and lets
 * the user create a new one inline. A "collection" is a favorite tag, so this
 * is pure tag-array math (see [[collections]]) committed through the existing
 * `updateFavorite` — no new storage. Reads the LIVE favorite by id so the
 * chips reflect each toggle immediately.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {useFavorites} from '@context/FavoritesContext';
import {
  collectionNames,
  addToCollection,
  removeFromCollection,
  isInCollection,
  normalizeCollectionName,
} from './collections';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface Props {
  /** The favorite being edited, or null to keep the sheet closed. */
  favoriteId: string | null;
  onClose: () => void;
}

export const AddToCollectionSheet: React.FC<Props> = ({
  favoriteId,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tc = t.collections;
  const {favorites, updateFavorite} = useFavorites();
  const [draft, setDraft] = useState('');

  const fav = favorites.find(f => f.id === favoriteId);
  const names = collectionNames(favorites);

  const commit = (tags: string[]) => {
    if (!fav) return;
    updateFavorite(fav.id, {tags}).catch(() => undefined);
  };

  const toggle = (name: string) => {
    if (!fav) return;
    haptics.tap();
    commit(
      isInCollection(fav.tags, name)
        ? removeFromCollection(fav.tags, name)
        : addToCollection(fav.tags, name),
    );
  };

  const create = () => {
    if (!fav) return;
    const name = normalizeCollectionName(draft);
    if (!name) return;
    haptics.tap();
    commit(addToCollection(fav.tags, name));
    setDraft('');
  };

  return (
    <Modal
      visible={favoriteId !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {backgroundColor: colors.card}]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <AppText
            scaleRole="display"
            style={[styles.title, {color: colors.text}]}>
            {tc.addTitle}
          </AppText>

          {names.length > 0 ? (
            <View style={styles.chipRow}>
              {names.map(name => {
                const active = isInCollection(fav?.tags, name);
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => toggle(name)}
                    accessibilityRole="button"
                    accessibilityState={{selected: active}}
                    accessibilityLabel={name}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active
                          ? colors.primary + '22'
                          : staticColors.transparent,
                      },
                    ]}>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primary}
                      />
                    ) : null}
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.chipText,
                        {color: active ? colors.primary : colors.textSecondary},
                      ]}>
                      {name}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.inputRow, {borderColor: colors.border}]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={tc.newPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, {color: colors.text}]}
              returnKeyType="done"
              onSubmitEditing={create}
              maxLength={40}
            />
            <TouchableOpacity
              onPress={create}
              disabled={normalizeCollectionName(draft).length === 0}
              accessibilityRole="button"
              accessibilityLabel={tc.create}
              style={[
                styles.createButton,
                {
                  backgroundColor:
                    normalizeCollectionName(draft).length === 0
                      ? colors.border
                      : colors.primary,
                },
              ]}>
              <Ionicons name="add" size={20} color={staticColors.white} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={tc.done}
            style={[styles.doneButton, {backgroundColor: colors.primary}]}>
            <AppText scaleRole="compact" style={styles.doneText}>
              {tc.done}
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AddToCollectionSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack30,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: staticColors.glassWhite25,
  },
  title: {fontSize: fontSizes.lg, fontWeight: '800'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {fontSize: fontSizes.sm, fontWeight: '600'},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {flex: 1, fontSize: fontSizes.base, paddingVertical: spacing.xs},
  createButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  doneText: {
    color: staticColors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
