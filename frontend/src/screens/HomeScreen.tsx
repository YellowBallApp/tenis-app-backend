import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { reservationService, announcementService, userService, courtService, coachService, notificationService } from '../services/api';
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
  const [reservations, setReservations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    courts: 0,
    coaches: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Scroll animation için
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [250, 100],
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

  const quickActions = [
    { title: t('home.reservationMake'), icon: 'calendar-plus', color: '#2E7D32', action: () => navigation.navigate('Reservation') },
    { title: t('home.reservationsList'), icon: 'calendar-text', color: '#1B5E20', action: () => navigation.navigate('ReservationsList') },
    { title: t('home.matchHistory'), icon: 'history', color: '#FF9800', action: () => navigation.navigate('MatchHistory') },
    { title: t('home.notifications'), icon: 'bell', color: '#1976D2', action: () => navigation.navigate('Notifications'), badge: unreadCount },
  ];

  // İlk yüklemede veri çek
  useEffect(() => {
    loadData();
  }, []);

  // Ekran her görünür olduğunda sadece scroll pozisyonunu sıfırla (veri yükleme)
  useFocusEffect(
    React.useCallback(() => {
      // Scroll pozisyonunu en üste al
      scrollY.setValue(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Tüm verileri paralel olarak çek
      const [reservationsData, announcementsData, usersData, courtsData, coachesData, unreadNotifications] = await Promise.all([
        reservationService.getUpcomingReservations(2),
        announcementService.getAllAnnouncements(),
        userService.getAllUsers(),
        courtService.getAllCourts(),
        coachService.getAllCoaches(),
        notificationService.getUnreadCount().catch(() => 0), // Hata durumunda 0 döndür
      ]);
      
      setReservations(reservationsData);
      setAnnouncements(announcementsData.slice(0, 1)); // İlk duyuru
      
      // İstatistikleri güncelle
      setStats({
        users: usersData.length,
        courts: courtsData.length,
        coaches: coachesData.length,
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      {/* Animated Hero Section - Modern Gradient Design */}
      <Animated.View style={[
        styles.heroSection, 
        { 
          height: headerHeight,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }
      ]}>
        <LinearGradient
          colors={['#2E7D32', '#4CAF50', '#66BB6A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Kompakt Başlık (scroll edildiğinde görünür) */}
        <Animated.View style={[
          styles.compactHeader,
          { opacity: compactOpacity }
        ]}>
          <Text style={styles.compactTitle}>{t('home.homePage')}</Text>
        </Animated.View>
        
        {/* Normal İçerik (scroll başta görünür) */}
        <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="tennis" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Title style={styles.heroTitle}>{t('home.tennisClub')}</Title>
          <Text style={styles.heroSubtitle}>
            {t('home.subtitle')}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.heroStats, { opacity: headerOpacity }]}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>{stats.users}</Text>
            <Text style={styles.statLabel}>{t('home.activeMembers')}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="tennis-ball" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>{stats.courts}</Text>
            <Text style={styles.statLabel}>{t('home.courts')}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>{stats.coaches}</Text>
            <Text style={styles.statLabel}>{t('home.coaches')}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 250 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.quickActions')}</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} onPress={action.action} activeOpacity={0.8}>
              <View style={styles.actionCardWrapper}>
                <LinearGradient
                  colors={['#FFFFFF', '#FAFAFA']}
                  style={styles.actionCard}
                >
                  <View style={styles.actionContent}>
                    <LinearGradient
                      colors={[action.color, action.color + 'DD']}
                      style={styles.actionIcon}
                    >
                      <MaterialCommunityIcons name={action.icon as any} size={28} color="#fff" />
                      {action.badge !== undefined && action.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                        </View>
                      )}
                    </LinearGradient>
                    <Text style={[styles.actionTitle, themedStyles.text]}>{action.title}</Text>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Matches - Yakın Zamandaki Rezervasyonlar */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.upcomingReservationsTitle')}</Title>
        {reservations.length > 0 ? (
          reservations.map((reservation) => (
            <View key={reservation.id} style={styles.matchCardWrapper}>
              <LinearGradient
                colors={['#FFFFFF', '#FAFAFA']}
                style={styles.matchCard}
              >
                <Card.Content>
                  <View style={styles.matchHeader}>
                    <View style={styles.timeBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#2E7D32" />
                      <Text style={styles.matchTime}>{formatTime(reservation.startTime)}</Text>
                    </View>
                    <View style={styles.courtChip}>
                      <MaterialCommunityIcons name="tennis-ball" size={14} color="#2E7D32" />
                      <Text style={styles.courtText}>{reservation.court?.name || t('home.courts')}</Text>
                    </View>
                  </View>
                  <View style={styles.matchPlayers}>
                    <View style={styles.player}>
                      <View style={styles.avatarWrapper}>
                        <Avatar.Text size={48} label={reservation.user.name.charAt(0)} />
                      </View>
                      <Text style={[styles.playerName, themedStyles.text]}>{reservation.user.name}</Text>
                    </View>
                    {reservation.participants && reservation.participants.length > 0 && (
                      <>
                        <View style={styles.vsContainer}>
                          <Text style={styles.vsText}>VS</Text>
                        </View>
                        <View style={styles.player}>
                          <View style={styles.avatarWrapper}>
                            <Avatar.Text size={48} label={reservation.participants[0].name.charAt(0)} />
                          </View>
                          <Text style={[styles.playerName, themedStyles.text]}>{reservation.participants[0].name}</Text>
                        </View>
                      </>
                    )}
                  </View>
                  {reservation.notes && (
                    <View style={styles.notesContainer}>
                      <MaterialCommunityIcons name="note-text" size={16} color="#6C757D" />
                      <Text style={[styles.reservationNotes, themedStyles.subtitle]}>{reservation.notes}</Text>
                    </View>
                  )}
                </Card.Content>
              </LinearGradient>
            </View>
          ))
        ) : (
          <View style={styles.matchCardWrapper}>
            <LinearGradient
              colors={['#FFFFFF', '#FAFAFA']}
              style={styles.matchCard}
            >
              <Card.Content>
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="calendar-blank" size={48} color="#9E9E9E" />
                  <Text style={{ textAlign: 'center', color: '#9E9E9E', marginTop: 12, fontSize: 14 }}>
                    {t('home.noUpcomingReservations')}
                  </Text>
                </View>
              </Card.Content>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* News & Updates */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>{t('home.newsUpdates')}</Title>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <View key={announcement.id} style={styles.newsCardWrapper}>
              <LinearGradient
                colors={['#FFFFFF', '#FAFAFA']}
                style={styles.newsCard}
              >
                <Card.Content>
                  <View style={styles.newsHeader}>
                    <View style={styles.newsIconContainer}>
                      <MaterialCommunityIcons 
                        name={announcement.isPinned ? "pin" : "newspaper-variant"} 
                        size={24} 
                        color={theme.colors.primary} 
                      />
                    </View>
                    <Text style={[styles.newsTitle, themedStyles.title]}>{announcement.title}</Text>
                  </View>
                  <Text style={[styles.newsContent, themedStyles.text]}>
                    {announcement.content}
                  </Text>
                  <View style={styles.newsFooter}>
                    <MaterialCommunityIcons name="account" size={16} color="#9E9E9E" />
                    <Text style={[styles.newsAuthor, themedStyles.subtitle]}>
                      {announcement.author.name} • {new Date(announcement.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                    </Text>
                  </View>
                </Card.Content>
              </LinearGradient>
            </View>
          ))
        ) : (
          <View style={styles.newsCardWrapper}>
            <LinearGradient
              colors={['#FFFFFF', '#FAFAFA']}
              style={styles.newsCard}
            >
              <Card.Content>
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color="#9E9E9E" />
                  <Text style={{ textAlign: 'center', color: '#9E9E9E', marginTop: 12, fontSize: 14 }}>
                    {t('home.noAnnouncements')}
                  </Text>
                </View>
              </Card.Content>
            </LinearGradient>
          </View>
        )}
      </View>
      </Animated.ScrollView>
    </View>
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
  heroSection: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 50,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E8F5E8',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardWrapper: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  actionContent: {
    alignItems: 'center',
    padding: 18,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 14,
    color: '#1B1B1B',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
  },
  matchCardWrapper: {
    marginBottom: 15,
    borderRadius: 18,
    overflow: 'hidden',
  },
  matchCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  courtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  courtText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
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
  avatarWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
  newsCardWrapper: {
    marginBottom: 15,
    borderRadius: 18,
    overflow: 'hidden',
  },
  newsCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  newsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginLeft: 10,
  },
  newsContent: {
    color: '#6C757D',
    marginBottom: 15,
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  newsAuthor: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  reservationNotes: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
