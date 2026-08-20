/**
 * Tips & guides index — a single row in Ajustes that opens a full-screen
 * modal listing every `FeatureGuideModal` in
 * `src/lib/onboarding/featureGuides.ts`, so it stops eating vertical space
 * in the main Ajustes scroll (same consolidation pattern as GoalsSettings).
 * The list is driven entirely by `FEATURE_GUIDES`, so a new guide only
 * needs adding there — never here too. The per-guide `FeatureGuideModal`
 * stays a sibling of the outer list modal so it can render on top of it.
 */

import {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
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
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [openGuideId, setOpenGuideId] = useState<FeatureGuideId | null>(null);

  const openContent = openGuideId
    ? getFeatureGuideContent(openGuideId, t)
    : null;

  const guidesCard = (
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
            style={[styles.rowIcon, {backgroundColor: colors.primary + '15'}]}>
            <Ionicons name={guide.listIcon} size={20} color={colors.primary} />
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
  );

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

      <TouchableOpacity
        style={[
          styles.entryCard,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={() => {
          haptics.tap();
          setModalVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t.settings.tipsAndGuidesEntryTitle}>
        <View style={styles.entryRow}>
          <View style={styles.entryRowInfo}>
            <Text
              scaleRole="compact"
              style={[styles.label, {color: colors.text}]}>
              {t.settings.tipsAndGuidesEntryTitle}
            </Text>
            <Text
              scaleRole="compact"
              style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.tipsAndGuidesEntryDesc}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={[modalStyles.container, {backgroundColor: colors.background}]}
          {...focusTrapProps()}>
          <View style={[modalStyles.header, {paddingTop: insets.top + 10}]}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text
              scaleRole="display"
              style={[modalStyles.title, {color: colors.text}]}>
              {t.settings.tipsAndGuides}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            {guidesCard}
          </ScrollView>
        </View>
      </Modal>

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
  entryCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  entryRowInfo: {
    flex: 1,
    marginRight: 12,
  },
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

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
