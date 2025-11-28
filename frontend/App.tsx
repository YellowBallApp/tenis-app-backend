import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/utils/ErrorLogger'; // Initialize error logger

import { ErrorBoundary } from './src/components/ErrorBoundary';

// ThemeProvider içinde olması gerektiği için AppContent component'i oluşturuyoruz
const AppContent = () => {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ErrorBoundary>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
