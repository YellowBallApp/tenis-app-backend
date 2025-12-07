import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text,
  Portal,
  Modal,
  Button,
  Title,
  Searchbar,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { courtService, reservationService, weatherService, userService, authService, matchChallengeService, leagueStandingsService } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CourtDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const { courtId } = route.params as { courtId: number };
  
  const [court, setCourt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [allTimes] = useState<string[]>([
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [blockedHours, setBlockedHours] = useState<Array<{hour: number, reason: string | null}>>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [weatherCache, setWeatherCache] = useState<{[key: string]: {isRainy: boolean, isSnowy: boolean}}>({});
  const [showWeatherWarningModal, setShowWeatherWarningModal] = useState(false);
  const [pendingTimeSelection, setPendingTimeSelection] = useState<string | null>(null);
  
  // Game Type and Player Selection States
  const [playerType, setPlayerType] = useState<'single' | 'double'>('single');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [selectedOpponents, setSelectedOpponents] = useState<any[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'partner' | 'opponent' | 'opponents'>('opponent');
  const [selectedOpponentIndex, setSelectedOpponentIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCourtData();
    loadCurrentUser();
  }, [courtId]);

  useEffect(() => {
    if (court && selectedDate) {
      loadReservationsForDate();
    }
  }, [court, selectedDate]);

  // Hava durumu yükle (availableTimes ve allTimes değiştiğinde - tüm saatler için)
  useEffect(() => {
    if (court && selectedDate && allTimes.length > 0 && !court.indoors) {
      loadWeatherForTimes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTimes, allTimes]);

  const loadCourtData = async () => {
    try {
      setLoading(true);
      const courtData = await courtService.getCourtById(courtId);
      setCourt(courtData);
      
      // Bugünün tarihini varsayılan olarak ayarla
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    } catch (error) {
      console.error('Kort detayları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservationsForDate = async () => {
    if (!selectedDate) return;
    
    try {
      const [reservationsData, blockedHoursData] = await Promise.all([
        reservationService.getReservationsByDate(selectedDate),
        reservationService.getBlockedHours(courtId, selectedDate),
      ]);
      
      // Bu korta ait rezervasyonları filtrele
      const courtReservations = reservationsData.filter(
        (res: any) => res.court.id === courtId
      );
      
      setReservations(courtReservations);
      setBlockedHours(blockedHoursData || []);
      
      // Müsait saatleri hesapla
      calculateAvailableTimes(courtReservations, blockedHoursData || []);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    }
  };

  const loadWeatherForTimes = async () => {
    if (!selectedDate || !court) {
      setWeatherCache({});
      return;
    }

    // Sadece açık kortlar için hava durumu kontrolü
    if (court.indoors) {
      setWeatherCache({});
      return;
    }

    try {
      const cache: {[key: string]: {isRainy: boolean, isSnowy: boolean}} = {};
      
      // Sadece müsait saatler için hava durumu yükle (rezerve edilmiş saatler için gerekli değil)
      const times = availableTimes;
      
      if (times.length === 0) {
        setWeatherCache({});
        return;
      }

      // Paralel olarak tüm saatler için hava durumu bilgisini çek
      const weatherPromises = times.map(async (time) => {
        try {
          const weather = await weatherService.getWeatherForDateTime(selectedDate, time);
          if (weather) {
            return { time, weather };
          }
        } catch (error: any) {
          // 404 hatası normaldir (cache'de veri yoksa), sessizce geç
          if (error?.response?.status !== 404 && __DEV__) {
            console.log(`❌ Hava durumu bilgisi alınamadı: ${time}`, error?.response?.status || error?.message);
          }
        }
        return null;
      });

      const weatherResults = await Promise.all(weatherPromises);
      
      weatherResults.forEach(result => {
        if (result && result.weather) {
          cache[result.time] = {
            isRainy: !!(result.weather.isRainy),
            isSnowy: !!(result.weather.isSnowy),
          };
        }
      });
      
      setWeatherCache(cache);
    } catch (error) {
      console.error('Hava durumu yüklenirken hata:', error);
      setWeatherCache({});
    }
  };

  const calculateAvailableTimes = (courtReservations: any[], blockedHours: Array<{hour: number, reason: string | null}>) => {
    const times = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
      '20:00', '21:00', '22:00', '23:00'
    ];

    const reservedTimes = courtReservations.map((res: any) => {
      const resTime = new Date(res.startTime);
      const hours = resTime.getHours();
      const minutes = resTime.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    const blockedHourNumbers = blockedHours.map(bh => bh.hour);

    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDateObj);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const isToday = selectedDateOnly.getTime() === today.getTime();

    const available = times.filter(time => {
      // Rezerve edilmiş mi kontrol et
      if (reservedTimes.includes(time)) return false;

      // Bloke edilmiş mi kontrol et
      const hour = parseInt(time.split(':')[0]);
      if (blockedHourNumbers.includes(hour)) return false;

      // Bugün ise geçmiş saatleri atla
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeDate = new Date(selectedDateObj);
        timeDate.setHours(hours, minutes, 0, 0);
        if (timeDate < now) return false;
      }

      return true;
    });

    setAvailableTimes(available);
  };

  const getCourtDisplayInfo = (court: any) => {
    const surfaceMap: any = {
      grass: { surface: t('reservation.grass'), gradient: ['#4CAF50', '#2E7D32'] },
      clay: { surface: t('reservation.clay'), gradient: ['#FF9800', '#F57C00'] },
      hard: { surface: t('reservation.hard'), gradient: ['#2196F3', '#1976D2'] },
    };

    const surfaceInfo = surfaceMap[court.groundType] || surfaceMap.hard;
    const isIndoor = !!(court.indoors);

    return {
      type: isIndoor ? t('reservation.indoor') : t('reservation.outdoor'),
      surface: surfaceInfo.surface,
    };
  };

  const getDatesForSelection = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = language === 'tr' 
        ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
      });
    }
    
    return dates;
  };

  const isTimeReserved = (time: string) => {
    return reservations.some((res: any) => {
      const resTime = new Date(res.startTime);
      const hours = resTime.getHours();
      const minutes = resTime.getMinutes();
      const resTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return resTimeString === time;
    });
  };

  const isTimeBlocked = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return blockedHours.some(bh => bh.hour === hour);
  };

  const confirmTimeSelection = (time: string) => {
    setSelectedTime(time);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  // Load current user
  const loadCurrentUser = async () => {
    try {
      const profile = await authService.getProfile();
      setCurrentUserId(profile.id);
    } catch (error) {
      console.error('Kullanıcı profili yüklenirken hata:', error);
    }
  };

  // Load users for selection
  const loadUsers = async () => {
    try {
      const usersList = await userService.getAllUsers();
      
      // Filter out current user, coaches, and admins
      const filteredUsers = usersList.filter((user: any) => {
        const userType = user.userType?.toLowerCase();
        return user.id !== currentUserId && 
               userType !== 'coach' && 
               userType !== 'admin';
      }).map((user: any) => ({
        id: user.id,
        name: user.name + (user.surname ? ` ${user.surname}` : ''),
        email: user.email,
        currentRank: user.currentRank || 0,
        title: user.title || t('reservation.intermediate'),
      }));
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: any) => {
    if (selectorMode === 'partner') {
      setSelectedPartner(user);
      setShowUserSelector(false);
      setSearchQuery('');
    } else if (selectorMode === 'opponent') {
      setSelectedPartner(user);
      setShowUserSelector(false);
      setSearchQuery('');
    } else if (selectorMode === 'opponents') {
      if (selectedOpponentIndex !== null) {
        // Belirli bir pozisyondaki rakibi değiştir
        const newOpponents = [...selectedOpponents];
        newOpponents[selectedOpponentIndex] = user;
        setSelectedOpponents(newOpponents.filter(opp => opp !== undefined && opp !== null));
        setShowUserSelector(false);
        setSearchQuery('');
        setSelectedOpponentIndex(null);
      } else {
        // Genel rakip seçimi (eski mantık)
        const isAlreadySelected = selectedOpponents.some(opp => opp.id === user.id);
        if (isAlreadySelected) {
          setSelectedOpponents(selectedOpponents.filter(opp => opp.id !== user.id));
        } else {
          if (selectedOpponents.length < 2) {
            const newOpponents = [...selectedOpponents, user];
            setSelectedOpponents(newOpponents);
            // 2 rakip seçildiyse modal'ı kapat
            if (newOpponents.length === 2) {
              setShowUserSelector(false);
              setSearchQuery('');
            }
          }
        }
      }
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create challenges for opponents after reservation
  const createChallengesForOpponents = async (reservationStartTime: Date) => {
    if (!currentUserId) {
      console.log('⚠️ Kullanıcı ID bulunamadı, challenge oluşturulamıyor');
      return;
    }

    // Determine opponents based on game type
    const opponents: any[] = [];
    
    if (playerType === 'single' && selectedPartner) {
      // Singles mode: selectedPartner is the opponent
      opponents.push(selectedPartner);
    } else if (playerType === 'double' && selectedOpponents.length > 0) {
      // Doubles mode: selectedOpponents are the opponents (not the partner)
      opponents.push(...selectedOpponents);
    }

    if (opponents.length === 0) {
      console.log('ℹ️ Rakip seçilmedi, challenge oluşturulmayacak');
      return;
    }

    try {
      // Get current user's leagues
      const currentUserStandings = await leagueStandingsService.getStandingsByUserId(currentUserId);
      const currentUserLeagueIds = currentUserStandings
        .filter((standing: any) => standing.league && standing.league.id)
        .map((standing: any) => standing.league.id);

      if (currentUserLeagueIds.length === 0) {
        console.log('⚠️ Kullanıcının aktif ligi yok, challenge oluşturulamıyor');
        return;
      }

      // Create challenges for each opponent
      for (const opponent of opponents) {
        try {
          // Get opponent's leagues
          const opponentStandings = await leagueStandingsService.getStandingsByUserId(opponent.id);
          const opponentLeagueIds = opponentStandings
            .filter((standing: any) => standing.league && standing.league.id)
            .map((standing: any) => standing.league.id);

          // Find common league
          const commonLeagueId = currentUserLeagueIds.find((leagueId: number) =>
            opponentLeagueIds.includes(leagueId)
          );

          if (!commonLeagueId) {
            console.log(`⚠️ ${opponent.name} ile ortak lig bulunamadı, challenge oluşturulamıyor`);
            continue;
          }

          // Create challenge
          const challengeMessage = `${court?.name || 'Kort'} rezervasyonu için meydan okuma - ${selectedDate} ${selectedTime}`;
          
          await matchChallengeService.createChallenge({
            challengedId: opponent.id,
            leagueId: commonLeagueId,
            message: challengeMessage,
            proposedDate: reservationStartTime,
            expiresInDays: 7,
          });

          console.log(`✅ ${opponent.name} için challenge oluşturuldu (Lig ID: ${commonLeagueId})`);
        } catch (challengeError: any) {
          // Silently handle challenge creation errors (don't disturb the user)
          console.log(`⚠️ ${opponent.name} için challenge oluşturulamadı:`, 
            challengeError?.response?.data?.message || challengeError?.message || 'Bilinmeyen hata');
        }
      }
    } catch (error: any) {
      // Silently handle errors
      console.log('⚠️ Challenge oluşturma işlemi sırasında hata:', 
        error?.response?.data?.message || error?.message || 'Bilinmeyen hata');
    }
  };

  const handleReservation = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert(
        t('common.error'),
        'Lütfen tarih ve saat seçin',
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      setIsCreatingReservation(true);

      // Tarih ve saati birleştir
      const [hours, minutes] = selectedTime.split(':');
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Bitiş saatini hesapla (60 dakika sonra - 1 saatlik rezervasyon)
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(startDateTime.getMinutes() + 60);

      // Build participant IDs based on game type
      const participantIds: string[] = [];
      if (playerType === 'single' && selectedPartner) {
        participantIds.push(selectedPartner.id);
      } else if (playerType === 'double') {
        if (selectedPartner) {
          participantIds.push(selectedPartner.id);
        }
        selectedOpponents.forEach(opp => participantIds.push(opp.id));
      }

      const reservationData: {
        courtId: number;
        startTime: string;
        endTime: string;
        participantIds?: string[];
        notes?: string;
      } = {
        courtId: courtId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: participantIds.length > 0 ? participantIds : undefined,
        notes: `Standart seans: ${court.name}`,
      };

      console.log('📤 Rezervasyon verisi gönderiliyor:', reservationData);

      const reservation = await reservationService.createReservation(reservationData);

      console.log('✅ Rezervasyon başarılı:', reservation);

      // Create challenges for opponents (don't await - let it run in background)
      createChallengesForOpponents(startDateTime).catch(error => {
        console.log('⚠️ Challenge oluşturma işlemi arka planda hata verdi:', error);
      });

      Alert.alert(
        t('common.success'),
        t('reservation.success'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Rezervasyonlar listesine yönlendir (takvimi görmek için)
              navigation.getParent()?.navigate('ReservationsList');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Rezervasyon hatası:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });
      
      // Daha açıklayıcı hata mesajı
      let errorMessage = t('reservation.errorCreating');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }

      Alert.alert(
        t('common.error'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsCreatingReservation(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!court) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Kort bulunamadı</Text>
      </View>
    );
  }

  const displayCourt = getCourtDisplayInfo(court);
  const dates = getDatesForSelection();

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={selectedTime ? styles.scrollContentWithButton : styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('reservation.courtDetails')}</Text>
        </View>

        {/* Top Visual Section */}
        <View style={styles.topVisualSection}>
          {/* Chips */}
          <View style={styles.topChipsContainer}>
            <View style={styles.topChip}>
              <Text style={styles.topChipText}>{displayCourt.surface}</Text>
            </View>
            <View style={styles.topChip}>
              <Text style={styles.topChipText}>{displayCourt.type}</Text>
            </View>
          </View>

          {/* Tennis Ball Icon */}
          <View style={styles.tennisBallContainer}>
            <MaterialCommunityIcons 
              name="tennis-ball" 
              size={120} 
              color="#4CAF50" 
            />
          </View>
        </View>

        {/* Court Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.courtName}>{court.name}</Text>
          
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons 
              name="map-marker-outline" 
              size={16} 
              color="#666666" 
            />
            <Text style={styles.locationText}>
              {`${displayCourt.surface} • ${displayCourt.type}`}
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons 
              name="information-outline" 
              size={20} 
              color="#666666" 
            />
            <Text style={styles.infoText}>
              {t('reservation.standardSession')}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>{t('reservation.selectDate')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
            contentContainerStyle={styles.dateScrollContent}
          >
            {dates.map((dateItem) => (
              <TouchableOpacity
                key={dateItem.date}
                style={[
                  styles.dateCard,
                  selectedDate === dateItem.date && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(dateItem.date)}
              >
                <Text style={[
                  styles.dateDayName,
                  selectedDate === dateItem.date && styles.dateDayNameSelected
                ]}>
                  {dateItem.dayName}
                </Text>
                <Text style={[
                  styles.dateDayNumber,
                  selectedDate === dateItem.date && styles.dateDayNumberSelected
                ]}>
                  {dateItem.dayNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Game Type Selection */}
        <View style={styles.gameTypeSection}>
          <Text style={styles.sectionTitle}>{t('reservation.gameType')}</Text>
          <View style={styles.gameTypeCards}>
            <TouchableOpacity
              style={[
                styles.gameTypeCard,
                playerType === 'single' && styles.gameTypeCardSelected
              ]}
              onPress={() => {
                setPlayerType('single');
                setSelectedPartner(null);
                setSelectedOpponents([]);
              }}
            >
              <MaterialCommunityIcons 
                name="account" 
                size={32} 
                color={playerType === 'single' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.gameTypeTitle,
                playerType === 'single' && styles.gameTypeTitleSelected
              ]}>
                {t('reservation.singlesShort')}
              </Text>
              <Text style={[
                styles.gameTypeSubtitle,
                playerType === 'single' && styles.gameTypeSubtitleSelected
              ]}>
                1 vs 1
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.gameTypeCard,
                playerType === 'double' && styles.gameTypeCardSelected
              ]}
              onPress={() => {
                setPlayerType('double');
                setSelectedPartner(null);
                setSelectedOpponents([]);
              }}
            >
              <MaterialCommunityIcons 
                name="account-group" 
                size={32} 
                color={playerType === 'double' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.gameTypeTitle,
                playerType === 'double' && styles.gameTypeTitleSelected
              ]}>
                {t('reservation.doublesShort')}
              </Text>
              <Text style={[
                styles.gameTypeSubtitle,
                playerType === 'double' && styles.gameTypeSubtitleSelected
              ]}>
                2 vs 2
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player Selection Section */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>{t('reservation.players')}</Text>
          
          {/* Single Mode - Opponent Selection */}
          {playerType === 'single' && (
            <TouchableOpacity
              style={styles.playerSelectorCard}
              onPress={() => {
                setSelectorMode('opponent');
                setShowUserSelector(true);
                loadUsers();
              }}
            >
              {selectedPartner ? (
                <View style={styles.selectedPlayerCard}>
                  <Avatar.Text
                    size={48}
                    label={getInitials(selectedPartner.name)}
                    style={styles.playerAvatar}
                    labelStyle={styles.playerAvatarLabel}
                  />
                  <View style={styles.selectedPlayerInfo}>
                    <Text style={styles.selectedPlayerName}>{selectedPartner.name}</Text>
                    <Text style={styles.selectedPlayerDetails}>
                      {t('reservation.rank')} #{selectedPartner.currentRank || 0} • {selectedPartner.title || t('reservation.intermediate')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedPartner(null);
                    }}
                    style={styles.removePlayerButton}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.playerSelectorPlaceholder}>
                  <MaterialCommunityIcons name="account-plus" size={32} color="#BDBDBD" />
                  <Text style={styles.playerSelectorPlaceholderText}>
                    {t('reservation.selectOpponentPlayer')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Double Mode - Partner and Opponents Selection */}
          {playerType === 'double' && (
            <>
              {/* Partner Selection */}
              <Text style={styles.playerSubsectionTitle}>{t('reservation.yourPartner')}</Text>
              <TouchableOpacity
                style={styles.playerSelectorCard}
                onPress={() => {
                  setSelectorMode('partner');
                  setShowUserSelector(true);
                  loadUsers();
                }}
              >
                {selectedPartner ? (
                  <View style={styles.selectedPlayerCard}>
                    <Avatar.Text
                      size={48}
                      label={getInitials(selectedPartner.name)}
                      style={styles.playerAvatar}
                      labelStyle={styles.playerAvatarLabel}
                    />
                    <View style={styles.selectedPlayerInfo}>
                      <Text style={styles.selectedPlayerName}>{selectedPartner.name}</Text>
                      <Text style={styles.selectedPlayerDetails}>
                        {t('reservation.rank')} #{selectedPartner.currentRank || 0} • {selectedPartner.title || t('reservation.intermediate')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedPartner(null);
                      }}
                      style={styles.removePlayerButton}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.playerSelectorPlaceholder}>
                    <MaterialCommunityIcons name="account-plus" size={32} color="#BDBDBD" />
                    <Text style={styles.playerSelectorPlaceholderText}>
                      {t('reservation.selectPartner')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Opponents Selection */}
              <Text style={styles.playerSubsectionTitle}>{t('reservation.opponentTeamCount')}</Text>
              <View style={styles.opponentsContainer}>
                {[0, 1].map((index) => {
                  const currentOpponent = selectedOpponents[index];
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.playerSelectorCard}
                      onPress={() => {
                        setSelectorMode('opponents');
                        setSelectedOpponentIndex(index);
                        setShowUserSelector(true);
                        loadUsers();
                      }}
                    >
                      {currentOpponent ? (
                        <View style={styles.selectedPlayerCard}>
                          <Avatar.Text
                            size={48}
                            label={getInitials(currentOpponent.name)}
                            style={styles.playerAvatar}
                            labelStyle={styles.playerAvatarLabel}
                          />
                          <View style={styles.selectedPlayerInfo}>
                            <Text style={styles.selectedPlayerName}>
                              {currentOpponent.name}
                            </Text>
                            <Text style={styles.selectedPlayerDetails}>
                              {t('reservation.rank')} #{currentOpponent.currentRank || 0} • {currentOpponent.title || t('reservation.intermediate')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedOpponents(selectedOpponents.filter((_, i) => i !== index));
                            }}
                            style={styles.removePlayerButton}
                          >
                            <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.playerSelectorPlaceholder}>
                          <MaterialCommunityIcons name="account-plus" size={32} color="#BDBDBD" />
                          <Text style={styles.playerSelectorPlaceholderText}>
                            {index === 0 ? t('reservation.selectOpponent') + ' 1' : t('reservation.selectOpponent') + ' 2'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Available Time Slots */}
        <View style={styles.timeSlotsSection}>
          <Text style={styles.sectionTitle}>{t('reservation.availableTimeSlots')}</Text>
          <View style={styles.timeGrid}>
            {allTimes.map((time) => {
              const isReserved = isTimeReserved(time);
              const isBlocked = isTimeBlocked(time);
              const isAvailable = availableTimes.includes(time);
              // Rezerve edilmiş veya bloke edilmiş saatler disabled olmalı
              const isDisabled = isReserved || isBlocked;
              
              // Bugün ise geçmiş saatleri kontrol et
              const now = new Date();
              const selectedDateObj = new Date(selectedDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const selectedDateOnly = new Date(selectedDateObj);
              selectedDateOnly.setHours(0, 0, 0, 0);
              const isToday = selectedDateOnly.getTime() === today.getTime();
              
              let isPastTime = false;
              if (isToday) {
                const [hours, minutes] = time.split(':').map(Number);
                const timeDate = new Date(selectedDateObj);
                timeDate.setHours(hours, minutes, 0, 0);
                isPastTime = timeDate < now;
              }
              
              const finalDisabled = isDisabled || isPastTime;
              
              // Hava durumu bilgisini al (sadece müsait saatler için)
              const weatherInfo = weatherCache[time];
              const showWeather = !!(weatherInfo && (weatherInfo.isRainy || weatherInfo.isSnowy) && !finalDisabled);
              
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlotCard,
                    selectedTime === time && styles.timeSlotCardSelected,
                    finalDisabled && styles.timeSlotCardDisabled
                  ]}
                  onPress={() => {
                    if (!finalDisabled) {
                      // Hava durumu kontrolü
                      if (showWeather && weatherInfo) {
                        setPendingTimeSelection(time);
                        setShowWeatherWarningModal(true);
                      } else {
                        setSelectedTime(time);
                      }
                    }
                  }}
                  disabled={finalDisabled}
                >
                  <MaterialCommunityIcons 
                    name={finalDisabled ? "lock" : "clock"} 
                    size={18} 
                    color={
                      finalDisabled 
                        ? "#BDBDBD" 
                        : selectedTime === time 
                          ? "#2E7D32" 
                          : "#666666"
                    } 
                  />
                  <Text style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextSelected,
                    finalDisabled && styles.timeSlotTextDisabled
                  ]}>
                    {time}
                  </Text>
                  {showWeather && !finalDisabled && (
                    <MaterialCommunityIcons 
                      name={weatherInfo?.isSnowy ? "weather-snowy" : "weather-rainy"} 
                      size={18} 
                      color={selectedTime === time ? "#2E7D32" : "#2196F3"} 
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            {allTimes.length === 0 && (
              <Text style={styles.noTimeSlotsText}>
                {t('reservation.noAvailableSlots')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Continue to Booking Button - Fixed at bottom */}
      {selectedTime && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleReservation}
            disabled={isCreatingReservation}
          >
            <LinearGradient
              colors={isCreatingReservation ? ['#BDBDBD', '#9E9E9E'] : ['#2E7D32', '#1B5E20']}
              style={styles.continueButtonGradient}
            >
              {isCreatingReservation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {t('reservation.continueToBooking')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Weather Warning Modal */}
      <Portal>
        <Modal
          visible={showWeatherWarningModal}
          onDismiss={() => {
            setShowWeatherWarningModal(false);
            setPendingTimeSelection(null);
          }}
          contentContainerStyle={styles.weatherModalContainer}
          dismissable={false}
        >
          <Card style={styles.weatherModalCard}>
            <Card.Content style={styles.weatherModalContent}>
              <View style={styles.weatherModalHeader}>
                <View style={styles.weatherModalIconContainer}>
                  <MaterialCommunityIcons 
                    name={
                      pendingTimeSelection && weatherCache[pendingTimeSelection]?.isSnowy
                        ? "weather-snowy" 
                        : "weather-rainy"
                    } 
                    size={48} 
                    color="#2196F3" 
                  />
                </View>
                <Title style={styles.weatherModalTitle}>
                  {t('reservation.weatherWarningTitle')}
                </Title>
              </View>
              
              <Text style={styles.weatherModalMessage}>
                {pendingTimeSelection && weatherCache[pendingTimeSelection]?.isSnowy
                  ? t('reservation.weatherWarningSnowy')
                  : t('reservation.weatherWarningRainy')}
                {'\n\n'}
                {t('reservation.weatherWarningMessage')}
              </Text>

              <View style={styles.weatherModalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowWeatherWarningModal(false);
                    setPendingTimeSelection(null);
                  }}
                  style={[styles.weatherModalButton, styles.weatherModalCancelButton]}
                  labelStyle={styles.weatherModalCancelButtonLabel}
                >
                  {t('reservation.weatherWarningCancel')}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    if (pendingTimeSelection) {
                      confirmTimeSelection(pendingTimeSelection);
                    }
                    setShowWeatherWarningModal(false);
                    setPendingTimeSelection(null);
                  }}
                  style={[styles.weatherModalButton, styles.weatherModalContinueButton]}
                  labelStyle={styles.weatherModalContinueButtonLabel}
                  buttonColor="#4CAF50"
                >
                  {t('reservation.weatherWarningContinue')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* User Selector Modal */}
      <Portal>
        <Modal
          visible={showUserSelector}
          onDismiss={() => {
            setShowUserSelector(false);
            setSearchQuery('');
            setSelectedOpponentIndex(null);
          }}
          contentContainerStyle={styles.userSelectorModal}
        >
          <Card style={styles.userSelectorCard}>
            <Card.Content>
              <View style={styles.userModalHeader}>
                <View style={styles.userModalHeaderContent}>
                  <Title style={styles.userModalTitle}>
                    {selectorMode === 'partner'
                      ? t('reservation.selectPartner')
                      : selectorMode === 'opponent'
                      ? t('reservation.selectOpponent')
                      : t('reservation.selectOpponents')}
                  </Title>
                  <Text style={styles.userModalSubtitle}>
                    {selectorMode === 'partner'
                      ? t('reservation.selectPartnerForMatch')
                      : t('reservation.selectPlayerFromOpposingTeam')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowUserSelector(false);
                    setSearchQuery('');
                    setSelectedOpponentIndex(null);
                  }}
                  style={styles.userModalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              <Searchbar
                placeholder={t('reservation.searchUsers')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.userSearchbar}
                iconColor={selectorMode === 'opponents' ? "#FF9800" : "#2E7D32"}
              />

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                style={styles.userList}
                renderItem={({ item }) => {
                  const isSelected = selectorMode === 'partner' || selectorMode === 'opponent'
                    ? selectedPartner?.id === item.id
                    : selectedOpponents.some(opp => opp.id === item.id);
                  
                  const isDisabledInPartnerMode = selectorMode === 'partner' &&
                    selectedOpponents.some(opp => opp.id === item.id);
                  
                  const isDisabledInOpponentsMode = selectorMode === 'opponents' &&
                    selectedPartner?.id === item.id;
                  
                  // Belirli bir pozisyon için seçim yapılıyorsa, limit kontrolü yapma
                  const isDisabledDueToLimit = selectorMode === 'opponents' &&
                    selectedOpponentIndex === null &&
                    selectedOpponents.length >= 2 && !isSelected;
                  
                  const isDisabled = isDisabledInPartnerMode || isDisabledInOpponentsMode || isDisabledDueToLimit;

                  return (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleUserSelect(item)}
                      disabled={isDisabled}
                    >
                      <View style={[
                        styles.userItemContent,
                        isDisabled && styles.disabledUserItem
                      ]}>
                        <Avatar.Text
                          size={48}
                          label={getInitials(item.name)}
                          style={styles.userItemAvatar}
                          labelStyle={styles.userItemAvatarLabel}
                        />
                        <View style={styles.userItemInfo}>
                          <Text style={[
                            styles.userItemName,
                            isDisabled && styles.disabledText
                          ]}>
                            {item.name}
                          </Text>
                          <Text style={[
                            styles.userItemDetails,
                            isDisabled && styles.disabledText
                          ]}>
                            {t('reservation.rank')} #{item.currentRank || 0} • {item.title || t('reservation.intermediate')}
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialCommunityIcons 
                            name={selectorMode === 'opponents' ? "checkbox-marked-circle" : "check-circle"} 
                            size={24} 
                            color={selectorMode === 'opponents' ? "#FF9800" : "#4CAF50"} 
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyUserList}>
                    <MaterialCommunityIcons name="account-search" size={48} color="#BDBDBD" />
                    <Text style={styles.emptyUserListText}>{t('reservation.noUsersFound')}</Text>
                  </View>
                )}
              />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  topVisualSection: {
    backgroundColor: '#E8F5E8',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
    position: 'relative',
  },
  topChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  topChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  tennisBallContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  courtName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  dateSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  dateScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateScrollContent: {
    gap: 12,
    paddingHorizontal: 0,
  },
  dateCard: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateCardSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  dateDayNameSelected: {
    color: '#FFFFFF',
  },
  dateDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  dateDayNumberSelected: {
    color: '#FFFFFF',
  },
  timeSlotsSection: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithButton: {
    paddingBottom: 100, // Buton için alan bırak
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    width: (width - 64) / 3,
  },
  timeSlotCardSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  timeSlotCardDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  timeSlotTextSelected: {
    color: '#2E7D32',
  },
  timeSlotTextDisabled: {
    color: '#BDBDBD',
  },
  noTimeSlotsText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  weatherModalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  weatherModalContent: {
    padding: 24,
  },
  weatherModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B1B1B',
    textAlign: 'center',
  },
  weatherModalMessage: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  weatherModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  weatherModalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  weatherModalCancelButton: {
    borderColor: '#757575',
  },
  weatherModalCancelButtonLabel: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
  },
  weatherModalContinueButton: {
    elevation: 0,
  },
  weatherModalContinueButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Game Type Section Styles
  gameTypeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  gameTypeCards: {
    flexDirection: 'row',
    gap: 12,
  },
  gameTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  gameTypeCardSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  gameTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 12,
    marginBottom: 4,
  },
  gameTypeTitleSelected: {
    color: '#2E7D32',
  },
  gameTypeSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  gameTypeSubtitleSelected: {
    color: '#2E7D32',
  },
  // Players Section Styles
  playersSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  playerSubsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
    marginTop: 8,
  },
  playerSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    minHeight: 80,
  },
  selectedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    backgroundColor: '#E8F5E8',
    marginRight: 12,
  },
  playerAvatarLabel: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  selectedPlayerInfo: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  selectedPlayerDetails: {
    fontSize: 14,
    color: '#666666',
  },
  removePlayerButton: {
    padding: 4,
  },
  playerSelectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playerSelectorPlaceholderText: {
    fontSize: 14,
    color: '#BDBDBD',
  },
  opponentsContainer: {
    gap: 12,
  },
  // User Selector Modal Styles
  userSelectorModal: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  userSelectorCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    maxHeight: '80%',
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userModalHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  userModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  userModalSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  userModalCloseButton: {
    padding: 4,
  },
  userSearchbar: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  userList: {
    maxHeight: 400,
  },
  userItem: {
    marginBottom: 12,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  userItemAvatar: {
    backgroundColor: '#E8F5E8',
    marginRight: 12,
  },
  userItemAvatarLabel: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  userItemDetails: {
    fontSize: 14,
    color: '#666666',
  },
  disabledUserItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#BDBDBD',
  },
  emptyUserList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyUserListText: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 12,
  },
});

export default CourtDetailScreen;

