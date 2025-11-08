import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Dinamik tema stillerini sağlayan custom hook
 * Tüm ekranlar bu hook'u kullanarak tema değişikliklerine tepki verebilir
 */
export const useThemedStyles = () => {
  const { theme } = useTheme();

  const themedStyles = StyleSheet.create({
    // Container stilleri
    container: {
      backgroundColor: theme.colors.background,
    },
    
    // Card stilleri
    card: {
      backgroundColor: theme.colors.surface,
    },
    
    // Text stilleri
    text: {
      color: theme.colors.text,
    },
    
    title: {
      color: theme.colors.text,
    },
    
    subtitle: {
      color: theme.colors.placeholder,
    },
    
    // Section title
    sectionTitle: {
      color: theme.colors.text,
    },
    
    // Input stilleri
    input: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    
    // Stat card text
    statNumber: {
      color: theme.colors.text,
    },
    
    statLabel: {
      color: theme.colors.placeholder,
    },
  });

  return { themedStyles, theme };
};

