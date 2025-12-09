import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AppState } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: any; // Simplified type for theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Light Theme - EGEV Tennis App UI/UX Design
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#54CE8F', // Primary Green (butonlar, aksan renkler)
    secondary: '#B4AEBD', // Primary Purple (header'lar)
    background: '#FAFCFB', // Background color
    surface: '#FFFFFF', // Card backgrounds
    text: '#030213', // Dark text
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#030213',
    onSurface: '#030213',
    error: '#DC3545',
    placeholder: '#717182', // Medium gray text
    backdrop: 'rgba(0, 0, 0, 0.5)',
    outline: '#E5E7EB', // Border color
    surfaceVariant: '#F3F4F6', // Muted backgrounds
    // Additional colors from design system
    purple: '#B4AEBD', // Primary purple for headers
    green: '#54CE8F', // Primary green for buttons
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray900: '#1F2937',
  },
  roundness: 10, // rounded-2xl equivalent
};

// Dark Theme - Yumuşak karanlık tenis teması
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#66BB6A', // Yumuşak yeşil
    secondary: '#A5D6A7', // Daha açık yeşil
    background: '#1A1A1A', // Yumuşak koyu gri (siyah değil)
    surface: '#2D2D2D', // Orta ton koyu gri
    text: '#E0E0E0', // Yumuşak açık gri
    onPrimary: '#FFFFFF',
    onSecondary: '#1A1A1A',
    onBackground: '#E0E0E0',
    onSurface: '#E0E0E0',
    error: '#EF9A9A', // Yumuşak kırmızı
    placeholder: '#B0B0B0', // Daha açık gri
    backdrop: 'rgba(0, 0, 0, 0.6)',
    outline: '#404040', // Yumuşak kenarlık
    surfaceVariant: '#383838', // Varyant yüzey
  },
  roundness: 12,
};

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
        console.log('📱 Tema tercihi yüklendi:', savedTheme);
      }
    } catch (error) {
      console.error('Tema tercihi yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      const themeValue = newMode ? 'dark' : 'light';
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeValue);
      console.log('🌓 Tema değiştirildi:', themeValue);
    } catch (error) {
      console.error('Tema kaydedilirken hata:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

