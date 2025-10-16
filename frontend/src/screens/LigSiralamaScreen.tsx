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
  StatusBar,
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
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { leagueStandingsService, authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LigSiralamaScreen = ({ route, navigation }: any) => {
  const { lig } = route.params;
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showMatchResultModal, setShowMatchResultModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı profilini getir
      const profileData = await authService.getProfile();
      
      // Seçilen ligin sıralama verilerini getir
      const rankingsData = await leagueStandingsService.getLeagueRankings(lig.id);
      
      // Eğer ranking data boşsa veya kullanıcı yoksa, mock data kullan
      if (!rankingsData || rankingsData.length === 0) {
        // Mock current user data
        setCurrentUser({
          id: profileData.id,
          name: profileData.name || 'Oyuncu',
          position: 1,
          email: profileData.email,
          challengePending: false,
          challengeDate: null,
          challengedUser: null,
        });
        
        // Mock players data
        setPlayers([
          {
            user: {
              id: profileData.id,
              name: profileData.name || 'Oyuncu',
              email: profileData.email,
            },
            position: 1,
            description: 'Yeni Oyuncu',
            challengePending: false,
          }
        ]);
      } else {
        // Gerçek kullanıcıyı rankings'de bul
        const currentUserRanking = rankingsData.find((r: any) => r.user.id === profileData.id);
        
        if (currentUserRanking) {
          setCurrentUser({
            id: currentUserRanking.user.id,
            name: currentUserRanking.user.name,
            position: currentUserRanking.position,
            email: currentUserRanking.user.email,
            challengePending: currentUserRanking.challengePending,
            challengeDate: currentUserRanking.challengeDate,
            challengedUser: currentUserRanking.challengedUser,
          });
        } else {
          // Kullanıcı rankings'de yoksa, ilk kullanıcıyı kullan
          const firstUser = rankingsData[0];
          setCurrentUser({
            id: firstUser.user.id,
            name: firstUser.user.name,
            position: firstUser.position,
            email: firstUser.user.email,
            challengePending: firstUser.challengePending,
            challengeDate: firstUser.challengeDate,
            challengedUser: firstUser.challengedUser,
          });
        }
        
        setPlayers(rankingsData);
      }
    } catch (error) {
      console.error('Sıralama yüklenirken hata:', error);
      
      // Hata durumunda da kullanıcıyı yükle
      try {
        const profileData = await authService.getProfile();
        setCurrentUser({
          id: profileData.id,
          name: profileData.name || 'Oyuncu',
          position: 1,
          email: profileData.email,
          challengePending: false,
          challengeDate: null,
          challengedUser: null,
        });
        setPlayers([]);
      } catch (profileError) {
        console.error('Profil yüklenirken hata:', profileError);
        Alert.alert('Hata', 'Veri yüklenemedi. Lütfen tekrar deneyin.');
      }
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
    
    // Challenge bekleyen oyuncuya istek gönderilemez
    if (player.challengePending) {
      Alert.alert(
        'Oyuncu Meşgul', 
        `${player.user.name} zaten bekleyen bir meydan okuma isteğine sahip. Lütfen daha sonra tekrar deneyin.`
      );
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
    setMessageError(false);
    setShowChallengeModal(true);
  };

  const sendChallenge = async () => {
    if (!challengeMessage.trim()) {
      setMessageError(true);
      return;
    }
    
    setMessageError(false);

    try {
      // Challenge gönder
      await leagueStandingsService.sendMatchChallenge(
        currentUser.id,
        selectedPlayer.user.id,
        challengeMessage,
        lig.id
      );

      // Modal'ı kapat
      setShowChallengeModal(false);

      // Listeyi hemen yenile
      await loadRankings();

      // Başarı bildirimi göster
      setSnackbarMessage(`${selectedPlayer?.user.name} adlı oyuncuya meydan okuma gönderildi!`);
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Challenge hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Meydan okuma gönderilemedi');
    }
  };

  const openMatchResultModal = () => {
    if (!currentUser.challengedUser) {
      Alert.alert('Uyarı', 'Henüz oynanan bir maç yok');
      return;
    }
    setSelectedWinner(null);
    setShowMatchResultModal(true);
  };

  const submitMatchResult = async () => {
    if (!selectedWinner) {
      Alert.alert('Uyarı', 'Lütfen kazananı seçin');
      return;
    }

    const winnerId = selectedWinner;
    const loserId = selectedWinner === currentUser.id 
      ? currentUser.challengedUser.id 
      : currentUser.id;

    try {
      setLoading(true);

      // Standings'leri güncelle
      await leagueStandingsService.updateUserRanking(
        lig.id,
        winnerId,
        loserId
      );

      // Modal'ı kapat
      setShowMatchResultModal(false);

      // Listeyi yenile
      await loadRankings();
      setLoading(false);

      // Başarı bildirimi göster
      setSnackbarMessage('Yerleştirmeler güncellendi!');
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç sonucu kaydedilemedi');
      setLoading(false);
    }
  };

  const renderPlayerCard = (player: any) => {
    if (!currentUser) return null;
    
    const isCurrentUser = player.user.id === currentUser.id;
    const positionDifference = currentUser.position - player.position;
    const canChallenge = !isCurrentUser 
      && positionDifference <= 3 
      && positionDifference > 0 
      && !player.challengePending // Challenge bekleyen kullanıcılara istek gönderilemez
      && !currentUser.challengePending; // Kendi challengePending'i true olan kullanıcı meydan okuyamaz
    
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
              {player.challengePending && (
                <Chip 
                  icon="clock-alert-outline" 
                  style={styles.pendingChip}
                  textStyle={styles.pendingChipText}
                  compact
                >
                  Beklemede
                </Chip>
              )}
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
    <View style={styles.container}>
      <ScrollView>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Title style={styles.headerTitle}>{lig.name}</Title>
              <Text style={styles.headerSubtitle}>
                {players.length} oyuncu • 1v1 rekabet
              </Text>
            </View>
            <TouchableOpacity 
              onPress={loadRankings}
              style={styles.refreshButton}
            >
              <MaterialCommunityIcons name="refresh" size={28} color="#FFFFFF" />
            </TouchableOpacity>
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
                  {currentUser.challengePending && (
                    <Chip 
                      icon="clock-alert-outline" 
                      style={styles.pendingChip}
                      textStyle={styles.pendingChipText}
                      compact
                    >
                      Bekleyen Challenge
                    </Chip>
                  )}
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
              icon="clipboard-check"
              onPress={openMatchResultModal}
            >
              Maç Sonucu Gir
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
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
            >
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
                    label="Meydan Okuma Mesajı *"
                    placeholder="Mesajınızı yazın..."
                    value={challengeMessage}
                    onChangeText={(text) => {
                      setChallengeMessage(text);
                      if (messageError && text.trim()) {
                        setMessageError(false);
                      }
                    }}
                    multiline
                    numberOfLines={3}
                    style={styles.messageInput}
                    outlineColor={messageError ? "#D32F2F" : "#E0E0E0"}
                    activeOutlineColor={messageError ? "#D32F2F" : "#2E7D32"}
                    error={messageError}
                  />
                  {messageError && (
                    <Text style={styles.errorText}>Bu alan gereklidir</Text>
                  )}

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
            </ScrollView>
          </Card>
        </Modal>
      </Portal>

      {/* Match Result Modal */}
      <Portal>
        <Modal
          visible={showMatchResultModal}
          onDismiss={() => setShowMatchResultModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                <Title style={styles.modalTitle}>Kazanan Kullanıcı</Title>
                <TouchableOpacity onPress={() => setShowMatchResultModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              {currentUser && currentUser.challengedUser && (
                <>
                  <Text style={styles.modalSubtitle}>
                    Maç sonucunu belirtmek için kazananı seçin
                  </Text>

                  <View style={styles.winnerSelectionContainer}>
                    {/* Kullanıcı seçeneği */}
                    <TouchableOpacity
                      style={[
                        styles.winnerOption,
                        selectedWinner === currentUser.id && styles.winnerOptionSelected
                      ]}
                      onPress={() => setSelectedWinner(currentUser.id)}
                    >
                      <View style={styles.radioButton}>
                        {selectedWinner === currentUser.id && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Avatar.Text 
                        size={40} 
                        label={currentUser.name.charAt(0)} 
                        style={styles.winnerAvatar}
                      />
                      <View style={styles.winnerInfo}>
                        <Text style={styles.winnerName}>{currentUser.name}</Text>
                        <Text style={styles.winnerLabel}>(Siz)</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Rakip seçeneği */}
                    <TouchableOpacity
                      style={[
                        styles.winnerOption,
                        selectedWinner === currentUser.challengedUser.id && styles.winnerOptionSelected
                      ]}
                      onPress={() => setSelectedWinner(currentUser.challengedUser.id)}
                    >
                      <View style={styles.radioButton}>
                        {selectedWinner === currentUser.challengedUser.id && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Avatar.Text 
                        size={40} 
                        label={currentUser.challengedUser.name.charAt(0)} 
                        style={styles.winnerAvatar}
                      />
                      <View style={styles.winnerInfo}>
                        <Text style={styles.winnerName}>{currentUser.challengedUser.name}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowMatchResultModal(false)}
                      style={styles.modalCancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={submitMatchResult}
                      style={styles.modalSendButton}
                      buttonColor="#2E7D32"
                    >
                      Onayla
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Başarı Bildirimi Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'X',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50 : 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 10,
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
  pendingChip: {
    marginTop: 5,
    backgroundColor: '#FFF3E0',
    height: 24,
  },
  pendingChipText: {
    fontSize: 10,
    color: '#F57C00',
    marginVertical: 0,
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
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: '100%',
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
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 15,
    marginLeft: 12,
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
  snackbar: {
    backgroundColor: '#2E7D32',
    marginBottom: 20,
  },
  winnerSelectionContainer: {
    marginVertical: 20,
    gap: 15,
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  winnerOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#757575',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  winnerAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 15,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  winnerLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
});

export default LigSiralamaScreen;
