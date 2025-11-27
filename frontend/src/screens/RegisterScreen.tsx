import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    // Yaş validasyonu (opsiyonel ama girilmişse kontrol et)
    if (age && age.trim() !== '') {
      const ageNumber = parseInt(age, 10);
      if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
        setError('Lütfen geçerli bir yaş girin (1-120)');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const ageValue = age && age.trim() !== '' ? parseInt(age, 10) : undefined;
      await register(name, email, password, ageValue);
      // Auth context otomatik olarak isAuthenticated'ı true yapacak
      navigation.replace('Main');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kayıt yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="tennis" size={80} color="#2E7D32" />
          </View>
          <Title style={styles.appTitle}>🎾 Tenis Kulübü</Title>
          <Text style={styles.appSubtitle}>
            Profesyonel tenis deneyimi için kayıt olun
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Hesap Oluştur</Title>
            <Text style={styles.subtitle}>
              Yeni hesap oluşturun
            </Text>

            <TextInput
              label="Ad Soyad"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              left={<TextInput.Icon icon="account" color="#2E7D32" />}
              theme={{ colors: { primary: '#2E7D32', placeholder: '#6C757D' } }}
            />

            <TextInput
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="email" color="#2E7D32" />}
              theme={{ colors: { primary: '#2E7D32', placeholder: '#6C757D' } }}
            />

            <TextInput
              label="Yaş (Opsiyonel)"
              value={age}
              onChangeText={setAge}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="Yaşınızı girin"
              left={<TextInput.Icon icon="calendar" color="#2E7D32" />}
              theme={{ colors: { primary: '#2E7D32', placeholder: '#6C757D' } }}
            />

            <TextInput
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock" color="#2E7D32" />}
              theme={{ colors: { primary: '#2E7D32', placeholder: '#6C757D' } }}
            />

            <TextInput
              label="Şifre Tekrar"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-check" color="#2E7D32" />}
              theme={{ colors: { primary: '#2E7D32', placeholder: '#6C757D' } }}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={Boolean(loading)}
              style={styles.button}
              buttonColor="#2E7D32"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Kayıt Ol
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
              textColor="#2E7D32"
              labelStyle={styles.linkButtonLabel}
            >
              Zaten hesabınız var mı? Giriş yapın
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
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
  card: {
    elevation: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2E7D32',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6C757D',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    marginTop: 8,
  },
  linkButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
});

export default RegisterScreen;
