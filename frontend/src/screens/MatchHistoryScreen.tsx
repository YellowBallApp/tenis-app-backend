import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { matchHistoryService, authService, leagueService, commentService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

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
  const { t, language } = useLanguage();
  const { themedStyles, theme } = useThemedStyles();
  const insets = useSafeAreaInsets();
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

  // Comment state'leri
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistory | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCounts, setCommentCounts] = useState<{[key: number]: number}>({});
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

      // Her maç için yorum sayısını yükle
      await loadCommentCounts(matchHistory);
    } catch (error) {
      console.error('Maç geçmişi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentCounts = async (matches: MatchHistory[]) => {
    try {
      const counts: {[key: number]: number} = {};
      await Promise.all(
        matches.map(async (match) => {
          try {
            const count = await commentService.getCommentCount(match.id);
            counts[match.id] = count;
          } catch (error) {
            console.error(`Maç ${match.id} yorum sayısı yüklenemedi:`, error);
            counts[match.id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error('Yorum sayıları yüklenirken hata:', error);
    }
  };

  const openCommentModal = async (match: MatchHistory) => {
    setSelectedMatch(match);
    setShowCommentModal(true);
    setLoadingComments(true);
    
    try {
      const matchComments = await commentService.getMatchComments(match.id);
      setComments(matchComments);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedMatch(null);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedMatch) return;

    try {
      await commentService.createComment({
        matchHistoryId: selectedMatch.id,
        comment: newComment.trim(),
      });
      
      // Yorumları yeniden yükle
      const matchComments = await commentService.getMatchComments(selectedMatch.id);
      setComments(matchComments);
      
      // Yorum sayısını güncelle
      const count = await commentService.getCommentCount(selectedMatch.id);
      setCommentCounts(prev => ({...prev, [selectedMatch.id]: count}));
      
      setNewComment('');
    } catch (error: any) {
      console.error('Yorum eklenirken hata:', error);
      alert(error.response?.data?.message || 'Yorum eklenirken bir hata oluştu');
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) return;

    try {
      await commentService.updateComment(commentId, editingCommentText.trim());
      
      // Yorumları yeniden yükle
      if (selectedMatch) {
        const matchComments = await commentService.getMatchComments(selectedMatch.id);
        setComments(matchComments);
      }
      
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error: any) {
      console.error('Yorum güncellenirken hata:', error);
      alert(error.response?.data?.message || 'Yorum güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId);
      
      // Yorumları yeniden yükle
      if (selectedMatch) {
        const matchComments = await commentService.getMatchComments(selectedMatch.id);
        setComments(matchComments);
        
        // Yorum sayısını güncelle
        const count = await commentService.getCommentCount(selectedMatch.id);
        setCommentCounts(prev => ({...prev, [selectedMatch.id]: count}));
      }
    } catch (error: any) {
      console.error('Yorum silinirken hata:', error);
      alert(error.response?.data?.message || 'Yorum silinirken bir hata oluştu');
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
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
        <Text style={{ marginTop: 10, color: '#6C757D' }}>{t('matchHistory.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.headerSection, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : 50 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Title style={styles.headerTitle}>{t('matchHistory.title')}</Title>
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
                <Title style={styles.statsTitle}>{t('matchHistory.statistics')}</Title>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.totalMatches')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{stats.wins}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.wins')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#DC3545' }]}>{stats.losses}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.losses')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF9800' }]}>%{stats.winRate}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.winRate')}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Filtreleme */}
        <View style={styles.filterSection}>
          <Searchbar
            placeholder={t('matchHistory.searchOpponent')}
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
              <Text style={styles.filterButtonText}>{t('matchHistory.filter')}</Text>
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
                <Text style={styles.clearFilterText}>{t('matchHistory.clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Maç Listesi */}
        <View style={styles.matchesSection}>
          <Title style={styles.sectionTitle}>
            {t('matchHistory.matches')} ({filteredMatches.length})
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
                        {isMatchWinner ? t('matchHistory.winner') : t('matchHistory.loser')}
                      </Chip>
                    </View>

                    {/* Skor */}
                    <View style={styles.scoreContainer}>
                      <MaterialCommunityIcons name="tennis" size={20} color="#2E7D32" />
                      <Text style={styles.scoreText}>{match.score}</Text>
                    </View>

                    {/* Rakipler */}
                    <View style={styles.playersContainer}>
                      <Text style={styles.playersLabel}>{t('matchHistory.opponent')}</Text>
                      <Text style={styles.playersNames}>
                        {opponents.map(o => `${o.name} ${o.surname || ''}`).join(', ')}
                      </Text>
                    </View>

                    {/* Partner (varsa) */}
                    {partners.length > 0 && (
                      <View style={styles.playersContainer}>
                        <Text style={styles.playersLabel}>{t('matchHistory.partner')}</Text>
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
                          {match.indoorCourt ? t('matchHistory.indoorCourt') : t('matchHistory.outdoorCourt')}
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
                          {match.courtGround === 'grass' && t('matchHistory.grassCourt')}
                          {match.courtGround === 'clay' && t('matchHistory.clayCourt')}
                          {match.courtGround === 'hard' && t('matchHistory.hardCourt')}
                        </Text>
                      </View>
                    </View>

                    {/* Yorum Butonu */}
                    <TouchableOpacity
                      style={styles.commentButton}
                      onPress={() => openCommentModal(match)}
                    >
                      <MaterialCommunityIcons name="comment-text-outline" size={20} color="#2E7D32" />
                      <Text style={styles.commentButtonText}>{t('matchHistory.comments')}</Text>
                      {commentCounts[match.id] > 0 && (
                        <View style={styles.commentBadge}>
                          <Text style={styles.commentBadgeText}>{commentCounts[match.id]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

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
                <Text style={styles.emptyText}>{t('matchHistory.noMatches')}</Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Filtreleme Modal */}
      <Portal>
        <Modal
        dismissable={false}
          visible={!!showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>{t('matchHistory.filters')}</Title>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Lig Maçı Filtresi */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>{t('matchHistory.matchType')}</Text>
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
                      ]}>{t('matchHistory.all')}</Text>
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
                      ]}>{t('matchHistory.leagueMatches')}</Text>
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
                      ]}>{t('matchHistory.normalMatches')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lig Seçimi */}
                {filterLeagueOnly !== false && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterGroupLabel}>{t('matchHistory.league')}</Text>
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
                        ]}>{t('matchHistory.allLeagues')}</Text>
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
                  <Text style={styles.filterGroupLabel}>{t('matchHistory.courtType')}</Text>
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
                      ]}>{t('matchHistory.all')}</Text>
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
                      ]}>{t('matchHistory.outdoorCourt')}</Text>
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
                      ]}>{t('matchHistory.indoorCourt')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Zemin Tipi Filtresi */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>{t('matchHistory.groundType')}</Text>
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
                      ]}>{t('matchHistory.all')}</Text>
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
                      ]}>{t('matchHistory.hardCourt')}</Text>
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
                      ]}>{t('matchHistory.clayCourt')}</Text>
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
                      ]}>{t('matchHistory.grassCourt')}</Text>
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
                  {t('matchHistory.clear')}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalApplyButton}
                  buttonColor="#2E7D32"
                >
                  {t('matchHistory.apply')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>

        {/* Yorum Modalı */}
        <Modal
        dismissable={false}
          visible={!!showCommentModal}
          onDismiss={closeCommentModal}
          contentContainerStyle={styles.commentModalContainer}
        >
          <Card style={[styles.commentModalCard, themedStyles.card]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <Card.Content style={styles.commentModalContent}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline || '#E9ECEF' }]}>
                  <MaterialCommunityIcons name="comment-text" size={32} color="#2E7D32" />
                  <Title style={[styles.modalTitle, themedStyles.title]}>{t('matchHistory.matchComments')}</Title>
                <TouchableOpacity onPress={closeCommentModal}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text || '#757575'} />
                </TouchableOpacity>
              </View>

              {/* Maç Bilgisi */}
              {selectedMatch && (
                <View style={styles.matchInfoBar}>
                    <Text style={[styles.matchInfoText, themedStyles.text]}>
                    {formatDate(selectedMatch.matchDate)} • {selectedMatch.score}
                  </Text>
                </View>
              )}

                {/* Yorumlar Listesi */}
                {loadingComments ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2E7D32" />
                    <Text style={[styles.loadingText, themedStyles.text]}>{t('matchHistory.loadingComments')}</Text>
                  </View>
                ) : comments.length > 0 ? (
                  <View style={styles.commentsListContainer}>
                    {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentUserInfo}>
                          <MaterialCommunityIcons name="account-circle" size={32} color="#2E7D32" />
                          <View style={styles.commentUserDetails}>
                              <Text style={[styles.commentUserName, themedStyles.title]}>{comment.user.name}</Text>
                              <Text style={[styles.commentDate, themedStyles.subtitle]}>{formatCommentDate(comment.created)}</Text>
                          </View>
                        </View>
                        
                        {/* Kullanıcının kendi yorumu ise edit/delete butonları */}
                        {comment.user.id === currentUserId && (
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              style={styles.commentActionButton}
                              onPress={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.comment);
                              }}
                            >
                              <MaterialCommunityIcons name="pencil" size={20} color="#2E7D32" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.commentActionButton}
                              onPress={() => handleDeleteComment(comment.id)}
                            >
                              <MaterialCommunityIcons name="delete" size={20} color="#DC3545" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Yorum içeriği */}
                      {editingCommentId === comment.id ? (
                        <View style={styles.editCommentContainer}>
                          <TextInput
                            style={styles.editCommentInput}
                            value={editingCommentText}
                            onChangeText={setEditingCommentText}
                            multiline
                            placeholder={t('matchHistory.editComment')}
                          />
                          <View style={styles.editCommentButtons}>
                            <TouchableOpacity
                              style={styles.cancelEditButton}
                              onPress={() => {
                                setEditingCommentId(null);
                                setEditingCommentText('');
                              }}
                            >
                              <Text style={styles.cancelEditButtonText}>{t('matchHistory.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.saveEditButton}
                              onPress={() => handleEditComment(comment.id)}
                            >
                              <Text style={styles.saveEditButtonText}>{t('matchHistory.save')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                          <Text style={[styles.commentText, themedStyles.text]}>{comment.comment}</Text>
                      )}
                    </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCommentsContainer}>
                    <MaterialCommunityIcons name="comment-off-outline" size={48} color="#BDBDBD" />
                    <Text style={[styles.emptyCommentsText, themedStyles.subtitle]}>{t('matchHistory.noComments')}</Text>
                  </View>
                )}

                {/* Yeni Yorum Ekleme */}
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder={t('matchHistory.writeComment')}
                  multiline
                  numberOfLines={3}
                    placeholderTextColor={theme.colors.placeholder || '#9E9E9E'}
                />
                <View style={styles.commentInputButtons}>
                  <Button
                    mode="outlined"
                    onPress={closeCommentModal}
                    style={styles.cancelCommentButton}
                      textColor={theme.colors.text || '#757575'}
                  >
                    {t('matchHistory.cancel')}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddComment}
                    style={styles.sendCommentButton}
                    buttonColor="#2E7D32"
                    disabled={!!(!newComment.trim())}
                  >
                    {t('matchHistory.send')}
                  </Button>
                </View>
              </View>
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
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    backgroundColor: '#E1BEE7',
    paddingBottom: 25,
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
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: '#E1BEE7',
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    elevation: 0,
    borderWidth: 0,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#F8F9FA',
  },
  searchbar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 0,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    gap: 8,
  },
  filterButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 15,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 0,
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
    height: 32,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  resultChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  winChip: {
    backgroundColor: '#C8E6C9',
  },
  loseChip: {
    backgroundColor: '#FFCDD2',
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
    margin: 10,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    maxHeight: '90%',
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
  modalScrollView: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 32,
  },
  commentModalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  commentModalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    maxHeight: '85%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  commentModalContent: {
    padding: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 12,
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
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  commentButtonText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  commentBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  commentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  matchInfoBar: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#1B1B1B',
    fontWeight: '600',
    textAlign: 'center',
  },
  commentsListContainer: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 10,
  },
  commentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  commentDate: {
    fontSize: 11,
    color: '#6C757D',
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  commentActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  commentText: {
    fontSize: 14,
    color: '#1B1B1B',
    lineHeight: 20,
  },
  editCommentContainer: {
    marginTop: 8,
  },
  editCommentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editCommentButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelEditButtonText: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '600',
  },
  saveEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  saveEditButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 12,
  },
  addCommentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 20,
    marginTop: 24,
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#1B1B1B',
  },
  commentInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelCommentButton: {
    flex: 1,
    borderRadius: 12,
  },
  sendCommentButton: {
    flex: 1,
    borderRadius: 12,
  },
});

export default MatchHistoryScreen;

