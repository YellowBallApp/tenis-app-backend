import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
}

const CustomSplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Web platformunda expo-splash-screen kullanma
    if (Platform.OS !== 'web') {
      // Hide native splash screen and show our custom one
      const hideNativeSplash = async () => {
        try {
          const SplashScreen = require('expo-splash-screen');
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('SplashScreen.hideAsync error:', e);
        }
      };

      hideNativeSplash();
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/egevlogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default CustomSplashScreen;

