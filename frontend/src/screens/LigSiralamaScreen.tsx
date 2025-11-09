import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { leagueStandingsService, authService, courtService, matchChallengeService } from '../services/api';
import { ChallengeStatus } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LigSiralamaScreen = ({ route, navigation }: any) => {
  const { lig } = route.params;
  
  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [200, 110],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const compactOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [acceptedChallenge, setAcceptedChallenge] = useState<any>(null); // Kabul edilmiş challenge
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showMatchResultModal, setShowMatchResultModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [matchSets, setMatchSets] = useState<Array<{ userScore: string; opponentScore: string }>>([
    { userScore: '', opponentScore: '' },
    { userScore: '', opponentScore: '' },
    { userScore: '', opponentScore: '' },
  ]);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [courtMenuVisible, setCourtMenuVisible] = useState(false);
  const [scoreError, setScoreError] = useState(false);
  const [scoreMismatch, setScoreMismatch] = useState(false);
  const [maxOfferRange, setMaxOfferRange] = useState<number>(3); // Varsayılan 3
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [userPendingChallenges, setUserPendingChallenges] = useState<any[]>([]);

  // Sayfa her odaklandığında verileri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadRankings();
      loadCourts();
      loadUserChallenges();
    }, [])
  );

  const loadCourts = async () => {
    try {
      const courtsList = await courtService.getActiveCourts();
      setCourts(courtsList);
    } catch (error) {
      console.error('Kortlar yüklenirken hata:', error);
    }
  };

  const loadUserChallenges = async () => {
    try {
      // Kullanıcının TÜM challengelarını yükle (hem gönderdiği hem de aldığı)
      const challenges = await matchChallengeService.getUserChallenges();
      // Pending olanları filtrele
      setUserPendingChallenges(challenges.filter((c: any) => c.status === ChallengeStatus.PENDING));
      
      // Accepted challenge'ı bul (varsa)
      const accepted = challenges.find((c: any) => 
        c.status === ChallengeStatus.ACCEPTED && c.league.id === lig.id
      );
      setAcceptedChallenge(accepted || null);
    } catch (error) {
      console.error('Challenge\'lar yüklenirken hata:', error);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı profilini getir
      const profileData = await authService.getProfile();
      
      // Seçilen ligin sıralama verilerini getir
      const rankingsData = await leagueStandingsService.getLeagueRankings(lig.id);
      
      // League settings'ten maxOfferRange'i çek
      try {
        const availableOpponents = await leagueStandingsService.getAvailableOpponents(profileData.id, lig.id);
        if (availableOpponents.maxOfferRange) {
          setMaxOfferRange(availableOpponents.maxOfferRange);
        }
      } catch (error) {
        console.error('Max offer range alınırken hata:', error);
        // Hata durumunda varsayılan 3 kullan
      }
      
      // Eğer ranking data boşsa veya kullanıcı yoksa, mock data kullan
      if (!rankingsData || rankingsData.length === 0) {
        // Mock current user data
        setCurrentUser({
          id: profileData.id,
          name: profileData.name || 'Oyuncu',
          position: 1,
          email: profileData.email,
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
          });
          
          // Kullanıcının olduğu sayfayı hesapla
          const userPage = Math.ceil(currentUserRanking.position / itemsPerPage);
          setCurrentPage(userPage);
        } else {
          // Kullanıcı rankings'de yoksa, ilk kullanıcıyı kullan
          const firstUser = rankingsData[0];
          setCurrentUser({
            id: firstUser.user.id,
            name: firstUser.user.name,
            position: firstUser.position,
            email: firstUser.user.email,
          });
          setCurrentPage(1);
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
    
    // Kullanıcının bu ligde aktif bir challenge'ı var mı kontrol et (pending veya accepted)
    const userHasActiveChallengeInLeague = userPendingChallenges.some(
      (c: any) => c.league.id === lig.id
    ) || (acceptedChallenge && acceptedChallenge.league.id === lig.id);
    
    if (userHasActiveChallengeInLeague) {
      Alert.alert(
        'Aktif Meydan Okuma', 
        'Bu ligde zaten aktif bir meydan okumanız var. Önce mevcut meydan okumanın sonuçlanmasını bekleyin.'
      );
      return;
    }
    
    // Bu oyuncuya zaten bekleyen bir challenge gönderilmiş mi kontrol et
    const existingChallenge = userPendingChallenges.find(
      (c: any) => c.challenged.id === player.user.id && c.league.id === lig.id
    );
    
    if (existingChallenge) {
      Alert.alert(
        'Bekleyen Meydan Okuma', 
        `${player.user.name} kullanıcısına zaten bekleyen bir meydan okuma gönderdiniz. Lütfen cevabını bekleyin.`
      );
      return;
    }
    
    // Hedef oyuncunun bu ligde aktif bir challenge'ı var mı kontrol et
    // (Backend de kontrol ediyor ama kullanıcı deneyimi için burada da gösterelim)
    
    // Lig kuralı: Sadece maxOfferRange kadar sıra üstüne meydan okunabilir
    const positionDifference = currentUser.position - player.position;
    if (positionDifference > maxOfferRange) {
      Alert.alert(
        'Meydan Okuma Kuralı', 
        `Sadece ${maxOfferRange} sıra üstündeki oyunculara meydan okuyabilirsiniz.\n\nMevcut sıranız: #${currentUser.position}\nHedef sıra: #${player.position}\nFark: ${positionDifference} sıra`
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
      // Yeni endpoint kullanarak challenge gönder
      await matchChallengeService.createChallenge({
        challengedId: selectedPlayer.user.id,
        leagueId: lig.id,
        message: challengeMessage,
        expiresInDays: 7, // Varsayılan 7 gün
      });

      // Modal'ı kapat
      setShowChallengeModal(false);

      // Listeyi hemen yenile
      await loadRankings();
      await loadUserChallenges(); // Challenge listesini de yenile

      // Başarı bildirimi göster
      setSnackbarMessage(`${selectedPlayer?.user.name} adlı oyuncuya meydan okuma gönderildi!`);
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Challenge hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Meydan okuma gönderilemedi');
    }
  };

  const openMatchResultModal = () => {
    if (!acceptedChallenge) {
      Alert.alert('Uyarı', 'Kabul edilmiş bir meydan okuma bulunmuyor');
      return;
    }
    setSelectedWinner(null);
    setSelectedCourt(null);
    setMatchSets([
      { userScore: '', opponentScore: '' },
      { userScore: '', opponentScore: '' },
      { userScore: '', opponentScore: '' },
    ]);
    setScoreError(false);
    setShowMatchResultModal(true);
  };

  const updateSetScore = (setIndex: number, field: 'userScore' | 'opponentScore', value: string) => {
    // Sadece sayıları kabul et
    if (value && !/^\d+$/.test(value)) return;
    
    const newSets = [...matchSets];
    newSets[setIndex][field] = value;
    setMatchSets(newSets);
    
    // Hata durumunu temizle
    if (scoreError) {
      setScoreError(false);
    }
  };

  const addSet = () => {
    if (matchSets.length < 5) {
      setMatchSets([...matchSets, { userScore: '', opponentScore: '' }]);
    }
  };

  const removeSet = (index: number) => {
    if (matchSets.length > 1) {
      const newSets = matchSets.filter((_, i) => i !== index);
      setMatchSets(newSets);
    }
  };

  const submitMatchResult = async () => {
    if (!selectedWinner) {
      Alert.alert('Uyarı', 'Lütfen kazananı seçin');
      return;
    }

    if (!selectedCourt) {
      Alert.alert('Uyarı', 'Lütfen kort seçin');
      return;
    }

    // Skor validasyonu - en az 2 set girilmiş olmalı (ZORUNLU)
    const filledSets = matchSets.filter(set => set.userScore && set.opponentScore);
    if (filledSets.length < 2) {
      setScoreError(true);
      Alert.alert('Uyarı', 'En az 2 set skoru girilmesi zorunludur');
      return;
    }

    // Set skorlarına göre gerçek kazananı belirle
    let userWonSets = 0;
    let opponentWonSets = 0;
    
    filledSets.forEach(set => {
      const userScore = parseInt(set.userScore);
      const opponentScore = parseInt(set.opponentScore);
      
      if (userScore > opponentScore) {
        userWonSets++;
      } else if (opponentScore > userScore) {
        opponentWonSets++;
      }
    });

    if (!acceptedChallenge) {
      Alert.alert('Hata', 'Kabul edilmiş challenge bulunamadı');
      return;
    }

    // Opponent'ı belirle (challenge'da challenger mı challenged mı olduğumuza bak)
    const opponentId = acceptedChallenge.challenger.id === currentUser.id
      ? acceptedChallenge.challenged.id
      : acceptedChallenge.challenger.id;

    // Gerçek kazananı belirle (en çok seti kim kazandı?)
    const actualWinnerId = userWonSets > opponentWonSets 
      ? currentUser.id 
      : opponentId;

    // Seçilen kazanan ile gerçek kazananı karşılaştır - uyarı göster ve kaydetmeyi engelle
    if (selectedWinner !== actualWinnerId) {
      setScoreMismatch(true);
      return;
    } else {
      setScoreMismatch(false);
    }

    // Skor formatını oluştur (örn: "6-4, 3-6, 6-4")
    const scoreString = filledSets
      .map(set => `${set.userScore}-${set.opponentScore}`)
      .join(', ');

    const winnerId = selectedWinner;
    const loserId = selectedWinner === currentUser.id 
      ? opponentId 
      : currentUser.id;

    try {
      setLoading(true);

      // Standings'leri güncelle ve skoru yolla
      await leagueStandingsService.updateUserRanking(
        lig.id,
        winnerId,
        loserId,
        scoreString, // Skoru backend'e gönder
        selectedCourt // Kort ID'sini backend'e gönder
      );

      // Maç sonucu kaydedildikten sonra challenge'ı sil
      if (acceptedChallenge) {
        try {
          await matchChallengeService.deleteChallenge(acceptedChallenge.id);
          console.log('Challenge silindi:', acceptedChallenge.id);
        } catch (deleteError) {
          console.error('Challenge silinemedi:', deleteError);
          // Challenge silme hatası maç sonucunu etkilemez, sadece log'larız
        }
      }

      // Modal'ı kapat
      setShowMatchResultModal(false);

      // Listeyi yenile
      await loadRankings();
      await loadUserChallenges(); // Challenge'lar listesini de yenile
      setLoading(false);

      // Başarı bildirimi göster
      setSnackbarMessage(`Maç sonucu kaydedildi: ${scoreString}`);
      setSnackbarVisible(true);
      
      console.log('Kaydedilen skor:', scoreString);
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç sonucu kaydedilemedi');
      setLoading(false);
    }
  };

  // Sıralama ekranında challenge kabul et
  const handleAcceptChallengeInRanking = async (player: any) => {
    if (loading) return;
    
    try {
      // Bu oyuncudan gelen pending challenge'ı bul
      const challenge = userPendingChallenges.find(
        (c: any) => c.challenger.id === player.user.id && c.challenged.id === currentUser.id && c.league.id === lig.id
      );
      
      if (!challenge) {
        Alert.alert('Hata', 'Bekleyen maç isteği bulunamadı');
        return;
      }
      
      setLoading(true);
      await matchChallengeService.acceptChallenge(challenge.id);
      
      Alert.alert('Başarılı', `${player.user.name} ile maç isteği kabul edildi!`);
      
      // Challenge'ları yeniden yükle
      await loadUserChallenges();
      await loadRankings();
      
      setLoading(false);
    } catch (error: any) {
      console.error('Challenge kabul hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç isteği kabul edilemedi');
      setLoading(false);
    }
  };

  // Sıralama ekranında challenge reddet
  const handleRejectChallengeInRanking = async (player: any) => {
    if (loading) return;
    
    try {
      // Bu oyuncudan gelen pending challenge'ı bul
      const challenge = userPendingChallenges.find(
        (c: any) => c.challenger.id === player.user.id && c.challenged.id === currentUser.id && c.league.id === lig.id
      );
      
      if (!challenge) {
        Alert.alert('Hata', 'Bekleyen maç isteği bulunamadı');
        return;
      }
      
      setLoading(true);
      await matchChallengeService.rejectChallenge(challenge.id);
      
      Alert.alert('Başarılı', `${player.user.name}'dan gelen maç isteği reddedildi`);
      
      // Challenge'ları yeniden yükle
      await loadUserChallenges();
      await loadRankings();
      
      setLoading(false);
    } catch (error: any) {
      console.error('Challenge reddetme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç isteği reddedilemedi');
      setLoading(false);
    }
  };

  // Pagination helper functions
  const getTotalPages = () => {
    return Math.ceil(players.length / itemsPerPage);
  };

  const getCurrentPagePlayers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return players.slice(startIndex, endIndex);
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPlayerCard = (player: any) => {
    if (!currentUser) return null;
    
    const isCurrentUser = player.user.id === currentUser.id;
    const positionDifference = currentUser.position - player.position;
    
    // Kullanıcının bu ligde aktif bir challenge'ı var mı? (hem gönderdiği hem aldığı, pending veya accepted)
    const userHasActiveChallengeInLeague = userPendingChallenges.some(
      (c: any) => c.league.id === lig.id
    ) || (acceptedChallenge && acceptedChallenge.league.id === lig.id);
    
    // Bu oyuncuya zaten bekleyen bir challenge gönderilmiş mi?
    const hasPendingChallengeToThisPlayer = userPendingChallenges.some(
      (c: any) => c.challenger.id === currentUser.id && c.challenged.id === player.user.id && c.league.id === lig.id
    );
    
    // Bu oyuncu bana bekleyen bir challenge göndermiş mi?
    const hasPendingChallengeFromThisPlayer = userPendingChallenges.some(
      (c: any) => c.challenger.id === player.user.id && c.challenged.id === currentUser.id && c.league.id === lig.id
    );
    
    const canChallenge = !isCurrentUser 
      && positionDifference <= maxOfferRange 
      && positionDifference > 0 
      && !userHasActiveChallengeInLeague // Kullanıcının bu ligde aktif challenge'ı olmamalı (pending veya accepted)
      && !hasPendingChallengeToThisPlayer; // Bu oyuncuya zaten pending challenge gönderilmemiş olmalı
    
    return (
      <Card 
        key={player.user.id} 
        style={[styles.playerCard, isCurrentUser && styles.currentUserCard]}
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
              <Text style={styles.playerName}>
                {player.user.name}
                {isCurrentUser && ' (Siz)'}
              </Text>
              <Text style={styles.playerLevel}>{player.user.name} - {player.position}. sırada</Text>
              
              {/* Pending challenge durumları */}
              {hasPendingChallengeToThisPlayer && (
                <Chip 
                  icon="clock-alert-outline" 
                  style={styles.pendingChallengeSentChip}
                  textStyle={styles.pendingChallengeSentChipText}
                  compact
                >
                  Maç İsteği Bekleniyor
                </Chip>
              )}
              {hasPendingChallengeFromThisPlayer && (
                <Chip 
                  icon="email-alert" 
                  style={styles.pendingChallengeReceivedChip}
                  textStyle={styles.pendingChallengeReceivedChipText}
                  compact
                >
                  Sana Maç İsteği Gönderdi
                </Chip>
              )}
            </View>
            
            <View style={styles.playerActions}>
              {isCurrentUser ? (
                // Kullanıcının kendi kartı - buton gösterme
                <Chip 
                  icon="account-check" 
                  style={styles.currentUserChip}
                  textStyle={styles.currentUserChipText}
                  compact
                >
                  Sizsiniz
                </Chip>
              ) : hasPendingChallengeFromThisPlayer ? (
                // Bu oyuncu bana maç isteği göndermiş - Kabul/Reddet butonları
                <View style={styles.challengeResponseButtons}>
                  <Button
                    mode="contained"
                    onPress={() => handleAcceptChallengeInRanking(player)}
                    style={styles.acceptChallengeButton}
                    buttonColor="#2E7D32"
                    icon="check"
                    compact
                  >
                    Kabul Et
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleRejectChallengeInRanking(player)}
                    style={styles.rejectChallengeButton}
                    textColor="#DC3545"
                    icon="close"
                    compact
                  >
                    Reddet
                  </Button>
                </View>
              ) : canChallenge ? (
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
      {/* Animated Header Section */}
      <Animated.View style={[
        styles.headerSection,
        { height: headerHeight }
      ]}>
        {/* Kompakt Başlık */}
        <Animated.View style={[
          styles.compactHeader,
          { opacity: compactOpacity }
        ]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.compactBackButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Title style={styles.compactTitle}>{lig.name}</Title>
          <TouchableOpacity 
            onPress={loadRankings}
            style={styles.compactRefreshButton}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Normal İçerik */}
        <Animated.View style={{ opacity: headerOpacity }}>
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
        </Animated.View>
      </Animated.View>
      
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

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
                  {userPendingChallenges.length > 0 && (
                    <Chip 
                      icon="clock-alert-outline" 
                      style={styles.pendingChip}
                      textStyle={styles.pendingChipText}
                      compact
                    >
                      Bekleyen Challenge ({userPendingChallenges.length})
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
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Rakip Oyuncular</Title>
            <Text style={styles.paginationInfo}>
              Sayfa {currentPage} / {getTotalPages()}
            </Text>
          </View>
          {getCurrentPagePlayers().map(renderPlayerCard)}
          
          {/* Pagination Controls */}
          {getTotalPages() > 1 && (
            <View style={styles.paginationContainer}>
              <Button
                mode="outlined"
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
                style={styles.paginationButton}
                icon="chevron-left"
                compact
              >
                Önceki
              </Button>
              
              <View style={styles.pageIndicator}>
                <Text style={styles.pageText}>
                  {currentPage} / {getTotalPages()}
                </Text>
              </View>
              
              <Button
                mode="outlined"
                onPress={goToNextPage}
                disabled={currentPage === getTotalPages()}
                style={styles.paginationButton}
                icon="chevron-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
                compact
              >
                Sonraki
              </Button>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Title style={styles.sectionTitle}>Hızlı İşlemler</Title>
          
          {/* Maç Sonucu Gir Butonu */}
          <View style={styles.matchResultButtonContainer}>
            <Button
              mode="contained"
              style={[
                styles.quickActionButton, 
                !acceptedChallenge && styles.disabledQuickActionButton
              ]}
              buttonColor={acceptedChallenge ? "#2E7D32" : "#9E9E9E"}
              icon="clipboard-check"
              onPress={openMatchResultModal}
              disabled={!acceptedChallenge}
            >
              Maç Sonucu Gir
            </Button>
            {acceptedChallenge ? (
              <View style={styles.matchInfoContainer}>
                <MaterialCommunityIcons name="information" size={16} color="#2E7D32" />
                <Text style={styles.matchInfoText}>
                  {acceptedChallenge.challenger.id === currentUser.id 
                    ? acceptedChallenge.challenged.name 
                    : acceptedChallenge.challenger.name} ile kabul edilmiş müsabakanız var
                </Text>
              </View>
            ) : userPendingChallenges.length > 0 ? (
              <View style={styles.matchInfoContainer}>
                <MaterialCommunityIcons name="clock-alert" size={16} color="#FF9800" />
                <Text style={styles.noMatchInfoText}>
                  Bekleyen meydan okuma var. Maç sonucu girebilmek için önce meydan okumanın kabul edilmesini bekleyin.
                </Text>
              </View>
            ) : (
              <View style={styles.matchInfoContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF9800" />
                <Text style={styles.noMatchInfoText}>
                  Aktif müsabaka bulunmuyor. Maç sonucu girebilmek için önce bir oyuncuya meydan okuyun ve kabul edilmesini bekleyin.
                </Text>
              </View>
            )}
          </View>

          {/* Maç Geçmişi Butonu */}
          <Button
            mode="outlined"
            style={styles.quickActionButton}
            textColor="#2E7D32"
            icon="calendar"
            onPress={() => navigation.navigate('MatchHistory', { leagueId: lig.id, leagueName: lig.name })}
          >
            Maç Geçmişi
          </Button>
        </View>
      </Animated.ScrollView>

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
                      <Text style={styles.opponentLevel}>{selectedPlayer.user.name} - {selectedPlayer.position}. sırada</Text>
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
            <ScrollView showsVerticalScrollIndicator={true} style={styles.modalScrollView}>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                  <Title style={styles.modalTitle}>Maç Sonucu Gir</Title>
                  <TouchableOpacity onPress={() => setShowMatchResultModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#757575" />
                  </TouchableOpacity>
                </View>

                {currentUser && acceptedChallenge && (
                  <>
                    <Text style={styles.modalSubtitle}>
                      Maç sonucunu ve set skorlarını girin
                    </Text>

                    {/* Kazanan Seçimi */}
                    <Text style={styles.sectionLabel}>Kazanan Oyuncu</Text>
                    <View style={[
                      styles.winnerSelectionContainer,
                      scoreMismatch && styles.errorBorder
                    ]}>
                      {/* Kullanıcı seçeneği */}
                      <TouchableOpacity
                        style={[
                          styles.winnerOption,
                          selectedWinner === currentUser.id && styles.winnerOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedWinner(currentUser.id);
                          setScoreMismatch(false);
                        }}
                      >
                        <View style={styles.radioButton}>
                          {selectedWinner === currentUser.id && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Avatar.Text 
                          size={36} 
                          label={currentUser.name.charAt(0)} 
                          style={styles.winnerAvatar}
                        />
                        <View style={styles.winnerInfo}>
                          <Text style={styles.winnerName}>{currentUser.name}</Text>
                          <Text style={styles.winnerLabel}>(Siz)</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Rakip seçeneği */}
                      {(() => {
                        const opponent = acceptedChallenge.challenger.id === currentUser.id 
                          ? acceptedChallenge.challenged 
                          : acceptedChallenge.challenger;
                        return (
                          <TouchableOpacity
                            style={[
                              styles.winnerOption,
                              selectedWinner === opponent.id && styles.winnerOptionSelected
                            ]}
                            onPress={() => {
                              setSelectedWinner(opponent.id);
                              setScoreMismatch(false);
                            }}
                          >
                            <View style={styles.radioButton}>
                              {selectedWinner === opponent.id && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Avatar.Text 
                              size={36} 
                              label={opponent.name.charAt(0)} 
                              style={styles.winnerAvatar}
                            />
                            <View style={styles.winnerInfo}>
                              <Text style={styles.winnerName}>{opponent.name}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>

                    {/* Kort Seçimi */}
                    <View style={styles.courtSelectionSection}>
                      <Text style={styles.sectionLabel}>Kort Seçin *</Text>
                      <Menu
                        visible={courtMenuVisible}
                        onDismiss={() => setCourtMenuVisible(false)}
                        anchorPosition="bottom"
                        contentStyle={styles.menuContent}
                        anchor={
                          <TouchableOpacity
                            style={styles.courtDropdownButton}
                            onPress={() => setCourtMenuVisible(true)}
                          >
                            <View style={styles.courtDropdownContent}>
                              <MaterialCommunityIcons 
                                name="tennis" 
                                size={20} 
                                color="#2E7D32" 
                              />
                              <Text style={styles.courtDropdownText}>
                                {selectedCourt 
                                  ? courts.find(c => c.id === selectedCourt)?.name 
                                  : 'Kort seçin'}
                              </Text>
                            </View>
                            <MaterialCommunityIcons 
                              name="chevron-down" 
                              size={24} 
                              color="#757575" 
                            />
                          </TouchableOpacity>
                        }
                      >
                        {courts.map((court) => (
                          <Menu.Item
                            key={court.id}
                            onPress={() => {
                              setSelectedCourt(court.id);
                              setCourtMenuVisible(false);
                            }}
                            title={court.name}
                            leadingIcon="tennis"
                            style={selectedCourt === court.id && styles.selectedMenuItem}
                          />
                        ))}
                      </Menu>
                    </View>

                    {/* Set Skorları */}
                    <View style={styles.scoresSection}>
                      <View style={styles.scoresSectionHeader}>
                        <Text style={styles.sectionLabel}>Set Skorları (Minimum 2 Set Zorunlu)</Text>
                        {matchSets.length < 5 && (
                          <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
                            <MaterialCommunityIcons name="plus-circle" size={24} color="#2E7D32" />
                            <Text style={styles.addSetText}>Set Ekle</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Uyarı mesajı */}
                      {scoreError && (
                        <View style={styles.scoreErrorContainer}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color="#DC3545" />
                          <Text style={styles.scoreErrorText}>
                            En az 2 set skoru girilmesi zorunludur
                          </Text>
                        </View>
                      )}

                      {/* Skorlar başlığı */}
                      <View style={styles.scoresHeader}>
                        <Text style={styles.scorePlayerLabel}>{currentUser.name}</Text>
                        <Text style={styles.scoreDivider}>vs</Text>
                        <Text style={styles.scorePlayerLabel}>
                          {acceptedChallenge.challenger.id === currentUser.id 
                            ? acceptedChallenge.challenged.name 
                            : acceptedChallenge.challenger.name}
                        </Text>
                      </View>

                      {/* Set input'ları */}
                      {matchSets.map((set, index) => {
                        const isSetFilled = set.userScore && set.opponentScore;
                        const shouldShowError = (scoreError && !isSetFilled && index < 2) || scoreMismatch;
                        
                        return (
                          <View key={index} style={styles.setRow}>
                            <Text style={[styles.setLabel, shouldShowError && styles.setLabelError]}>
                              Set {index + 1}{index < 2 ? ' *' : ''}:
                            </Text>
                            <TextInput
                              mode="outlined"
                              value={set.userScore}
                              onChangeText={(value) => {
                                updateSetScore(index, 'userScore', value);
                                setScoreMismatch(false);
                              }}
                              keyboardType="numeric"
                              maxLength={2}
                              style={styles.scoreInput}
                              outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                              activeOutlineColor={shouldShowError ? "#DC3545" : "#2E7D32"}
                              error={shouldShowError}
                              dense
                            />
                            <Text style={styles.scoreSeparator}>-</Text>
                            <TextInput
                              mode="outlined"
                              value={set.opponentScore}
                              onChangeText={(value) => {
                                updateSetScore(index, 'opponentScore', value);
                                setScoreMismatch(false);
                              }}
                              keyboardType="numeric"
                              maxLength={2}
                              style={styles.scoreInput}
                              outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                              activeOutlineColor={shouldShowError ? "#DC3545" : "#2E7D32"}
                              error={shouldShowError}
                              dense
                            />
                            {matchSets.length > 1 && (
                              <TouchableOpacity onPress={() => removeSet(index)} style={styles.removeSetButton}>
                                <MaterialCommunityIcons name="close-circle" size={24} color="#DC3545" />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}

                      {/* Skor Uyuşmazlığı Uyarısı */}
                      {scoreMismatch && (
                        <View style={styles.scoreErrorContainer}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color="#DC3545" />
                          <Text style={styles.scoreErrorText}>
                            Kazanan oyuncu ve yazılan skorlar uyuşmuyor
                          </Text>
                        </View>
                      )}
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
                        Kaydet
                      </Button>
                    </View>
                  </>
                )}
              </Card.Content>
            </ScrollView>
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
    overflow: 'hidden',
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactBackButton: {
    width: 40,
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  compactRefreshButton: {
    width: 40,
    alignItems: 'flex-end',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    margin: 0,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  paginationButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    borderColor: '#2E7D32',
  },
  pageIndicator: {
    paddingHorizontal: 15,
  },
  pageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
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
  currentUserChip: {
    marginTop: 5,
    backgroundColor: '#E8F5E9',
    height: 24,
  },
  currentUserChipText: {
    fontSize: 10,
    color: '#2E7D32',
    marginVertical: 0,
    fontWeight: 'bold',
  },
  pendingChallengeSentChip: {
    marginTop: 5,
    backgroundColor: '#FFF3E0',
    height: 24,
  },
  pendingChallengeSentChipText: {
    fontSize: 10,
    color: '#F57C00',
    marginVertical: 0,
    fontWeight: '600',
  },
  pendingChallengeReceivedChip: {
    marginTop: 5,
    backgroundColor: '#E3F2FD',
    height: 24,
  },
  pendingChallengeReceivedChipText: {
    fontSize: 10,
    color: '#1976D2',
    marginVertical: 0,
    fontWeight: '600',
  },
  playerActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  challengeResponseButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  acceptChallengeButton: {
    borderRadius: 8,
    minWidth: 100,
  },
  rejectChallengeButton: {
    borderRadius: 8,
    borderColor: '#DC3545',
    minWidth: 100,
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
    marginBottom: 10,
    borderRadius: 12,
  },
  disabledQuickActionButton: {
    opacity: 0.6,
  },
  matchResultButtonContainer: {
    marginBottom: 20,
  },
  matchInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 5,
    paddingHorizontal: 12,
  },
  matchInfoText: {
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  noMatchInfoText: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
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
    padding: 10,
    borderRadius: 12,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: '#DC3545',
    backgroundColor: '#FFF5F5',
  },
  courtSelectionSection: {
    marginVertical: 20,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  courtDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtDropdownText: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '500',
  },
  selectedMenuItem: {
    backgroundColor: '#E8F5E9',
  },
  menuContent: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 12,
    marginTop: 8,
  },
  scoresSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  scoresSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSetText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 4,
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  scorePlayerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
    textAlign: 'center',
  },
  scoreDivider: {
    fontSize: 12,
    color: '#6C757D',
    paddingHorizontal: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
    width: 50,
  },
  setLabelError: {
    color: '#DC3545',
  },
  scoreInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C757D',
    paddingHorizontal: 8,
  },
  removeSetButton: {
    marginLeft: 8,
    padding: 4,
  },
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  scoreErrorText: {
    fontSize: 13,
    color: '#DC3545',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
});

export default LigSiralamaScreen;
