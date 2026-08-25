/**
 * Funcionalidades index — a single row in Ajustes that opens a full-screen
 * modal listing the app's "V5.1" features (join a group, create a
 * devotional, widgets…), so it stops eating vertical space in the main
 * Ajustes scroll. Same consolidation pattern as `TipsAndGuidesSettings`
 * (which itself mirrors `GoalsSettings`): an entry card in the main scroll
 * opens a `Modal`, and each row inside still does its own `router.push` to
 * the feature's existing screen — nothing about those destinations changes.
 *
 * Insignias y Títulos is deliberately NOT listed here — the Logros tab
 * already links to the same /features/badges screen (Sprint 92 "single
 * source of truth" comment), so duplicating it here would just be a deeper,
 * more redundant path to the same place. Victor confirmed dropping it.
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
import {useRouter} from 'expo-router';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';

type FunctionalidadRoute =
  '/features/together' | '/features/devotional' | '/features/widgets';

interface FunctionalidadItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  route: FunctionalidadRoute;
}

export default function FunctionalidadesSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const ITEMS: FunctionalidadItem[] = [
    {
      id: 'together',
      icon: 'people',
      title: t.together.enterCode,
      description: t.together.joinFeatureDesc,
      route: '/features/together',
    },
    {
      id: 'devotional',
      icon: 'calendar',
      title: t.devotionalBuilder.entryTitle,
      description: t.devotionalBuilder.entryDesc,
      route: '/features/devotional',
    },
    {
      id: 'widgets',
      icon: 'apps',
      title: t.settingsV51.widgets,
      description: t.settingsV51.widgetsDesc,
      route: '/features/widgets',
    },
  ];

  const handlePress = (route: FunctionalidadRoute) => {
    haptics.tap();
    setModalVisible(false);
    router.push(route);
  };

  const itemsCard = (
    <View
      style={[
        styles.card,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        {backgroundColor: colors.surface},
      ]}>
      {ITEMS.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.row,
            index < ITEMS.length - 1 && [
              styles.rowDivider,
              {borderBottomColor: colors.border},
            ],
          ]}
          onPress={() => handlePress(item.route)}
          accessibilityRole="button"
          accessibilityLabel={item.title}>
          <View
            style={[styles.rowIcon, {backgroundColor: colors.primary + '15'}]}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.rowInfo}>
            <Text
              scaleRole="compact"
              style={[styles.label, {color: colors.text}]}>
              {item.title}
            </Text>
            <Text
              scaleRole="compact"
              style={[styles.description, {color: colors.textSecondary}]}>
              {item.description}
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
        <Ionicons name="sparkles" size={22} color={colors.accent} />
        <Text
          scaleRole="display"
          style={[styles.sectionTitle, {color: colors.text}]}>
          {t.settingsV51.title}
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
        accessibilityLabel={t.settingsV51.entryTitle}>
        <View style={styles.entryRow}>
          <View style={styles.entryRowInfo}>
            <Text
              scaleRole="compact"
              style={[styles.label, {color: colors.text}]}>
              {t.settingsV51.entryTitle}
            </Text>
            <Text
              scaleRole="compact"
              style={[styles.description, {color: colors.textSecondary}]}>
              {t.settingsV51.entryDesc}
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
              {t.settingsV51.title}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            {itemsCard}
          </ScrollView>
        </View>
      </Modal>
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
