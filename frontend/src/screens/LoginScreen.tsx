import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { clearAuthTokens } from '../utils/clearStorage';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const { themedStyles, theme } = useThemedStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sayfa açıldığında token'ları kontrol et ve gerekirse temizle
  React.useEffect(() => {
    const initializeLogin = async () => {
      // Eğer buraya geldiyse ama token varsa, muhtemelen geçersiz
      // Token'ları temizle
      const hasToken = await AsyncStorage.getItem('accessToken');
      if (hasToken) {
        console.log('⚠️  Login ekranında ama token var - muhtemelen geçersiz, temizleniyor...');
        await clearAuthTokens();
        setError('Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
    };
    
    initializeLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Auth context otomatik olarak isAuthenticated'ı true yapacak
      // ve AppNavigator Main ekranına yönlendirecek
      navigation.replace('Main');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, themedStyles.container]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="tennis" size={80} color={theme.colors.primary} />
          </View>
          <Title style={[styles.appTitle, themedStyles.title]}> Tenis Kulübü</Title>
          <Text style={[styles.appSubtitle, themedStyles.subtitle]}>
            Profesyonel tenis deneyimi için giriş yapın
          </Text>
        </View>

        {/* Login Form */}
        <Card style={[styles.loginCard, themedStyles.card]}>
          <Card.Content>
            <Title style={[styles.formTitle, themedStyles.title]}>Giriş Yap</Title>
            
            <TextInput
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, themedStyles.input]}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
              theme={{ colors: { primary: theme.colors.primary, placeholder: theme.colors.placeholder } }}
            />
            
            <TextInput
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={[styles.input, themedStyles.input]}
              secureTextEntry
              left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
              theme={{ colors: { primary: theme.colors.primary, placeholder: theme.colors.placeholder } }}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              buttonColor={theme.colors.primary}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.divider} />
            </View>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
              textColor="#2E7D32"
              icon="account-plus"
              labelStyle={styles.registerButtonLabel}
            >
              Yeni Hesap Oluştur
            </Button>

          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Giriş yaparak{' '}
            <Text style={styles.footerLink}>Kullanım Şartları</Text>
            {' '}ve{' '}
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
            'nı kabul etmiş olursunuz.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonContent: {
    paddingVertical: 12,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    color: '#6C757D',
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 12,
    borderColor: '#2E7D32',
    borderWidth: 2,
    marginBottom: 10,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#6C757D',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#2E7D32',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default LoginScreen;
