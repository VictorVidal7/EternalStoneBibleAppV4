/**
 * Consolidated accessibility entry point: a single row in Ajustes that opens
 * a full-screen modal containing the app's three accessibility toggles (keep
 * screen awake while reading, app-wide high contrast, reduce animations),
 * replacing what used to be three separate cards permanently inline — the
 * same consolidation NotificationsSettings/GoalsSettings already did for
 * their own sections.
 *
 * Purely a presentation consolidation: each toggle is still owned and
 * persisted by its existing context/hook (ReaderPreferencesContext,
 * useTheme, AccessibilityPreferencesContext) — this component only reads
 * and writes them, same copy and same behavior as before the move.
 */

import {useState} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useReaderPreferences} from '@context/ReaderPreferencesContext';
import {useAccessibilityPreferences} from '@context/AccessibilityPreferencesContext';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';

export default function AccessibilitySettings() {
  const {colors, isDark, highContrast, setHighContrast} = useTheme();
  const {t} = useLanguage();
  const {preferences: readerPrefs, setKeepScreenAwake} = useReaderPreferences();
  const {reduceMotionOverride, setReduceMotionOverride} =
    useAccessibilityPreferences();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  const controlsCard = (
    <>
      {/* Keep screen on while reading (UX review) — moved from Apariencia */}
      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>
              {t.settings.keepAwakeTitle}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                {color: colors.textSecondary},
              ]}>
              {t.settings.keepAwakeDescription}
            </Text>
          </View>
          <Switch
            value={readerPrefs.keepScreenAwake}
            onValueChange={next => {
              haptics.tap();
              setKeepScreenAwake(next);
            }}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={staticColors.white}
            accessibilityLabel={t.settings.keepAwakeTitle}
          />
        </View>
      </View>

      {/* App-wide high contrast (T15 — #9) */}
      <View
        style={[
          styles.card,
          styles.cardWithMargin,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>
              {t.settings.highContrastTitle}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                {color: colors.textSecondary},
              ]}>
              {t.settings.highContrastDescription}
            </Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={next => {
              haptics.tap();
              void setHighContrast(next);
            }}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={staticColors.white}
            accessibilityLabel={t.settings.highContrastTitle}
          />
        </View>
        <Text
          style={[
            styles.settingDescription,
            styles.highContrastReaderNote,
            {color: colors.textSecondary},
          ]}>
          {t.settings.highContrastReaderNote}
        </Text>
      </View>

      {/* Reduce animations override (T15 — #9) */}
      <View
        style={[
          styles.card,
          styles.cardWithMargin,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>
              {t.settings.reduceMotionTitle}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                {color: colors.textSecondary},
              ]}>
              {t.settings.reduceMotionDescription}
            </Text>
          </View>
          <Switch
            value={reduceMotionOverride}
            onValueChange={next => {
              haptics.tap();
              void setReduceMotionOverride(next);
            }}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={staticColors.white}
            accessibilityLabel={t.settings.reduceMotionTitle}
          />
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="accessibility-outline"
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.settings.accessibility}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t.settings.accessibilityEntryTitle}>
        <View style={styles.entryRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.settings.accessibilityEntryTitle}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.accessibilityEntryDesc}
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
            <Text style={[modalStyles.title, {color: colors.text}]}>
              {t.settings.accessibility}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            {controlsCard}
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
    padding: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardWithMargin: {
    marginTop: 16,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  highContrastReaderNote: {
    marginTop: 10,
    fontStyle: 'italic',
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
