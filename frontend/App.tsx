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
        
        // Timeout ile API başlatma - 5 saniye içinde tamamlanmazsa devam et
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            console.warn('⚠️ API başlatma timeout - Uygulama devam ediyor');
            resolve(null);
          }, 5000); // 5 saniye timeout
        });
        
        const apiPromise = initializeAPI();
        
        // İlk tamamlanan promise'i bekle
        await Promise.race([apiPromise, timeoutPromise]);
        
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
    // API hazır olduğunda hemen splash'i kapat (minimum gösterim süresi kaldırıldı)
    if (isAPIReady && !isSplashReady) {
      // Kısa bir delay ile smooth geçiş için (100ms)
      const timer = setTimeout(() => {
        setIsSplashReady(true);
      }, 100);

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
