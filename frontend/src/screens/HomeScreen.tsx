import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const upcomingMatches = [
    { id: 1, player1: 'Ahmet Yılmaz', player2: 'Mehmet Demir', time: '14:00', court: 'Kort 1' },
    { id: 2, player1: 'Fatma Kaya', player2: 'Ayşe Özkan', time: '15:30', court: 'Kort 2' },
  ];

  const quickActions = [
    { title: 'Rezervasyon Yap', icon: 'calendar-plus', color: '#2E7D32', action: () => navigation.navigate('Reservation') },
    { title: 'Ders Programı', icon: 'school', color: '#4CAF50', action: () => console.log('Ders Programı') },
    { title: 'Lider Tablosu', icon: 'trophy', color: '#81C784', action: () => navigation.navigate('GameModes') },
    { title: 'Duyurular', icon: 'bullhorn', color: '#28A745', action: () => console.log('Duyurular') },
  ];

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

      {/* Upcoming Matches */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Yaklaşan Maçlar</Title>
        {upcomingMatches.map((match) => (
          <Card key={match.id} style={styles.matchCard}>
            <Card.Content>
              <View style={styles.matchHeader}>
                <Text style={styles.matchTime}>{match.time}</Text>
                <View style={styles.courtChip}>
                  <Text style={styles.courtText}>{match.court}</Text>
                </View>
              </View>
              <View style={styles.matchPlayers}>
                <View style={styles.player}>
                  <Avatar.Text size={40} label={match.player1.charAt(0)} />
                  <Text style={styles.playerName}>{match.player1}</Text>
                </View>
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={styles.player}>
                  <Avatar.Text size={40} label={match.player2.charAt(0)} />
                  <Text style={styles.playerName}>{match.player2}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* News & Updates */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Haberler & Güncellemeler</Title>
        <Card style={styles.newsCard}>
          <Card.Content>
            <View style={styles.newsHeader}>
              <MaterialCommunityIcons name="newspaper" size={24} color="#2E7D32" />
              <Text style={styles.newsTitle}>Yeni Turnuva Duyurusu</Text>
            </View>
            <Text style={styles.newsContent}>
              Bu hafta sonu gerçekleşecek olan "Bahar Kupası" turnuvası için kayıtlar başlamıştır.
            </Text>
            <Button mode="text" textColor="#2E7D32">
              Detayları Gör
            </Button>
          </Card.Content>
        </Card>
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
  },
});

export default HomeScreen;
