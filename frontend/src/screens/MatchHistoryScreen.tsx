import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Chip,
  Portal,
  Modal,
  Button,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { matchHistoryService, authService, leagueService } from '../services/api';

interface MatchHistory {
  id: number;
  winners: any[];
  losers: any[];
  score: string;
  matchDate: Date;
  indoorCourt: boolean;
  courtGround: 'grass' | 'clay' | 'hard';
  leagueStanding?: {
    id: number;
    league: {
      id: number;
      name: string;
    };
  };
}

const MatchHistoryScreen = ({ navigation, route }: any) => {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, winRate: 0 });
  
  // Route parametrelerini al
  const { leagueId, leagueName } = route?.params || {};
  
  // Filtreleme state'leri
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpponent, setFilterOpponent] = useState<string | null>(null);
  const [filterLeagueOnly, setFilterLeagueOnly] = useState<boolean | null>(null);
  const [filterLeague, setFilterLeague] = useState<number | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [filterCourtType, setFilterCourtType] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [filterGroundType, setFilterGroundType] = useState<'all' | 'grass' | 'clay' | 'hard'>('all');
  const [leagues, setLeagues] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Lig parametresi ile açıldıysa otomatik filtrele
  useEffect(() => {
    if (leagueId && leagues.length > 0) {
      setFilterLeague(leagueId);
      setFilterLeagueOnly(true);
    }
  }, [leagueId, leagues]);

  useEffect(() => {
    applyFilters();
  }, [matches, searchQuery, filterOpponent, filterLeagueOnly, filterLeague, filterDateFrom, filterDateTo, filterCourtType, filterGroundType, currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı bilgilerini al
      const profile = await authService.getProfile();
      setCurrentUserId(profile.id);

      // Kullanıcının maç geçmişini al
      const matchHistory = await matchHistoryService.getUserMatchHistory(profile.id);
      setMatches(matchHistory);

      // Ligleri getir (filtreleme için)
      const leaguesData = await leagueService.getAllLeagues();
      setLeagues(leaguesData);

      // İstatistikleri hesapla
      calculateStats(matchHistory, profile.id);
    } catch (error) {
      console.error('Maç geçmişi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (matchHistory: MatchHistory[], userId: string) => {
    const total = matchHistory.length;
    const wins = matchHistory.filter(match => 
      match.winners.some(w => w.id === userId)
    ).length;
    const losses = total - wins;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    setStats({ total, wins, losses, winRate });
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Rakip filtresi (arama ile)
    if (searchQuery) {
      filtered = filtered.filter(match => {
        const opponents = isWinner(match, currentUserId || '') ? match.losers : match.winners;
        return opponents.some(opp => {
          const fullName = `${opp.name} ${opp.surname || ''}`.toLowerCase();
          return fullName.includes(searchQuery.toLowerCase());
        });
      });
    }

    // Lig maçı filtresi
    if (filterLeagueOnly !== null) {
      if (filterLeagueOnly) {
        filtered = filtered.filter(match => !!match.leagueStanding);
      } else {
        filtered = filtered.filter(match => !match.leagueStanding);
      }
    }

    // Belirli lig filtresi
    if (filterLeague !== null) {
      filtered = filtered.filter(match => 
        match.leagueStanding?.league?.id === filterLeague
      );
    }

    // Tarih filtresi
    if (filterDateFrom) {
      filtered = filtered.filter(match => 
        new Date(match.matchDate) >= filterDateFrom
      );
    }
    if (filterDateTo) {
      filtered = filtered.filter(match => 
        new Date(match.matchDate) <= filterDateTo
      );
    }

    // Kort tipi filtresi (açık alan / kapalı alan)
    if (filterCourtType !== 'all') {
      if (filterCourtType === 'indoor') {
        filtered = filtered.filter(match => match.indoorCourt === true);
      } else if (filterCourtType === 'outdoor') {
        filtered = filtered.filter(match => match.indoorCourt === false);
      }
    }

    // Zemin tipi filtresi
    if (filterGroundType !== 'all') {
      filtered = filtered.filter(match => match.courtGround === filterGroundType);
    }

    setFilteredMatches(filtered);
    
    // Filtrelenmiş maçlara göre istatistikleri güncelle
    if (currentUserId) {
      calculateStats(filtered, currentUserId);
    }
  };

  const isWinner = (match: MatchHistory, userId: string) => {
    return match.winners.some(w => w.id === userId);
  };

  const getOpponents = (match: MatchHistory) => {
    return isWinner(match, currentUserId || '') ? match.losers : match.winners;
  };

  const getPartners = (match: MatchHistory) => {
    const myTeam = isWinner(match, currentUserId || '') ? match.winners : match.losers;
    return myTeam.filter(player => player.id !== currentUserId);
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterOpponent(null);
    setFilterLeagueOnly(null);
    setFilterLeague(null);
    setFilterDateFrom(null);
    setFilterDateTo(null);
    setFilterCourtType('all');
    setFilterGroundType('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterLeagueOnly !== null) count++;
    if (filterLeague !== null) count++;
    if (filterDateFrom || filterDateTo) count++;
    if (filterCourtType !== 'all') count++;
    if (filterGroundType !== 'all') count++;
    return count;
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
    <View style={styles.container}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Title style={styles.headerTitle}>Maç Geçmişi</Title>
          {leagueName && (
            <Text style={styles.headerSubtitle}>{leagueName}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* İstatistik Kartı */}
        <View style={styles.statsSection}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsHeader}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#2E7D32" />
                <Title style={styles.statsTitle}>İstatistikler</Title>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Toplam Maç</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{stats.wins}</Text>
                  <Text style={styles.statLabel}>Galibiyet</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#DC3545' }]}>{stats.losses}</Text>
                  <Text style={styles.statLabel}>Mağlubiyet</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF9800' }]}>%{stats.winRate}</Text>
                  <Text style={styles.statLabel}>Kazanma Oranı</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Filtreleme */}
        <View style={styles.filterSection}>
          <Searchbar
            placeholder="Rakip ara..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#2E7D32"
          />
          <View style={styles.filterButtonRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color="#2E7D32" />
              <Text style={styles.filterButtonText}>Filtrele</Text>
              {getActiveFilterCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            {getActiveFilterCount() > 0 && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFilterText}>Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Maç Listesi */}
        <View style={styles.matchesSection}>
          <Title style={styles.sectionTitle}>
            Maçlar ({filteredMatches.length})
          </Title>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => {
              const isMatchWinner = isWinner(match, currentUserId || '');
              const opponents = getOpponents(match);
              const partners = getPartners(match);
              
              // Debug
              console.log('Match ID:', match.id);
              console.log('Current User ID:', currentUserId);
              console.log('Winners:', match.winners.map(w => ({ id: w.id, name: w.name })));
              console.log('Losers:', match.losers.map(l => ({ id: l.id, name: l.name })));
              console.log('Is Winner?:', isMatchWinner);
              console.log('Opponents:', opponents.map(o => o.name));
              console.log('Partners:', partners.map(p => p.name));
              console.log('---');

              return (
                <Card key={match.id} style={styles.matchCard}>
                  <Card.Content style={styles.matchCardContent}>
                    {/* Maç Tarihi ve Sonuç */}
                    <View style={styles.matchHeader}>
                      <View style={styles.matchDateContainer}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#6C757D" />
                        <Text style={styles.matchDate}>{formatDate(match.matchDate)}</Text>
                      </View>
                      <Chip
                        style={[
                          styles.resultChip,
                          isMatchWinner ? styles.winChip : styles.loseChip
                        ]}
                        textStyle={styles.resultChipText}
                        compact
                      >
                        {isMatchWinner ? 'Galip' : 'Mağlup'}
                      </Chip>
                    </View>

                    {/* Skor */}
                    <View style={styles.scoreContainer}>
                      <MaterialCommunityIcons name="tennis" size={20} color="#2E7D32" />
                      <Text style={styles.scoreText}>{match.score}</Text>
                    </View>

                    {/* Rakipler */}
                    <View style={styles.playersContainer}>
                      <Text style={styles.playersLabel}>Rakip:</Text>
                      <Text style={styles.playersNames}>
                        {opponents.map(o => `${o.name} ${o.surname || ''}`).join(', ')}
                      </Text>
                    </View>

                    {/* Partner (varsa) */}
                    {partners.length > 0 && (
                      <View style={styles.playersContainer}>
                        <Text style={styles.playersLabel}>Partner:</Text>
                        <Text style={styles.playersNames}>
                          {partners.map(p => `${p.name} ${p.surname || ''}`).join(', ')}
                        </Text>
                      </View>
                    )}

                    {/* Kort Bilgileri */}
                    <View style={styles.courtInfoContainer}>
                      <View style={styles.courtInfoItem}>
                        <MaterialCommunityIcons 
                          name={match.indoorCourt ? "home-roof" : "weather-sunny"} 
                          size={16} 
                          color="#2E7D32" 
                        />
                        <Text style={styles.courtInfoText}>
                          {match.indoorCourt ? 'Kapalı Saha' : 'Açık Saha'}
                        </Text>
                      </View>
                      <View style={styles.courtInfoDivider} />
                      <View style={styles.courtInfoItem}>
                        <MaterialCommunityIcons 
                          name="texture-box" 
                          size={16} 
                          color="#2E7D32" 
                        />
                        <Text style={styles.courtInfoText}>
                          {match.courtGround === 'grass' && 'Çim Kort'}
                          {match.courtGround === 'clay' && 'Toprak Kort'}
                          {match.courtGround === 'hard' && 'Sert Kort'}
                        </Text>
                      </View>
                    </View>

                    {/* Lig Bilgisi - Sağ Alt Köşe */}
                    {match.leagueStanding?.league?.name && (
                      <View style={styles.leagueBadge}>
                        <MaterialCommunityIcons name="trophy" size={14} color="#FF9800" />
                        <Text style={styles.leagueBadgeText}>
                          {match.leagueStanding.league.name}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <MaterialCommunityIcons name="tennis-ball" size={48} color="#BDBDBD" />
                <Text style={styles.emptyText}>Maç geçmişi bulunamadı</Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Filtreleme Modal */}
      <Portal>
        <Modal
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>Filtreler</Title>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Lig Maçı Filtresi */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Maç Tipi</Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterLeagueOnly === null && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterLeagueOnly(null)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterLeagueOnly === null && styles.filterOptionTextActive
                      ]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterLeagueOnly === true && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterLeagueOnly(true)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterLeagueOnly === true && styles.filterOptionTextActive
                      ]}>Lig Maçları</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterLeagueOnly === false && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterLeagueOnly(false)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterLeagueOnly === false && styles.filterOptionTextActive
                      ]}>Normal Maçlar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lig Seçimi */}
                {filterLeagueOnly !== false && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterGroupLabel}>Lig</Text>
                    <View style={styles.filterOptions}>
                      <TouchableOpacity
                        style={[
                          styles.filterOption,
                          filterLeague === null && styles.filterOptionActive
                        ]}
                        onPress={() => setFilterLeague(null)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filterLeague === null && styles.filterOptionTextActive
                        ]}>Tüm Ligler</Text>
                      </TouchableOpacity>
                      {leagues.map(league => (
                        <TouchableOpacity
                          key={league.id}
                          style={[
                            styles.filterOption,
                            filterLeague === league.id && styles.filterOptionActive
                          ]}
                          onPress={() => setFilterLeague(league.id)}
                        >
                          <Text style={[
                            styles.filterOptionText,
                            filterLeague === league.id && styles.filterOptionTextActive
                          ]}>{league.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Kort Tipi Filtresi */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Kort Tipi</Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterCourtType === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterCourtType('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterCourtType === 'all' && styles.filterOptionTextActive
                      ]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterCourtType === 'outdoor' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterCourtType('outdoor')}
                    >
                      <MaterialCommunityIcons 
                        name="weather-sunny" 
                        size={18} 
                        color={filterCourtType === 'outdoor' ? "#2E7D32" : "#757575"} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[
                        styles.filterOptionText,
                        filterCourtType === 'outdoor' && styles.filterOptionTextActive
                      ]}>Açık Saha</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterCourtType === 'indoor' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterCourtType('indoor')}
                    >
                      <MaterialCommunityIcons 
                        name="home-roof" 
                        size={18} 
                        color={filterCourtType === 'indoor' ? "#2E7D32" : "#757575"} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[
                        styles.filterOptionText,
                        filterCourtType === 'indoor' && styles.filterOptionTextActive
                      ]}>Kapalı Saha</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Zemin Tipi Filtresi */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Zemin Tipi</Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterGroundType === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterGroundType('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterGroundType === 'all' && styles.filterOptionTextActive
                      ]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterGroundType === 'hard' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterGroundType('hard')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterGroundType === 'hard' && styles.filterOptionTextActive
                      ]}>Sert Kort</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterGroundType === 'clay' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterGroundType('clay')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterGroundType === 'clay' && styles.filterOptionTextActive
                      ]}>Toprak Kort</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterGroundType === 'grass' && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterGroundType('grass')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterGroundType === 'grass' && styles.filterOptionTextActive
                      ]}>Çim Kort</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={clearFilters}
                  style={styles.modalClearButton}
                >
                  Temizle
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalApplyButton}
                  buttonColor="#2E7D32"
                >
                  Uygula
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    backgroundColor: '#2E7D32',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  statsSection: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E9ECEF',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchbar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 2,
    marginBottom: 10,
  },
  filterButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    gap: 8,
  },
  filterButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  filterBadge: {
    backgroundColor: '#DC3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearFilterText: {
    color: '#DC3545',
    fontWeight: '600',
    fontSize: 14,
  },
  matchesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    elevation: 2,
  },
  matchCardContent: {
    position: 'relative',
    paddingBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  resultChip: {
    height: 28,
  },
  resultChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  winChip: {
    backgroundColor: '#E8F5E8',
  },
  loseChip: {
    backgroundColor: '#FFEBEE',
  },
  leagueBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    gap: 4,
  },
  leagueBadgeText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  playersLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
  },
  playersNames: {
    fontSize: 14,
    color: '#1B1B1B',
    flex: 1,
  },
  courtInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 16,
  },
  courtInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courtInfoText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  courtInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  modalContent: {
    maxHeight: 400,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterGroupLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  filterOptionActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E8',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6C757D',
  },
  filterOptionTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalClearButton: {
    flex: 1,
    borderRadius: 12,
  },
  modalApplyButton: {
    flex: 1,
    borderRadius: 12,
  },
});

export default MatchHistoryScreen;

