import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {staticColors} from '@/styles/designTokens';
import {useLanguage} from '@hooks/useLanguage';
import {logger} from '@lib/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it in the tree — without this, a
 * throw in any of the ~60 route screens produced a blank white screen with
 * no recovery path (only the native Crashlytics handler saw it, after the
 * fact). React error boundaries must be class components; the actual
 * fallback UI is a plain function component below so it can use hooks
 * (translated copy, in this case) freely.
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
      return <ErrorFallbackScreen onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallbackScreen({onRetry}: {onRetry: () => void}) {
  const {t} = useLanguage();
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
});
