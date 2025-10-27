import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
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
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService, leagueService, leagueStandingsService, matchHistoryService } from '../services/api';
import { User } from '../types';

const { width } = Dimensions.get('window');

const DefiLigScreen = ({ navigation }: any) => {
  const [showLigModal, setShowLigModal] = useState(false);
  const [selectedLig, setSelectedLig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const leaguesPerPage = 2;
  const [matchStats, setMatchStats] = useState({
    leagueWins: 0,
    totalMatches: 0,
    winRate: 0,
    badges: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı verisini çek
      const profileData = await authService.getProfile();
      
      // Kullanıcının maç geçmişini çek
      const matchHistory = await matchHistoryService.getUserMatchHistory(profileData.id);
      
      // Maç istatistiklerini hesapla
      const totalMatches = matchHistory.length;
      const wins = matchHistory.filter((match: any) => 
        match.winners.some((winner: any) => winner.id === profileData.id)
      ).length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      
      // Lig maçlarını say (leagueStanding'i olan maçlar)
      const leagueMatches = matchHistory.filter((match: any) => match.leagueStanding);
      const leagueWins = leagueMatches.filter((match: any) => 
        match.winners.some((winner: any) => winner.id === profileData.id)
      ).length;
      
      // İstatistikleri güncelle
      setMatchStats({
        leagueWins: leagueWins,
        totalMatches: totalMatches,
        winRate: winRate,
        badges: 0, // TODO: Rozet sistemi eklenecek
      });
      
      // Backend'den gelen profil verisini UI formatına dönüştür
      const formattedUser = {
        id: profileData.id,
        name: profileData.name || 'Oyuncu',
        email: profileData.email,
        age: profileData.age,
        level: 'Üye',
        rank: 'Altın', // TODO: Rank sistemi eklenecek
        points: 0, // TODO: Match history'den hesaplanacak
        position: 0, // TODO: League ranking'den alınacak
        winRate: winRate,
        matchesPlayed: totalMatches,
      };
      
      setCurrentUser(formattedUser);
      
      // Tüm ligleri çek
      const allLeagues = await leagueService.getAllLeagues();
      
      // Her lig için ikon ve renk tanımla
      const leagueColors = ['#2E7D32', '#1976D2', '#D32F2F'];
      const leagueIcons = ['trophy', 'weather-sunny', 'account-multiple'];
      
      // Her lig için standings'leri çek ve format düzenle
      const formattedLeagues = await Promise.all(
        allLeagues.map(async (league: any, index: number) => {
          const standings = await leagueStandingsService.getStandingsByLeagueId(league.id);
          
          // Kullanıcının bu ligde olup olmadığını kontrol et
          const isUserInThisLeague = standings.some((standing: any) => 
            standing.user.id === profileData.id
          );
          
          return {
            id: league.id,
            name: league.name || league.code,
            code: league.code,
            description: league.description || 'Rekabetçi oyuncularla karşılaşın ve lig sıralamasında yükselin',
            playerCount: standings.length || 0,
            isUserInLeague: isUserInThisLeague,
            settings: league.settings,
            color: leagueColors[index % leagueColors.length],
            icon: leagueIcons[index % leagueIcons.length],
            rewards: ['Lig rozetleri', 'Puan bonusları', 'Özel ödüller'],
            rules: [
              '1v1 maç formatı',
              'Sadece 3 sıra üstüne meydan okuma',
              'Puan bazlı sıralama',
              'Haftalık lig güncellemeleri'
            ],
          };
        })
      );
      
      setLeagues(formattedLeagues);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      Alert.alert('Hata', 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const openLigModal = (lig: any) => {
    setSelectedLig(lig);
    setShowLigModal(true);
  };

  const startLig = async () => {
    try {
      // Eğer kullanıcı ligde değilse, önce lige katıl
      if (!selectedLig.isUserInLeague) {
        // Yaş kontrolü yap
        const settings = selectedLig.settings;
        const userAge = currentUser.age;
        
        if (settings && (settings.minAge !== null || settings.maxAge !== null)) {
          if (!userAge) {
            Alert.alert(
              'Yaş Bilgisi Gerekli',
              'Bu lige katılmak için yaş bilgisi gereklidir. Lütfen profilinizi güncelleyin.',
              [{ text: 'Tamam' }]
            );
            setShowLigModal(false);
            return;
          }
          
          if (settings.minAge !== null && userAge < settings.minAge) {
            Alert.alert(
              'Yaş Uyumsuzluğu',
              `Bu lige katılmak için minimum ${settings.minAge} yaşında olmanız gerekmektedir. Sizin yaşınız: ${userAge}`,
              [{ text: 'Tamam' }]
            );
            setShowLigModal(false);
            return;
          }
          
          if (settings.maxAge !== null && userAge > settings.maxAge) {
            Alert.alert(
              'Yaş Uyumsuzluğu',
              `Bu lige katılmak için maksimum ${settings.maxAge} yaşında olmanız gerekmektedir. Sizin yaşınız: ${userAge}`,
              [{ text: 'Tamam' }]
            );
            setShowLigModal(false);
            return;
          }
        }
        
        setLoading(true);
        
        await leagueStandingsService.joinLeague(currentUser.id, selectedLig.id);
        
        Alert.alert('Başarılı', `${selectedLig.name} ligine katıldınız!`);
        
        // Ligleri yeniden yükle
        await loadData();
        setLoading(false);
      }
      
      setShowLigModal(false);
      // Navigate to Lig Sıralama screen
      navigation.navigate('LigSiralama', { lig: selectedLig });
    } catch (error: any) {
      console.error('Lige katılma hatası:', error);
      const errorMessage = error.response?.data?.message || 'Lige katılırken bir hata oluştu';
      Alert.alert('Hata', errorMessage);
      setLoading(false);
    }
  };

  // Pagination yardımcı fonksiyonlar
  const totalPages = Math.ceil(leagues.length / leaguesPerPage);
  const startIndex = currentPage * leaguesPerPage;
  const endIndex = startIndex + leaguesPerPage;
  const currentLeagues = leagues.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
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
            <View style={styles.headerTextContainer}>
              <Title style={styles.headerTitle}>🏆 Ligler</Title>
              <Text style={styles.headerSubtitle}>
                Rekabetçi oyuncularla karşılaşın ve lig sıralamasında yükselin
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('LigAyarlari')}
              style={styles.settingsButton}
            >
              <MaterialCommunityIcons name="cog" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current User Card - Belirgin Gösterim */}
        <View style={styles.currentUserSection}>
          <Title style={styles.sectionTitle}>Sen</Title>
          <Card style={styles.currentUserHighlightCard}>
            <Card.Content>
              <View style={styles.currentUserHighlightHeader}>
                <Avatar.Text 
                  size={60} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.currentUserHighlightAvatar}
                />
                
                <View style={styles.currentUserHighlightInfo}>
                  <Title style={styles.currentUserHighlightName}>{currentUser.name}</Title>
                  <Text style={styles.currentUserHighlightLevel}>{currentUser.level} • {currentUser.rank}</Text>
                </View>
                
                <View style={styles.currentUserPositionContainer}>
                  <MaterialCommunityIcons 
                    name="trophy" 
                    size={24} 
                    color="#FFD700" 
                  />
                  <Text style={styles.currentUserPositionText}>
                    #{currentUser.position}
                  </Text>
                </View>
              </View>
              
              <View style={styles.currentUserHighlightStats}>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="percent" size={20} color="#4CAF50" />
                  <Text style={styles.currentUserHighlightStatNumber}>{currentUser.winRate}%</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Galibiyet</Text>
                </View>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="tennis" size={20} color="#2E7D32" />
                  <Text style={styles.currentUserHighlightStatNumber}>{currentUser.matchesPlayed}</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Maç</Text>
                </View>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                  <Text style={styles.currentUserHighlightStatNumber}>{currentUser.points}</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Puan</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Ligler Listesi */}
        <View style={styles.ligSection}>
          <View style={styles.ligHeaderContainer}>
            <Title style={styles.sectionTitle}>Aktif Ligler</Title>
            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {totalPages}
            </Text>
          </View>
          
          {currentLeagues.map((lig, index) => (
            <Card key={lig.id} style={[styles.ligCard, { marginBottom: index < currentLeagues.length - 1 ? 16 : 0 }]}>
              <Card.Content>
                <TouchableOpacity onPress={() => openLigModal(lig)}>
                  <View style={styles.ligHeader}>
                    <View style={[styles.ligIcon, { backgroundColor: lig.color }]}>
                      <MaterialCommunityIcons 
                        name={lig.icon as any} 
                        size={40} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.ligInfo}>
                      <Title style={styles.ligName}>{lig.name}</Title>
                      <Text style={styles.ligPlayers}>
                        <MaterialCommunityIcons name="account-group" size={16} color={lig.color} />
                        {' '}{lig.playerCount} oyuncu aktif
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={28} 
                      color={lig.color} 
                    />
                  </View>

                  <View style={styles.ligQuickInfo}>
                    <View style={styles.quickInfoItem}>
                      <MaterialCommunityIcons name="tennis" size={20} color={lig.color} />
                      <Text style={styles.quickInfoText}>1v1 Format</Text>
                    </View>
                    <View style={styles.quickInfoItem}>
                      <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                      <Text style={styles.quickInfoText}>Rozetler</Text>
                    </View>
                    <View style={styles.quickInfoItem}>
                      <MaterialCommunityIcons name="chart-line" size={20} color="#4CAF50" />
                      <Text style={styles.quickInfoText}>Puan Sistemi</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))}
          
          {/* Pagination Kontrolleri */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                onPress={goToPreviousPage}
                disabled={currentPage === 0}
                style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={24} 
                  color={currentPage === 0 ? '#CCCCCC' : '#2E7D32'} 
                />
                <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
                  Önceki
                </Text>
              </TouchableOpacity>

              <View style={styles.paginationDots}>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentPage && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity 
                onPress={goToNextPage}
                disabled={currentPage === totalPages - 1}
                style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
                  Sonraki
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={currentPage === totalPages - 1 ? '#CCCCCC' : '#2E7D32'} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Title style={styles.sectionTitle}>İstatistikler</Title>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                <Text style={styles.statNumber}>{matchStats.leagueWins}</Text>
                <Text style={styles.statLabel}>Lig Galibiyeti</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="tennis" size={32} color="#4CAF50" />
                <Text style={styles.statNumber}>{matchStats.totalMatches}</Text>
                <Text style={styles.statLabel}>Toplam Maç</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="percent" size={32} color="#81C784" />
                <Text style={styles.statNumber}>{matchStats.winRate}%</Text>
                <Text style={styles.statLabel}>Galibiyet Oranı</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="medal" size={32} color="#FF9800" />
                <Text style={styles.statNumber}>{matchStats.badges}</Text>
                <Text style={styles.statLabel}>Rozet</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsSection}>
          <Title style={styles.sectionTitle}>Son Başarılar</Title>
          <Card style={styles.achievementCard}>
            <Card.Content>
              <View style={styles.achievementItem}>
                <MaterialCommunityIcons name="trophy-award" size={40} color="#FFD700" />
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>İlk Zafer!</Text>
                  <Text style={styles.achievementDescription}>İlk Defi Lig maçını kazandınız</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          <Card style={styles.achievementCard}>
            <Card.Content>
              <View style={styles.achievementItem}>
                <MaterialCommunityIcons name="fire" size={40} color="#FF6B35" />
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>Seri Kazanan</Text>
                  <Text style={styles.achievementDescription}>3 maç üst üste kazandınız</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Lig Detay Modal */}
      <Portal>
        <Modal
          visible={showLigModal}
          onDismiss={() => setShowLigModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
            >
              <Card.Content>
                {selectedLig && (
                  <>
                    <View style={styles.modalHeader}>
                    <View style={[styles.modalIcon, { backgroundColor: selectedLig.color }]}>
                      <MaterialCommunityIcons 
                        name={selectedLig.icon as any} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.modalInfo}>
                      <Title style={styles.modalTitle}>{selectedLig.name}</Title>
                      <Text style={styles.modalDescription}>{selectedLig.description}</Text>
                    </View>
                  </View>

                  <Divider style={styles.modalDivider} />

                  <View style={styles.modalDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account-group" size={20} color="#2E7D32" />
                      <Text style={styles.detailLabel}>Oyuncu Sayısı:</Text>
                      <Text style={styles.detailValue}>{selectedLig.playerCount}</Text>
                    </View>
                    {selectedLig.settings && (selectedLig.settings.minAge !== null || selectedLig.settings.maxAge !== null) && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-account" size={20} color="#1976D2" />
                        <Text style={styles.detailLabel}>Yaş Aralığı:</Text>
                        <Text style={styles.detailValue}>
                          {selectedLig.settings.minAge !== null && selectedLig.settings.maxAge !== null
                            ? `${selectedLig.settings.minAge} - ${selectedLig.settings.maxAge}`
                            : selectedLig.settings.minAge !== null
                            ? `${selectedLig.settings.minAge}+`
                            : `${selectedLig.settings.maxAge} ve altı`}
                        </Text>
                      </View>
                    )}
                    {selectedLig.settings && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="currency-try" size={20} color="#FF9800" />
                        <Text style={styles.detailLabel}>Kayıt Ücreti:</Text>
                        <Text style={styles.detailValue}>{selectedLig.settings.registrationFee} ₺</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalRewards}>
                    <Text style={styles.modalRewardsTitle}>Ödüller:</Text>
                    {selectedLig.rewards.map((reward: string, index: number) => (
                      <View key={index} style={styles.modalRewardItem}>
                        <MaterialCommunityIcons name="gift" size={16} color="#2E7D32" />
                        <Text style={styles.modalRewardText}>{reward}</Text>
                      </View>
                    ))}
                  </View>

                  {!selectedLig.isUserInLeague && selectedLig.settings && (selectedLig.settings.minAge !== null || selectedLig.settings.maxAge !== null) && (() => {
                    const userAge = currentUser.age;
                    const settings = selectedLig.settings;
                    const isAgeValid = userAge && 
                      (settings.minAge === null || userAge >= settings.minAge) &&
                      (settings.maxAge === null || userAge <= settings.maxAge);
                    
                    if (!isAgeValid) {
                      return (
                        <View style={styles.ageWarning}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color="#D32F2F" />
                          <Text style={styles.ageWarningText}>
                            {!userAge 
                              ? 'Bu lige katılmak için yaş bilgisi gereklidir.'
                              : 'Yaşınız bu ligin yaş aralığına uymuyor.'}
                          </Text>
                        </View>
                      );
                    }
                  })()}

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowLigModal(false)}
                      style={styles.modalCancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={startLig}
                      style={styles.modalStartButton}
                      buttonColor="#2E7D32"
                      icon={selectedLig.isUserInLeague ? "eye" : "account-plus"}
                    >
                      {selectedLig.isUserInLeague ? "Ligi Görüntüle" : "Lige Katıl"}
                    </Button>
                  </View>
                </>
              )}
              </Card.Content>
            </ScrollView>
          </Card>
        </Modal>
      </Portal>
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
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    lineHeight: 22,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 10,
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
    color: '#FFD700',
    marginTop: 2,
  },
  currentUserHighlightAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 15,
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
  currentUserHighlightStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  currentUserHighlightStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 5,
    marginBottom: 3,
  },
  currentUserHighlightStatLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  ligSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  ligCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  ligHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ligIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  ligInfo: {
    flex: 1,
  },
  ligName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  ligPlayers: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  ligQuickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickInfoText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
    paddingBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
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
  statContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
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
  achievementsSection: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  achievementCard: {
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementInfo: {
    marginLeft: 15,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#6C757D',
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
    marginBottom: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  modalDivider: {
    backgroundColor: '#E9ECEF',
    marginVertical: 15,
  },
  modalDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  modalRewards: {
    marginBottom: 20,
  },
  modalRewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  modalRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalRewardText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
  },
  ageWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#D32F2F',
  },
  ageWarningText: {
    fontSize: 13,
    color: '#C62828',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
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
  modalStartButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
  },
  ligHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pageIndicator: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F8F9FA',
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginHorizontal: 5,
  },
  paginationButtonTextDisabled: {
    color: '#CCCCCC',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E9ECEF',
  },
  paginationDotActive: {
    backgroundColor: '#2E7D32',
    width: 24,
    borderRadius: 4,
  },
});

export default DefiLigScreen;
