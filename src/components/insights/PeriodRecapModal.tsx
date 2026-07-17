/**
 * 📅 PeriodRecapModal — "Tu año / trimestre en la Palabra" (Sprint 87).
 *
 * A shareable temporal recap: a scope toggle (this year / this quarter) over the
 * pure {@link buildPeriodRecap}, rendered onto a gradient template card through
 * the S56/77 captureRef → expo-sharing pipeline + the FREE imageTemplates
 * catalog (mirrors ConstancyImageModal). The owner passes the same per-day /
 * per-event sources the journey screen already loads; the recap recomputes
 * purely whenever the scope changes — nothing here does math.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
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
import {haptics} from '@lib/haptics';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useShareImage} from '@/features/share/useShareImage';
import {ShareCardHost} from '@/features/share/ShareCardHost';
import {PremiumShareExtras} from '@/features/share/PremiumShareExtras';
import {SHARE_TEMPLATES} from '@/features/share/imageTemplates';
import {
  buildPeriodRecap,
  type PeriodInput,
  type RecapPeriod,
} from '@/features/journey/periodRecap';
import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
} from '@/styles/designTokens';

export interface PeriodRecapModalProps {
  visible: boolean;
  input: PeriodInput;
  onClose: () => void;
}

const SCOPES: RecapPeriod[] = ['year', 'quarter'];

export const PeriodRecapModal: React.FC<PeriodRecapModalProps> = ({
  visible,
  input,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tp = t.periodRecap;
  const feelingNames = t.feelings.list as Record<string, {name: string}>;

  const [scope, setScope] = useState<RecapPeriod>('year');

  const recap = useMemo(
    () => buildPeriodRecap(input, scope, new Date()),
    [input, scope],
  );

  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

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
    componentName: 'PeriodRecapModal',
    canShare: () => recap.hasData,
    onShared: onClose,
  });

  const periodLabel =
    scope === 'year'
      ? String(recap.window.year)
      : tp.quarterLabel
          .replace('{{q}}', String(recap.window.quarter))
          .replace('{{year}}', String(recap.window.year));
  const title = scope === 'year' ? tp.yearTitle : tp.quarterTitle;

  // Stat rows, in order, dropping zero / absent metrics.
  const rows: {icon: keyof typeof Ionicons.glyphMap; text: string}[] = [];
  if (recap.versesRead > 0) {
    rows.push({
      icon: 'book',
      text: tp.versesRead.replace('{{n}}', String(recap.versesRead)),
    });
  }
  if (recap.activeDays > 0) {
    rows.push({
      icon: 'calendar',
      text: tp.activeDays.replace('{{n}}', String(recap.activeDays)),
    });
  }
  if (recap.versesMastered > 0) {
    rows.push({
      icon: 'sparkles',
      text: tp.mastered.replace('{{n}}', String(recap.versesMastered)),
    });
  }
  if (recap.versesHeard > 0) {
    rows.push({
      icon: 'headset',
      text: tp.listened.replace('{{n}}', String(recap.versesHeard)),
    });
  }
  if (recap.favoritesAdded > 0) {
    rows.push({
      icon: 'heart',
      text: tp.favorites.replace('{{n}}', String(recap.favoritesAdded)),
    });
  }
  if (recap.mood) {
    const name =
      feelingNames[recap.mood.dominantFeelingId]?.name ??
      recap.mood.dominantFeelingId;
    rows.push({icon: 'heart-half', text: tp.mood.replace('{{feeling}}', name)});
  }

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
          <Text style={[styles.headerTitle, {color: colors.text}]}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || !recap.hasData}
            style={isSharing || !recap.hasData ? styles.disabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t.share}
            accessibilityState={{disabled: isSharing || !recap.hasData}}>
            <Ionicons name="share-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Scope toggle. */}
        <View style={styles.scopeRow}>
          {SCOPES.map(s => {
            const active = s === scope;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  haptics.tap();
                  setScope(s);
                }}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                style={[
                  styles.scopeChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.scopeText,
                    {color: active ? colors.onPrimary : colors.textSecondary},
                  ]}>
                  {s === 'year' ? tp.scopeYear : tp.scopeQuarter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <ShareCardHost
              ref={previewRef}
              template={template}
              texture={texture}>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={template.textColor}
                style={styles.watermark}
              />
              <Text style={[styles.cardTitle, {color: template.textColor}]}>
                {title}
              </Text>
              <Text style={[styles.periodLabel, {color: template.textColor}]}>
                {periodLabel}
              </Text>

              {recap.hasData ? (
                rows.map(row => (
                  <View key={row.icon} style={styles.statRow}>
                    <Ionicons
                      name={row.icon}
                      size={16}
                      color={template.textColor}
                      style={styles.statIcon}
                    />
                    <Text
                      style={[styles.statText, {color: template.textColor}]}>
                      {row.text}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.statText, {color: template.textColor}]}>
                  {tp.empty}
                </Text>
              )}

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

export default PeriodRecapModal;

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
    paddingBottom: spacing.md,
  },
  headerTitle: {fontSize: fontSizes.lg, fontWeight: '700', flexShrink: 1},
  scopeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  scopeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  scopeText: {fontSize: fontSizes.sm, fontWeight: '700'},
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  watermark: {opacity: 0.4, marginBottom: spacing.md},
  cardTitle: {fontSize: fontSizes.lg, fontWeight: '700', opacity: 0.9},
  periodLabel: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  statRow: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm},
  statIcon: {marginRight: spacing.sm, opacity: 0.9},
  statText: {fontSize: fontSizes.md, fontWeight: '600', flexShrink: 1},
  brand: {marginTop: spacing.xl, alignItems: 'flex-start'},
  brandDivider: {width: 30, height: 2, marginBottom: spacing.sm, opacity: 0.3},
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
});
