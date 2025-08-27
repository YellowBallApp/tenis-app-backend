import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
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
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const user = {
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@email.com',
    level: 'İleri',
    rank: 'Altın',
    points: 1250,
    matchesPlayed: 45,
    matchesWon: 32,
    winRate: 71,
    joinDate: 'Mart 2023',
    membershipType: 'Premium',
    nextRenewal: '15 Nisan 2024',
  };

  const achievements = [
    { id: 1, title: 'İlk Maç', description: 'İlk maçınızı oynadınız', icon: 'trophy', color: '#FFD700' },
    { id: 2, title: 'Seri Kazanan', description: '5 maç üst üste kazandınız', icon: 'fire', color: '#FF6B35' },
    { id: 3, title: 'Century Club', description: '100 maç oynadınız', icon: 'star', color: '#4CAF50' },
  ];

  const preferences = [
    { id: 1, title: 'Bildirimler', icon: 'bell', enabled: notificationsEnabled, onToggle: setNotificationsEnabled },
    { id: 2, title: 'Karanlık Mod', icon: 'theme-light-dark', enabled: darkModeEnabled, onToggle: setDarkModeEnabled },
    { id: 3, title: 'Konum Paylaşımı', icon: 'map-marker', enabled: true, onToggle: () => {} },
  ];

  const quickActions = [
    { title: 'Profil Düzenle', icon: 'account-edit', action: () => {} },
    { title: 'Şifre Değiştir', icon: 'lock-reset', action: () => {} },
    { title: 'Hesap Ayarları', icon: 'cog', action: () => {} },
    { title: 'Yardım', icon: 'help-circle', action: () => {} },
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

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Avatar.Text size={80} label={user.name.charAt(0)} style={styles.avatar} />
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
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>İstatistikler</Title>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="trophy" size={32} color="#2E7D32" />
              <Text style={styles.statNumber}>{user.points}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="tennis" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>{user.matchesPlayed}</Text>
              <Text style={styles.statLabel}>Maç</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#81C784" />
              <Text style={styles.statNumber}>{user.matchesWon}</Text>
              <Text style={styles.statLabel}>Galibiyet</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="percent" size={32} color="#28A745" />
              <Text style={styles.statNumber}>{user.winRate}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Başarılar</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievements.map((achievement) => (
            <Card key={achievement.id} style={styles.achievementCard}>
              <Card.Content style={styles.achievementContent}>
                <MaterialCommunityIcons 
                  name={achievement.icon as any} 
                  size={40} 
                  color={achievement.color} 
                />
                <Title style={styles.achievementTitle}>{achievement.title}</Title>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Membership Info */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Üyelik Bilgileri</Title>
        <Card style={styles.membershipCard}>
          <Card.Content>
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="calendar" size={24} color="#2E7D32" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Katılım Tarihi</Text>
                <Text style={styles.membershipValue}>{user.joinDate}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Üyelik Türü</Text>
                <Text style={styles.membershipValue}>{user.membershipType}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="refresh" size={24} color="#4CAF50" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Sonraki Yenileme</Text>
                <Text style={styles.membershipValue}>{user.nextRenewal}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Tercihler</Title>
        <Card style={styles.preferencesCard}>
          <Card.Content>
            {preferences.map((preference) => (
              <View key={preference.id} style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name={preference.icon as any} size={24} color="#2E7D32" />
                  <Text style={styles.preferenceTitle}>{preference.title}</Text>
                </View>
                <Switch
                  value={preference.enabled}
                  onValueChange={preference.onToggle}
                  color="#2E7D32"
                />
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Hızlı İşlemler</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={action.action}
              style={styles.actionButton}
              textColor="#2E7D32"
              icon={action.icon}
            >
              {action.title}
            </Button>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FFFFFF',
    marginRight: 20,
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
  achievementCard: {
    width: 150,
    marginRight: 15,
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
    padding: 15,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 16,
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
});

export default ProfileScreen;
