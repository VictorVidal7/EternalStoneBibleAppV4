/**
 * 🖼️ NoteImageModal — share a verse + your personal note as a designer image.
 *
 * Sprint 70. Reuses the Sprint 56 view-shot pipeline (`captureRef` →
 * `expo-sharing`, `collapsable={false}` on Android) and the `imageTemplates`
 * gradient catalog (like CollectionImageModal / CompareImageModal), but draws a
 * NOTE card: the verse reference, the verse text, and the writer's reflection,
 * baked into a shareable PNG. The card model is the pure [[noteCard]] builder.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useShareImage} from '@/features/share/useShareImage';
import {ShareCardHost} from '@/features/share/ShareCardHost';
import {PremiumShareExtras} from '@/features/share/PremiumShareExtras';
import {SHARE_TEMPLATES} from '@/features/share/imageTemplates';
import {buildNoteCard} from '@/lib/notes/noteCard';
import {
  spacing,
  fontSize as fontSizes,
  verseTextRightSlack,
} from '@/styles/designTokens';

export interface NoteImageModalProps {
  visible: boolean;
  /** Verse reference, e.g. "John 3:16" (composed + localized by the caller). */
  reference: string;
  verseText: string;
  /** The user's note (the live draft shown in the editor). */
  note: string;
  /** Inner card width (px) used for the preview min height. */
  cardSize: number;
  onClose: () => void;
}

export const NoteImageModal: React.FC<NoteImageModalProps> = ({
  visible,
  reference,
  verseText,
  note,
  cardSize,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  const card = buildNoteCard(reference, verseText, note);

  const {
    templateIndex,
    setTemplateIndex,
    template,
    templates,
    texture,
    setTexture,
    isSharing,
    previewRef,
    handleShare,
  } = useShareImage({
    templates: SHARE_TEMPLATES,
    componentName: 'NoteImageModal',
    canShare: () => card.hasNote,
    onShared: onClose,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.container, {backgroundColor: colors.background}]}
        {...focusTrapProps()}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.close}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]}>
            {t.verse.shareAsImage}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || !card.hasNote}
            style={isSharing || !card.hasNote ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t.notes.shareImage}
            accessibilityState={{disabled: isSharing || !card.hasNote}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <ShareCardHost
              ref={previewRef}
              template={template}
              style={{minHeight: cardSize}}
              texture={texture}>
              <Ionicons
                name={template.icon as keyof typeof Ionicons.glyphMap}
                size={30}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text
                style={[styles.cardRef, {color: template.textColor}]}
                numberOfLines={2}>
                {card.reference}
              </Text>
              <Text
                style={[styles.cardVerse, {color: template.textColor}]}
                numberOfLines={5}>
                {`“${card.verseText}”`}
              </Text>

              <View
                style={[
                  styles.noteDivider,
                  {backgroundColor: template.textColor},
                ]}
              />
              <Text
                style={[styles.noteLabel, {color: template.textColor}]}
                numberOfLines={1}>
                {t.notes.note}
              </Text>
              <Text
                style={[styles.noteText, {color: template.textColor}]}
                numberOfLines={8}>
                {card.note}
              </Text>

              <View style={styles.brand}>
                <View
                  style={[
                    styles.brandDivider,
                    {backgroundColor: template.textColor},
                  ]}
                />
                <Text style={[styles.brandText, {color: template.textColor}]}>
                  Eternal Stone Bible
                </Text>
              </View>
            </ShareCardHost>
          </View>

          <PremiumShareExtras
            templates={templates}
            templateIndex={templateIndex}
            onSelectTemplate={setTemplateIndex}
            texture={texture}
            onSelectTexture={setTexture}
            isPremium={isPremium}
            onLockedAction={openOfferingSheet}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default NoteImageModal;

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scrollContent: {paddingBottom: spacing['4xl']},
  disabled: {opacity: 0.6},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {fontSize: fontSizes.lg, fontWeight: '700'},
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  cardRef: {fontSize: fontSizes['3xl'], fontWeight: '800'},
  cardVerse: {
    fontSize: fontSizes.base,
    fontStyle: 'italic',
    lineHeight: 24,
    marginTop: spacing.sm,
    opacity: 0.95,
    // Italic serif clips its last glyph on some OEMs (Sprint 94) — reserve a
    // few px so the painted right bearing clears the card's inner edge.
    paddingRight: verseTextRightSlack(fontSizes.base),
  },
  noteDivider: {
    width: 40,
    height: 2,
    opacity: 0.3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  noteLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: spacing.xs,
  },
  noteText: {fontSize: fontSizes.md, lineHeight: 26, fontWeight: '500'},
  brand: {marginTop: spacing.xl, alignItems: 'flex-start'},
  brandDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
});
