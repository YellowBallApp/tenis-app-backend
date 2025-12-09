import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Text,
  Avatar,
  Chip,
  Portal,
  Modal,
  TextInput,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { leagueStandingsService, authService, courtService, matchChallengeService } from '../services/api';
import { ChallengeStatus } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LigSiralamaScreen = ({ route, navigation }: any) => {
  const { lig } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
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
  const [selectedCourt, setSelectedCourt] = useState<number | undefined>(undefined);
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

  // Route params'tan modal açma işlemi (sadece route params değiştiğinde)
  useEffect(() => {
    if (route.params?.openMatchResultModal && route.params?.challengeId) {
      const challengeId = route.params.challengeId;
      // Challenge'ı yükle ve modalı aç
      const loadChallengeAndOpenModal = async () => {
        try {
          const challenge = await matchChallengeService.getChallengeById(challengeId);
          if (challenge) {
            setAcceptedChallenge(challenge);
            setTimeout(() => {
              openMatchResultModal();
            }, 500);
          }
        } catch (error) {
          console.error('Challenge yüklenirken hata:', error);
        }
      };
      loadChallengeAndOpenModal();
    }
  }, [route.params?.openMatchResultModal, route.params?.challengeId]);

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
    setSelectedCourt(undefined);
    setMatchSets([
      { userScore: '', opponentScore: '' },
      { userScore: '', opponentScore: '' },
      { userScore: '', opponentScore: '' },
    ]);
    setScoreError(false);
    setShowMatchResultModal(true);
  };

  const openReservationScreen = () => {
    if (!acceptedChallenge) {
      Alert.alert('Uyarı', 'Kabul edilmiş bir meydan okuma bulunmuyor');
      return;
    }
    
    // Maçı kabul eden kullanıcıyı belirle
    const opponentId = acceptedChallenge.challenger.id === currentUser.id
      ? acceptedChallenge.challenged.id
      : acceptedChallenge.challenger.id;
    
    const opponentName = acceptedChallenge.challenger.id === currentUser.id
      ? acceptedChallenge.challenged.name
      : acceptedChallenge.challenger.name;

    navigation.navigate('Reservation', {
      opponentId,
      opponentName,
      matchChallengeId: acceptedChallenge.id,
    });
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

    // Kort seçimi rezervasyondan alınır, kontrol etmeye gerek yok
    if (!acceptedChallenge?.reservation?.court?.id) {
      Alert.alert(t('common.error') || 'Hata', 'Rezervasyon kort bilgisi bulunamadı');
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
    
    const handleAvatarPress = () => {
      // Sadece profil resmine tıklandığında profil sayfasına git
      if (!isCurrentUser) {
        // Nested navigation kullanarak Users stack'indeki MemberDetail sayfasına git
        (navigation as any).navigate('Users', {
          screen: 'MemberDetail',
          params: { memberId: player.user.id }
        });
      }
    };

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
            
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleAvatarPress}
              disabled={isCurrentUser}
            >
              <Avatar.Text 
                size={45} 
                label={player.user.name.charAt(0)} 
                style={styles.playerAvatar}
              />
            </TouchableOpacity>
              
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.user.name}
                  {isCurrentUser && ' (Siz)'}
                </Text>
                <Text style={styles.playerLevel}>{player.user.name} - {player.position}. sırada</Text>
                
              {/* Pending challenge durumları */}
              {hasPendingChallengeToThisPlayer && (
                <View style={styles.pendingChallengeBadge}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={12} color="#F59E0B" />
                  <Text style={styles.pendingChallengeBadgeText}>
                    Maç İsteği Bekleniyor
                  </Text>
                </View>
              )}
              {hasPendingChallengeFromThisPlayer && (
                <View style={styles.receivedChallengeBadge}>
                  <MaterialCommunityIcons name="email-alert" size={12} color="#54CE8F" />
                  <Text style={styles.receivedChallengeBadgeText}>
                    Sana Maç İsteği Gönderdi
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.playerActions}>
              {isCurrentUser ? (
                // Kullanıcının kendi kartı - buton gösterme
                <View style={styles.currentUserIndicator}>
                  <MaterialCommunityIcons name="account-check" size={16} color="#54CE8F" />
                  <Text style={styles.currentUserIndicatorText}>Sizsiniz</Text>
                </View>
              ) : hasPendingChallengeFromThisPlayer ? (
                // Bu oyuncu bana maç isteği göndermiş - Kabul/Reddet butonları
                <View style={styles.challengeResponseButtons}>
                  <TouchableOpacity
                    onPress={() => handleAcceptChallengeInRanking(player)}
                    style={styles.acceptChallengeButton}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptChallengeButtonText}>Kabul Et</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRejectChallengeInRanking(player)}
                    style={styles.rejectChallengeButton}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                    <Text style={styles.rejectChallengeButtonText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              ) : canChallenge ? (
                <TouchableOpacity
                  onPress={() => openChallengeModal(player)}
                  style={styles.challengeButton}
                >
                  <MaterialCommunityIcons name="sword-cross" size={18} color="#FFFFFF" />
                  <Text style={styles.challengeButtonText}>Meydan Oku</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledChallengeButton}>
                  <MaterialCommunityIcons name="lock" size={18} color="#9CA3AF" />
                  <Text style={styles.disabledChallengeButtonText}>Kilitli</Text>
                </View>
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
      <StatusBar style="light" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('DefiLig' as never);
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="trophy" size={28} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{lig.name}</Text>
        </View>
        <TouchableOpacity 
          onPress={loadRankings}
          style={styles.refreshButton}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Current User Card */}
        <View style={styles.currentUserSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={20} color="#54CE8F" />
            <Text style={styles.sectionTitle}>Senin Sıran</Text>
          </View>
          <Card style={styles.currentUserCard}>
            <Card.Content style={styles.currentUserCardContent}>
              <View style={styles.currentUserHeader}>
                <Avatar.Text 
                  size={64} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.currentUserAvatar}
                />
                <View style={styles.currentUserInfo}>
                  <Text style={styles.currentUserName}>{currentUser.name}</Text>
                  <Text style={styles.currentUserEmail}>{currentUser.email}</Text>
                  {userPendingChallenges.length > 0 && (
                    <View style={styles.pendingBadge}>
                      <MaterialCommunityIcons name="clock-alert-outline" size={14} color="#F59E0B" />
                      <Text style={styles.pendingBadgeText}>
                        Bekleyen Challenge ({userPendingChallenges.length})
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.currentUserPosition}>
                  <MaterialCommunityIcons 
                    name={getPositionIcon(currentUser.position) as any} 
                    size={24} 
                    color="#54CE8F" 
                  />
                  <Text style={styles.currentUserPositionText}>
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
            <MaterialCommunityIcons name="account-group" size={20} color="#54CE8F" />
            <Text style={styles.sectionTitle}>Rakip Oyuncular</Text>
            <Text style={styles.paginationInfo}>
              {currentPage} / {getTotalPages()}
            </Text>
          </View>
          {getCurrentPagePlayers().map(renderPlayerCard)}
          
          {/* Pagination Controls */}
          {getTotalPages() > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={20} 
                  color={currentPage === 1 ? '#9CA3AF' : '#54CE8F'} 
                />
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Önceki
                </Text>
              </TouchableOpacity>
              
              <View style={styles.pageIndicator}>
                <Text style={styles.pageText}>
                  {currentPage} / {getTotalPages()}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={goToNextPage}
                disabled={currentPage === getTotalPages()}
                style={[styles.paginationButton, currentPage === getTotalPages() && styles.paginationButtonDisabled]}
              >
                <Text style={[styles.paginationButtonText, currentPage === getTotalPages() && styles.paginationButtonTextDisabled]}>
                  Sonraki
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={currentPage === getTotalPages() ? '#9CA3AF' : '#54CE8F'} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          
          {/* Randevu Oluştur Butonu */}
          <View style={styles.matchResultButtonContainer}>
            <TouchableOpacity
              style={[
                styles.quickActionButton, 
                !acceptedChallenge && styles.quickActionButtonDisabled
              ]}
              onPress={openReservationScreen}
              disabled={!!(!acceptedChallenge)}
            >
              <MaterialCommunityIcons name="calendar-plus" size={20} color={acceptedChallenge ? "#FFFFFF" : "#9CA3AF"} />
              <Text style={[
                styles.quickActionButtonText,
                !acceptedChallenge && styles.quickActionButtonTextDisabled
              ]}>Randevu Oluştur</Text>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('MatchHistory', { leagueId: lig.id, leagueName: lig.name })}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
            <Text style={styles.quickActionButtonText}>Maç Geçmişi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Challenge Modal */}
      <Portal>
        <Modal
        dismissable={false}
          visible={!!showChallengeModal}
          onDismiss={() => setShowChallengeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
            >
              <Card.Content style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={styles.modalIconContainer}>
                        <MaterialCommunityIcons name="sword-cross" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.modalTitle}>Meydan Okuma Gönder</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowChallengeModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <Divider style={styles.modalDivider} />
              
              {selectedPlayer && (
                <>
                  <Text style={styles.modalSubtitle}>
                    {selectedPlayer.user.name} adlı oyuncuya meydan okuma göndermek istediğinizden emin misiniz?
                  </Text>
                  
                  {/* Opponent Card */}
                  <View style={styles.opponentCard}>
                    <View style={styles.opponentCardContent}>
                      <View style={styles.opponentAvatarContainer}>
                        <Avatar.Text 
                          size={64} 
                          label={selectedPlayer.user.name.charAt(0).toUpperCase()} 
                          style={styles.opponentAvatar}
                          labelStyle={styles.opponentAvatarLabel}
                        />
                        <View style={styles.opponentRankBadge}>
                          <MaterialCommunityIcons name="trophy" size={16} color="#FFFFFF" />
                          <Text style={styles.opponentRankText}>#{selectedPlayer.position}</Text>
                        </View>
                      </View>
                      <View style={styles.opponentDetails}>
                        <Text style={styles.opponentName}>{selectedPlayer.user.name}</Text>
                        <View style={styles.opponentInfoRow}>
                          <MaterialCommunityIcons name="trophy-outline" size={16} color="#666666" />
                          <Text style={styles.opponentLevel}>{selectedPlayer.position}. Sırada</Text>
                        </View>
                        <View style={styles.opponentInfoRow}>
                          <MaterialCommunityIcons name="chart-line" size={16} color="#2E7D32" />
                          <Text style={styles.opponentPoints}>{selectedPlayer.points || 0} Puan</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.messageSection}>
                    <View style={styles.sectionHeaderRow}>
                      <MaterialCommunityIcons name="message-text-outline" size={18} color="#54CE8F" />
                      <Text style={styles.messageSectionLabelText}>
                        Meydan Okuma Mesajı
                        <Text style={styles.requiredStar}> *</Text>
                      </Text>
                    </View>
                    <TextInput
                      mode="outlined"
                      placeholder="Rakibinize göndermek istediğiniz mesajı yazın..."
                      value={challengeMessage}
                      onChangeText={(text) => {
                        setChallengeMessage(text);
                        if (messageError && text.trim()) {
                          setMessageError(false);
                        }
                      }}
                      multiline
                      numberOfLines={4}
                      style={styles.messageInput}
                      contentStyle={styles.messageInputContent}
                      outlineColor={messageError ? "#D32F2F" : "#E0E0E0"}
                      activeOutlineColor={messageError ? "#D32F2F" : "#2E7D32"}
                      error={messageError}
                      placeholderTextColor="#9E9E9E"
                    />
                    {messageError && (
                      <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color="#D32F2F" />
                        <Text style={styles.errorText}>Bu alan gereklidir</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => setShowChallengeModal(false)}
                      style={styles.modalCancelButton}
                    >
                      <Text style={styles.modalCancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={sendChallenge}
                      style={styles.modalSendButton}
                    >
                      <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.modalSendButtonText}>Gönder</Text>
                    </TouchableOpacity>
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
        dismissable={false}
          visible={!!showMatchResultModal}
          onDismiss={() => setShowMatchResultModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={true} style={styles.modalScrollView}>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                  <Text style={styles.modalTitle}>Maç Sonucu Gir</Text>
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
                      <View style={styles.courtSectionHeader}>
                        <MaterialCommunityIcons name="tennis" size={20} color="#54CE8F" />
                        <Text style={styles.sectionLabel}>Kort</Text>
                      </View>
                      <View style={[styles.courtDropdownButton, styles.courtDropdownButtonDisabled]}>
                        <View style={styles.courtDropdownContent}>
                          <MaterialCommunityIcons 
                            name="tennis" 
                            size={20} 
                            color="#9CA3AF" 
                          />
                          <Text style={[styles.courtDropdownText, styles.courtDropdownTextDisabled]}>
                            {selectedCourt 
                              ? courts.find(c => c.id === selectedCourt)?.name 
                              : acceptedChallenge?.reservation?.court?.name || 'Kort'}
                          </Text>
                        </View>
                        <MaterialCommunityIcons 
                          name="lock" 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </View>

                    {/* Set Skorları */}
                    <View style={styles.scoresSection}>
                      <View style={styles.scoresSectionHeader}>
                        <View style={styles.sectionHeaderRow}>
                          <MaterialCommunityIcons name="scoreboard" size={18} color="#54CE8F" />
                          <Text style={styles.sectionLabel}>Set Skorları (Minimum 2 Set Zorunlu)</Text>
                        </View>
                        {matchSets.length < 5 && (
                          <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
                            <MaterialCommunityIcons name="plus-circle" size={20} color="#54CE8F" />
                            <Text style={styles.addSetText}>Set Ekle</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Uyarı mesajı */}
                      {scoreError && (
                        <View style={styles.scoreErrorContainer}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
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
                              outlineColor={shouldShowError ? "#EF4444" : "#E5E7EB"}
                              activeOutlineColor={shouldShowError ? "#EF4444" : "#54CE8F"}
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
                              outlineColor={shouldShowError ? "#EF4444" : "#E5E7EB"}
                              activeOutlineColor={shouldShowError ? "#EF4444" : "#54CE8F"}
                              error={shouldShowError}
                              dense
                            />
                            {matchSets.length > 1 && (
                              <TouchableOpacity onPress={() => removeSet(index)} style={styles.removeSetButton}>
                                <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}

                      {/* Skor Uyuşmazlığı Uyarısı */}
                      {scoreMismatch && (
                        <View style={styles.scoreErrorContainer}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                          <Text style={styles.scoreErrorText}>
                            Kazanan oyuncu ve yazılan skorlar uyuşmuyor
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        onPress={() => setShowMatchResultModal(false)}
                        style={styles.modalCancelButton}
                      >
                        <Text style={styles.modalCancelButtonText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={submitMatchResult}
                        style={styles.modalSaveButton}
                      >
                        <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                        <Text style={styles.modalSaveButtonText}>Kaydet</Text>
                      </TouchableOpacity>
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
        visible={!!snackbarVisible}
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
    backgroundColor: '#FAFCFB',
  },
  header: {
    backgroundColor: '#B4AEBD',
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  currentUserSection: {
    padding: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  currentUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  currentUserCardContent: {
    padding: 24,
  },
  currentUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserAvatar: {
    backgroundColor: '#54CE8F',
    marginRight: 16,
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  currentUserEmail: {
    fontSize: 14,
    color: '#717182',
    marginBottom: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  currentUserPosition: {
    alignItems: 'center',
  },
  currentUserPositionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#54CE8F',
    marginTop: 4,
  },
  playersSection: {
    padding: 24,
    paddingTop: 0,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#54CE8F',
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicator: {
    paddingHorizontal: 16,
  },
  pageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerCardContent: {
    padding: 20,
  },
  currentUserCardHighlight: {
    borderColor: '#54CE8F',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionContainer: {
    alignItems: 'center',
    minWidth: 40,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54CE8F',
    marginTop: 4,
  },
  playerAvatar: {
    backgroundColor: '#B4AEBD',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  currentUserBadge: {
    backgroundColor: '#54CE8F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentUserBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerLevel: {
    fontSize: 13,
    color: '#717182',
    marginBottom: 8,
  },
  pendingChallengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  pendingChallengeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F59E0B',
    flexShrink: 1,
  },
  receivedChallengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  receivedChallengeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#54CE8F',
    flexShrink: 1,
  },
  playerActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  currentUserIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  currentUserIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54CE8F',
  },
  challengeResponseButtons: {
    flexDirection: 'column',
    gap: 8,
    minWidth: 110,
  },
  acceptChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54CE8F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  acceptChallengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  rejectChallengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54CE8F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    minWidth: 110,
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    minWidth: 110,
  },
  disabledChallengeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  quickActionsSection: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54CE8F',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickActionButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  quickActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionButtonTextDisabled: {
    color: '#9CA3AF',
  },
  matchResultButtonContainer: {
    marginBottom: 20,
  },
  matchInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  matchInfoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  matchInfoText: {
    fontSize: 13,
    color: '#030213',
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  noMatchInfoText: {
    fontSize: 13,
    color: '#717182',
    flex: 1,
    lineHeight: 18,
  },
  modalContainer: {
    margin: 16,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: '85%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B4AEBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#717182',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalDivider: {
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
    height: 1,
  },
  reservationInfoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  reservationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reservationInfoText: {
    fontSize: 14,
    color: '#030213',
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  opponentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  opponentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  opponentAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  opponentAvatar: {
    backgroundColor: '#B4AEBD',
  },
  opponentAvatarLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  opponentRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54CE8F',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 3,
  },
  opponentRankText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  opponentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  opponentLevel: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  opponentPoints: {
    fontSize: 14,
    color: '#54CE8F',
    fontWeight: '600',
  },
  messageSection: {
    marginBottom: 24,
  },
  messageSectionLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#030213',
  },
  requiredStar: {
    color: '#EF4444',
  },
  messageInput: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  messageInputContent: {
    minHeight: 100,
    paddingVertical: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  modalSendButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#54CE8F',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalSendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#54CE8F',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  snackbar: {
    backgroundColor: '#54CE8F',
    marginBottom: 20,
  },
  winnerSelectionSection: {
    marginBottom: 24,
  },
  winnerSelectionContainer: {
    gap: 12,
    marginTop: 12,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  courtSelectionSection: {
    marginBottom: 24,
  },
  courtSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courtDropdownButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  courtDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courtDropdownText: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '500',
  },
  courtDropdownTextDisabled: {
    color: '#9CA3AF',
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  winnerOptionSelected: {
    borderColor: '#54CE8F',
    backgroundColor: '#F0FDF4',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#54CE8F',
  },
  winnerAvatar: {
    backgroundColor: '#54CE8F',
    marginRight: 16,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 13,
    color: '#717182',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#030213',
  },
  scoresSection: {
    marginBottom: 24,
  },
  scoresSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  addSetText: {
    fontSize: 13,
    color: '#54CE8F',
    fontWeight: '600',
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginTop: 8,
  },
  scorePlayerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
    flex: 1,
    textAlign: 'center',
  },
  scoreDivider: {
    fontSize: 14,
    fontWeight: '600',
    color: '#717182',
    paddingHorizontal: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
    minWidth: 60,
  },
  setLabelError: {
    color: '#EF4444',
  },
  scoreInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#717182',
    paddingHorizontal: 8,
  },
  removeSetButton: {
    marginLeft: 4,
    padding: 4,
  },
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  scoreErrorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default LigSiralamaScreen;
