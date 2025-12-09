import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/utils/ErrorLogger'; // Initialize error logger
import { initializeAPI } from './src/services/api';
import CustomSplashScreen from './src/components/SplashScreen';

import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
  const [isSplashReady, setIsSplashReady] = useState(false);
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

  // Splash screen göster - API hazır olana kadar
  useEffect(() => {
    // API hazır olduğunda ve minimum 2 saniye geçtiğinde splash'i kapat
    if (isAPIReady && !isSplashReady) {
      const timer = setTimeout(() => {
        setIsSplashReady(true);
      }, 2000); // Minimum 2 saniye göster

      return () => clearTimeout(timer);
    }
  }, [isAPIReady, isSplashReady]);

  if (!isSplashReady || !isAPIReady) {
    return (
      <SafeAreaProvider>
        <CustomSplashScreen onFinish={() => {}} />
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
