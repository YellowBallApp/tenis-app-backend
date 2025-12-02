import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/utils/ErrorLogger'; // Initialize error logger
import { initializeAPI } from './src/services/api';

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
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Uygulama başlarken IP keşfini tamamla
    const setupAPI = async () => {
      try {
        console.log('📱 Uygulama başlatılıyor - IP keşfi yapılıyor...');
        await initializeAPI();
        console.log('✅ IP keşfi tamamlandı - Uygulama hazır');
        setIsAPIReady(true);
      } catch (error: any) {
        console.error('❌ API başlatma hatası:', error);
        setApiError(error.message || 'Backend sunucusuna bağlanılamıyor');
        // Hataya rağmen devam et (localhost ile deneyecek)
        setIsAPIReady(true);
      }
    };

    setupAPI();
  }, []);

  // API hazır olana kadar loading göster
  if (!isAPIReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 16, color: '#fff', fontSize: 16 }}>
            Backend sunucusu aranıyor...
          </Text>
          <Text style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
            IP adresi otomatik keşfediliyor
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

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
