import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
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

const { height } = Dimensions.get('window');

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
  const commentScrollViewRef = useRef<ScrollView>(null);

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

  // Yorumlar yüklendiğinde en alta kaydır
  useEffect(() => {
    if (showCommentModal && !loadingComments && comments.length > 0) {
      setTimeout(() => {
        commentScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showCommentModal, loadingComments, comments.length]);

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
      
      // Yorum eklendikten sonra en alta kaydır
      setTimeout(() => {
        commentScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
        <ActivityIndicator size="large" color="#54CE8F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home' as never);
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('matchHistory.title')}</Text>
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
              <Text style={styles.statsTitle}>{t('matchHistory.statistics')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#B4AEBD" />
                  </View>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.totalMatches')}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#B4AEBD" />
                  </View>
                  <Text style={[styles.statNumber, { color: '#54CE8F' }]}>{stats.wins}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.wins')}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#B4AEBD" />
                  </View>
                  <Text style={[styles.statNumber, { color: '#B4AEBD' }]}>{stats.losses}</Text>
                  <Text style={styles.statLabel}>{t('matchHistory.losses')}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="trending-up" size={20} color="#B4AEBD" />
                  </View>
                  <Text style={[styles.statNumber, { color: '#54CE8F' }]}>%{stats.winRate}</Text>
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
            iconColor="#9CA3AF"
            inputStyle={styles.searchInput}
          />
          <View style={styles.filterButtonRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color="#54CE8F" />
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
                      <View
                        style={[
                          styles.resultChip,
                          isMatchWinner ? styles.winChip : styles.loseChip
                        ]}
                      >
                        <Text style={styles.resultChipText}>
                          {isMatchWinner ? t('matchHistory.winner') : t('matchHistory.loser')}
                        </Text>
                      </View>
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
                          color="#9CA3AF" 
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
                          color="#9CA3AF" 
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
                      <MaterialCommunityIcons name="comment-text-outline" size={20} color="#54CE8F" />
                      <Text style={styles.commentButtonText}>{t('matchHistory.comments')}</Text>
                      {commentCounts[match.id] > 0 && (
                        <View style={styles.commentBadge}>
                          <Text style={styles.commentBadgeText}>{commentCounts[match.id]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Lig Bilgisi */}
                    {match.leagueStanding?.league?.name && (
                      <View style={styles.leagueBadge}>
                        <MaterialCommunityIcons name="trophy" size={14} color="#54CE8F" />
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
            <Card.Content style={styles.modalCardContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('matchHistory.filters')}</Text>
                <TouchableOpacity 
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
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
                        color={filterCourtType === 'outdoor' ? "#54CE8F" : "#9CA3AF"} 
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
                        color={filterCourtType === 'indoor' ? "#54CE8F" : "#9CA3AF"} 
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
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[styles.modalClearButton, { paddingVertical: 16, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={styles.cancelButtonText}>{t('matchHistory.clear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  style={[styles.modalApplyButton, { paddingVertical: 16, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={styles.saveButtonText}>{t('matchHistory.apply')}</Text>
                </TouchableOpacity>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Card style={styles.commentModalCard}>
              <Card.Content style={styles.commentModalCardContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('matchHistory.matchComments')}</Text>
                  <TouchableOpacity 
                    onPress={closeCommentModal}
                    style={styles.modalCloseButton}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Maç Bilgisi */}
                {selectedMatch && (
                  <View style={styles.matchInfoBar}>
                    <Text style={styles.matchInfoText}>
                      {formatDate(selectedMatch.matchDate)} • {selectedMatch.score}
                    </Text>
                  </View>
                )}

                {/* Yorumlar Listesi */}
                <ScrollView 
                  ref={commentScrollViewRef}
                  style={styles.commentScrollView}
                  contentContainerStyle={styles.commentScrollViewContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {loadingComments ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#54CE8F" />
                      <Text style={styles.loadingText}>{t('matchHistory.loadingComments')}</Text>
                    </View>
                  ) : comments.length > 0 ? (
                    <View style={styles.commentsListContainer}>
                      {comments.map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentUserInfo}>
                              <View style={styles.commentUserAvatar}>
                                <MaterialCommunityIcons name="account-circle" size={24} color="#B4AEBD" />
                              </View>
                              <View style={styles.commentUserDetails}>
                                <Text style={styles.commentUserName}>{comment.user.name}</Text>
                                <Text style={styles.commentDate}>{formatCommentDate(comment.created)}</Text>
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
                                  <MaterialCommunityIcons name="pencil" size={18} color="#54CE8F" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.commentActionButton}
                                  onPress={() => handleDeleteComment(comment.id)}
                                >
                                  <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
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
                            <Text style={styles.commentText}>{comment.comment}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCommentsContainer}>
                      <MaterialCommunityIcons name="comment-off-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.emptyCommentsText}>{t('matchHistory.noComments')}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Yeni Yorum Ekleme - Her zaman görünür */}
                <View style={styles.addCommentContainer}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder={t('matchHistory.writeComment')}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9CA3AF"
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
            </Card>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  headerSection: {
    backgroundColor: '#B4AEBD', // New design purple
    paddingBottom: 24, // pb-6
    paddingHorizontal: 24, // px-6
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24, // text-2xl
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12, // text-xs
    color: '#F3E5F5', // Light purple
    textAlign: 'center',
    marginTop: 4, // mt-1
  },
  placeholder: {
    width: 40,
  },
  statsSection: {
    paddingHorizontal: 24, // px-6
    paddingVertical: 24, // py-6
    backgroundColor: '#FAFCFB',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213',
    marginBottom: 20, // mb-5
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12, // gap-3
  },
  statItem: {
    width: '48%', // 2 columns
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  statNumber: {
    fontSize: 28, // text-3xl
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4, // mb-1
  },
  statLabel: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    textAlign: 'left',
  },
  filterSection: {
    paddingHorizontal: 24, // px-6
    paddingTop: 24, // pt-6
    paddingBottom: 16, // pb-4
    backgroundColor: '#FAFCFB',
  },
  searchbar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    elevation: 0,
    marginBottom: 12, // mb-3
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  searchInput: {
    fontSize: 16,
    color: '#030213',
  },
  filterButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    gap: 8, // gap-2
  },
  filterButtonText: {
    color: '#030213',
    fontWeight: '500',
    fontSize: 14, // text-sm
  },
  filterBadge: {
    backgroundColor: '#54CE8F', // Primary green
    borderRadius: 9999, // rounded-full
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11, // text-xs
    fontWeight: '600',
  },
  clearFilterButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
  },
  clearFilterText: {
    color: '#717182', // Medium gray
    fontWeight: '500',
    fontSize: 14, // text-sm
  },
  matchesSection: {
    paddingHorizontal: 24, // px-6
    paddingTop: 24, // pt-6
    paddingBottom: 24, // pb-6
    backgroundColor: '#FAFCFB',
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213',
    marginBottom: 16, // mb-4
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    marginBottom: 12, // mb-3
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  matchCardContent: {
    position: 'relative',
    padding: 20, // p-5
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
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  resultChip: {
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
  },
  resultChipText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
  },
  winChip: {
    backgroundColor: '#D1FAE5', // green-100
  },
  loseChip: {
    backgroundColor: '#FEE2E2', // red-100
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // gray-100
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
    borderRadius: 9999, // rounded-full
    gap: 6, // gap-1.5
    alignSelf: 'flex-start',
    marginTop: 12, // mt-3
  },
  leagueBadgeText: {
    fontSize: 11, // text-xs
    color: '#030213',
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    marginBottom: 16, // mb-4
    backgroundColor: '#F0FDF4', // green-50
    padding: 12, // p-3
    borderRadius: 12, // rounded-xl
  },
  scoreText: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#54CE8F', // Primary green
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // mt-3
    gap: 8, // gap-2
  },
  playersLabel: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
    fontWeight: '500',
  },
  playersNames: {
    fontSize: 14, // text-sm
    color: '#030213',
    flex: 1,
  },
  courtInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16, // mt-4
    paddingTop: 16, // pt-4
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    gap: 16, // gap-4
  },
  courtInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // gap-1.5
  },
  courtInfoText: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
    fontWeight: '400',
  },
  courtInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB', // gray-200
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
    margin: Platform.OS === 'ios' ? 10 : 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    maxHeight: Platform.OS === 'ios' ? height * 0.95 : height * 0.8,
    width: Platform.OS === 'ios' ? '95%' : undefined,
    alignSelf: Platform.OS === 'ios' ? 'center' : undefined,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  modalCardContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: 16,
  },
  commentModalContainer: {
    margin: Platform.OS === 'ios' ? 20 : 20,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 0,
  },
  commentModalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    maxHeight: Platform.OS === 'ios' ? height * 0.60 : height * 0.8,
    minHeight: Platform.OS === 'ios' ? height * 0.50 : undefined,
    width: Platform.OS === 'ios' ? '90%' : undefined,
    alignSelf: Platform.OS === 'ios' ? 'center' : undefined,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  commentModalCardContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  commentScrollView: {
    flex: 1,
    minHeight: 0,
  },
  commentScrollViewContent: {
    paddingBottom: 16,
  },
  commentModalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  modalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  modalCloseButton: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterGroup: {
    marginBottom: 24, // mb-6
  },
  filterGroupLabel: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    marginBottom: 12, // mb-3
  },
  filterOptions: {
    gap: 8, // gap-2
  },
  filterOption: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionActive: {
    borderColor: '#54CE8F', // Primary green
    backgroundColor: '#F0FDF4', // green-50
  },
  filterOptionText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  filterOptionTextActive: {
    color: '#030213',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, // mt-5
    gap: 12, // gap-3
  },
  modalClearButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  modalApplyButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // green-50
    paddingVertical: 8, // py-2
    paddingHorizontal: 12, // px-3
    borderRadius: 12, // rounded-xl
    marginTop: 12, // mt-3
    gap: 6, // gap-1.5
    alignSelf: 'flex-start',
  },
  commentButtonText: {
    fontSize: 12, // text-xs
    color: '#54CE8F', // Primary green
    fontWeight: '500',
  },
  commentBadge: {
    backgroundColor: '#54CE8F', // Primary green
    borderRadius: 9999, // rounded-full
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  commentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  matchInfoBar: {
    backgroundColor: '#F3F4F6', // gray-100
    padding: 12, // p-3
    borderRadius: 12, // rounded-xl
    marginBottom: 20, // mb-5
    marginTop: 8, // mt-2
  },
  matchInfoText: {
    fontSize: 14, // text-sm
    color: '#030213',
    fontWeight: '500',
    textAlign: 'center',
  },
  commentUserAvatar: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginTop: 10, // mt-2.5
  },
  commentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    marginBottom: 12, // mb-3
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // mb-2
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3
    flex: 1,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
  },
  commentDate: {
    fontSize: 11, // text-xs
    color: '#9CA3AF', // gray-400
    marginTop: 4, // mt-1
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8, // gap-2
  },
  commentActionButton: {
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
    backgroundColor: '#F3F4F6', // gray-100
  },
  commentText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    lineHeight: 20,
  },
  editCommentContainer: {
    marginTop: 8,
  },
  editCommentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    padding: 12, // p-3
    fontSize: 14, // text-sm
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#030213',
  },
  editCommentButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8, // gap-2
    marginTop: 12, // mt-3
  },
  cancelEditButton: {
    paddingVertical: 10, // py-2.5
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  cancelEditButtonText: {
    fontSize: 14, // text-sm
    color: '#030213',
    fontWeight: '500',
    textAlign: 'center',
  },
  saveEditButton: {
    paddingVertical: 10, // py-2.5
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-xl
    backgroundColor: '#54CE8F', // Primary green
  },
  saveEditButtonText: {
    fontSize: 14, // text-sm
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40, // py-10
  },
  emptyCommentsText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginTop: 12, // mt-3
  },
  addCommentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    paddingTop: 16, // pt-4
    marginTop: 16, // mt-4
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    padding: 12, // p-3
    fontSize: 14, // text-sm
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16, // mb-4
    color: '#030213',
  },
  commentInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // gap-3
  },
  cancelCommentButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  sendCommentButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030213',
    textAlign: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default MatchHistoryScreen;

