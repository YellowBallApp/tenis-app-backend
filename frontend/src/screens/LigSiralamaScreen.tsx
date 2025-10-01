import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Portal,
  Modal,
  TextInput,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LigSiralamaScreen = ({ route, navigation }: any) => {
  const { lig } = route.params;
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [challengeMessage, setChallengeMessage] = useState('');

  const currentUser = {
    id: 12,
    name: 'Ahmet Emin Kahraman',
    level: 'İleri',
    rank: 'Altın',
    points: 1250,
    position: 12,
    winRate: 78,
    matchesPlayed: 45,
    lastActive: '2 saat önce',
    status: 'online',
  };

  const players = [
    {
      id: 1,
      name: 'Mehmet Demir',
      level: 'Uzman',
      rank: 'Platin',
      points: 2450,
      position: 1,
      winRate: 92,
      matchesPlayed: 89,
      lastActive: '1 saat önce',
      status: 'online',
      achievements: ['🏆 Lig Şampiyonu', '⭐ 10 Maç Serisi'],
    },
    {
      id: 2,
      name: 'Ayşe Özkan',
      level: 'Uzman',
      rank: 'Platin',
      points: 2380,
      position: 2,
      winRate: 88,
      matchesPlayed: 76,
      lastActive: '3 saat önce',
      status: 'online',
      achievements: ['🥈 İkinci Sıra', '🔥 5 Maç Serisi'],
    },
    {
      id: 3,
      name: 'Ali Veli',
      level: 'İleri',
      rank: 'Altın',
      points: 2200,
      position: 3,
      winRate: 85,
      matchesPlayed: 67,
      lastActive: '5 saat önce',
      status: 'away',
      achievements: ['🥉 Üçüncü Sıra'],
    },
    {
      id: 4,
      name: 'Fatma Kaya',
      level: 'İleri',
      rank: 'Altın',
      points: 1980,
      position: 4,
      winRate: 82,
      matchesPlayed: 54,
      lastActive: '1 gün önce',
      status: 'offline',
      achievements: ['⭐ Yükselen Oyuncu'],
    },
    {
      id: 5,
      name: 'Zeynep Arslan',
      level: 'İleri',
      rank: 'Altın',
      points: 1850,
      position: 5,
      winRate: 79,
      matchesPlayed: 48,
      lastActive: '2 gün önce',
      status: 'offline',
      achievements: ['🎯 İstikrarlı Oyuncu'],
    },
    {
      id: 6,
      name: 'Can Yılmaz',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1650,
      position: 6,
      winRate: 75,
      matchesPlayed: 42,
      lastActive: '3 gün önce',
      status: 'offline',
      achievements: ['🌱 Gelişen Yetenek'],
    },
    {
      id: 7,
      name: 'Selin Demir',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1520,
      position: 7,
      winRate: 72,
      matchesPlayed: 38,
      lastActive: '4 gün önce',
      status: 'offline',
      achievements: ['💪 Güçlü Savunma'],
    },
    {
      id: 8,
      name: 'Burak Kaya',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1480,
      position: 8,
      winRate: 70,
      matchesPlayed: 35,
      lastActive: '5 gün önce',
      status: 'offline',
      achievements: ['🎾 Teknik Oyuncu'],
    },
    {
      id: 9,
      name: 'Emre Özkan',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1420,
      position: 9,
      winRate: 68,
      matchesPlayed: 33,
      lastActive: '6 gün önce',
      status: 'offline',
      achievements: ['⚡ Hızlı Oyuncu'],
    },
    {
      id: 10,
      name: 'Deniz Arslan',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1380,
      position: 10,
      winRate: 65,
      matchesPlayed: 31,
      lastActive: '1 hafta önce',
      status: 'offline',
      achievements: ['🎯 Hedefli Oyuncu'],
    },
    {
      id: 11,
      name: 'Gizem Yılmaz',
      level: 'Orta',
      rank: 'Gümüş',
      points: 1320,
      position: 11,
      winRate: 63,
      matchesPlayed: 29,
      lastActive: '1 hafta önce',
      status: 'offline',
      achievements: ['🤝 Takım Oyuncusu'],
    },
    {
      id: 12,
      name: 'Ahmet Emin Kahraman',
      level: 'İleri',
      rank: 'Altın',
      points: 1250,
      position: 12,
      winRate: 78,
      matchesPlayed: 45,
      lastActive: '2 saat önce',
      status: 'online',
      achievements: ['⭐ Yeni Yetenek'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FF9800';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'away': return 'Uzakta';
      case 'offline': return 'Çevrimdışı';
      default: return 'Çevrimdışı';
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    if (position <= 10) return '#2E7D32';
    return '#6C757D';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return 'trophy';
    if (position === 2) return 'medal';
    if (position === 3) return 'medal';
    return 'numeric';
  };

  const openChallengeModal = (player: any) => {
    if (player.id === currentUser.id) {
      Alert.alert('Hata', 'Kendinizle maç yapamazsınız!');
      return;
    }
    
    // Defi Lig kuralı: Sadece 3 sıra üstüne meydan okunabilir
    const positionDifference = currentUser.position - player.position;
    if (positionDifference > 3) {
      Alert.alert(
        'Meydan Okuma Kuralı', 
        `Sadece 3 sıra üstündeki oyunculara meydan okuyabilirsiniz.\n\nMevcut sıranız: #${currentUser.position}\nHedef sıra: #${player.position}\nFark: ${positionDifference} sıra`
      );
      return;
    }
    
    setSelectedPlayer(player);
    setChallengeMessage('');
    setShowChallengeModal(true);
  };

  const sendChallenge = () => {
    if (!challengeMessage.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }

    Alert.alert(
      'Meydan Okuma Gönderildi',
      `${selectedPlayer?.name} adlı oyuncuya meydan okuma gönderildi!`,
      [
        {
          text: 'Tamam',
          onPress: () => setShowChallengeModal(false),
        },
      ]
    );
  };

  const renderPlayerCard = (player: any) => {
    const isCurrentUser = player.id === currentUser.id;
    const positionDifference = currentUser.position - player.position;
    const canChallenge = !isCurrentUser && positionDifference <= 3 && positionDifference > 0;
    
    // Kullanıcı kendini gösterme, zaten "Senin Sıran" bölümünde gösteriliyor
    if (isCurrentUser) {
      return null;
    }
    
    return (
      <Card 
        key={player.id} 
        style={styles.playerCard}
      >
        <Card.Content>
          <View style={styles.playerHeader}>
            <View style={styles.positionContainer}>
              <MaterialCommunityIcons 
                name={getPositionIcon(player.position) as any} 
                size={20} 
                color={getPositionColor(player.position)} 
              />
              <Text style={[styles.positionText, { color: getPositionColor(player.position) }]}>
                #{player.position}
              </Text>
            </View>
            
            <Avatar.Text 
              size={45} 
              label={player.name.split(' ').map((n: string) => n.charAt(0)).join('')} 
              style={styles.playerAvatar}
            />
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerLevel}>{player.level} • {player.rank}</Text>
              <Text style={styles.playerPoints}>{player.points} puan</Text>
            </View>
            
            <View style={styles.playerActions}>
              {canChallenge ? (
                <Button
                  mode="contained"
                  onPress={() => openChallengeModal(player)}
                  style={styles.challengeButton}
                  buttonColor="#2E7D32"
                  icon="sword-cross"
                  compact
                >
                  Meydan Oku
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  disabled={true}
                  style={styles.disabledChallengeButton}
                  textColor="#9E9E9E"
                  icon="lock"
                  compact
                >
                  Kilitli
                </Button>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFFFFF"
              onPress={() => navigation.goBack()}
            />
            <View style={styles.headerInfo}>
              <Title style={styles.headerTitle}>{lig.name}</Title>
              <Text style={styles.headerSubtitle}>
                {players.length} oyuncu • 1v1 rekabet
              </Text>
            </View>
            <IconButton
              icon="refresh"
              size={24}
              iconColor="#FFFFFF"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Current User Status */}
        <View style={styles.userStatusSection}>
          <Card style={styles.userStatusCard}>
            <Card.Content>
              <View style={styles.userStatusHeader}>
                <View style={styles.userPosition}>
                  <MaterialCommunityIcons 
                    name={getPositionIcon(currentUser.position) as any} 
                    size={20} 
                    color={getPositionColor(currentUser.position)} 
                  />
                  <Text style={[styles.userPositionText, { color: getPositionColor(currentUser.position) }]}>
                    #{currentUser.position}
                  </Text>
                </View>
                <Text style={styles.userStatusText}>
                  {currentUser.points} puan • %{currentUser.winRate} galibiyet
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Current User Card - Belirgin Gösterim */}
        <View style={styles.currentUserSection}>
          <Title style={styles.sectionTitle}>Senin Sıran</Title>
          <Card style={styles.currentUserHighlightCard}>
            <Card.Content>
              <View style={styles.currentUserHighlightHeader}>
                <Avatar.Text 
                  size={55} 
                  label={currentUser.name.split(' ').map((n: string) => n.charAt(0)).join('')} 
                  style={styles.currentUserHighlightAvatar}
                />
                
                <View style={styles.currentUserHighlightInfo}>
                  <Text style={styles.currentUserHighlightName}>{currentUser.name}</Text>
                  <Text style={styles.currentUserHighlightLevel}>{currentUser.level} • {currentUser.rank}</Text>
                </View>
                
                <View style={styles.currentUserPositionContainer}>
                  <MaterialCommunityIcons 
                    name={getPositionIcon(currentUser.position) as any} 
                    size={24} 
                    color={getPositionColor(currentUser.position)} 
                  />
                  <Text style={[styles.currentUserPositionText, { color: getPositionColor(currentUser.position) }]}>
                    #{currentUser.position}
                  </Text>
                </View>
              </View>
              
              <View style={styles.currentUserHighlightStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.points}</Text>
                  <Text style={styles.statLabel}>Puan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.winRate}%</Text>
                  <Text style={styles.statLabel}>Galibiyet</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.matchesPlayed}</Text>
                  <Text style={styles.statLabel}>Maç</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <Title style={styles.sectionTitle}>Rakip Oyuncular</Title>
          {players.map(renderPlayerCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Title style={styles.sectionTitle}>Hızlı İşlemler</Title>
          <View style={styles.quickActionsGrid}>
            <Button
              mode="contained"
              style={styles.quickActionButton}
              buttonColor="#2E7D32"
              icon="sword-cross"
              onPress={() => {}}
            >
              Rastgele Meydan Okuma
            </Button>
            <Button
              mode="outlined"
              style={styles.quickActionButton}
              textColor="#2E7D32"
              icon="calendar"
              onPress={() => {}}
            >
              Maç Geçmişi
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Challenge Modal */}
      <Portal>
        <Modal
          visible={showChallengeModal}
          onDismiss={() => setShowChallengeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="sword-cross" size={32} color="#FF9800" />
                <Title style={styles.modalTitle}>Meydan Okuma Gönder</Title>
                <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              {selectedPlayer && (
                <>
                  <Text style={styles.modalSubtitle}>
                    {selectedPlayer.name} adlı oyuncuya meydan okuma gönderin
                  </Text>
                  
                  <View style={styles.opponentInfo}>
                    <Avatar.Text 
                      size={40} 
                      label={selectedPlayer.name.split(' ').map((n: string) => n.charAt(0)).join('')} 
                    />
                    <View style={styles.opponentDetails}>
                      <Text style={styles.opponentName}>{selectedPlayer.name}</Text>
                      <Text style={styles.opponentLevel}>{selectedPlayer.level} • {selectedPlayer.rank}</Text>
                      <Text style={styles.opponentPoints}>{selectedPlayer.points} puan</Text>
                    </View>
                  </View>
                  
                  <TextInput
                    mode="outlined"
                    label="Meydan Okuma Mesajı"
                    placeholder="Mesajınızı yazın..."
                    value={challengeMessage}
                    onChangeText={setChallengeMessage}
                    multiline
                    numberOfLines={3}
                    style={styles.messageInput}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#2E7D32"
                  />

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowChallengeModal(false)}
                      style={styles.modalCancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={sendChallenge}
                      style={styles.modalSendButton}
                      buttonColor="#2E7D32"
                    >
                      Gönder
                    </Button>
                  </View>
                </>
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
  headerSection: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  userStatusSection: {
    padding: 20,
  },
  userStatusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  userStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userPosition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  userStatusText: {
    fontSize: 14,
    color: '#6C757D',
  },
  currentUserSection: {
    padding: 20,
    paddingBottom: 10,
  },
  currentUserHighlightCard: {
    backgroundColor: '#F8FFF8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  currentUserHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentUserPositionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  currentUserPositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  currentUserHighlightAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 12,
  },
  currentUserHighlightInfo: {
    flex: 1,
  },
  currentUserHighlightName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  currentUserHighlightLevel: {
    fontSize: 13,
    color: '#6C757D',
  },
  currentUserHighlightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  playersSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
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
  currentUserCard: {
    borderColor: '#2E7D32',
    borderWidth: 2,
    backgroundColor: '#F8FFF8',
  },
  currentUserHighlightCard: {
    borderColor: '#2E7D32',
    borderWidth: 3,
    backgroundColor: '#F8FFF8',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 35,
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  playerAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 3,
  },
  playerLevel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 3,
  },
  playerPoints: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  playerActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  challengeButton: {
    borderRadius: 8,
  },
  disabledChallengeButton: {
    borderRadius: 8,
    borderColor: '#E0E0E0',
  },
  quickActionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
  },
  modalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
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
    fontSize: 18,
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
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  opponentDetails: {
    marginLeft: 15,
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  opponentLevel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 3,
  },
  opponentPoints: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  messageInput: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 12,
  },
  modalSendButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
  },
});

export default LigSiralamaScreen;
