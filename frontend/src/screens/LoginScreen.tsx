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
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="trophy" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>EGEV Tenis</Text>
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
              <MaterialCommunityIcons name="email-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
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
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
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
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9E9E9E" 
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#BA68C8', // Darker purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#424242',
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '400',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#424242',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#66BB6A', // Light green
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#66BB6A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
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
  signUpSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  signUpText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '400',
  },
  signUpLink: {
    color: '#66BB6A',
    fontWeight: '600',
  },
});

export default LoginScreen;
