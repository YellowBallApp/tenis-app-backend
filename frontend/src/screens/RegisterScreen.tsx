import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (!agreeToTerms) {
      setError(t('auth.agreeTermsError'));
      return;
    }

    // Yaş validasyonu (opsiyonel ama girilmişse kontrol et)
    if (age && age.trim() !== '') {
      const ageNumber = parseInt(age, 10);
      if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
        setError(t('auth.validAge'));
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const ageValue = age && age.trim() !== '' ? parseInt(age, 10) : undefined;
      await register(name, email, password, ageValue);
      navigation.replace('Main');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
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
          <Text style={styles.appTitle}>Tenis App</Text>
        </View>

        {/* Main Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.joinCommunity')}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                placeholder={t('auth.enterFullName')}
                placeholderTextColor="#9E9E9E"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.email')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                placeholder={t('auth.enterEmail')}
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.phoneNumber')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                placeholder={t('auth.enterPhoneNumber')}
                placeholderTextColor="#9E9E9E"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Age Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.age')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="calendar-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                placeholder={t('auth.enterAge')}
                placeholderTextColor="#9E9E9E"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
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
                placeholder={t('auth.createPassword')}
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

          {/* Confirm Password Input (hidden but kept for functionality) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <RNTextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                placeholderTextColor="#9E9E9E"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && (
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxText}>
              {t('auth.agreeTerms')}
            </Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.signUpButtonText}>{t('auth.loading')}</Text>
            ) : (
              <Text style={styles.signUpButtonText}>{t('auth.signUp')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              {t('auth.login')}
            </Text>
          </Text>
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
    paddingTop: 64, // pt-16 equivalent
    paddingBottom: 48, // pb-12 equivalent
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32, // mb-8 equivalent
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
  titleSection: {
    marginBottom: 32, // mb-8 equivalent
  },
  mainTitle: {
    fontSize: 30, // text-3xl equivalent
    fontWeight: '600',
    color: '#030213', // Dark text from design
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#717182', // Medium gray
    fontWeight: '400',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16, // mb-4 equivalent
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#54CE8F', // Primary green
    borderColor: '#54CE8F',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#717182', // Medium gray
    fontWeight: '400',
  },
  errorText: {
    color: '#DC3545', // Error color
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  signUpButton: {
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
    marginTop: 24, // mt-6 equivalent
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginSection: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 48, // pb-12 equivalent
  },
  loginText: {
    fontSize: 14,
    color: '#717182', // Medium gray
    fontWeight: '400',
  },
  loginLink: {
    color: '#54CE8F', // Primary green
    fontWeight: '500',
  },
});

export default RegisterScreen;
