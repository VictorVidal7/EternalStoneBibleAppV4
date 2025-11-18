/**
 * 🛡️ ERROR BOUNDARY
 *
 * Componente para capturar y manejar errores en React.
 * Proporciona una UI de fallback cuando ocurren errores, logging mejorado
 * y soporte para temas y accesibilidad.
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React, {Component, ErrorInfo, ReactNode} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface ErrorBoundaryProps {
  /** Componentes hijos */
  children: ReactNode;

  /** Componente de fallback personalizado */
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    reset: () => void,
  ) => ReactNode;

  /** Callback cuando ocurre un error */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Callback para reportar errores (ej: Sentry) */
  onErrorReport?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary para capturar errores en componentes React
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={handleError}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error
    console.error('ErrorBoundary capturó un error:', error, errorInfo);

    // Guardar información del error
    this.setState({
      error,
      errorInfo,
    });

    // Llamar callback de error si existe
    this.props.onError?.(error, errorInfo);

    // Reportar a servicio de tracking (ej: Sentry)
    this.props.onErrorReport?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.resetError,
        );
      }

      // UI de fallback por defecto
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>

            {/* Texts */}
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              We're sorry, an unexpected error occurred. Please try again.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={this.resetError}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Retry loading the content">
              <Ionicons
                name="refresh"
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Error Details (Dev Only) */}
            {__DEV__ && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/* eslint-disable react-native/no-color-literals */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 300,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

export default ErrorBoundary;
