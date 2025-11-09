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
import { reservationService, announcementService, userService, courtService, coachService, notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout } = useAuth();
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
    { title: 'Rezervasyon Yap', icon: 'calendar-plus', color: '#2E7D32', action: () => navigation.navigate('Reservation') },
    { title: 'Rezervasyonlar', icon: 'calendar-text', color: '#1B5E20', action: () => navigation.navigate('ReservationsList') },
    { title: 'Maç Geçmişi', icon: 'history', color: '#FF9800', action: () => navigation.navigate('MatchHistory') },
    { title: 'Bildirimler', icon: 'bell', color: '#1976D2', action: () => navigation.navigate('Notifications'), badge: unreadCount },
  ];

  // Ekran her görünür olduğunda rezervasyonları yenile
  useFocusEffect(
    React.useCallback(() => {
      loadData();
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
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 0 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Animated Hero Section */}
        <Animated.View style={[
          styles.heroSection, 
          { 
            backgroundColor: theme.colors.primary,
            height: headerHeight,
          }
        ]}>
          {/* Kompakt Başlık (scroll edildiğinde görünür) */}
          <Animated.View style={[
            styles.compactHeader,
            { opacity: compactOpacity }
          ]}>
            <Text style={styles.compactTitle}>🎾 Ana Sayfa</Text>
          </Animated.View>
          
          {/* Normal İçerik (scroll başta görünür) */}
          <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
            <Title style={styles.heroTitle}>🎾 Tenis Kulübü</Title>
            <Text style={styles.heroSubtitle}>
              Profesyonel tenis deneyimi için doğru adres
            </Text>
          </Animated.View>
          <Animated.View style={[styles.heroStats, { opacity: headerOpacity }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.users}</Text>
              <Text style={styles.statLabel}>Aktif Üye</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.courts}</Text>
              <Text style={styles.statLabel}>Kort</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.coaches}</Text>
              <Text style={styles.statLabel}>Koç</Text>
            </View>
          </Animated.View>
        </Animated.View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Hızlı İşlemler</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} onPress={action.action} activeOpacity={1}>
              <Card style={[styles.actionCard, themedStyles.card]}>
                <Card.Content style={styles.actionContent}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="#fff" />
                    {action.badge !== undefined && action.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.actionTitle, themedStyles.text]}>{action.title}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Matches - Yakın Zamandaki Rezervasyonlar */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Yakın Zamandaki Rezervasyonlar</Title>
        {reservations.length > 0 ? (
          reservations.map((reservation) => (
            <Card key={reservation.id} style={[styles.matchCard, themedStyles.card]}>
              <Card.Content>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTime}>{formatTime(reservation.startTime)}</Text>
                  <View style={styles.courtChip}>
                    <Text style={styles.courtText}>{reservation.court?.name || 'Kort'}</Text>
                  </View>
                </View>
                <View style={styles.matchPlayers}>
                  <View style={styles.player}>
                    <Avatar.Text size={40} label={reservation.user.name.charAt(0)} />
                    <Text style={[styles.playerName, themedStyles.text]}>{reservation.user.name}</Text>
                  </View>
                  {reservation.participants && reservation.participants.length > 0 && (
                    <>
                      <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                      </View>
                      <View style={styles.player}>
                        <Avatar.Text size={40} label={reservation.participants[0].name.charAt(0)} />
                        <Text style={[styles.playerName, themedStyles.text]}>{reservation.participants[0].name}</Text>
                      </View>
                    </>
                  )}
                </View>
                {reservation.notes && (
                  <Text style={[styles.reservationNotes, themedStyles.subtitle]}>📝 {reservation.notes}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={[styles.matchCard, themedStyles.card]}>
            <Card.Content>
              <Text style={{ textAlign: 'center', color: '#6C757D' }}>
                Yakın zamanda rezervasyon yok
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* News & Updates */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>Haberler & Güncellemeler</Title>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id} style={[styles.newsCard, themedStyles.card]}>
              <Card.Content>
                <View style={styles.newsHeader}>
                  <MaterialCommunityIcons 
                    name={announcement.isPinned ? "pin" : "newspaper"} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.newsTitle, themedStyles.title]}>{announcement.title}</Text>
                </View>
                <Text style={[styles.newsContent, themedStyles.text]}>
                  {announcement.content}
                </Text>
                <Text style={[styles.newsAuthor, themedStyles.subtitle]}>
                  👤 {announcement.author.name} • {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={[styles.newsCard, themedStyles.card]}>
            <Card.Content>
              <Text style={{ textAlign: 'center', color: '#6C757D' }}>
                Henüz duyuru bulunmuyor
              </Text>
            </Card.Content>
          </Card>
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
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
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
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 50) / 2,
    marginBottom: 15,
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
  actionContent: {
    alignItems: 'center',
    padding: 15,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
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
    fontSize: 12,
    color: '#1B1B1B',
    textAlign: 'center',
    fontWeight: '500',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
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
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  courtChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
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
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  newsAuthor: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 10,
  },
  reservationNotes: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
