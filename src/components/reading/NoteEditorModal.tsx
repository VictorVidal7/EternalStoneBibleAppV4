/**
 * 📝 NOTE EDITOR MODAL
 *
 * Bottom-sheet style modal used by the verse reader to add or edit a
 * note on a single verse. Extracted from `verse/[book]/[chapter].tsx`
 * (Sprint 21 tech debt #13) so the reader file stays under control —
 * the modal owns its own styles + theme glue and exposes a minimal
 * controlled-input surface to the parent.
 *
 * Reference auto-detection (ported from "Notas de sermón" —
 * `src/features/study/sermonNotes.ts`'s `getReferencedVerses`, the SAME
 * `linkifyReferences` recognizer used everywhere else in the app): any
 * Bible reference typed inline in the note (e.g. "como dice Juan 3:16") is
 * recognized live and shown below the input as a tappable chip. The verse
 * this note is already attached to is excluded — pointing a chip at the
 * very verse you're annotating would be redundant. Tapping a chip saves the
 * in-progress note first (mirrors why sermon-notes' own chips are safe to
 * navigate away from — the draft is never lost), then jumps the reader.
 */
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {MarkdownTextInput} from '@expensify/react-native-live-markdown';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {useBibleVersion} from '../../hooks/useBibleVersion';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {parseReference} from '@lib/references/parseReference';
import {getBookByName} from '@/constants/bible';
import {
  getReferencedVerses,
  formatReferencedVerseLabel,
  type ReferencedVerse,
} from '@/features/study/sermonNotes';
import {parseNoteMarkdownRanges} from '@lib/notes/noteMarkdownRanges';
import {NoteImageModal} from './NoteImageModal';
import {staticColors} from '../../styles/designTokens';
import {
  borderRadius,
  fontSize as fontSizes,
  shadows,
  spacing,
} from '../../styles/designTokens';

export interface NoteEditorModalProps {
  visible: boolean;
  /** Verse the note is attached to (used for the header + preview snippet). */
  verseReference: string;
  verseText: string;
  /** Current draft value of the note input. */
  value: string;
  onChangeText: (next: string) => void;
  onSave: () => void;
  onClose: () => void;
  /**
   * Called right before a referenced-verse chip navigates away, mirroring
   * `CrossReferencesSheet`'s `onJump` — lets a host that's already showing a
   * reader chapter remember where the jump came from (e.g. push onto its own
   * back-navigation stack) before this modal's own `router.push`.
   */
  onJump?: () => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  visible,
  verseReference,
  verseText,
  value,
  onChangeText,
  onSave,
  onClose,
  onJump,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();
  const {selectedVersion} = useBibleVersion();
  // Referenced-verse chip labels follow the READING VERSION's language (same
  // convention as `localizedBookName` in the reader screen and sermon-notes'
  // `bookLang`), not the app UI language.
  const bookLang: 'es' | 'en' = selectedVersion.language === 'es' ? 'es' : 'en';
  const {width: screenWidth} = useWindowDimensions();
  const trimmed = value.trim();
  // Share-as-image (Sprint 70): a designer card of the verse + this note.
  const [shareVisible, setShareVisible] = useState(false);

  // Must be a stable reference, not an inline object literal: MarkdownTextInput
  // re-derives its native style (JSON clone + processColor) and re-registers
  // its parser worklet whenever `markdownStyle`/`parser` change identity
  // (`node_modules/@expensify/react-native-live-markdown/src/MarkdownTextInput.tsx`
  // lines 95 & 107) — an inline literal here would re-do that work on every
  // keystroke, the exact hot path this feature exists for.
  const markdownStyle = useMemo(
    () => ({syntax: {color: colors.textTertiary}}),
    [colors.textTertiary],
  );

  // The verse this note is attached to, as a ParsedReference — used only to
  // exclude it from the detected-references chips below. `verseReference` is
  // always built by the caller from `BIBLE_BOOKS` names (localizedBookName),
  // so it round-trips through parseReference exactly.
  const selfRef = useMemo(
    () => parseReference(verseReference),
    [verseReference],
  );

