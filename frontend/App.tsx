import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

// Tenis uygulaması için özel tema
const tennisTheme = {
  colors: {
    primary: '#2E7D32', // Koyu yeşil - ana renk
    secondary: '#4CAF50', // Orta yeşil - ikincil renk
    accent: '#81C784', // Açık yeşil - vurgu rengi
    background: '#FFFFFF', // Beyaz - ana arka plan
    surface: '#F8F9FA', // Çok açık gri - kart arka planı
    text: '#1B1B1B', // Koyu gri - ana metin
    placeholder: '#6C757D', // Orta gri - placeholder metin
    error: '#DC3545', // Kırmızı - hata rengi
    success: '#28A745', // Yeşil - başarı rengi
    warning: '#FFC107', // Sarı - uyarı rengi
    info: '#17A2B8', // Mavi - bilgi rengi
    disabled: '#ADB5BD', // Açık gri - devre dışı
    border: '#E9ECEF', // Çok açık gri - kenarlık
    card: '#FFFFFF', // Beyaz - kart arka planı
    notification: '#FF6B6B', // Mercan - bildirim rengi
    onPrimary: '#FFFFFF', // Beyaz - ana renk üzerindeki metin
    onSecondary: '#FFFFFF', // Beyaz - ikincil renk üzerindeki metin
    onBackground: '#1B1B1B', // Koyu gri - arka plan üzerindeki metin
    onSurface: '#1B1B1B', // Koyu gri - yüzey üzerindeki metin
    // React Native Paper için gerekli ek renkler
    elevation: {
      level0: 'transparent',
      level1: 'rgba(0, 0, 0, 0.05)',
      level2: 'rgba(0, 0, 0, 0.07)',
      level3: 'rgba(0, 0, 0, 0.08)',
      level4: 'rgba(0, 0, 0, 0.09)',
      level5: 'rgba(0, 0, 0, 0.11)',
    },
    surfaceVariant: '#F8F9FA',
    onSurfaceVariant: '#1B1B1B',
    outline: '#E9ECEF',
    outlineVariant: '#F8F9FA',
    inverseSurface: '#1B1B1B',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#81C784',
    shadow: 'rgba(0, 0, 0, 0.1)',
    scrim: 'rgba(0, 0, 0, 0.32)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    // bodySmall variant'ı için
    bodySmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 12,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 16,
    },
    labelSmall: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 11,
    },
    labelMedium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 12,
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
    },
    titleSmall: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
    },
    titleMedium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 16,
    },
    titleLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 22,
    },
    headlineSmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 24,
    },
    headlineMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 28,
    },
    headlineLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 32,
    },
  },
  roundness: 12,
};

export default function App() {
  return (
    <PaperProvider theme={tennisTheme}>
      <AppNavigator />
    </PaperProvider>
  );
}
