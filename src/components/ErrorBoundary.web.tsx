import React, {Component, ErrorInfo, ReactNode, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {staticColors} from '@/styles/designTokens';
import {useLanguage} from '@hooks/useLanguage';
import {logger} from '@lib/utils/logger';
import {isStorageLockError} from '@lib/database/storageLockError';
import {clearWebStorageForLockRecovery} from '@lib/database/data-loader.web';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Web variant of ErrorBoundary.tsx. Native's generic "Reintentar" (a plain
 * state reset) is a real recovery for most render errors, but it's a dead
 * end for the OPFS storage-lock class (isStorageLockError): expo-sqlite's
 * web VFS worker keeps a module-level singleton that never retries after
 * its first failed lock acquisition (see storageLockError.ts's doc
 * comment), so anything short of an actual page reload hits the exact same
 * error again. Until now that recovery only existed in
 * app/_layout.web.tsx's own boot-time catch (the initializeBibleData()
 * await) — a storage-lock error thrown anywhere ELSE in the route tree
 * (e.g. reached by navigating straight into a reader route after the
 * initial boot already succeeded) fell through to this boundary's generic
 * fallback instead, which could never actually recover. This reuses the
 * exact same "Borrar datos y recargar" copy/flow app/_layout.web.tsx
 * already has for its own boot-time case.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled render error caught by ErrorBoundary', error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = (): void => {
    this.setState({error: null});
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallbackScreen error={this.state.error} onRetry={this.reset} />
      );
    }
    return this.props.children;
  }
}

function ErrorFallbackScreen({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const {t} = useLanguage();
  const [isClearingStorage, setIsClearingStorage] = useState(false);

  async function handleClearStorageAndReload() {
    setIsClearingStorage(true);
    try {
      await clearWebStorageForLockRecovery();
    } catch (clearError) {
      logger.error('Web storage clear error', clearError as Error, {
        component: 'ErrorBoundary',
        action: 'handleClearStorageAndReload',
      });
    } finally {
      window.location.reload();
    }
  }

  if (isStorageLockError(error)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.app.storageLockedTitle}</Text>
        <Text style={styles.message}>{t.app.storageLockedMessage}</Text>
        <TouchableOpacity
          style={styles.clearButton}
          disabled={isClearingStorage}
          onPress={handleClearStorageAndReload}
          accessibilityRole="button"
          accessibilityLabel={t.app.clearDataAndReload}>
          <Text style={styles.clearButtonText}>
            {isClearingStorage ? t.app.clearingData : t.app.clearDataAndReload}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.app.unexpectedErrorTitle}</Text>
      <Text style={styles.message}>{t.app.unexpectedErrorMessage}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t.app.retry}>
        <Text style={styles.retryButtonText}>{t.app.retry}</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>{t.app.errorHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: staticColors.accentRed,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: staticColors.grayDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: staticColors.brandBlue,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: staticColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 14,
    color: staticColors.grayTertiary,
    textAlign: 'center',
    marginTop: 16,
  },
  clearButton: {
    backgroundColor: staticColors.amber500,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: staticColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