  const referencedVerses = useMemo(() => {
    const all = getReferencedVerses(value);
    if (!selfRef) return all;
    return all.filter(
      rv =>
        !(
          rv.bookNameEn === selfRef.book.nameEn &&
          rv.chapter === selfRef.chapter &&
          rv.verse === selfRef.verse &&
          rv.verseEnd === selfRef.verseEnd
        ),
    );
  }, [value, selfRef]);

  const handleOpenReference = (rv: ReferencedVerse) => {
    // getBookByName matches either language, so the English canonical name
    // resolves correctly regardless of the reading version's language.
    const targetBook = getBookByName(rv.bookNameEn);
    if (!targetBook) return;
    // Save first — `onSave` (the parent's `saveNote`) already taps haptics
    // and early-returns on a blank draft, so calling it unconditionally is
    // safe. Without this, navigating away would drop the in-progress note:
    // unlike sermon-notes' autosaving editor, this modal's draft lives only
    // in the parent's state until explicitly saved.
    onSave();
    onJump?.();
    onClose();
    const base = `/verse/${rv.bookNameEn}/${rv.chapter}`;
    router.push(
      (rv.verse === undefined ? base : `${base}?verse=${rv.verse}`) as never,
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View
          style={[
            styles.content,
            {backgroundColor: colors.surface, borderTopColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <View style={styles.header}>
            <Text
              style={[styles.title, {color: colors.text}]}
              numberOfLines={1}>
              {verseReference || t.notes.add}
            </Text>
            <View style={styles.headerActions}>
              {/* Share the verse + this note as a designer image (Sprint 70).
                  Only when there's note content to draw. */}
              {trimmed ? (
                <TouchableOpacity
                  onPress={() => setShareVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t.notes.shareImage}>
                  <Ionicons
                    name="share-outline"
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.close}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {verseText ? (
            <Text
              style={[
                styles.versePreview,
                {
                  color: colors.textSecondary,
                  backgroundColor: colors.surfaceVariant,
                },
              ]}>
              "{verseText}"
            </Text>
          ) : null}

          <MarkdownTextInput
            style={[
              styles.input,
              {color: colors.text, borderColor: colors.border},
            ]}
            placeholder={t.notes.placeholder}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
            textAlignVertical="top"
            parser={parseNoteMarkdownRanges}
            markdownStyle={markdownStyle}
          />

          <Text style={[styles.markdownHint, {color: colors.textTertiary}]}>
            {t.notes.markdownHint}
          </Text>

          {/* Referenced-verse chips (ported from "Notas de sermón"): only
            shown once at least one reference is detected, so an empty draft
            doesn't grow this already-compact bottom sheet. */}
          {referencedVerses.length > 0 ? (
            <View style={styles.chipsSection}>
              <Text
                style={[styles.chipsTitle, {color: colors.text}]}
                accessibilityRole="header">
                {t.notes.referencedVersesTitle}
              </Text>
              <View style={styles.chipsWrap}>
                {referencedVerses.map(rv => (
                  <TouchableOpacity
                    key={rv.key}
                    style={[
                      styles.chip,
                      {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + '14',
                      },
                    ]}
                    onPress={() => handleOpenReference(rv)}
                    accessibilityRole="button"
                    accessibilityLabel={formatReferencedVerseLabel(
                      rv,
                      bookLang,
                    )}
                    accessibilityHint={t.notes.goToVerse}>
                    <Ionicons
                      name="book-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text style={[styles.chipText, {color: colors.primary}]}>
                      {formatReferencedVerseLabel(rv, bookLang)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: trimmed ? colors.success : colors.textTertiary,
              },
            ]}
            onPress={onSave}
            disabled={!trimmed}>
            <Text style={[styles.saveButtonText, {color: colors.onPrimary}]}>
              {t.notes.saveNote}
            </Text>
          </TouchableOpacity>
        </View>

        <NoteImageModal
          visible={shareVisible}
          reference={verseReference}
          verseText={verseText}
          note={value}
          cardSize={screenWidth - 80}
          onClose={() => setShareVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    minHeight: 450,
    ...shadows['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginRight: spacing.md,
  },
  versePreview: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * 1.6,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSizes.base,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  markdownHint: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  chipsSection: {marginTop: spacing.md, gap: spacing.xs},
  chipsTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {fontSize: fontSizes.xs, fontWeight: '600'},
  saveButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  saveButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: staticColors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
