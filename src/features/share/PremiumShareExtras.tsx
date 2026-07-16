/**
 * 🎨 PremiumShareExtras — Tanda M3 foundation.
 *
 * Extends the 12 non-verse "share as image" screens (Achievement, Challenge,
 * Testimony, Constancy, Highlights, Mood, Timeline, WeeklyRecap,
 * PeriodRecap, Note, Collection, Compare) with the same three
 * offering-unlocked extras the flagship `ImageShareModal` already has:
 * premium templates (lock-badged), premium textures (lock-badged), and a
 * "Mis estilos" saved-preset row — using the reduced `CompactStylePreset`
 * shape (template + texture only, no font/alignment/aspect) since these
 * screens share charts/rings/bars with no verse text to typeset.
 *
 * Mirrors `ImageShareModal.tsx`'s own template row / texture row / preset
 * row markup (lock badges, `leaf-outline` icon, `t.offering.badgeA11y`
 * suffix) rather than the free-tier `ShareStylePicker`, which has no
 * lock-badge support and is intentionally left untouched — 11 free-only
 * screens still use it as-is.
 *
 * Fully controlled from outside: this component does NOT call
 * `usePremium()` or `useOfferingSheet()` itself — the calling screen owns
 * that state and passes `isPremium` + `onLockedAction` down, so this stays
 * simple to render/test in isolation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {
  spacing,
  fontSize as fontSizes,
  borderRadius,
  staticColors,
} from '@/styles/designTokens';
import {isTemplateUnlocked, type ShareTemplate} from './imageTemplates';
import {SHARE_TEXTURES, isTextureUnlocked, type ShareTexture} from './textures';
import {
  getCompactStylePresets,
  saveCompactStylePreset,
  deleteCompactStylePreset,
} from './compactStylePresetsStore';
import type {CompactStylePreset} from './compactStylePresets';

export interface PremiumShareExtrasProps {
  /** Catalog to render in the template row (free-only or free+premium). */
  templates: readonly ShareTemplate[];
  templateIndex: number;
  onSelectTemplate: (index: number) => void;
  texture: ShareTexture;
  onSelectTexture: (texture: ShareTexture) => void;
  isPremium: boolean;
  /** Routes a locked tap (template, texture, or "save current look"). */
  onLockedAction: () => void;
}

