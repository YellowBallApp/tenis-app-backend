import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { reservationService, announcementService, userService, courtService, coachService, notificationService, authService, matchHistoryService, leagueStandingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const { themedStyles, theme } = useThemedStyles();
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    wins: 0,
    ranking: null as number | null,
    upcomingCount: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Scroll animation kaldırıldı - header artık collapsible değil
  const scrollViewRef = useRef<any>(null);

  const quickActions = [
    { 
      title: t('home.reservationMake'), 
      icon: 'calendar-plus', 
      color: '#2E7D32', 
      action: () => {
        // Reservation sayfasına git (stack'in ilk ekranı ReservationList olacak)
        navigation.navigate('Reservation');
      }
    },
    { title: t('home.reservationsList'), icon: 'calendar-text', color: '#9E9E9E', action: () => navigation.navigate('ReservationsList') },
    { title: t('home.matchHistory'), icon: 'history', color: '#2E7D32', action: () => navigation.navigate('MatchHistory') },
  ];

  // İlk yüklemede veri çek
  useEffect(() => {
    loadData();
  }, []);

  // Ekran her görünür olduğunda scroll pozisyonunu sıfırla ve okunmamış bildirim sayısını güncelle
  useFocusEffect(
    React.useCallback(() => {
      // Scroll pozisyonunu en üste al
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // Okunmamış bildirim sayısını güncelle
      loadUnreadCount();
    }, [])
  );

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Okunmamış bildirim sayısı yüklenirken hata:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı profilini çek
      const profileData = await authService.getProfile();
      setCurrentUser(profileData);
      
      // Tüm verileri paralel olarak çek
      const [reservationsData, announcementsData, unreadNotifications, matchStats, userStandings] = await Promise.all([
        reservationService.getUpcomingReservations(10),
        announcementService.getAllAnnouncements(),
        notificationService.getUnreadCount().catch(() => 0),
        matchHistoryService.getUserMatchStats(profileData.id).catch(() => ({
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        })),
        leagueStandingsService.getStandingsByUserId(profileData.id).catch(() => []),
      ]);
      
      // Boolean değerleri normalize et (API'den string olarak gelebilir)
      const normalizedReservations = (reservationsData || []).map((reservation: any) => ({
        ...reservation,
        // Eğer reservation içinde boolean field'lar varsa normalize et
        court: reservation.court ? {
          ...reservation.court,
          closed: !!(reservation.court.closed),
          indoors: !!(reservation.court.indoors),
        } : reservation.court,
      }));
      
      const normalizedAnnouncements = (announcementsData || []).slice(0, 1).map((announcement: any) => ({
        ...announcement,
        isPinned: !!(announcement.isPinned),
      }));
      
      setReservations(normalizedReservations);
      setAnnouncements(normalizedAnnouncements);
      
      // Kullanıcı istatistiklerini güncelle
      const wins = matchStats.wins || 0;
      const ranking = userStandings && userStandings.length > 0 ? userStandings[0].leagueRanking : null;
      const upcomingCount = normalizedReservations.length;
      
      setUserStats({
        wins,
        ranking,
        upcomingCount,
      });
      
      setUnreadCount(unreadNotifications);
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      
      // Unauthorized hatası ise, session expired
      if (error?.response?.status === 401 || error?.message?.includes('Session expired')) {
        console.log('Session expired - logging out');
        Alert.alert(
          'Oturum Süresi Doldu',
          'Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Tamam',
              onPress: async () => {
                await logout();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' as any }],
                  })
                );
              },
            },
          ],
          { cancelable: false }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatReservationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reservationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (reservationDate.getTime() === today.getTime()) {
      return language === 'tr' ? 'Bugün' : 'Today';
    } else if (reservationDate.getTime() === tomorrow.getTime()) {
      return language === 'tr' ? 'Yarın' : 'Tomorrow';
    } else {
      return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  const formatReservationTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startStr = start.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const endStr = end.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return `${startStr} - ${endStr}`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Get user level/title
  const getUserLevel = () => {
    return currentUser?.title || (language === 'tr' ? 'Üye' : 'Member');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#9E9E9E' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      {/* Hero Section - Artık collapsible değil, sabit */}
      <View style={[styles.heroSection, { paddingTop: insets.top + 12 }]}>
        {/* Normal İçerik */}
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderLeft}>
              <View style={styles.heroHeaderContent}>
                {/* Avatar - Left Side */}
                <View style={styles.avatarContainer}>
                  {currentUser?.profilePhoto ? (
                    <Image 
                      source={{ uri: currentUser.profilePhoto }} 
                      style={styles.profileAvatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{getInitials(currentUser?.name || '')}</Text>
                    </View>
                  )}
                </View>
                
                {/* User Info - Right Side */}
                <View style={styles.userInfoContainer}>
                  <Text style={styles.welcomeText} numberOfLines={1}>{t('home.welcomeBack')}</Text>
                  <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{currentUser?.name || ''}</Text>
                  {currentUser && (
                    <View style={styles.tagsContainer}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText} numberOfLines={1}>{getUserLevel()}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')}
              style={styles.notificationButton}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.heroStats, { marginTop: 16 }]}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color="#666666" />
            <Text style={styles.statNumber}>{userStats.wins}</Text>
            <Text style={styles.statLabel}>{t('home.wins')}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#666666" />
            <Text style={styles.statNumber}>{userStats.ranking ? `#${userStats.ranking}` : '-'}</Text>
            <Text style={styles.statLabel}>{t('home.ranking')}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color="#666666" />
            <Text style={styles.statNumber}>{userStats.upcomingCount}</Text>
            <Text style={styles.statLabel}>{t('home.upcoming')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 20 }}
      >

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.quickActions')}</Title>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} onPress={action.action} activeOpacity={0.7}>
              <View style={[styles.actionCard, themedStyles.card]}>
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color === '#9E9E9E' ? '#F5F5F5' : action.color }]}>
                    <MaterialCommunityIcons 
                      name={action.icon as any} 
                      size={24} 
                      color={action.color === '#9E9E9E' ? '#666666' : '#fff'} 
                    />
                  </View>
                  <Text style={[styles.actionTitle, themedStyles.text]}>{action.title}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Matches - Yakın Zamandaki Rezervasyonlar */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.upcomingReservationsTitle')}</Title>
        {reservations.length > 0 ? (
          reservations.slice(0, 1).map((reservation) => (
            <TouchableOpacity 
              key={reservation.id} 
              onPress={() => navigation.navigate('ReservationsList')}
              activeOpacity={0.7}
            >
              <View style={[styles.matchCard, themedStyles.card]}>
                <View style={{ padding: 16 }}>
                  <View style={styles.reservationHeader}>
                    <View style={styles.reservationInfo}>
                      <Text style={styles.courtName}>{reservation.court?.name || t('home.courts')}</Text>
                      <View style={styles.reservationTimeRow}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#666666" />
                        <Text style={styles.reservationTime}>
                          {formatReservationDate(reservation.startTime)}, {formatReservationTimeRange(reservation.startTime, reservation.endTime)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedBadgeText}>{t('home.confirmed')}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('ReservationsList')}
                    style={styles.viewDetailsButton}
                  >
                    <Text style={styles.viewDetailsText}>{t('home.viewDetails')} →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.matchCard, themedStyles.card]}>
            <View style={{ padding: 16 }}>
              <Text style={{ textAlign: 'center', color: '#9E9E9E' }}>
                {t('home.noUpcomingReservations')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* News & Updates */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.newsUpdates')}</Title>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <View key={announcement.id} style={[styles.newsCard, themedStyles.card]}>
              <View style={{ padding: 16 }}>
                <View style={styles.newsHeader}>
                  <MaterialCommunityIcons 
                    name={!!(announcement.isPinned) ? "pin" : "newspaper"} 
                    size={24} 
                    color="#2E7D32" 
                  />
                  <Text style={[styles.newsTitle, themedStyles.title]}>{announcement.title}</Text>
                </View>
                <Text style={[styles.newsContent, themedStyles.text]}>
                  {announcement.content}
                </Text>
                <Text style={[styles.newsAuthor, themedStyles.subtitle]}>
                  👤                   {announcement.author.name} • {new Date(announcement.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.newsCard, themedStyles.card]}>
            <View style={{ padding: 16 }}>
              <Text style={{ textAlign: 'center', color: '#9E9E9E' }}>
                {t('home.noAnnouncements')}
              </Text>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#BA68C8',
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  heroContent: {
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroHeaderLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  heroHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9575CD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
    minWidth: 0,
  },
  welcomeText: {
    fontSize: 14,
    color: '#F3E5F5',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 14,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#BA68C8',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 0,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
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
    marginTop: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionContent: {
    alignItems: 'center',
    padding: 18,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 13,
    color: '#1B1B1B',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchTime: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  reservationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reservationTime: {
    fontSize: 14,
    color: '#666666',
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confirmedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsButton: {
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  courtChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  courtText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  player: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    color: '#1B1B1B',
    marginTop: 8,
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC3545',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginLeft: 10,
    flex: 1,
  },
  newsContent: {
    color: '#666666',
    marginBottom: 12,
    lineHeight: 22,
    fontSize: 14,
  },
  newsAuthor: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 8,
  },
  reservationNotes: {
    color: '#9E9E9E',
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
