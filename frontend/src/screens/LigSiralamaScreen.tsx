import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { leagueService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LigSiralamaScreen = ({ route, navigation }: any) => {
  const { lig } = route.params;
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // Sıralama verilerini getir
      const rankingsData = await leagueService.getLeagueRankings();
      
      // Kullanıcı bilgisini al (şu an için ilk kullanıcıyı current user olarak kabul ediyoruz)
      // Gerçek uygulamada AsyncStorage'dan alınmalı
      const currentUserData = rankingsData[0]; // İlk kullanıcıyı current user yap
      
      setPlayers(rankingsData);
      setCurrentUser({
        id: currentUserData.user.id,
        name: currentUserData.user.name,
        position: currentUserData.position,
        email: currentUserData.user.email,
      });
    } catch (error) {
      console.error('Sıralama yüklenirken hata:', error);
      Alert.alert('Hata', 'Sıralama verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

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

  const sendChallenge = async () => {
    if (!challengeMessage.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }

    try {
      await leagueService.sendMatchChallenge(
        currentUser.id,
        selectedPlayer.user.id,
        challengeMessage
      );

      Alert.alert(
        'Meydan Okuma Gönderildi',
        `${selectedPlayer?.user.name} adlı oyuncuya meydan okuma gönderildi!`,
        [
          {
            text: 'Tamam',
            onPress: () => setShowChallengeModal(false),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Meydan okuma gönderilemedi');
    }
  };

  const renderPlayerCard = (player: any) => {
    if (!currentUser) return null;
    
    const isCurrentUser = player.user.id === currentUser.id;
    const positionDifference = currentUser.position - player.position;
    const canChallenge = !isCurrentUser && positionDifference <= 3 && positionDifference > 0;
    
    // Kullanıcı kendini gösterme, zaten "Senin Sıran" bölümünde gösteriliyor
    if (isCurrentUser) {
      return null;
    }
    
    return (
      <Card 
        key={player.user.id} 
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
              label={player.user.name.charAt(0)} 
              style={styles.playerAvatar}
            />
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.user.name}</Text>
              <Text style={styles.playerLevel}>{player.description || 'Oyuncu'}</Text>
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

  if (loading || !currentUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>Yükleniyor...</Text>
      </View>
    );
  }

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
                  {currentUser.email}
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
                  label={currentUser.name.charAt(0)} 
                  style={styles.currentUserHighlightAvatar}
                />
                
                <View style={styles.currentUserHighlightInfo}>
                  <Text style={styles.currentUserHighlightName}>{currentUser.name}</Text>
                  <Text style={styles.currentUserHighlightLevel}>{currentUser.email}</Text>
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
                    {selectedPlayer.user.name} adlı oyuncuya meydan okuma gönderin
                  </Text>
                  
                  <View style={styles.opponentInfo}>
                    <Avatar.Text 
                      size={40} 
                      label={selectedPlayer.user.name.charAt(0)} 
                    />
                    <View style={styles.opponentDetails}>
                      <Text style={styles.opponentName}>{selectedPlayer.user.name}</Text>
                      <Text style={styles.opponentLevel}>{selectedPlayer.description || 'Oyuncu'}</Text>
                      <Text style={styles.opponentPoints}>#{selectedPlayer.position}</Text>
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
