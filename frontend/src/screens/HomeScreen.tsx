import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { reservationService, announcementService } from '../services/api';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [reservations, setReservations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { title: 'Rezervasyon Yap', icon: 'calendar-plus', color: '#2E7D32', action: () => navigation.navigate('Reservation') },
    { title: 'Rezervasyonlar', icon: 'calendar-text', color: '#1B5E20', action: () => navigation.navigate('ReservationsList') },
    { title: 'Maç Geçmişi', icon: 'history', color: '#FF9800', action: () => navigation.navigate('MatchHistory') },
    { title: 'Lider Tablosu', icon: 'trophy', color: '#81C784', action: () => navigation.navigate('GameModes') },
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
      
      // Yakın zamandaki rezervasyonları getir (en yakın 2)
      const reservationsData = await reservationService.getUpcomingReservations(2);
      setReservations(reservationsData);

      // Duyuruları getir
      const announcementsData = await announcementService.getAllAnnouncements();
      setAnnouncements(announcementsData.slice(0, 1)); // İlk duyuru
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
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
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Title style={styles.heroTitle}>🎾 Tenis Kulübü</Title>
          <Text style={styles.heroSubtitle}>
            Profesyonel tenis deneyimi için doğru adres
          </Text>
          <Button 
            mode="contained" 
            style={styles.heroButton}
            buttonColor="#FFFFFF"
            textColor="#2E7D32"
          >
            Hemen Başla
          </Button>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>150+</Text>
            <Text style={styles.statLabel}>Aktif Üye</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Kort</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Hoca</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Hızlı İşlemler</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} onPress={action.action} activeOpacity={1}>
              <Card style={styles.actionCard}>
                <Card.Content style={styles.actionContent}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Matches - Yakın Zamandaki Rezervasyonlar */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Yakın Zamandaki Rezervasyonlar</Title>
        {reservations.length > 0 ? (
          reservations.map((reservation) => (
            <Card key={reservation.id} style={styles.matchCard}>
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
                    <Text style={styles.playerName}>{reservation.user.name}</Text>
                  </View>
                  {reservation.participants && reservation.participants.length > 0 && (
                    <>
                      <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                      </View>
                      <View style={styles.player}>
                        <Avatar.Text size={40} label={reservation.participants[0].name.charAt(0)} />
                        <Text style={styles.playerName}>{reservation.participants[0].name}</Text>
                      </View>
                    </>
                  )}
                </View>
                {reservation.notes && (
                  <Text style={styles.reservationNotes}>📝 {reservation.notes}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.matchCard}>
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
        <Title style={styles.sectionTitle}>Haberler & Güncellemeler</Title>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id} style={styles.newsCard}>
              <Card.Content>
                <View style={styles.newsHeader}>
                  <MaterialCommunityIcons 
                    name={announcement.isPinned ? "pin" : "newspaper"} 
                    size={24} 
                    color="#2E7D32" 
                  />
                  <Text style={styles.newsTitle}>{announcement.title}</Text>
                </View>
                <Text style={styles.newsContent}>
                  {announcement.content}
                </Text>
                <Text style={styles.newsAuthor}>
                  👤 {announcement.author.name} • {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.newsCard}>
            <Card.Content>
              <Text style={{ textAlign: 'center', color: '#6C757D' }}>
                Henüz duyuru bulunmuyor
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    backgroundColor: '#2E7D32',
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
  heroContent: {
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
  },
  heroButton: {
    borderRadius: 25,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
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
