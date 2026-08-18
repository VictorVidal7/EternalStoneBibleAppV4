/**
 * Tips & guides index — a single Settings section that lists every
 * `FeatureGuideModal` in `src/lib/onboarding/featureGuides.ts` and opens
 * any of them directly, without needing to be on that feature's own
 * screen first. The list is driven entirely by `FEATURE_GUIDES`, so a new
 * guide only needs adding there — never here too.
 */

import {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {
  FEATURE_GUIDES,
  getFeatureGuideContent,
  type FeatureGuideId,
} from '@lib/onboarding/featureGuides';

export default function TipsAndGuidesSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const [openGuideId, setOpenGuideId] = useState<FeatureGuideId | null>(null);

  const openContent = openGuideId
    ? getFeatureGuideContent(openGuideId, t)
    : null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
        <Text
          scaleRole="display"
          style={[styles.sectionTitle, {color: colors.text}]}>
          {t.settings.tipsAndGuides}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        {FEATURE_GUIDES.map((guide, index) => (
          <TouchableOpacity
            key={guide.id}
            style={[
              styles.row,
              index < FEATURE_GUIDES.length - 1 && [
                styles.rowDivider,
                {borderBottomColor: colors.border},
              ],
            ]}
            onPress={() => {
              haptics.tap();
              setOpenGuideId(guide.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={guide.getLabel(t)}>
            <View
              style={[
                styles.rowIcon,
                {backgroundColor: colors.primary + '15'},
              ]}>
              <Ionicons
                name={guide.listIcon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowInfo}>
              <Text
                scaleRole="compact"
                style={[styles.label, {color: colors.text}]}>
                {guide.getLabel(t)}
              </Text>
              <Text
                scaleRole="compact"
                style={[styles.description, {color: colors.textSecondary}]}>
                {guide.getDescription(t)}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {openContent && (
        <FeatureGuideModal
          visible={!!openGuideId}
          onClose={() => setOpenGuideId(null)}
          {...openContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    padding: 8,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
