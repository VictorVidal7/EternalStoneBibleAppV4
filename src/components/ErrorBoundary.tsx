/**
 * ErrorBoundary - Componente para capturar y manejar errores en React
 * Proporciona una UI de fallback cuando ocurren errores y logging mejorado
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface ErrorBoundaryProps {
  /** Componentes hijos */
  children: ReactNode;

  /** Componente de fallback personalizado */
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;

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
          this.resetError
        );
      }

      // UI de fallback por defecto
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>😔 Algo salió mal</Text>
            <Text style={styles.subtitle}>
              Lo sentimos, ocurrió un error inesperado.
            </Text>

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Intentar de nuevo</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Detalles del error:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Stack trace:</Text>
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
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 300,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

export default ErrorBoundary;
