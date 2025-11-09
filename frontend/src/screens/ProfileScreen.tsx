import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Switch,
  Divider,
  Portal,
  Modal,
  TextInput,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { authService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { logout: authLogout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { themedStyles } = useThemedStyles();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Scroll animation için
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const compactOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await authService.getProfile();
      
      // Backend'den gelen profil verisini UI formatına dönüştür
      const formattedUser = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        surname: profileData.surname,
        age: (profileData as any).age,
        profilePhoto: (profileData as any).profilePhoto,
        level: profileData.title || 'Üye',
        rank: 'Altın', // TODO: Rank sistemi eklenecek
        points: 0, // TODO: Match history'den hesaplanacak
        matchesPlayed: 0, // TODO: Match history'den hesaplanacak
        matchesWon: 0, // TODO: Match history'den hesaplanacak
        winRate: 0, // TODO: Match history'den hesaplanacak
        joinDate: (profileData as any).createdAt 
          ? new Date((profileData as any).createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
          : 'Bilinmiyor',
        membershipType: 'Premium',
        nextRenewal: '15 Nisan 2024',
      };
      
      setUser(formattedUser);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    { id: 1, title: 'İlk Maç', description: 'İlk maçınızı oynadınız', icon: 'trophy', color: '#FFD700' },
    { id: 2, title: 'Seri Kazanan', description: '5 maç üst üste kazandınız', icon: 'fire', color: '#FF6B35' },
    { id: 3, title: 'Century Club', description: '100 maç oynadınız', icon: 'star', color: '#4CAF50' },
  ];

  const preferences = [
    { id: 1, title: 'Bildirimler', icon: 'bell', enabled: notificationsEnabled, onToggle: setNotificationsEnabled },
    { id: 2, title: 'Karanlık Mod', icon: 'theme-light-dark', enabled: isDarkMode, onToggle: toggleTheme },
    { id: 3, title: 'Konum Paylaşımı', icon: 'map-marker', enabled: true, onToggle: () => {} },
  ];

  const openEditProfile = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditAge(user.age ? user.age.toString() : '');
      setShowEditProfileModal(true);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // İzin iste
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermeniz gerekiyor.');
        return;
      }

      // Fotoğraf seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Dosya boyutunu küçültmek için (30% kalite)
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Base64'e çevir
        const base64 = await fetch(imageUri)
          .then(res => res.blob())
          .then(blob => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }));

        // Backend'e gönder
        await authService.updateProfile({ profilePhoto: base64 });
        
        // UI'ı güncelle
        setUser({ ...user, profilePhoto: base64 });
        // Başarı mesajı kaldırıldı - sessizce güncelle
      }
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      // İzin iste
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kameranıza erişmek için izin vermeniz gerekiyor.');
        return;
      }

      // Fotoğraf çek
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Dosya boyutunu küçültmek için (30% kalite)
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Base64'e çevir
        const base64 = await fetch(imageUri)
          .then(res => res.blob())
          .then(blob => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }));

        // Backend'e gönder
        await authService.updateProfile({ profilePhoto: base64 });
        
        // UI'ı güncelle
        setUser({ ...user, profilePhoto: base64 });
        // Başarı mesajı kaldırıldı - sessizce güncelle
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const removeProfilePhoto = () => {
    setShowPhotoOptionsModal(false);
    setShowRemovePhotoModal(true);
  };

  const confirmRemovePhoto = async () => {
    setShowRemovePhotoModal(false);
    
    try {
      // Backend'e undefined gönder
      await authService.updateProfile({ profilePhoto: undefined });
      
      // UI'ı güncelle
      setUser({ ...user, profilePhoto: null });
      // Başarı mesajı kaldırıldı - sessizce güncelle
    } catch (error) {
      console.error('Fotoğraf kaldırma hatası:', error);
      Alert.alert('Hata', 'Fotoğraf kaldırılırken bir hata oluştu.');
    }
  };

  const selectProfilePhoto = () => {
    setShowPhotoOptionsModal(true);
  };

  const handleGalleryPress = () => {
    setShowPhotoOptionsModal(false);
    pickImageFromGallery();
  };

  const handleCameraPress = () => {
    setShowPhotoOptionsModal(false);
    pickImageFromCamera();
  };

  const handleLogout = () => {
    console.log('handleLogout çağrıldı - Modal açılıyor');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('Çıkış Yap onaylandı');
    setLoggingOut(true);
    
    try {
      // AuthContext'deki logout fonksiyonunu kullan
      await authLogout();
      
      // Login ekranına yönlendir
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const quickActions = [
    { title: 'Profil Düzenle', icon: 'account-edit', action: openEditProfile },
    { title: 'Şifre Değiştir', icon: 'lock-reset', action: () => setShowChangePasswordModal(true) },
    { title: 'Hesap Ayarları', icon: 'cog', action: () => setShowAccountSettingsModal(true) },
    { title: 'Yardım', icon: 'help-circle', action: () => setShowHelpModal(true) },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Başlangıç': return '#4CAF50';
      case 'Orta': return '#FF9800';
      case 'İleri': return '#F44336';
      case 'Uzman': return '#9C27B0';
      default: return '#6C757D';
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Bronz': return '#CD7F32';
      case 'Gümüş': return '#C0C0C0';
      case 'Altın': return '#FFD700';
      case 'Platin': return '#E5E4E2';
      default: return '#6C757D';
    }
  };

  if (loading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <>
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated Profile Header */}
      <Animated.View style={[styles.profileHeader, { height: headerHeight }]}>
        {/* Kompakt Başlık - Scroll edildiğinde görünür */}
        <Animated.View style={[
          styles.compactHeader,
          { opacity: compactOpacity }
        ]}>
          <View style={styles.compactContent}>
            {user.profilePhoto ? (
              <Image 
                source={{ uri: user.profilePhoto }} 
                style={styles.compactAvatar}
              />
            ) : (
              <Avatar.Text size={40} label={user.name.charAt(0)} style={styles.compactAvatar} />
            )}
            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>{user.name}</Text>
              <Text style={styles.compactLevel}>{user.level} • {user.rank}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Normal İçerik - Scroll başta görünür */}
        <Animated.View style={[styles.profileInfo, { opacity: headerOpacity }]}>
          <TouchableOpacity onPress={selectProfilePhoto} activeOpacity={0.7}>
            {user.profilePhoto ? (
              <Image 
                source={{ uri: user.profilePhoto }} 
                style={styles.profileImage}
              />
            ) : (
              <Avatar.Text size={80} label={user.name.charAt(0)} style={styles.avatar} />
            )}
            <View style={styles.cameraIconContainer}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.userDetails}>
            <Title style={styles.userName}>{user.name}</Title>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.levelRankContainer}>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getLevelColor(user.level), marginRight: 10 }}
              >
                {user.level}
              </Chip>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getRankColor(user.rank) }}
              >
                {user.rank}
              </Chip>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

      {/* Stats Section */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>İstatistikler</Title>
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, themedStyles.card]}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="trophy" size={32} color={theme.colors.primary} />
              <Text style={[styles.statNumber, themedStyles.statNumber]}>{user.points}</Text>
              <Text style={[styles.statLabel, themedStyles.statLabel]}>Puan</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, themedStyles.card]}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="tennis" size={32} color={theme.colors.primary} />
              <Text style={[styles.statNumber, themedStyles.statNumber]}>{user.matchesPlayed}</Text>
              <Text style={[styles.statLabel, themedStyles.statLabel]}>Maç</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, themedStyles.card]}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.primary} />
              <Text style={[styles.statNumber, themedStyles.statNumber]}>{user.matchesWon}</Text>
              <Text style={[styles.statLabel, themedStyles.statLabel]}>Galibiyet</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, themedStyles.card]}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="percent" size={32} color={theme.colors.primary} />
              <Text style={[styles.statNumber, themedStyles.statNumber]}>{user.winRate}%</Text>
              <Text style={[styles.statLabel, themedStyles.statLabel]}>Başarı</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Achievements */}
      <View style={[styles.section, styles.achievementsSection]}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Başarılar</Title>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsContainer}
        >
          {achievements.map((achievement) => (
            <Card key={achievement.id} style={[styles.achievementCard, themedStyles.card]}>
              <Card.Content style={styles.achievementContent}>
                <View style={styles.achievementIconContainer}>
                  <MaterialCommunityIcons 
                    name={achievement.icon as any} 
                    size={36} 
                    color={achievement.color} 
                  />
                </View>
                <View style={styles.achievementTextContainer}>
                  <Title style={styles.achievementTitle}>{achievement.title}</Title>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Membership Info */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Üyelik Bilgileri</Title>
        <Card style={[styles.membershipCard, themedStyles.card]}>
          <Card.Content>
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
              <View style={styles.membershipInfo}>
                <Text style={[styles.membershipLabel, themedStyles.subtitle]}>Katılım Tarihi</Text>
                <Text style={[styles.membershipValue, themedStyles.text]}>{user.joinDate}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
              <View style={styles.membershipInfo}>
                <Text style={[styles.membershipLabel, themedStyles.subtitle]}>Üyelik Türü</Text>
                <Text style={[styles.membershipValue, themedStyles.text]}>{user.membershipType}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.primary} />
              <View style={styles.membershipInfo}>
                <Text style={[styles.membershipLabel, themedStyles.subtitle]}>Sonraki Yenileme</Text>
                <Text style={[styles.membershipValue, themedStyles.text]}>{user.nextRenewal}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Tercihler</Title>
        <Card style={[styles.preferencesCard, themedStyles.card]}>
          <Card.Content>
            {preferences.map((preference) => (
              <View key={preference.id} style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name={preference.icon as any} size={24} color={theme.colors.primary} />
                  <Text style={[styles.preferenceTitle, themedStyles.text]}>{preference.title}</Text>
                </View>
                <Switch
                  value={preference.enabled}
                  onValueChange={preference.onToggle}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Hızlı İşlemler</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={action.action}
              style={styles.actionButton}
              textColor={theme.colors.primary}
              icon={action.icon}
            >
              {action.title}
            </Button>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View style={[styles.section, { paddingBottom: 40 }]}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#DC3545"
          icon="logout"
          contentStyle={styles.logoutButtonContent}
        >
          Çıkış Yap
        </Button>
      </View>
      </Animated.ScrollView>
    </View>

    {/* Profil Düzenle Modal */}
    <Portal>
      <Modal
        visible={showEditProfileModal}
        onDismiss={() => setShowEditProfileModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-edit" size={32} color={theme.colors.primary} />
                <Title style={[styles.modalTitle, themedStyles.title]}>Profil Düzenle</Title>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>Profil bilgilerinizi güncelleyin</Text>
              
              <TextInput
                mode="outlined"
                label="Ad Soyad"
                value={editName}
                onChangeText={setEditName}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="account" />}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.text}
              />
              
              <TextInput
                mode="outlined"
                label="E-posta"
                value={editEmail}
                onChangeText={setEditEmail}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="email" />}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.text}
                keyboardType="email-address"
              />
              
              <TextInput
                mode="outlined"
                label="Yaş"
                value={editAge}
                onChangeText={setEditAge}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="calendar" />}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.text}
                keyboardType="numeric"
                placeholder="Yaşınızı girin"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEditProfileModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  textColor={theme.colors.text}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={async () => {
                    try {
                      const updateData: any = {
                        name: editName,
                      };
                      
                      // Yaş girilmişse ekle
                      if (editAge && editAge.trim() !== '') {
                        const ageNumber = parseInt(editAge, 10);
                        if (!isNaN(ageNumber) && ageNumber > 0 && ageNumber < 150) {
                          updateData.age = ageNumber;
                        } else {
                          Alert.alert('Hata', 'Lütfen geçerli bir yaş girin');
                          return;
                        }
                      }
                      
                      await authService.updateProfile(updateData);
                      await loadProfile(); // Profili yeniden yükle
                      setShowEditProfileModal(false);
                      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi');
                    } catch (error) {
                      console.error('Profil güncellenirken hata:', error);
                      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
                    }
                  }}
                  style={[styles.modalButton, styles.saveButton]}
                  buttonColor={theme.colors.primary}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  Kaydet
                </Button>
              </View>
            </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Profil Fotoğrafı Seçenekleri Modal */}
    <Portal>
      <Modal
        visible={showPhotoOptionsModal}
        onDismiss={() => setShowPhotoOptionsModal(false)}
        contentContainerStyle={styles.photoModalContainer}
      >
        <Card style={[styles.photoModalCard, themedStyles.card]}>
          <Card.Content style={styles.photoModalContent}>
            <View style={styles.photoModalHeader}>
              <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
              <Title style={[styles.photoModalTitle, themedStyles.title]}>Profil Fotoğrafı</Title>
            </View>
            
            <Text style={[styles.photoModalSubtitle, themedStyles.subtitle]}>
              Fotoğraf eklemek veya değiştirmek için bir seçenek seçin
            </Text>

            <View style={styles.photoOptionsContainer}>
              {/* Galeri Seçeneği */}
              <TouchableOpacity 
                style={[styles.photoOption, themedStyles.card]}
                onPress={handleGalleryPress}
                activeOpacity={0.7}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons name="image" size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.photoOptionTitle, themedStyles.text]}>Galeriden Seç</Text>
                <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                  Mevcut fotoğraflarınızdan seçin
                </Text>
              </TouchableOpacity>

              {/* Kamera Seçeneği */}
              <TouchableOpacity 
                style={[styles.photoOption, themedStyles.card]}
                onPress={handleCameraPress}
                activeOpacity={0.7}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.photoOptionTitle, themedStyles.text]}>Fotoğraf Çek</Text>
                <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                  Kameranızla yeni bir fotoğraf çekin
                </Text>
              </TouchableOpacity>

              {/* Fotoğrafı Kaldır Seçeneği - Sadece fotoğraf varsa göster */}
              {user?.profilePhoto && (
                <TouchableOpacity 
                  style={[styles.photoOption, styles.photoOptionDanger, themedStyles.card]}
                  onPress={removeProfilePhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.photoOptionIcon, { backgroundColor: '#DC3545' }]}>
                    <MaterialCommunityIcons name="delete" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.photoOptionTitle, { color: '#DC3545' }]}>Fotoğrafı Kaldır</Text>
                  <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                    Mevcut profil fotoğrafınızı silin
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* İptal Butonu */}
            <Button
              mode="outlined"
              onPress={() => setShowPhotoOptionsModal(false)}
              style={styles.photoCancelButton}
              textColor={theme.colors.primary}
            >
              İptal
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>

    {/* Profil Fotoğrafını Kaldır Onay Modal */}
    <Portal>
      <Modal
        visible={showRemovePhotoModal}
        onDismiss={() => setShowRemovePhotoModal(false)}
        contentContainerStyle={styles.logoutModalContainer}
      >
        <Card style={[styles.logoutModalCard, themedStyles.card]}>
          <Card.Content style={styles.logoutModalContent}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                backgroundColor: isDarkMode ? '#4A2020' : '#FFEBEE',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MaterialCommunityIcons name="delete-alert" size={48} color={theme.colors.error} />
              </View>
            </View>
            
            <Title style={[styles.logoutModalTitle, themedStyles.title]}>Profil Fotoğrafını Kaldır</Title>
            <Text style={[styles.logoutModalText, themedStyles.text]}>
              Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>

            <View style={styles.logoutModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowRemovePhotoModal(false)}
                style={styles.logoutCancelButton}
                textColor={theme.colors.text}
              >
                İptal
              </Button>
              <Button
                mode="contained"
                onPress={confirmRemovePhoto}
                style={styles.logoutConfirmButton}
                buttonColor={theme.colors.error}
                textColor="#FFFFFF"
              >
                Kaldır
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>

    {/* Şifre Değiştir Modal */}
    <Portal>
      <Modal
        visible={showChangePasswordModal}
        onDismiss={() => setShowChangePasswordModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
                <MaterialCommunityIcons name="lock-reset" size={32} color="#FF9800" />
                <Title style={[styles.modalTitle, themedStyles.title]}>Şifre Değiştir</Title>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>Güvenliğiniz için şifrenizi güncelleyin</Text>
              
              <TextInput
                mode="outlined"
                label="Mevcut Şifre"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock" />}
                secureTextEntry
                outlineColor={theme.colors.outline}
                activeOutlineColor="#FF9800"
                textColor={theme.colors.text}
              />
              
              <TextInput
                mode="outlined"
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock-plus" />}
                secureTextEntry
                outlineColor={theme.colors.outline}
                activeOutlineColor="#FF9800"
                textColor={theme.colors.text}
              />
              
              <TextInput
                mode="outlined"
                label="Yeni Şifre Tekrar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock-check" />}
                secureTextEntry
                outlineColor={confirmPassword && newPassword !== confirmPassword ? "#F44336" : theme.colors.outline}
                activeOutlineColor={confirmPassword && newPassword !== confirmPassword ? "#F44336" : "#FF9800"}
                error={!!confirmPassword && newPassword !== confirmPassword}
                textColor={theme.colors.text}
              />
              
              {/* Şifre Kontrol Mesajları */}
              {confirmPassword && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>
                  ⚠️ Şifreler uyuşmuyor
                </Text>
              )}
              
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <Text style={styles.successText}>
                  ✅ Şifreler uyuşuyor
                </Text>
              )}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowChangePasswordModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  textColor={theme.colors.text}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('Şifre değiştirildi');
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={[
                    styles.modalButton, 
                    styles.saveButton,
                    (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) && styles.disabledButton
                  ]}
                  buttonColor={(!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) ? "#CCCCCC" : "#FF9800"}
                  contentStyle={{ paddingVertical: 12 }}
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  Değiştir
                </Button>
              </View>
            </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Hesap Ayarları Modal */}
    <Portal>
      <Modal
        visible={showAccountSettingsModal}
        onDismiss={() => setShowAccountSettingsModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
              <MaterialCommunityIcons name="cog" size={32} color="#4CAF50" />
              <Title style={[styles.modalTitle, themedStyles.title]}>Hesap Ayarları</Title>
              <TouchableOpacity onPress={() => setShowAccountSettingsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>Hesap tercihlerinizi yönetin</Text>
            
            <List.Section>
              <List.Item
                title="Gizlilik Ayarları"
                description="Profil görünürlüğü ve gizlilik"
                left={props => <List.Icon {...props} icon="shield-account" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Bildirim Tercihleri"
                description="E-posta ve push bildirimleri"
                left={props => <List.Icon {...props} icon="bell-cog" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Dil ve Bölge"
                description="Uygulama dili ve saat dilimi"
                left={props => <List.Icon {...props} icon="earth" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Veri İndirme"
                description="Hesap verilerinizi indirin"
                left={props => <List.Icon {...props} icon="download" color="#2196F3" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Hesap Silme"
                description="Hesabınızı kalıcı olarak silin"
                left={props => <List.Icon {...props} icon="delete-forever" color="#F44336" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
            </List.Section>

            <Button
              mode="contained"
              onPress={() => setShowAccountSettingsModal(false)}
              style={[styles.modalButton, { marginTop: 32 }]}
              buttonColor="#4CAF50"
              contentStyle={{ paddingVertical: 12 }}
            >
              Tamam
            </Button>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Yardım Modal */}
    <Portal>
      <Modal
        visible={showHelpModal}
        onDismiss={() => setShowHelpModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
              <MaterialCommunityIcons name="help-circle" size={32} color="#2196F3" />
              <Title style={[styles.modalTitle, themedStyles.title]}>Yardım & Destek</Title>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>Size nasıl yardımcı olabiliriz?</Text>
            
            <List.Section>
              <List.Item
                title="Sık Sorulan Sorular"
                description="En çok merak edilen konular"
                left={props => <List.Icon {...props} icon="frequently-asked-questions" color="#2196F3" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Canlı Destek"
                description="7/24 müşteri hizmetleri"
                left={props => <List.Icon {...props} icon="chat" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="E-posta Desteği"
                description="destek@teniskulubu.com"
                left={props => <List.Icon {...props} icon="email" color="#FF9800" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Telefon Desteği"
                description="+90 212 555 0123"
                left={props => <List.Icon {...props} icon="phone" color="#9C27B0" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
              <List.Item
                title="Kullanım Kılavuzu"
                description="Uygulama nasıl kullanılır?"
                left={props => <List.Icon {...props} icon="book-open" color="#607D8B" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.placeholder }}
              />
            </List.Section>

            <Button
              mode="contained"
              onPress={() => setShowHelpModal(false)}
              style={[styles.modalButton, { marginTop: 32 }]}
              buttonColor="#2196F3"
              contentStyle={{ paddingVertical: 12 }}
            >
              Tamam
            </Button>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Logout Confirmation Modal */}
    <Portal>
      <Modal
        visible={showLogoutModal}
        onDismiss={() => !loggingOut && setShowLogoutModal(false)}
        contentContainerStyle={styles.logoutModalContainer}
      >
        <Card style={[styles.logoutModalCard, themedStyles.card]}>
          <Card.Content style={styles.logoutModalContent}>
            <View style={styles.logoutModalHeader}>
              <MaterialCommunityIcons name="logout" size={28} color={theme.colors.error} />
              <Title style={[styles.logoutModalTitle, themedStyles.title]}>Çıkış Yap</Title>
              <TouchableOpacity 
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.logoutModalText, themedStyles.text]}>
              Çıkış yapmak istediğinizden emin misiniz?
            </Text>

            {loggingOut ? (
              <View style={{ alignItems: 'center', paddingVertical: 15 }}>
                <ActivityIndicator size="large" color={theme.colors.error} />
                <Text style={{ marginTop: 8, color: theme.colors.placeholder, fontSize: 13 }}>Çıkış yapılıyor...</Text>
              </View>
            ) : (
              <View style={styles.logoutModalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowLogoutModal(false)}
                  style={styles.logoutCancelButton}
                  textColor={theme.colors.text}
                  contentStyle={{ paddingVertical: 4 }}
                  labelStyle={{ fontSize: 14 }}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmLogout}
                  style={styles.logoutConfirmButton}
                  buttonColor={theme.colors.error}
                  contentStyle={{ paddingVertical: 4 }}
                  labelStyle={{ fontSize: 14 }}
                >
                  Çıkış Yap
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#2E7D32',
    overflow: 'hidden',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAvatar: {
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactLevel: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
  },
  avatar: {
    backgroundColor: '#FFFFFF',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 15,
  },
  levelRankContainer: {
    flexDirection: 'row',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statCardContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
    paddingBottom: 5,
  },
  achievementCard: {
    width: 160,
    minHeight: 140,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    padding: 16,
    paddingVertical: 20,
  },
  achievementIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 0,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  membershipInfo: {
    marginLeft: 15,
    flex: 1,
  },
  membershipLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  membershipValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B1B',
  },
  divider: {
    backgroundColor: '#E9ECEF',
    marginVertical: 5,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceTitle: {
    fontSize: 16,
    color: '#1B1B1B',
    marginLeft: 15,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderColor: '#2E7D32',
    borderRadius: 12,
  },
  logoutButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#DC3545',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButtonContent: {
    paddingVertical: 12,
  },
  modalContainer: {
    margin: 10,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    maxHeight: '85%',
    minHeight: '60%',
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
    lineHeight: 20,
  },
  textInput: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: '#757575',
  },
  saveButton: {
    // Flex gap ile spacing sağlandı
  },
  listItem: {
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: -15,
    marginBottom: 10,
    marginLeft: 16,
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: -15,
    marginBottom: 10,
    marginLeft: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Logout Modal Styles
  logoutModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  logoutModalCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  logoutModalContent: {
    padding: 16,
  },
  logoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 10,
    marginTop: 0,
    marginBottom: 0,
  },
  logoutModalText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  logoutCancelButton: {
    flex: 1,
    borderRadius: 10,
    borderColor: '#757575',
  },
  logoutConfirmButton: {
    flex: 1,
    borderRadius: 10,
  },
  // Photo Options Modal Styles
  photoModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  photoModalCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  photoModalContent: {
    padding: 24,
  },
  photoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  photoModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  photoModalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  photoOptionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  photoOption: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoOptionDanger: {
    borderColor: '#FFCDD2',
  },
  photoOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  photoOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  photoCancelButton: {
    borderRadius: 12,
    borderWidth: 2,
  },
});

export default ProfileScreen;
