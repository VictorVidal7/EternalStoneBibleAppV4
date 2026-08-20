/**
 * Consolidated data-management entry point: a single row in Ajustes that
 * opens a full-screen modal containing export / import / reset actions,
 * replacing what used to be three separate cards permanently inline — the
 * same consolidation NotificationsSettings/GoalsSettings already did for
 * their own sections.
 *
 * Owns 100% of its own async state (export/import/reset in-flight flags,
 * the two confirm dialogs, and the pending-import-URI ref) — nothing is
 * threaded down from settings.tsx as props.
 *
 * The honest partial-failure handling on export/import (`degradedSections` /
 * `failedSections`) is preserved verbatim — it's deliberate, not incidental:
 * a transient SQLite/AsyncStorage read/write error during export or import
 * surfaces a "partial" toast instead of a false "success" toast or a full
 * abort. See BackupService for the underlying honest-degradation contract.
 */

import {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {staticColors} from '@/styles/designTokens';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {logger} from '@lib/utils/logger';
import {initializeBibleData, resetBibleData} from '@lib/database/data-loader';
import {
  exportBackup,
  pickBackupFileUri,
  readBackupFileFromUri,
  parseBackupPayload,
  importBackup,
} from '@/services/BackupService';

export default function DataSettings() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [importConfirmVisible, setImportConfirmVisible] = useState(false);
  const pendingImportUriRef = useRef<string | null>(null);

  function handleResetData() {
    setResetConfirmVisible(true);
  }

  async function performResetData() {
    setResetConfirmVisible(false);
    setIsResetting(true);
    try {
      await resetBibleData();
      // The reset clears the verse tables and flags; reload right
      // away so the user lands on a working app instead of having
      // to close-and-reopen the way the old success copy demanded.
      await initializeBibleData();
      toast.success(t.settings.resetSuccessMessage);
    } catch {
      toast.error(t.settings.resetError);
    } finally {
      setIsResetting(false);
    }
  }

  async function handleExportBackup() {
    setIsExporting(true);
    try {
      haptics.press();
      const result = await exportBackup();
      // A transient SQLite/AsyncStorage read error during export falls back
      // to an empty value per-section rather than aborting the whole file —
      // `degradedSections` is how that's surfaced instead of a backup file
      // that silently looks complete while actually missing real data.
      if (result.degradedSections.length > 0) {
        logger.warn('Backup export completed with degraded sections', {
          component: 'DataSettings',
          action: 'handleExportBackup',
          degradedSections: result.degradedSections,
        });
        toast.warning(t.settings.exportPartial);
      }
    } catch (error) {
      toast.error(t.settings.exportError);
      void error;
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePickImportFile() {
    if (isImporting) return;
    try {
      haptics.press();
      const uri = await pickBackupFileUri();
      if (!uri) return; // user cancelled the picker
      pendingImportUriRef.current = uri;
      setImportConfirmVisible(true);
    } catch (error) {
      toast.error(t.settings.importError);
      void error;
    }
  }

  async function performImport() {
    setImportConfirmVisible(false);
    const uri = pendingImportUriRef.current;
    pendingImportUriRef.current = null;
    if (!uri) return;
    setIsImporting(true);
    try {
      const raw = await readBackupFileFromUri(uri);
      const payload = parseBackupPayload(raw);
      const result = await importBackup(payload);
      // `importBackup` RESOLVES (never rejects) for the two honest-partial-
      // failure cases: a corrupted-but-structurally-valid section where
      // every row failed validation (left untouched rather than wiped), and
      // the rarer case where SQLite already committed but the subsequent
      // AsyncStorage write step then failed outright. Either way,
      // `failedSections` is non-empty and a flat "success" toast would be a
      // lie — surface the honest, non-alarming partial message instead.
      if (result.failedSections.length > 0) {
        logger.warn('Backup import completed with partial failures', {
          component: 'DataSettings',
          action: 'performImport',
          failedSections: result.failedSections,
          asyncStorageWriteFailed: result.asyncStorageWriteFailed,
        });
        toast.warning(t.settings.importPartial);
      } else {
        toast.success(t.settings.importSuccess);
      }
    } catch (error) {
      logger.error('Backup import failed', error as Error, {
        component: 'DataSettings',
        action: 'performImport',
      });
      toast.error(t.settings.importError);
    } finally {
      setIsImporting(false);
    }
  }

  const actionsContent = (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={() => void handleExportBackup()}
        disabled={isExporting}
        accessibilityRole="button"
        accessibilityLabel={t.settings.exportBackup}>
        <View style={styles.actionRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.actionLabel, {color: colors.primary}]}>
              {isExporting ? t.settings.exporting : t.settings.exportBackup}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.exportBackupDescription}
            </Text>
          </View>
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.card,
          styles.cardWithMargin,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={() => void handlePickImportFile()}
        disabled={isImporting}
        accessibilityRole="button"
        accessibilityLabel={t.settings.importBackup}>
        <View style={styles.actionRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.actionLabel, {color: colors.primary}]}>
              {isImporting ? t.settings.importing : t.settings.importBackup}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.importBackupDescription}
            </Text>
          </View>
          <Ionicons
            name="cloud-download-outline"
            size={20}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.card,
          styles.cardWithMargin,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}
        onPress={handleResetData}
        disabled={isResetting}
        accessibilityRole="button"
        accessibilityLabel={t.settings.resetData}>
        <View style={styles.actionRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.actionLabel, {color: colors.error}]}>
              {isResetting ? t.settings.resetting : t.settings.resetData}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.resetDescription}
            </Text>
          </View>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="server-outline" size={22} color={colors.primary} />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.settings.data}
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
        accessibilityLabel={t.settings.dataEntryTitle}>
        <View style={styles.entryRow}>
          <View style={styles.rowInfo}>
            <Text style={[styles.label, {color: colors.text}]}>
              {t.settings.dataEntryTitle}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {t.settings.dataEntryDesc}
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
              {t.settings.data}
            </Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            {actionsContent}
          </ScrollView>
        </View>
      </Modal>

      {/* Themed confirms (UX audit, replace native Alert.alert) */}
      <ConfirmDialog
        visible={resetConfirmVisible}
        title={t.settings.resetTitle}
        message={t.settings.resetMessage}
        confirmLabel={t.settings.resetConfirm}
        cancelLabel={t.cancel}
        onConfirm={() => void performResetData()}
        onCancel={() => setResetConfirmVisible(false)}
        destructive
      />
      <ConfirmDialog
        visible={importConfirmVisible}
        title={t.settings.importConfirmTitle}
        message={t.settings.importConfirmMessage}
        confirmLabel={t.settings.importConfirmCta}
        cancelLabel={t.cancel}
        onConfirm={() => void performImport()}
        onCancel={() => {
          pendingImportUriRef.current = null;
          setImportConfirmVisible(false);
        }}
        destructive
        icon="cloud-download-outline"
      />
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
