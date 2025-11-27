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

// Light Theme - Mevcut tenis teması
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32', // Koyu yeşil
    secondary: '#4CAF50',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1B1B1B',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1B1B1B',
    onSurface: '#1B1B1B',
    error: '#DC3545',
    placeholder: '#6C757D',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    outline: '#E0E0E0',
    surfaceVariant: '#F5F5F5',
  },
  roundness: 12,
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