export const PremiumShareExtras: React.FC<PremiumShareExtrasProps> = ({
  templates,
  templateIndex,
  onSelectTemplate,
  texture,
  onSelectTexture,
  isPremium,
  onLockedAction,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();

  // Matches ImageShareModal's own `selectedTextColor` — the active texture
  // icon/label swaps to `primaryDark` in dark mode instead of `primary`.
  const selectedTextColor = isDark ? colors.primaryDark : colors.primary;

  const [savedPresets, setSavedPresets] = useState<CompactStylePreset[]>([]);

  // Load once on mount — this component is the sole writer of compact
  // presets (save/delete below keep `savedPresets` in sync locally), so
  // there's no external source for the list to drift from within a session.
  useEffect(() => {
    getCompactStylePresets().then(setSavedPresets);
  }, []);

  // Mirrors the flagship's own revert-on-premium-loss pattern for the
  // texture overlay (every texture but 'none' is offering-unlocked) — see
  // `ImageShareModal.tsx`'s equivalent effect.
  useEffect(() => {
    if (!isPremium && texture !== 'none') {
      onSelectTexture('none');
    }
  }, [isPremium, texture]);

  function handleSelectTemplate(template: ShareTemplate, index: number) {
    haptics.tap();
    if (!isTemplateUnlocked(template, isPremium)) {
      onLockedAction();
      return;
    }
    onSelectTemplate(index);
  }

  function handleSelectTexture(option: ShareTexture) {
    haptics.tap();
    if (!isTextureUnlocked(option, isPremium)) {
      onLockedAction();
      return;
    }
    onSelectTexture(option);
  }

  function handleSavePreset() {
    haptics.tap();
    if (!isPremium) {
      onLockedAction();
      return;
    }
    const activeTemplate = templates[templateIndex];
    saveCompactStylePreset({
      templateId: activeTemplate?.id ?? '',
      texture,
    }).then(next => {
      setSavedPresets(next);
      toast.success(t.verse.imageStyleSaved);
    });
  }

  function handleApplyPreset(preset: CompactStylePreset) {
    haptics.tap();
    const index = templates.findIndex(tpl => tpl.id === preset.templateId);
    if (index >= 0) onSelectTemplate(index);
    if (isTextureUnlocked(preset.texture, isPremium)) {
      onSelectTexture(preset.texture);
    }
  }

  function handleDeletePreset(id: string) {
    haptics.tap();
    deleteCompactStylePreset(id).then(setSavedPresets);
  }

  return (
    <View>
      {/* (a) Template row — mirrors ImageShareModal's SHARE_TEMPLATES.map */}
      <View style={styles.optionsContainer}>
        <Text style={[styles.optionsTitle, {color: colors.textSecondary}]}>
          {t.verse.imageStyle}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsRow}>
          {templates.map((tpl, index) => {
            const unlocked = isTemplateUnlocked(tpl, isPremium);
            const selected = index === templateIndex;
            return (
              <TouchableOpacity
                key={tpl.id}
                onPress={() => handleSelectTemplate(tpl, index)}
                accessibilityRole="button"
                accessibilityState={{selected}}
                accessibilityLabel={
                  t.verse.imageStyleA11y.replace('{{n}}', String(index + 1)) +
                  (unlocked ? '' : ` · ${t.offering.badgeA11y}`)
                }
                style={[
                  styles.styleCircle,
                  selected && styles.styleCircleSelected,
                  selected && {borderColor: colors.primary},
                ]}>
                <LinearGradient
                  colors={tpl.colors}
                  style={styles.styleCircleGradient}>
                  <Ionicons
                    name={tpl.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={tpl.textColor}
                  />
                </LinearGradient>
                {!unlocked && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="leaf-outline" size={11} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* (b) Texture row — mirrors ImageShareModal's SHARE_TEXTURES.map */}
      <View style={styles.optionSection}>
        <View style={styles.optionTitleRow}>
          <Text
            style={[
              styles.optionsTitle,
              styles.noMarginBottom,
              {color: colors.textSecondary},
            ]}>
            {t.verse.imageTexture}
          </Text>
          <View
            style={[
              styles.exclusiveBadge,
              {backgroundColor: colors.primary + '1a'},
            ]}>
            <Text style={[styles.exclusiveText, {color: colors.primary}]}>
              {t.verse.exclusiveLabel}
            </Text>
          </View>
        </View>
        <View style={styles.optionsRow}>
          {SHARE_TEXTURES.map(option => {
            const active = texture === option;
            const locked = !isTextureUnlocked(option, isPremium);
            const label =
              option === 'none'
                ? t.verse.imageTextureNone
                : option === 'dots'
                  ? t.verse.imageTextureDots
                  : option === 'lines'
                    ? t.verse.imageTextureLines
                    : t.verse.imageTextureGrain;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleSelectTexture(option)}
                accessibilityRole="button"
                accessibilityLabel={
                  locked ? `${label} · ${t.offering.badgeA11y}` : label
                }
                accessibilityState={{selected: active}}
                style={[
                  styles.sizeButton,
                  styles.flex1,
                  styles.formatButton,
                  active && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                  },
                ]}>
                <Ionicons
                  name={
                    option === 'none'
                      ? 'close-outline'
                      : option === 'dots'
                        ? 'ellipsis-horizontal'
                        : option === 'lines'
                          ? 'reorder-four-outline'
                          : 'sparkles-outline'
                  }
                  size={20}
                  color={active ? selectedTextColor : colors.text}
                />
                <Text
                  style={[
                    styles.formatLabel,
                    {color: active ? selectedTextColor : colors.text},
                  ]}>
                  {label}
                </Text>
                {locked && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="leaf-outline" size={11} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* (c) "Mis estilos" row — mirrors ImageShareModal's preset row, using
          the reduced CompactStylePreset (template + texture only). */}
      <View style={styles.optionSection}>
        <View style={styles.optionTitleRow}>
          <Text
            style={[
              styles.optionsTitle,
              styles.noMarginBottom,
              {color: colors.textSecondary},
            ]}>
            {t.verse.imageMyStyles}
          </Text>
          <View
            style={[
              styles.exclusiveBadge,
              {backgroundColor: colors.primary + '1a'},
            ]}>
            <Text style={[styles.exclusiveText, {color: colors.primary}]}>
              {t.verse.exclusiveLabel}
            </Text>
          </View>
        </View>
        {isPremium && savedPresets.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsRow}>
            {savedPresets.map(preset => {
              // Mirrors ImageShareModal's BUG-7 fix: only apply the
              // localized "Style {{n}}" template to a plain-ordinal name
              // (what this store always writes) — a defensive fallback in
              // case a future migration ever carries over a non-ordinal
              // legacy name, same guard as the flagship's own preset row.
              const isOrdinal = /^\d+$/.test(preset.name);
              const presetLabel = isOrdinal
                ? t.verse.imageStyleA11y.replace('{{n}}', preset.name)
                : preset.name;
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => handleApplyPreset(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={presetLabel}
                  style={[
                    styles.sizeButton,
                    styles.presetChip,
                    {borderColor: colors.border},
                  ]}>
                  <Text style={[styles.formatLabel, {color: colors.text}]}>
                    {presetLabel}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeletePreset(preset.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t.verse.imageDeletePreset}
                    hitSlop={8}
                    style={styles.presetDelete}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
        <TouchableOpacity
          onPress={handleSavePreset}
          accessibilityRole="button"
          accessibilityLabel={
            isPremium
              ? t.verse.imageSavePreset
              : `${t.verse.imageSavePreset} · ${t.offering.badgeA11y}`
          }
          style={[styles.saveStyleButton, {borderColor: colors.primary}]}>
          {!isPremium && (
            <Ionicons name="leaf-outline" size={14} color={colors.primary} />
          )}
          <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
          <Text style={[styles.saveStyleText, {color: colors.primary}]}>
            {t.verse.imageSavePreset}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PremiumShareExtras;

const styles = StyleSheet.create({
  optionsContainer: {
    paddingTop: spacing.md,
  },
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  optionSection: {
    marginTop: spacing.lg,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  noMarginBottom: {
    marginBottom: 0,
  },
  styleCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: staticColors.transparent,
  },
  styleCircleSelected: {borderWidth: 3},
  styleCircleGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: staticColors.overlayBlack65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sizeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: staticColors.transparent,
    backgroundColor: staticColors.overlayBlack05,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  flex1: {
    flex: 1,
  },
  formatButton: {
    position: 'relative',
    flexDirection: 'column',
    paddingVertical: spacing.md,
  },
  formatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  presetDelete: {
    marginLeft: 2,
  },
  saveStyleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  saveStyleText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});
