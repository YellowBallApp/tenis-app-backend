import React, { useState, useEffect, useRef } from 'react';
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
import { useLanguage, Language } from '../context/LanguageContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { authService, matchHistoryService, leagueStandingsService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { calculateAge } from '../utils/age.utils';
import { Calendar, LocaleConfig } from 'react-native-calendars';

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
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('tr');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const yearScrollViewRef = useRef<ScrollView>(null);
  const monthScrollViewRef = useRef<ScrollView>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  // Date picker modal açıldığında scroll yap
  useEffect(() => {
    if (showDatePickerModal) {
      // Modal açıldığında seçili yıla scroll yap
      if (yearScrollViewRef.current && selectedYear) {
        const currentYear = new Date().getFullYear();
        const yearIndex = currentYear - selectedYear;
        setTimeout(() => {
          yearScrollViewRef.current?.scrollTo({ y: yearIndex * 50, animated: true });
        }, 100);
      }
      // Seçili aya scroll yap
      if (monthScrollViewRef.current && selectedMonth) {
        setTimeout(() => {
          monthScrollViewRef.current?.scrollTo({ y: (selectedMonth - 1) * 50, animated: true });
        }, 100);
      }
    }
  }, [showDatePickerModal, selectedYear, selectedMonth]);

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
      
      // Tüm lig sıralamalarını kaydet
      if (userStandings && Array.isArray(userStandings)) {
        setUserStandings(userStandings);
      } else {
        setUserStandings([]);
      }
      
      // Points hesaplama: Defi Lig sıralamasını kullan
      let totalPoints = 0;
      let currentRank: number | null = null;
      const defiLigStandings = (userStandings || []).filter((standing: any) => {
        const leagueName = standing.league?.name || '';
        const leagueCode = standing.league?.code || '';
        return leagueName.toLowerCase().includes('defi') || leagueCode === 'DL2025';
      });
      
      if (defiLigStandings && defiLigStandings.length > 0) {
        // İlk standing'in rank'ini al
        currentRank = defiLigStandings[0].leagueRanking || null;
        // Defi Lig için puan hesapla
        const maxPlayers = 100;
        const rankingPoints = Math.max(0, maxPlayers - (currentRank || maxPlayers) + 1);
        totalPoints = rankingPoints;
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
        age: calculateAge((profileData as any).birthDate),
        birthDate: (profileData as any).birthDate,
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

  const openLanguageModal = () => {
    const currentLang = language || 'tr';
    setSelectedLanguage(currentLang);
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const confirmLanguageChange = async () => {
    if (selectedLanguage && selectedLanguage !== language) {
      await setLanguage(selectedLanguage);
    }
    setShowLanguageModal(false);
  };

  const preferences = [
    { id: 1, title: t('profile.notifications'), icon: 'bell', enabled: notificationsEnabled, onToggle: setNotificationsEnabled },
    { id: 2, title: t('profile.darkMode'), icon: 'theme-light-dark', enabled: isDarkMode, onToggle: toggleTheme },
    { id: 3, title: language === 'en' ? '🇬🇧 English' : '🇹🇷 Türkçe', icon: 'translate', enabled: language === 'en', onToggle: openLanguageModal },
    { id: 4, title: t('profile.locationSharing'), icon: 'map-marker', enabled: true, onToggle: () => {} },
  ];

  const openEditProfile = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      // birthDate'i formatla (YYYY-MM-DD)
      const birthDate = (user as any).birthDate;
      if (birthDate) {
        const date = new Date(birthDate);
        const formattedDate = date.toISOString().split('T')[0];
        setEditBirthDate(formattedDate);
        // Yıl ve ay seçimlerini güncelle
        setSelectedYear(date.getFullYear());
        setSelectedMonth(date.getMonth() + 1);
      } else {
        setEditBirthDate('');
        // Varsayılan olarak bugünün yılı ve ayı
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth() + 1);
      }
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
      </View>
    );
  }

  return (
    <>
    <View style={[styles.container, { backgroundColor: '#FAFCFB' }]}>
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
                <View style={[styles.tag, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Text style={styles.tagText}>{user.title || t('profile.member')}</Text>
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
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="trophy" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.statNumber}>{user.matchesPlayed}</Text>
              <Text style={styles.statLabel}>{t('profile.matchesPlayed')}</Text>
            </View>
            {/* Win Rate */}
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="trending-up" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.statNumber}>{user.winRate}%</Text>
              <Text style={styles.statLabel}>{t('profile.winRate')}</Text>
            </View>
            {/* Current Rank - Tüm Ligler */}
            <View style={[styles.statCard, styles.rankCard]}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="trophy" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.statLabel}>{t('profile.currentRank')}</Text>
              {userStandings.length > 0 ? (
                <View style={styles.rankingsList}>
                  {userStandings.map((standing: any, index: number) => (
                    <View 
                      key={standing.id || index} 
                      style={styles.rankingItem}
                    >
                      <Text style={styles.leagueName} numberOfLines={1}>
                        {standing.league?.name || t('profile.league')}
                      </Text>
                      <Text style={styles.rankingNumber}>
                        #{standing.leagueRanking || '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.statNumber}>-</Text>
              )}
            </View>
            {/* Member Since */}
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.statNumber}>{user.joinYear}</Text>
              <Text style={styles.statLabel}>{t('profile.memberSince')}</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem} onPress={openEditProfile}>
              <View style={styles.settingsIconContainer}>
                <MaterialCommunityIcons name="account" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.settingsItemText}>{t('profile.editProfile')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.preferences')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem} onPress={openLanguageModal}>
              <View style={styles.settingsIconContainer}>
                <MaterialCommunityIcons name="earth" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.settingsItemText}>{t('profile.language')}</Text>
              <View style={styles.settingsItemRight}>
                <Text style={styles.settingsItemSubtext}>{language === 'en' ? t('profile.english') : 'Türkçe'}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowAccountSettingsModal(true)}>
              <View style={styles.settingsIconContainer}>
                <MaterialCommunityIcons name="cog" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.settingsItemText}>{t('profile.accountSettings')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButtonFull}
          >
            <View style={styles.logoutButtonContent}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
              <Text style={styles.logoutButtonLabel}>{t('profile.logout')}</Text>
            </View>
          </TouchableOpacity>
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
                <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.editProfile')}</Title>
                <TouchableOpacity 
                  onPress={() => setShowEditProfileModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
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
              
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(true)}
                style={styles.dateInputContainer}
              >
                <TextInput
                  mode="outlined"
                  label={t('profile.birthDate') || 'Doğum Tarihi'}
                  value={editBirthDate}
                  editable={false}
                  style={[styles.textInput, themedStyles.input]}
                  left={<TextInput.Icon icon="calendar" />}
                  right={<TextInput.Icon icon="chevron-down" />}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#54CE8F"
                  textColor={theme.colors.text}
                  placeholder="Takvimden seçin"
                  pointerEvents="none"
                />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowEditProfileModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const updateData: any = {
                        name: editName,
                      };
                      
                      // Doğum tarihi girilmişse ekle
                      if (editBirthDate && editBirthDate.trim() !== '') {
                        const birthDate = new Date(editBirthDate);
                        if (!isNaN(birthDate.getTime()) && birthDate <= new Date()) {
                          updateData.birthDate = editBirthDate;
                        } else {
                          Alert.alert(t('common.error'), t('profile.invalidBirthDate') || 'Geçersiz doğum tarihi');
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
                >
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
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
              <TouchableOpacity 
                onPress={() => setShowPhotoOptionsModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
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
                <View style={[styles.photoOptionIcon, { backgroundColor: '#B4AEBD' }]}>
                  <MaterialCommunityIcons name="image" size={28} color="#FFFFFF" />
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
                <View style={[styles.photoOptionIcon, { backgroundColor: '#B4AEBD' }]}>
                  <MaterialCommunityIcons name="camera" size={28} color="#FFFFFF" />
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
                  <View style={[styles.photoOptionIcon, { backgroundColor: '#DC2626' }]}>
                    <MaterialCommunityIcons name="delete" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.photoOptionTitle, { color: '#DC2626' }]}>{t('profile.removePhoto')}</Text>
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
              <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.changePassword')}</Title>
              <TouchableOpacity 
                onPress={() => setShowChangePasswordModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
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
                <TouchableOpacity
                  onPress={() => setShowChangePasswordModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await authService.changePassword({
                        currentPassword,
                        newPassword,
                      });
                      setShowChangePasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      Alert.alert(t('common.success'), t('profile.passwordChanged'));
                    } catch (error: any) {
                      console.error('Şifre değiştirme hatası:', error);
                      Alert.alert(t('common.error'), error.response?.data?.message || t('profile.passwordChangeError'));
                    }
                  }}
                  style={[
                    styles.modalButton, 
                    styles.saveButton,
                    (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) && styles.disabledButton
                  ]}
                  disabled={!!(!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword)}
                >
                  <Text style={[
                    styles.saveButtonText,
                    (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) && { color: '#9CA3AF' }
                  ]}>
                    {t('common.save')}
                  </Text>
                </TouchableOpacity>
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
              <TouchableOpacity 
                onPress={() => setShowAccountSettingsModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>{t('profile.manageAccountPreferences')}</Text>
            
            <TouchableOpacity
              style={[styles.settingsItem, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 12, marginBottom: 12 }]}
              onPress={() => {
                setShowAccountSettingsModal(false);
                setShowChangePasswordModal(true);
              }}
            >
              <View style={styles.settingsIconContainer}>
                <MaterialCommunityIcons name="lock-reset" size={20} color="#B4AEBD" />
              </View>
              <Text style={styles.settingsItemText}>{t('profile.changePassword')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAccountSettingsModal(false)}
              style={[styles.modalButton, styles.saveButton, { marginTop: 32 }]}
            >
              <Text style={styles.saveButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
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
              <TouchableOpacity 
                onPress={() => setShowHelpModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
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

            <TouchableOpacity
              onPress={() => setShowHelpModal(false)}
              style={[styles.modalButton, styles.saveButton, { marginTop: 32 }]}
            >
              <Text style={styles.saveButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Date Picker Modal */}
    <Portal>
      <Modal
        dismissable={true}
        visible={showDatePickerModal}
        onDismiss={() => setShowDatePickerModal(false)}
        contentContainerStyle={styles.datePickerModalContainer}
      >
        <Card style={[styles.datePickerModalCard, themedStyles.card]}>
          <Card.Content style={styles.datePickerModalContent}>
            <View style={styles.datePickerModalHeader}>
              <Title style={[styles.modalTitle, themedStyles.title]}>
                {t('profile.birthDate') || 'Doğum Tarihi Seçin'}
              </Title>
              <TouchableOpacity 
                onPress={() => setShowDatePickerModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Yıl ve Ay Seçimi */}
            <View style={styles.yearMonthSelector}>
              <View style={styles.yearMonthItem}>
                <Text style={styles.yearMonthLabel}>{t('profile.year') || 'Yıl'}</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView 
                    style={styles.yearPickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {Array.from({ length: 100 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerOption,
                            selectedYear === year && styles.pickerOptionSelected
                          ]}
                          onPress={() => setSelectedYear(year)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            selectedYear === year && styles.pickerOptionTextSelected
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.yearMonthItem}>
                <Text style={styles.yearMonthLabel}>{t('profile.month') || 'Ay'}</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView 
                    ref={monthScrollViewRef}
                    style={styles.monthPickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const monthNames = language === 'tr' 
                        ? ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
                        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.pickerOption,
                            selectedMonth === month && styles.pickerOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedMonth(month);
                            // Scroll to selected month
                            if (monthScrollViewRef.current) {
                              monthScrollViewRef.current.scrollTo({ y: i * 50, animated: true });
                            }
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            selectedMonth === month && styles.pickerOptionTextSelected
                          ]}>
                            {monthNames[i]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>
            
            <Calendar
              key={`${selectedYear}-${selectedMonth}`}
              onDayPress={(day) => {
                setEditBirthDate(day.dateString);
                setShowDatePickerModal(false);
              }}
              current={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
              markedDates={{
                [editBirthDate]: {
                  selected: true,
                  selectedColor: '#54CE8F',
                  selectedTextColor: '#FFFFFF',
                },
              }}
              maxDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={false}
              hideArrows={true}
              hideExtraDays={true}
              disableMonthChange={true}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#030213',
                selectedDayBackgroundColor: '#54CE8F',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#54CE8F',
                dayTextColor: '#030213',
                textDisabledColor: '#D1D5DB',
                dotColor: '#54CE8F',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#54CE8F',
                monthTextColor: '#030213',
                indicatorColor: '#54CE8F',
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />

            {editBirthDate && (
              <TouchableOpacity
                onPress={() => {
                  setEditBirthDate('');
                  setShowDatePickerModal(false);
                }}
                style={styles.clearDateButton}
              >
                <Text style={styles.clearDateButtonText}>
                  {t('common.clear')}
                </Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>

    {/* Language Selection Modal */}
    <Portal>
      <Modal
        dismissable={false}
        visible={!!showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={[styles.modalCard, themedStyles.card]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="earth" size={32} color="#E1BEE7" />
                <Title style={[styles.modalTitle, themedStyles.title]}>{t('profile.language')}</Title>
                <TouchableOpacity 
                  onPress={() => setShowLanguageModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSubtitle, themedStyles.subtitle]}>
                {t('profile.selectLanguage') || 'Dil seçin'}
              </Text>

              <View style={styles.languageOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'tr' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('tr')}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇹🇷</Text>
                  <View style={styles.languageOptionText}>
                    <Text style={[
                      styles.languageOptionTitle,
                      selectedLanguage === 'tr' && styles.languageOptionTitleSelected
                    ]}>
                      Türkçe
                    </Text>
                    <Text style={[
                      styles.languageOptionSubtitle,
                      selectedLanguage === 'tr' && styles.languageOptionSubtitleSelected
                    ]}>
                      Turkish
                    </Text>
                  </View>
                </View>
                {selectedLanguage === 'tr' && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#54CE8F" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('en')}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇬🇧</Text>
                  <View style={styles.languageOptionText}>
                    <Text style={[
                      styles.languageOptionTitle,
                      selectedLanguage === 'en' && styles.languageOptionTitleSelected
                    ]}>
                      English
                    </Text>
                    <Text style={[
                      styles.languageOptionSubtitle,
                      selectedLanguage === 'en' && styles.languageOptionSubtitleSelected
                    ]}>
                      İngilizce
                    </Text>
                  </View>
                </View>
                {selectedLanguage === 'en' && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#54CE8F" />
                )}
              </TouchableOpacity>
            </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowLanguageModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmLanguageChange}
                  style={[styles.modalButton, styles.saveButton]}
                >
                  <Text style={styles.saveButtonText}>{t('common.confirm') || 'Onayla'}</Text>
                </TouchableOpacity>
              </View>
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
                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  style={[styles.modalButton, styles.logoutCancelButton]}
                  disabled={!!loggingOut}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmLogout}
                  style={[styles.modalButton, styles.logoutConfirmButton]}
                  disabled={!!loggingOut}
                >
                  {loggingOut ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>{t('auth.logout')}</Text>
                  )}
                </TouchableOpacity>
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
    backgroundColor: '#FAFCFB', // New design background
  },
  scrollView: {
    flex: 1,
  },
  // Profile Header Card - Light Purple
  profileHeaderCard: {
    backgroundColor: '#B4AEBD', // New design purple
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 24, // mb-6
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24, // px-6
    paddingBottom: 24, // pb-6
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20 with backdrop blur effect
    borderRadius: 16, // rounded-2xl
    padding: 24, // p-6
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16, // gap-4
  },
  profileAvatar: {
    width: 80, // w-20
    height: 80, // h-20
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80, // w-20
    height: 80, // h-20
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // white/30
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32, // text-2xl
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28, // w-7
    height: 28, // h-7
    borderRadius: 14,
    backgroundColor: '#54CE8F', // Primary green
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  userInfoContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4, // mb-1
  },
  profileEmail: {
    fontSize: 14, // text-sm
    color: 'rgba(255, 255, 255, 0.8)', // white/80
    marginBottom: 8, // mb-2
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8, // gap-2
  },
  tag: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
  },
  tagText: {
    fontSize: 11, // text-xs
    color: '#FFFFFF',
    fontWeight: '500',
  },
  section: {
    padding: 24, // px-6 py-6
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213', // Dark text from design
    marginBottom: 16, // mb-4
  },
  sectionHeader: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // gray-400
    marginBottom: 12, // mb-3
    fontWeight: '500',
    paddingHorizontal: 8, // px-2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6, // Negative margin to offset card margins
  },
  statCard: {
    width: (width - 48 - 12) / 2, // (width - padding*2 - gap) / 2
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    marginBottom: 12, // gap-3
    marginRight: 12, // gap-3
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // mb-3
  },
  statNumber: {
    fontSize: 24, // text-2xl
    fontWeight: '600',
    color: '#54CE8F', // Primary green
    marginBottom: 4, // mb-1
  },
  statLabel: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    textAlign: 'left',
  },
  rankCard: {
    alignItems: 'center',
    minHeight: 100,
  },
  rankingsList: {
    marginTop: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
    justifyContent: 'center',
  },
  leagueName: {
    fontSize: 13,
    color: 'gray',
    fontWeight: '400',
    width: '100%',
    flex: 1,
    marginRight: 4,
  },
  rankingNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // Quick Actions
  quickActionsHorizontal: {
    flexDirection: 'row',
    gap: 12, // gap-3
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    padding: 16, // p-4
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 12, // text-xs
    color: '#374151', // gray-700
    marginTop: 8, // gap-2
    textAlign: 'center',
  },
  // Settings List
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // px-5 py-4
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // gray-100
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    color: '#030213', // Dark text
    marginLeft: 16, // gap-4
  },
  settingsIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemSubtext: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // gray-400
    marginRight: 8,
  },
  // Logout
  logoutSection: {
    padding: 20,
    paddingTop: 0,
  },
  logoutButtonFull: {
    width: '100%',
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonContent: {
    paddingVertical: 20, // py-5
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // gap-3
  },
  logoutButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626', // red-600
  },
  modalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16, // rounded-2xl
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24, // px-6 py-6
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  modalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213', // Dark text
    flex: 1,
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginBottom: 20, // mb-5
    lineHeight: 20,
  },
  textInput: {
    marginBottom: 20, // mb-5
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32, // mt-8
    gap: 12, // gap-3
  },
  modalButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    paddingVertical: 16, // py-4
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030213', // Dark text
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#54CE8F', // Primary green
    borderWidth: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
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
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  logoutConfirmButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#DC2626', // Red background for logout
    borderWidth: 0,
  },
  // Photo Options Modal Styles
  photoModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  photoModalCard: {
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  photoModalContent: {
    padding: 24, // px-6 py-6
  },
  photoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  photoModalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213', // Dark text
    flex: 1,
    marginLeft: 12,
  },
  photoModalSubtitle: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginBottom: 24, // mb-6
    lineHeight: 20,
  },
  photoOptionsContainer: {
    gap: 12, // gap-3
    marginBottom: 20, // mb-5
  },
  photoOption: {
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  photoOptionDanger: {
    borderColor: '#FEE2E2', // red-100
    backgroundColor: '#FEF2F2', // red-50
  },
  photoOptionIcon: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // mb-3
  },
  photoOptionTitle: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213', // Dark text
    marginBottom: 6, // mb-1.5
  },
  photoOptionDescription: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    lineHeight: 20,
  },
  photoCancelButton: {
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Date Picker Styles
  dateInputContainer: {
    marginBottom: 20,
  },
  datePickerModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  datePickerModalCard: {
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  datePickerModalContent: {
    padding: 24, // px-6 py-6
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  calendar: {
    borderRadius: 16, // rounded-2xl
    marginBottom: 16,
  },
  clearDateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#717182',
    textAlign: 'center',
  },
  yearMonthSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  yearMonthItem: {
    flex: 1,
  },
  yearMonthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#717182',
    marginBottom: 8,
  },
  pickerContainer: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  yearPickerScroll: {
    flex: 1,
  },
  monthPickerScroll: {
    flex: 1,
  },
  pickerScrollContent: {
    paddingVertical: 4,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  pickerOptionSelected: {
    backgroundColor: '#54CE8F',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#030213',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Language Selection Modal Styles
  languageOptionsContainer: {
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
    width: '100%',
  },
  languageOption: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
    width: '100%',
  },
  languageOptionSelected: {
    borderColor: '#54CE8F',
    backgroundColor: '#F0FDF4',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageOptionText: {
    flex: 1,
  },
  languageOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  languageOptionTitleSelected: {
    color: '#54CE8F',
  },
  languageOptionSubtitle: {
    fontSize: 14,
    color: '#717182',
  },
  languageOptionSubtitleSelected: {
    color: '#54CE8F',
  },
});

export default ProfileScreen;
