import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { errorLogger } from '../utils/ErrorLogger';
import { Button } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Log the error
    errorLogger.logError(error, errorInfo.componentStack);
    
    // Check if it's a boolean casting error
    if (
      error.message?.includes('Boolean') ||
      error.message?.includes('cast') ||
      error.stack?.includes('Boolean') ||
      error.stack?.includes('cast')
    ) {
      console.error('⚠️ BOOLEAN CASTING ERROR IN ERROR BOUNDARY:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleShowDetails = async () => {
    const logs = await errorLogger.getLogsAsString();
    Alert.alert(
      'Error Details',
      `Error: ${this.state.error?.message}\n\nFull logs available in console.`,
      [{ text: 'OK' }]
    );
    console.log('Full error logs:', logs);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚠️ Bir Hata Oluştu</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'Bilinmeyen bir hata oluştu'}
            </Text>
            
            {this.state.error?.message?.includes('Boolean') && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>Boolean Casting Hatası Tespit Edildi</Text>
                <Text style={styles.warningText}>
                  Bu hata, bir değerin yanlış tipe cast edilmesinden kaynaklanıyor olabilir.
                  Detaylı loglar konsola yazıldı.
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={this.handleReload}
                style={styles.button}
              >
                Yeniden Dene
              </Button>
              <Button
                mode="outlined"
                onPress={this.handleShowDetails}
                style={styles.button}
              >
                Detayları Göster
              </Button>
            </View>

            {__DEV__ && this.state.errorInfo && (
              <View style={styles.stackContainer}>
                <Text style={styles.stackTitle}>Stack Trace:</Text>
                <Text style={styles.stackText}>{this.state.error?.stack}</Text>
                <Text style={styles.stackTitle}>Component Stack:</Text>
                <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    marginVertical: 4,
  },
  stackContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

