/**
 * 📑 PrepExportFormatSheet — the export-format picker for a "Mesa de
 * preparación" (Tanda 3, pastors/teachers premium track).
 *
 * Mirrors `ConfirmDialog`'s themed Modal/overlay/card shell — the app's
 * established confirm/choice-sheet visual language — but offers 4 tappable
 * rows instead of two buttons, one per `PrepExportFormat`
 * ('manuscript' | 'outline' | 'handout' | 'discussion', see prepPdf.ts).
 * 'manuscript' stays free always; the other 3 are gated behind `isPremium` —
 * a locked row shows a lock badge and routes the tap to `onLockedAction`
 * instead of `onSelect`, so a locked tap never silently no-ops.
 *
 * Fully controlled, like `ShareStylePicker`/`ShareCardHost`: no
 * `usePremium()`/`useOfferingSheet()` calls in here. The screen that wires
 * this in (a later pass, `app/features/prep/index.tsx`) owns premium state
 * and decides what a locked tap does (typically opening the offering
 * sheet) — this component only presents the choice and reports it back.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import type {PrepExportFormat} from './prepPdf';

export interface PrepExportFormatSheetProps {
  visible: boolean;
  /** 'manuscript' is free regardless of this; every other row is gated by it. */
  isPremium: boolean;
  /** Fires with the chosen format when an unlocked row is tapped. */
  onSelect: (format: PrepExportFormat) => void;
  /** Fires INSTEAD of onSelect when a locked row is tapped. */
  onLockedAction: () => void;
  onClose: () => void;
}

interface FormatRowMeta {
  format: PrepExportFormat;
  icon: keyof typeof Ionicons.glyphMap;
  /** 'manuscript' is always free; every other row is premium-gated. */
  premium: boolean;
}

const FORMAT_ROWS: readonly FormatRowMeta[] = [
  {format: 'manuscript', icon: 'document-text-outline', premium: false},
  {format: 'outline', icon: 'list-outline', premium: true},
  {format: 'handout', icon: 'people-outline', premium: true},
  {format: 'discussion', icon: 'chatbubbles-outline', premium: true},
];

export const PrepExportFormatSheet: React.FC<PrepExportFormatSheetProps> = ({
  visible,
  isPremium,
  onSelect,
  onLockedAction,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const p = t.prepTable;

  const labels: Record<PrepExportFormat, string> = {
    manuscript: p.exportFormatManuscriptLabel,
    outline: p.exportFormatOutlineLabel,
    handout: p.exportFormatHandoutLabel,
    discussion: p.exportFormatDiscussionLabel,
  };
  const descriptions: Record<PrepExportFormat, string> = {
    manuscript: p.exportFormatManuscriptDesc,
    outline: p.exportFormatOutlineDesc,
    handout: p.exportFormatHandoutDesc,
    discussion: p.exportFormatDiscussionDesc,
  };

  const handlePress = (row: FormatRowMeta) => {
    haptics.tap();
    if (row.premium && !isPremium) {
      onLockedAction();
      return;
    }
    onSelect(row.format);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View
          style={[
            styles.card,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}
          {...focusTrapProps()}>
          <Text style={[styles.title, {color: colors.text}]}>
            {p.exportFormatSheetTitle}
          </Text>

          <View style={styles.rows}>
            {FORMAT_ROWS.map(row => {
              const locked = row.premium && !isPremium;
              return (
                <TouchableOpacity
                  key={row.format}
                  style={[
                    styles.row,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handlePress(row)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    locked
                      ? `${labels[row.format]} — ${t.offering.badgeA11y}`
                      : labels[row.format]
                  }>
                  <View
                    style={[
                      styles.rowIcon,
                      {backgroundColor: colors.primary + '1a'},
                    ]}>
                    <Ionicons
                      name={row.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, {color: colors.text}]}>
                      {labels[row.format]}
                    </Text>
                    <Text
                      style={[styles.rowDesc, {color: colors.textSecondary}]}>
                      {descriptions[row.format]}
                    </Text>
                  </View>
                  {locked && (
                    <View
                      style={[
                        styles.lockBadge,
                        {backgroundColor: colors.primary + '22'},
                      ]}>
                      <Ionicons
                        name="lock-closed"
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.closeButton, {borderColor: colors.border}]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={p.exportFormatCloseLabel}>
            <Text style={[styles.closeButtonText, {color: colors.text}]}>
              {p.exportFormatCloseLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PrepExportFormatSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  lockBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: 18,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
