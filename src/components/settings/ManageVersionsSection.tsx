/* eslint-disable react-native/no-unused-styles -- styles consumed via a
   theme-aware createStyles(colors, isDark) factory + nested render helpers,
   which the rule's static analysis can't trace (same pattern as settings.tsx). */
/**
 * Manage Versions — the downloadable translation-packs UI (translation packs,
 * phase 5). Lists the versions available to download (KJV, BSB), each with its
 * size + verse count, and a per-row action: Download (with a live progress bar),
 * Installed + Remove, or Retry on error. The version PICKER above stays
 * installed-only; this is where new translations come from.
 *
 * Self-contained section card — drops into the Settings screen. Honors the
 * Settings theme (all colors from useTheme), i18n via useLanguage.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {
  formatBytes,
  PackDownloadError,
  type RemotePackVersion,
} from '@lib/database/pack-catalog';
import {
  downloadAndImportPack,
  fetchVersionCatalog,
  removeInstalledVersion,
} from '@lib/database/version-download-service';

export default function ManageVersionsSection() {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {installedVersionIds, refreshInstalledVersions} = useBibleVersion();

  const [catalog, setCatalog] = useState<RemotePackVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Presence of an id => that version is downloading; the value is its [0,1]
  // progress fraction. Kept separate from rowError so a retry clears cleanly.
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<RemotePackVersion | null>(
    null,
  );

  const installed = new Set(installedVersionIds.map(id => id.toLowerCase()));

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setCatalog(await fetchVersionCatalog());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const messageForError = useCallback(
    (error: unknown): string => {
      const s = t.settings;
      if (error instanceof PackDownloadError) {
        switch (error.code) {
          case 'insufficient-space':
            return s.versionErrorSpace;
          case 'checksum-mismatch':
          case 'size-mismatch':
            return s.versionErrorChecksum;
          case 'network':
            return s.versionErrorNetwork;
          default:
            return s.versionErrorGeneric;
        }
      }
      return s.versionErrorGeneric;
    },
    [t],
  );

  const onDownload = useCallback(
    async (version: RemotePackVersion) => {
      haptics.tap();
      setRowError(prev => {
        const next = {...prev};
        delete next[version.id];
        return next;
      });
      setProgress(prev => ({...prev, [version.id]: 0}));
      try {
        await downloadAndImportPack(version, fraction =>
          setProgress(prev => ({...prev, [version.id]: fraction})),
        );
        await refreshInstalledVersions();
        haptics.success();
        toast.success(
          t.settings.versionDownloadSuccess.replace('{version}', version.name),
        );
      } catch (error) {
        const message = messageForError(error);
        setRowError(prev => ({...prev, [version.id]: message}));
        toast.error(message);
      } finally {
        setProgress(prev => {
          const next = {...prev};
          delete next[version.id];
          return next;
        });
      }
    },
    [messageForError, refreshInstalledVersions, t, toast],
  );

  const onDelete = useCallback((version: RemotePackVersion) => {
    haptics.tap();
    setDeleteTarget(version);
  }, []);

  const confirmDeleteVersion = useCallback(async () => {
    const version = deleteTarget;
    if (!version) return;
    setDeleteTarget(null);
    try {
      await removeInstalledVersion(version.id);
      await refreshInstalledVersions();
      haptics.success();
      toast.success(
        t.settings.versionDeleteSuccess.replace('{version}', version.name),
      );
    } catch {
      toast.error(t.settings.versionErrorGeneric);
    }
  }, [deleteTarget, refreshInstalledVersions, t, toast]);

  const styles = createStyles(colors);

  const renderMeta = (version: RemotePackVersion) => {
    const lang = version.language === 'es' ? 'Español' : 'English';
    const parts = [lang];
    if (version.year) parts.push(version.year);
    parts.push(formatBytes(version.bytes));
    if (version.verseCount > 0) {
      parts.push(`${version.verseCount.toLocaleString(language)}`);
    }
    return parts.join(' · ');
  };

  const renderAction = (version: RemotePackVersion) => {
    const isDownloading = version.id in progress;
    const isInstalled = installed.has(version.id.toLowerCase());
    const error = rowError[version.id];

    if (isDownloading) {
      const fraction = progress[version.id] ?? 0;
      const importing = fraction >= 1;
      return (
        <View style={styles.progressWrap} accessibilityRole="progressbar">
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.round(fraction * 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {importing
              ? t.settings.versionImporting
              : `${Math.round(fraction * 100)}%`}
          </Text>
        </View>
      );
    }

    if (isInstalled) {
      return (
        <View style={styles.installedRow}>
          <View style={styles.installedPill}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={styles.installedText}>
              {t.settings.versionInstalled}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onDelete(version)}
            accessibilityRole="button"
            accessibilityLabel={`${t.settings.versionDelete} ${version.name}`}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    }

    // Not installed (fresh, or after an error → label becomes Retry).
    return (
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => onDownload(version)}
        accessibilityRole="button"
        accessibilityLabel={`${
          error ? t.settings.manageVersionsRetry : t.settings.versionDownload
        } ${version.name}`}>
        <Ionicons
          name={error ? 'refresh' : 'cloud-download-outline'}
          size={18}
          color={colors.onPrimary}
        />
        <Text style={styles.downloadButtonText}>
          {error ? t.settings.manageVersionsRetry : t.settings.versionDownload}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t.settings.manageVersions}</Text>
      <Text style={styles.description}>
        {t.settings.manageVersionsDescription}
      </Text>

      {loading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.mutedText}>
            {t.settings.manageVersionsLoading}
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerColumn}>
          <Text style={styles.mutedText}>{t.settings.manageVersionsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={load}
            accessibilityRole="button"
            accessibilityLabel={t.settings.manageVersionsRetry}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.retryText}>
              {t.settings.manageVersionsRetry}
            </Text>
          </TouchableOpacity>
        </View>
      ) : catalog.length === 0 ? (
        <Text style={styles.mutedText}>{t.settings.manageVersionsEmpty}</Text>
      ) : (
        <View style={styles.list}>
          {catalog.map(version => (
            <View key={version.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <View style={styles.rowHeader}>
                  <Text style={styles.abbr}>{version.abbreviation}</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {version.name}
                  </Text>
                </View>
                <Text style={styles.meta}>{renderMeta(version)}</Text>
                {rowError[version.id] ? (
                  <Text style={styles.rowError}>{rowError[version.id]}</Text>
                ) : null}
              </View>
              <View style={styles.rowAction}>{renderAction(version)}</View>
            </View>
          ))}
        </View>
      )}

      {/* Themed delete confirm (UX audit, replaces native Alert.alert) */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={t.settings.versionDeleteTitle}
        message={
          deleteTarget
            ? t.settings.versionDeleteMessage.replace(
                '{version}',
                deleteTarget.name,
              )
            : ''
        }
        confirmLabel={t.settings.versionDeleteConfirm}
        cancelLabel={t.cancel}
        onConfirm={() => void confirmDeleteVersion()}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 12,
    },
    label: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    centerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    centerColumn: {
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 4,
    },
    mutedText: {
      fontSize: 13,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    list: {
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowInfo: {
      flex: 1,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    abbr: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
    },
    meta: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    rowError: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    rowAction: {
      minWidth: 96,
      alignItems: 'flex-end',
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    downloadButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onPrimary,
    },
    installedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    installedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    installedText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
    },
    iconButton: {
      padding: 8,
    },
    progressWrap: {
      alignItems: 'flex-end',
      gap: 4,
      width: 96,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
