import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { authService, matchHistoryService, leagueStandingsService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { logout: authLogout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { themedStyles } = useThemedStyles();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userStandings, setUserStandings] = useState<any[]>([]);
  
  
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
      
      // Maç istatistiklerini ve lig bilgilerini paralel olarak çek
      const [matchStats, userStandings] = await Promise.all([
        matchHistoryService.getUserMatchStats(profileData.id).catch(() => ({
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        })),
        leagueStandingsService.getStandingsByUserId(profileData.id).catch(() => []),
      ]);
      
      // Sadece Defi Lig sıralamasını filtrele
      const defiLigStandings = (userStandings || []).filter((standing: any) => {
        const leagueName = standing.league?.name || '';
        const leagueCode = standing.league?.code || '';
        // "Defi Lig" isimli veya "DL2025" code'lu ligi bul
        return leagueName.toLowerCase().includes('defi') || leagueCode === 'DL2025';
      });
      
      // Points hesaplama: Sadece Defi Lig sıralamasını kullan
      let totalPoints = 0;
      let currentRank: number | null = null;
      if (defiLigStandings && defiLigStandings.length > 0) {
        // Sadece Defi Lig standings'ini state'e kaydet
        setUserStandings(defiLigStandings);
        
        // İlk standing'in rank'ini al
        currentRank = defiLigStandings[0].leagueRanking || null;
        // Defi Lig için puan hesapla
        const maxPlayers = 100;
        const rankingPoints = Math.max(0, maxPlayers - (currentRank || maxPlayers) + 1);
        totalPoints = rankingPoints;
      } else {
        setUserStandings([]);
      }
      
      // Join date sadece yıl olarak
      const joinYear = (profileData as any).createdAt 
        ? new Date((profileData as any).createdAt).getFullYear().toString()
        : '2024';
      
      // Backend'den gelen profil verisini UI formatına dönüştür
      const formattedUser = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        surname: profileData.surname,
        age: (profileData as any).age,
        profilePhoto: (profileData as any).profilePhoto,
        title: profileData.title, // Backend'den gelen ham değer
        points: totalPoints,
        matchesPlayed: matchStats.totalMatches || 0,
        matchesWon: matchStats.wins || 0,
        winRate: Math.round(matchStats.winRate || 0),
        currentRank: currentRank,
        joinYear: joinYear,
        joinDate: (profileData as any).createdAt 
          ? new Date((profileData as any).createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })
          : t('common.loading'),
        membershipType: 'Premium',
        nextRenewal: '15 Nisan 2024',
      };
      
      setUser(formattedUser);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('profile.updateProfileError'));
    } finally {
      setLoading(false);
    }
  };

  // Computed values - her render'da güncel çeviri ile hesaplanır
  const userLevel = user?.title || t('profile.member');
  const userRank = t('profile.gold'); // TODO: Rank sistemi eklenecek

  const achievements = [
    { id: 1, title: 'İlk Maç', description: 'İlk maçınızı oynadınız', icon: 'trophy', color: '#FFD700' },
    { id: 2, title: 'Seri Kazanan', description: '5 maç üst üste kazandınız', icon: 'fire', color: '#FF6B35' },
    { id: 3, title: 'Century Club', description: '100 maç oynadınız', icon: 'star', color: '#4CAF50' },
  ];

  const handleLanguageToggle = async () => {
    const newLanguage = language === 'tr' ? 'en' : 'tr';
    await setLanguage(newLanguage);
  };

  const preferences = [
    { id: 1, title: t('profile.notifications'), icon: 'bell', enabled: notificationsEnabled, onToggle: setNotificationsEnabled },
    { id: 2, title: t('profile.darkMode'), icon: 'theme-light-dark', enabled: isDarkMode, onToggle: toggleTheme },
    { id: 3, title: language === 'en' ? '🇬🇧 English' : '🇹🇷 Türkçe', icon: 'translate', enabled: language === 'en', onToggle: handleLanguageToggle },
    { id: 4, title: t('profile.locationSharing'), icon: 'map-marker', enabled: true, onToggle: () => {} },
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
    { title: t('profile.editProfile'), icon: 'account-edit', action: openEditProfile },
    { title: t('profile.changePassword'), icon: 'lock-reset', action: () => setShowChangePasswordModal(true) },
    { title: t('profile.accountSettings'), icon: 'cog', action: () => setShowAccountSettingsModal(true) },
    { title: t('profile.help'), icon: 'help-circle', action: () => setShowHelpModal(true) },
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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <>
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card - Light Purple */}
        <View style={[styles.profileHeaderCard, { paddingTop: insets.top + 20 }]}>
          <View style={styles.profileHeaderContent}>
            {/* Avatar - Left Side */}
            <TouchableOpacity onPress={selectProfilePhoto} activeOpacity={0.7} style={styles.avatarContainer}>
              {user.profilePhoto ? (
                <Image 
                  source={{ uri: user.profilePhoto }} 
                  style={styles.profileAvatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
                </View>
              )}
              {/* Edit Icon Overlay */}
              <View style={styles.editIconContainer}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            {/* User Info - Right Side */}
            <View style={styles.userInfoContainer}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.tagsContainer}>
                <View style={[styles.tag, { backgroundColor: '#F5F5F5' }]}>
                  <Text style={styles.tagText}>{userLevel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Your Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.yourStatistics')}</Text>
          <View style={styles.statsGrid}>
            {/* Matches Played */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trophy" size={24} color="#9E9E9E" />
              <Text style={styles.statNumber}>{user.matchesPlayed}</Text>
              <Text style={styles.statLabel}>{t('profile.matchesPlayed')}</Text>
            </View>
            {/* Win Rate */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#9E9E9E" />
              <Text style={styles.statNumber}>{user.winRate}%</Text>
              <Text style={styles.statLabel}>{t('profile.winRate')}</Text>
            </View>
            {/* Current Rank - Defi Lig */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trophy" size={24} color="#9E9E9E" />
              <Text style={styles.statNumber}>
                {userStandings.length > 0 ? `#${userStandings[0].leagueRanking || '-'}` : '-'}
              </Text>
              <Text style={styles.statLabel}>{t('profile.currentRank')}</Text>
            </View>
            {/* Member Since */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="calendar" size={24} color="#9E9E9E" />
              <Text style={styles.statNumber}>{user.joinYear}</Text>
              <Text style={styles.statLabel}>{t('profile.memberSince')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.quickActions')}</Text>
          <View style={styles.quickActionsHorizontal}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ReservationsList' as any)}
            >
              <MaterialCommunityIcons name="calendar" size={28} color="#4CAF50" />
              <Text style={styles.quickActionText}>{t('profile.myBookings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('MatchHistory' as any)}
            >
              <MaterialCommunityIcons name="trophy" size={28} color="#9E9E9E" />
              <Text style={styles.quickActionText}>{t('profile.myMatches')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => {}}
            >
              <MaterialCommunityIcons name="trending-up" size={28} color="#9E9E9E" />
              <Text style={styles.quickActionText}>{t('profile.statistics')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem} onPress={openEditProfile}>
              <MaterialCommunityIcons name="account-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.editProfile')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowAccountSettingsModal(true)}>
              <MaterialCommunityIcons name="shield-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.privacySecurity')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => {}}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.notifications')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.preferences')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem} onPress={handleLanguageToggle}>
              <MaterialCommunityIcons name="earth" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.language')}</Text>
              <View style={styles.settingsItemRight}>
                <Text style={styles.settingsItemSubtext}>{language === 'en' ? t('profile.english') : 'Türkçe'}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowAccountSettingsModal(true)}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.accountSettings')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.support')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowHelpModal(true)}>
              <MaterialCommunityIcons name="help-circle-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.helpSupport')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => {}}>
              <MaterialCommunityIcons name="shield-outline" size={24} color="#1B1B1B" />
              <Text style={styles.settingsItemText}>{t('profile.termsPolicies')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButtonFull}
            buttonColor="#F44336"
            contentStyle={styles.logoutButtonContent}
            labelStyle={styles.logoutButtonLabel}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="logout-variant" size={size} color={color} />
            )}
          >
            {t('profile.logout')}
          </Button>
        </View>
        <View style={{ paddingBottom: 40 }} />
      </ScrollView>
    </View>

    {/* Profil Düzenle Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showEditProfileModal}
        onDismiss={() => setShowEditProfileModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-edit" size={32} color="#E1BEE7" />
                <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.editProfile')}</Title>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>{t('profile.updateProfileInfo')}</Text>
              
              <TextInput
                mode="outlined"
                label={t('auth.name')}
                value={editName}
                onChangeText={setEditName}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="account" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#E1BEE7"
                textColor={theme.colors.text}
              />
              
              <TextInput
                mode="outlined"
                label={t('auth.email')}
                value={editEmail}
                onChangeText={setEditEmail}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="email" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#E1BEE7"
                textColor={theme.colors.text}
                keyboardType="email-address"
              />
              
              <TextInput
                mode="outlined"
                label={t('profile.age')}
                value={editAge}
                onChangeText={setEditAge}
                style={[styles.textInput, themedStyles.input]}
                left={<TextInput.Icon icon="calendar" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#E1BEE7"
                textColor={theme.colors.text}
                keyboardType="numeric"
                placeholder={t('profile.enterAge')}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEditProfileModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  textColor={theme.colors.text}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  {t('common.cancel')}
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
                          Alert.alert(t('common.error'), t('profile.invalidAge'));
                          return;
                        }
                      }
                      
                      await authService.updateProfile(updateData);
                      await loadProfile(); // Profili yeniden yükle
                      setShowEditProfileModal(false);
                      Alert.alert(t('common.success'), t('profile.updateProfileSuccess'));
                    } catch (error) {
                      console.error('Profil güncellenirken hata:', error);
                      Alert.alert(t('common.error'), t('profile.updateProfileError'));
                    }
                  }}
                  style={[styles.modalButton, styles.saveButton]}
                  buttonColor="#E1BEE7"
                  contentStyle={{ paddingVertical: 12 }}
                >
                  {t('common.save')}
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
        dismissable={false}
        visible={!!showPhotoOptionsModal}
        onDismiss={() => setShowPhotoOptionsModal(false)}
        contentContainerStyle={styles.photoModalContainer}
      >
        <Card style={[styles.photoModalCard, themedStyles.card]}>
          <Card.Content style={styles.photoModalContent}>
            <View style={styles.photoModalHeader}>
              <MaterialCommunityIcons name="camera" size={32} color="#E1BEE7" />
              <Title style={[styles.photoModalTitle, themedStyles.title]}>{t('profile.profilePhoto')}</Title>
              <TouchableOpacity onPress={() => setShowPhotoOptionsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.photoModalSubtitle, themedStyles.subtitle]}>
              {t('profile.photoOptionsTitle')}
            </Text>

            <View style={styles.photoOptionsContainer}>
              {/* Galeri Seçeneği */}
              <TouchableOpacity 
                style={[styles.photoOption, themedStyles.card]}
                onPress={handleGalleryPress}
                activeOpacity={0.7}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#BA68C8' }]}>
                  <MaterialCommunityIcons name="image" size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.photoOptionTitle, themedStyles.text]}>{t('profile.selectFromGallery')}</Text>
                <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                  {t('profile.galleryDescription')}
                </Text>
              </TouchableOpacity>

              {/* Kamera Seçeneği */}
              <TouchableOpacity 
                style={[styles.photoOption, themedStyles.card]}
                onPress={handleCameraPress}
                activeOpacity={0.7}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#BA68C8' }]}>
                  <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.photoOptionTitle, themedStyles.text]}>{t('profile.takePhoto')}</Text>
                <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                  {t('profile.cameraDescription')}
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
                  <Text style={[styles.photoOptionTitle, { color: '#DC3545' }]}>{t('profile.removePhoto')}</Text>
                  <Text style={[styles.photoOptionDescription, themedStyles.subtitle]}>
                    {t('profile.removePhotoDescription')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* İptal Butonu */}
            <Button
              mode="outlined"
              onPress={() => setShowPhotoOptionsModal(false)}
              style={styles.photoCancelButton}
              textColor="#E1BEE7"
            >
              {t('common.cancel')}
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>

    {/* Profil Fotoğrafını Kaldır Onay Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showRemovePhotoModal}
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
            
            <Title style={[styles.logoutModalTitle, themedStyles.title]}>{t('profile.removePhoto')}</Title>
            <Text style={[styles.logoutModalText, themedStyles.text]}>
              {t('profile.removePhotoConfirm')}
            </Text>

            <View style={styles.logoutModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowRemovePhotoModal(false)}
                style={styles.logoutCancelButton}
                textColor={theme.colors.text}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={confirmRemovePhoto}
                style={styles.logoutConfirmButton}
                buttonColor={theme.colors.error}
                textColor="#FFFFFF"
              >
                {t('common.delete')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>

    {/* Şifre Değiştir Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showChangePasswordModal}
        onDismiss={() => setShowChangePasswordModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="lock-reset" size={32} color="#E1BEE7" />
              <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.changePassword')}</Title>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>{t('profile.updatePasswordForSecurity')}</Text>
            
            <TextInput
              mode="outlined"
              label={t('profile.currentPassword')}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock" />}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor="#E1BEE7"
                textColor={theme.colors.text}
              />
            
            <TextInput
              mode="outlined"
              label={t('profile.newPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock-plus" />}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor="#E1BEE7"
                textColor={theme.colors.text}
              />
            
            <TextInput
              mode="outlined"
              label={t('profile.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock-check" />}
                secureTextEntry
                outlineColor={confirmPassword && newPassword !== confirmPassword ? "#F44336" : "#E0E0E0"}
                activeOutlineColor={confirmPassword && newPassword !== confirmPassword ? "#F44336" : "#E1BEE7"}
                error={!!confirmPassword && newPassword !== confirmPassword}
                textColor={theme.colors.text}
              />
            
            {/* Şifre Kontrol Mesajları */}
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>
                {t('profile.passwordMismatch')}
              </Text>
            )}
            
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <Text style={styles.successText}>
                {t('profile.passwordMatch')}
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
                {t('common.cancel')}
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
                buttonColor={(!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) ? "#CCCCCC" : "#E1BEE7"}
                contentStyle={{ paddingVertical: 12 }}
                disabled={!!(!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword)}
              >
                {t('profile.changePassword')}
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
        dismissable={false}
        visible={!!showAccountSettingsModal}
        onDismiss={() => setShowAccountSettingsModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="cog" size={32} color="#E1BEE7" />
              <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.accountSettings')}</Title>
              <TouchableOpacity onPress={() => setShowAccountSettingsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>{t('profile.manageAccountPreferences')}</Text>
            
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
              buttonColor="#E1BEE7"
              contentStyle={{ paddingVertical: 12 }}
            >
              {t('common.ok')}
            </Button>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Yardım Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showHelpModal}
        onDismiss={() => setShowHelpModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="help-circle" size={32} color="#E1BEE7" />
              <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.help')}</Title>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>{t('profile.howCanWeHelp')}</Text>
            
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
              buttonColor="#E1BEE7"
              contentStyle={{ paddingVertical: 12 }}
            >
              {t('common.ok')}
            </Button>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Logout Confirmation Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showLogoutModal}
        onDismiss={() => !loggingOut && setShowLogoutModal(false)}
        contentContainerStyle={styles.logoutModalContainer}
      >
        <Card style={[styles.logoutModalCard, themedStyles.card]}>
          <Card.Content style={styles.logoutModalContent}>
            <View style={styles.logoutModalHeader}>
              <MaterialCommunityIcons name="logout" size={28} color={theme.colors.error} />
              <Title style={[styles.logoutModalTitle, themedStyles.title]}>{t('auth.logout')}</Title>
              <TouchableOpacity 
                onPress={() => setShowLogoutModal(false)}
                disabled={!!loggingOut}
              >
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.logoutModalText, themedStyles.text]}>
              {t('auth.logoutConfirm')}
            </Text>

            {loggingOut ? (
              <View style={{ alignItems: 'center', paddingVertical: 15 }}>
                <ActivityIndicator size="large" color={theme.colors.error} />
                <Text style={{ marginTop: 8, color: theme.colors.placeholder, fontSize: 13 }}>{t('common.loading')}</Text>
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
                  {t('common.cancel')}
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmLogout}
                  style={styles.logoutConfirmButton}
                  buttonColor={theme.colors.error}
                  contentStyle={{ paddingVertical: 4 }}
                  labelStyle={{ fontSize: 14 }}
                >
                  {t('auth.logout')}
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
  // Profile Header Card - Light Purple
  profileHeaderCard: {
    backgroundColor: '#BA68C8',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9575CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7B1FA2',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#F3E5F5',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 80) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  // Quick Actions
  quickActionsHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1B1B1B',
    marginTop: 8,
    textAlign: 'center',
  },
  // Settings List
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1B1B1B',
    marginLeft: 12,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginRight: 8,
  },
  // Logout
  logoutSection: {
    padding: 20,
    paddingTop: 0,
  },
  logoutButtonFull: {
    width: '100%',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonContent: {
    paddingVertical: 14,
  },
  logoutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    borderBottomColor: '#F5F5F5',
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
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    borderBottomColor: '#F5F5F5',
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
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  photoModalContent: {
    padding: 24,
  },
  photoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
