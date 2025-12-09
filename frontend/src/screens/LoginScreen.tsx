import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { clearAuthTokens } from '../utils/clearStorage';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sayfa açıldığında token'ları kontrol et ve gerekirse temizle
  React.useEffect(() => {
    const initializeLogin = async () => {
      const hasToken = await AsyncStorage.getItem('accessToken');
      if (hasToken) {
        console.log('⚠️  Login ekranında ama token var - muhtemelen geçersiz, temizleniyor...');
        await clearAuthTokens();
        setError(t('auth.sessionExpired'));
      }
    };
    
    initializeLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigation.replace('Main');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = t('auth.loginFailed');
      
      if (err.message?.includes('Network') || err.message?.includes('timeout') || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        errorMessage = t('auth.connectionError');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = err.response?.data?.message || t('auth.invalidCredentials');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title Section */}
        <View style={styles.headerSection}>
          <Image 
            source={require('../../assets/egevlogo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('auth.signInToContinue')}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Email or Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.emailOrPhone')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                placeholder={t('auth.enterEmailOrPhone')}
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.password')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <RNTextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t('auth.enterPassword')}
                placeholderTextColor="#9E9E9E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>{t('auth.loading')}</Text>
            ) : (
              <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32, // px-8 equivalent
    paddingTop: 80, // pt-20 equivalent
    paddingBottom: 48, // pb-12 equivalent
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48, // mb-12 equivalent
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#030213', // Dark text
    textAlign: 'center',
  },
  welcomeSection: {
    marginBottom: 32, // mb-8 equivalent
  },
  welcomeTitle: {
    fontSize: 30, // text-3xl equivalent
    fontWeight: '600',
    color: '#030213', // Dark text from design
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#717182', // Medium gray
    fontWeight: '400',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20, // mb-5 equivalent
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8, // mb-2 equivalent
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, // px-4 equivalent
    height: 56, // py-4 equivalent
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#030213', // Dark text
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#DC3545', // Error color
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 32, // mt-8 equivalent
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#B4AEBD', // Primary purple
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#54CE8F', // Primary green from design
    borderRadius: 16, // rounded-2xl
    height: 56, // py-4 equivalent
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#54CE8F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LoginScreen;
