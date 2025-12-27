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
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ReservationStackParamList, MainTabParamList } from '../navigation/MainTabNavigator';
import { useLanguage } from '../context/LanguageContext';
import { courtService, reservationService, weatherService, userService, authService, matchChallengeService, leagueStandingsService, reservationTemplateService, reservationTimeSlotService, notificationService } from '../services/api';
import { NotificationType } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type CourtDetailScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ReservationStackParamList, 'CourtDetail'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const CourtDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<CourtDetailScreenNavigationProp>();
  const { t, language } = useLanguage();
  const routeParams = route.params as { 
    courtId: number;
    selectedDate?: string;
    selectedTime?: string;
  } | undefined;
  
  const courtId = routeParams?.courtId;
  const routeSelectedDate = routeParams?.selectedDate;
  const routeSelectedTime = routeParams?.selectedTime;
  
  // Debug: Route params'ı logla
  console.log('CourtDetailScreen - Route params:', routeParams);
  
  const [court, setCourt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [allTimes, setAllTimes] = useState<string[]>([
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
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationBlocked, setReservationBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState<number>(width);

  // Scroll refs for auto-scroll
  const mainScrollViewRef = useRef<ScrollView>(null);
  const dateSectionRef = useRef<View>(null);
  const gameTypeSectionRef = useRef<View>(null);
  const playersSectionRef = useRef<View>(null);
  const timeSlotsSectionRef = useRef<View>(null);
  const [gameTypeSectionY, setGameTypeSectionY] = useState(0);
  const [playersSectionY, setPlayersSectionY] = useState(0);
  const [timeSlotsSectionY, setTimeSlotsSectionY] = useState(0);
  const routeParamsProcessedRef = useRef(false);
  const savedRouteDateRef = useRef<string | null>(null);
  const savedRouteTimeRef = useRef<string | null>(null);

  // Rezervasyon engeli kontrolü
  const checkReservationBlock = React.useCallback(async () => {
    try {
      setCheckingBlockStatus(true);
      setReservationBlocked(false);
      
      // Aktif rezervasyon kontrolü (hem owner hem participant olarak)
      const hasActive = await reservationService.hasActiveReservation();
      if (hasActive) {
        setReservationBlocked(true);
        setBlockReason('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
        setCheckingBlockStatus(false);
        return;
      }

      // Bekleyen maç sonucu kontrolü
      const notifications = await notificationService.getUserNotifications(1, 20);
      const pendingMatchResult = notifications.notifications.find(
        (notif: any) => notif.type === NotificationType.MATCH_COMPLETED
      );

      if (pendingMatchResult) {
        setReservationBlocked(true);
        setBlockReason('Bekleyen maç sonucu girmeniz gereken bir maç var. Yeni rezervasyon oluşturmadan önce maç sonucunu girin.');
        setCheckingBlockStatus(false);
        return;
      }

      setReservationBlocked(false);
      setBlockReason('');
      setCheckingBlockStatus(false);
    } catch (error) {
      setCheckingBlockStatus(false);
      setReservationBlocked(false);
    }
  }, []);

  // Component mount olduğunda data yükle
  useEffect(() => {
    loadCourtData();
    loadCurrentUser();
  }, [courtId]);

  // Route params varsa tarih ve saati set et ve ref'e kaydet
  // SADECE route params değiştiğinde çalışır, kullanıcı etkileşimlerinde çalışmaz
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect - Route params kontrolü:', { 
      routeSelectedDate, 
      routeSelectedTime, 
      currentSelectedDate: selectedDate, 
      currentSelectedTime: selectedTime,
      savedDate: savedRouteDateRef.current,
      savedTime: savedRouteTimeRef.current
    });
    
    // Eğer kullanıcı zaten tarih/saat seçmişse ve route params yoksa, hiçbir şey yapma
    const hasUserDateOrTime = selectedDate || selectedTime;
    if (!routeSelectedDate && !routeSelectedTime && hasUserDateOrTime) {
      // Kullanıcı seçimi var, route params yok - hiçbir şey yapma
      return;
    }
    
    if (routeSelectedDate && routeSelectedTime) {
      // Route params'ı ref'e kaydet (navigation params temizlense bile değer kaybolmasın)
      if (savedRouteDateRef.current !== routeSelectedDate || savedRouteTimeRef.current !== routeSelectedTime) {
        savedRouteDateRef.current = routeSelectedDate;
        savedRouteTimeRef.current = routeSelectedTime;
        console.log('Route params ref\'e kaydedildi:', { routeSelectedDate, routeSelectedTime });
      }
      
      // Route params varsa mutlaka set et (farklıysa veya henüz set edilmemişse)
      if (selectedDate !== routeSelectedDate || selectedTime !== routeSelectedTime) {
        console.log('useLayoutEffect - Route params set ediliyor:', { routeSelectedDate, routeSelectedTime });
        setSelectedDate(routeSelectedDate);
        setSelectedTime(routeSelectedTime);
        routeParamsProcessedRef.current = true;
      }
    } else if (savedRouteDateRef.current && savedRouteTimeRef.current) {
      // Route params temizlenmiş ama ref'te kayıtlı değerler varsa onları kullan
      // ANCAK sadece eğer kullanıcı seçimi yoksa
      if (!hasUserDateOrTime && (selectedDate !== savedRouteDateRef.current || selectedTime !== savedRouteTimeRef.current)) {
        console.log('useLayoutEffect - Saved route params kullanılıyor:', { 
          date: savedRouteDateRef.current, 
          time: savedRouteTimeRef.current 
        });
        setSelectedDate(savedRouteDateRef.current);
        setSelectedTime(savedRouteTimeRef.current);
      }
    } else if (!routeSelectedDate && !routeSelectedTime) {
      // Route params yoksa ve henüz set edilmemişse default değerleri kullan
      // Eğer önceki bir navigation'dan değerler kalmışsa, onları da temizle
      // ANCAK sadece eğer kullanıcı seçimi yoksa
      if (!hasUserDateOrTime && !routeParamsProcessedRef.current) {
        // Yerel saat diliminde bugünün tarihini al
        const today = new Date();
        const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log('useLayoutEffect - Route params yok, default değerler set ediliyor:', { defaultDate });
        setSelectedDate(defaultDate);
        setSelectedTime('');
        savedRouteDateRef.current = null;
        savedRouteTimeRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSelectedDate, routeSelectedTime]);
  
  // Ayrıca useEffect ile de kontrol et (fallback)
  // SADECE route params değiştiğinde çalışır
  useEffect(() => {
    // Eğer kullanıcı zaten tarih/saat seçmişse ve route params yoksa, hiçbir şey yapma
    const hasUserDateOrTime = selectedDate || selectedTime;
    if (!routeSelectedDate && !routeSelectedTime && hasUserDateOrTime) {
      // Kullanıcı seçimi var, route params yok - hiçbir şey yapma
      return;
    }
    
    if (routeSelectedDate && routeSelectedTime) {
      if (selectedDate !== routeSelectedDate || selectedTime !== routeSelectedTime) {
        console.log('useEffect - Route params set ediliyor (fallback):', { routeSelectedDate, routeSelectedTime });
        savedRouteDateRef.current = routeSelectedDate;
        savedRouteTimeRef.current = routeSelectedTime;
        setSelectedDate(routeSelectedDate);
        setSelectedTime(routeSelectedTime);
        routeParamsProcessedRef.current = true;
      }
    } else if (savedRouteDateRef.current && savedRouteTimeRef.current && routeParamsProcessedRef.current) {
      // Route params temizlenmiş ama ref'te kayıtlı değerler varsa ve daha önce işlenmişse onları kullan
      // ANCAK sadece eğer kullanıcı seçimi yoksa
      if (!hasUserDateOrTime && (selectedDate !== savedRouteDateRef.current || selectedTime !== savedRouteTimeRef.current)) {
        console.log('useEffect - Saved route params kullanılıyor (fallback):', { 
          date: savedRouteDateRef.current, 
          time: savedRouteTimeRef.current 
        });
        setSelectedDate(savedRouteDateRef.current);
        setSelectedTime(savedRouteTimeRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSelectedDate, routeSelectedTime]);

  // Sayfa her açıldığında state'leri sıfırla (tarih ve saat hariç - onlar route params veya kullanıcı seçimi)
  useFocusEffect(
    React.useCallback(() => {
      // Kullanıcı seçimlerini kontrol et (closure ile mevcut değerleri kullan)
      const currentPartner = selectedPartner;
      const currentOpponents = selectedOpponents;
      const currentPlayerType = playerType;
      const currentDate = selectedDate;
      const currentTime = selectedTime;
      const hasUserSelections = currentPartner || currentOpponents.length > 0 || currentPlayerType !== 'single';
      const hasDateOrTime = currentDate || currentTime;
      
      // Route params varsa onları kullan (sadece route params gerçekten değiştiyse)
      if (routeSelectedDate && routeSelectedTime) {
        // Sadece route params farklıysa ve daha önce set edilmemişse set et
        if ((currentDate !== routeSelectedDate || currentTime !== routeSelectedTime) && 
            (savedRouteDateRef.current !== routeSelectedDate || savedRouteTimeRef.current !== routeSelectedTime)) {
          console.log('useFocusEffect - Route params set ediliyor:', { routeSelectedDate, routeSelectedTime });
          setSelectedDate(routeSelectedDate);
          setSelectedTime(routeSelectedTime);
          savedRouteDateRef.current = routeSelectedDate;
          savedRouteTimeRef.current = routeSelectedTime;
          routeParamsProcessedRef.current = true;
        }
      } else {
        // Route params yoksa (sadece courtId ile sayfaya gidildiğinde - yeni rezervasyon)
        // Önceki rezervasyon işleminden kalan tüm seçimleri temizle
        console.log('useFocusEffect - Route params yok, önceki seçimler temizleniyor');
        
        // Tarih ve saati resetle (default bugünün tarihi ile)
        const today = new Date();
        const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (currentDate !== defaultDate || currentTime !== '') {
          setSelectedDate(defaultDate);
          setSelectedTime('');
        }
        
        // Route params ref'lerini temizle
        savedRouteDateRef.current = null;
        savedRouteTimeRef.current = null;
        routeParamsProcessedRef.current = false;
      }
      
      // Diğer state'leri sıfırla (her focus'ta)
      // Route params yoksa (yeni rezervasyon başlatılıyorsa) tüm seçimleri temizle
      if (!routeSelectedDate && !routeSelectedTime) {
        // Route params yoksa, partner ve opponents'ı da temizle
        if (currentPartner || currentOpponents.length > 0 || currentPlayerType !== 'single') {
          console.log('useFocusEffect - Route params yok, partner ve opponents temizleniyor');
          setSelectedPartner(null);
          setSelectedOpponents([]);
          setPlayerType('single');
        }
      } else if (!hasUserSelections) {
        // Route params varsa ama kullanıcı seçimi yoksa, sadece o zaman resetle
        // ANCAK sadece eğer zaten resetlenmemişse (sonsuz döngüyü önlemek için)
        if (currentPartner || currentOpponents.length > 0 || currentPlayerType !== 'single') {
          setSelectedPartner(null);
          setSelectedOpponents([]);
          setPlayerType('single');
        }
      }
      // Modal state'lerini her zaman temizle
      setShowUserSelector(false);
      setShowWeatherWarningModal(false);
      setPendingTimeSelection(null);
      setWeatherCache({});
      setSearchQuery('');
      setSelectedOpponentIndex(null);

      // Rezervasyon engeli kontrolü
      checkReservationBlock();
    }, [checkReservationBlock, routeSelectedDate, routeSelectedTime])
  );

  // Zaman dilimlerini yükle
  const loadTimeSlots = React.useCallback(async () => {
    try {
      if (!selectedDate) {
        // Varsayılan saat dilimlerini kullan
        const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
        setAllTimes(defaultSlots.length > 0 ? defaultSlots : [
          '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
          '20:00', '21:00', '22:00', '23:00'
        ]);
        return;
      }

      // Seçilen tarihin haftanın gününü hesapla
      // JavaScript: 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
      // Backend: 0 = Pazartesi, 1 = Salı, ..., 6 = Pazar
      const dateObj = new Date(selectedDate);
      const jsDayOfWeek = dateObj.getDay();
      // Mapping: JS 0 (Pazar) -> Backend 6, JS 1 (Pazartesi) -> Backend 0, etc.
      const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;

      // Önce şablondan saat dilimlerini al
      try {
        const templateSlots = await reservationTemplateService.getActiveTimeSlotsForDay(dayOfWeek);
        if (templateSlots && templateSlots.length > 0) {
          setAllTimes(templateSlots);
          return;
        }
      } catch (error) {
        console.log('Şablon saat dilimleri alınamadı, varsayılan kullanılıyor:', error);
      }

      // Şablon yoksa, genel aktif saat dilimlerini kullan
      const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
      setAllTimes(defaultSlots.length > 0 ? defaultSlots : [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
        '20:00', '21:00', '22:00', '23:00'
      ]);
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
      // Hata durumunda varsayılan saat dilimlerini kullan
      setAllTimes([
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
        '20:00', '21:00', '22:00', '23:00'
      ]);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  useEffect(() => {
    if (court && selectedDate) {
      loadReservationsForDate();
    }
  }, [court, selectedDate, currentUserType]);

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
      // Tarih seçimi useFocusEffect'te yapılıyor
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
    const times = allTimes;

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

    // RESTRICTED kullanıcı kontrolü
    const isRestricted = currentUserType?.toLowerCase() === 'restricted';
    const dayOfWeek = selectedDateObj.getDay(); // 0 = Pazar, 6 = Cumartesi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const available = times.filter(time => {
      // Rezerve edilmiş mi kontrol et
      if (reservedTimes.includes(time)) return false;

      // Bloke edilmiş mi kontrol et
      const hour = parseInt(time.split(':')[0]);
      if (blockedHourNumbers.includes(hour)) return false;

      // RESTRICTED kullanıcılar için saat kısıtlaması
      if (isRestricted) {
        if (isWeekend) {
          // Hafta sonu: Sadece 18:00-24:00 arası
          if (hour < 18) return false;
        } else {
          // Hafta içi: Sadece 9:00-18:00 arası
          if (hour < 9 || hour >= 18) return false;
        }
      }

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

  // RESTRICTED kullanıcılar için saatin disabled olup olmadığını kontrol et
  const isTimeSlotDisabledForUser = (timeSlot: string): boolean => {
    if (currentUserType?.toLowerCase() !== 'restricted') {
      return false;
    }

    if (!selectedDate) {
      return false;
    }

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay(); // 0 = Pazar, 6 = Cumartesi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hour = parseInt(timeSlot.split(':')[0]);

    if (isWeekend) {
      // Hafta sonu: Sadece 18:00-24:00 arası izinli
      return hour < 18;
    } else {
      // Hafta içi: Sadece 9:00-18:00 arası izinli
      return hour < 9 || hour >= 18;
    }
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
    
    // Yerel saat diliminde tarih formatlamak için yardımcı fonksiyon
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = language === 'tr' 
        ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      dates.push({
        date: formatLocalDate(date),
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
    if (blockedHours.length === 0) return false;
    const hour = parseInt(time.split(':')[0]);
    return blockedHours.some(bh => bh.hour === hour);
  };

  const getBlockedReason = (time: string): string | null => {
    if (blockedHours.length === 0) return null;
    const hour = parseInt(time.split(':')[0]);
    const blockedHour = blockedHours.find(bh => bh.hour === hour);
    return blockedHour ? blockedHour.reason : null;
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
      setCurrentUserType(profile.userType || null);
      
      // Kullanıcı yüklendikten sonra rezervasyon engeli kontrolü yap
      checkReservationBlock();
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
      // Çift modda partner seçildikten sonra scroll yapmayalım, tüm boş alanlar dolana kadar bekleyelim
      // Sadece tek modda veya tüm seçimler tamamlandığında scroll yapalım
      const isDoubleMode = playerType === 'double';
      const allPlayersSelected = isDoubleMode 
        ? (user && selectedOpponents.length === 2)
        : true; // Tek modda zaten tek seçim yeterli
      
      if (!isDoubleMode || allPlayersSelected) {
        // Auto scroll to time slots section after all selections are complete
        setTimeout(() => {
          if (timeSlotsSectionY > 0 && mainScrollViewRef.current) {
            mainScrollViewRef.current.scrollTo({
              y: timeSlotsSectionY - 20,
              animated: true,
            });
          }
        }, 300);
      }
    } else if (selectorMode === 'opponent') {
      // Tek modda opponent seçildiğinde hemen scroll yap
      setSelectedPartner(user);
      setShowUserSelector(false);
      setSearchQuery('');
      setTimeout(() => {
        if (timeSlotsSectionY > 0 && mainScrollViewRef.current) {
          mainScrollViewRef.current.scrollTo({
            y: timeSlotsSectionY - 20,
            animated: true,
          });
        }
      }, 300);
    } else if (selectorMode === 'opponents') {
      if (selectedOpponentIndex !== null) {
        // Belirli bir pozisyondaki rakibi değiştir
        // ANCAK aynı kullanıcı başka bir pozisyonda seçiliyse, seçime izin verme
        const isAlreadySelectedInOtherPosition = selectedOpponents.some((opp, index) => 
          opp && opp.id === user.id && index !== selectedOpponentIndex
        );
        
        if (isAlreadySelectedInOtherPosition) {
          // Aynı kullanıcı başka bir pozisyonda seçili, seçime izin verme
          Alert.alert(
            t('common.error'),
            t('reservation.opponentAlreadySelected') || 'Bu rakip zaten seçilmiş',
            [{ text: t('common.ok') }]
          );
          return;
        }
        
        const newOpponents = [...selectedOpponents];
        newOpponents[selectedOpponentIndex] = user;
        const updatedOpponents = newOpponents.filter(opp => opp !== undefined && opp !== null);
        setSelectedOpponents(updatedOpponents);
        setShowUserSelector(false);
        setSearchQuery('');
        setSelectedOpponentIndex(null);
        
        // Çift modda: Partner ve 2 opponent seçildiyse scroll yap
        const allPlayersSelected = selectedPartner && updatedOpponents.length === 2;
        if (allPlayersSelected) {
          setTimeout(() => {
            if (timeSlotsSectionY > 0 && mainScrollViewRef.current) {
              mainScrollViewRef.current.scrollTo({
                y: timeSlotsSectionY - 20,
                animated: true,
              });
            }
          }, 300);
        }
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
              
              // Çift modda: Partner ve 2 opponent seçildiyse scroll yap
              const allPlayersSelected = selectedPartner && newOpponents.length === 2;
              if (allPlayersSelected) {
                // Auto scroll to time slots section after all players selected
                setTimeout(() => {
                  if (timeSlotsSectionY > 0 && mainScrollViewRef.current) {
                    mainScrollViewRef.current.scrollTo({
                      y: timeSlotsSectionY - 20,
                      animated: true,
                    });
                  }
                }, 300);
              }
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
            proposedDate: reservationStartTime.toISOString(),
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
    // Aktif rezervasyon kontrolü
    if (reservationBlocked) {
      Alert.alert(
        t('common.error'),
        blockReason || 'Yeni rezervasyon oluşturulamaz',
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert(
        t('common.error'),
        'Lütfen tarih ve saat seçin',
        [{ text: t('common.ok') }]
      );
      return;
    }

    // courtId'nin doğru olduğundan emin ol
    if (!courtId || !court) {
      Alert.alert(
        t('common.error'),
        'Kort bilgisi bulunamadı. Lütfen tekrar deneyin.',
        [{ text: t('common.ok') }]
      );
      return;
    }

    // BookingConfirm sayfasına navigate et
    navigation.navigate('BookingConfirm', {
      courtId: typeof courtId === 'number' ? courtId : parseInt(String(courtId)),
      selectedDate,
      selectedTime,
      playerType,
      selectedPartner,
      selectedOpponents,
      court,
    });
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
        ref={mainScrollViewRef}
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={selectedTime ? styles.scrollContentWithButton : styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ReservationList' as never);
              }
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('reservation.courtDetails')}</Text>
        </View>

        {/* Rezervasyon Engeli Mesajı */}
        {(checkingBlockStatus || reservationBlocked) && (
          <Card style={styles.blockCard} elevation={5}>
            <Card.Content style={styles.blockCardContent}>
              {checkingBlockStatus ? (
                <View style={styles.blockContent}>
                  <ActivityIndicator size="large" color="#FF9800" />
                  <Text style={styles.blockText}>Kontrol ediliyor...</Text>
                </View>
              ) : reservationBlocked ? (
                <View style={styles.blockContent}>
                  <MaterialCommunityIcons name="alert-circle" size={48} color="#DC3545" />
                  <Title style={styles.blockTitle}>Rezervasyon Oluşturulamaz</Title>
                  <Text style={styles.blockText}>{blockReason}</Text>
                  {/* Sadece bekleyen maç sonucu durumunda "Bildirimlere Git" butonu göster */}
                  {blockReason.includes('maç sonucu') && (
                    <Button
                      mode="contained"
                      buttonColor="#1976D2"
                      icon="bell"
                      onPress={() => navigation.getParent()?.navigate('Notifications')}
                      style={styles.blockButton}
                    >
                      Bildirimlere Git
                    </Button>
                  )}
                </View>
              ) : null}
            </Card.Content>
          </Card>
        )}

        {/* Top Visual Section - Court Image */}
        <LinearGradient
          colors={['#D1FAE5', '#ECFDF5']} // from-green-100 to-green-50
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topVisualSection}
        >
          {/* Chips */}
          <View style={styles.topChipsContainer}>
            <View style={styles.topChip}>
              <Text style={styles.topChipText}>{displayCourt.surface}</Text>
            </View>
            <View style={styles.topChip}>
              <MaterialCommunityIcons 
                name={court.indoors ? "home-roof" : "weather-sunny"} 
                size={12} 
                color="#374151" 
              />
              <Text style={styles.topChipText}>{displayCourt.type}</Text>
            </View>
          </View>

          {/* Tennis Ball Icon */}
          <View style={styles.tennisBallContainer}>
            <Text style={{ fontSize: 112 }}>🎾</Text>
          </View>
        </LinearGradient>

        {/* Court Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.courtName}>{court.name}</Text>
          
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={18} 
              color="#717182" 
            />
            <Text style={styles.locationText}>
              {`${displayCourt.surface} • ${displayCourt.type}`}
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons 
              name="information" 
              size={20} 
              color="#B4AEBD" 
            />
            <Text style={styles.infoText}>
              {t('reservation.standardSession')}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View 
          ref={dateSectionRef}
          style={styles.dateSection}
        >
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
                  selectedDate === dateItem.date && styles.dateCardSelected,
                  (reservationBlocked || checkingBlockStatus) && styles.dateCardDisabled
                ]}
                onPress={() => {
                  if (!reservationBlocked && !checkingBlockStatus) {
                    setSelectedDate(dateItem.date);
                    // Auto scroll to game type section after date selection
                    setTimeout(() => {
                      if (gameTypeSectionY > 0 && mainScrollViewRef.current) {
                        mainScrollViewRef.current.scrollTo({
                          y: gameTypeSectionY - 20, // 20px offset for better visibility
                          animated: true,
                        });
                      }
                    }, 300);
                  }
                }}
                disabled={reservationBlocked || checkingBlockStatus}
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
        <View 
          ref={gameTypeSectionRef}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setGameTypeSectionY(y);
          }}
          style={styles.gameTypeSection}
        >
          <Text style={styles.sectionTitle}>{t('reservation.gameType')}</Text>
          <View style={styles.gameTypeCards}>
            <TouchableOpacity
              style={[
                styles.gameTypeCard,
                playerType === 'single' && styles.gameTypeCardSelected,
                (reservationBlocked || checkingBlockStatus) && styles.gameTypeCardDisabled
              ]}
              onPress={() => {
                if (!reservationBlocked && !checkingBlockStatus) {
                  setPlayerType('single');
                  setSelectedPartner(null);
                  setSelectedOpponents([]);
                  // Auto scroll to players section after game type selection
                  setTimeout(() => {
                    if (playersSectionY > 0 && mainScrollViewRef.current) {
                      mainScrollViewRef.current.scrollTo({
                        y: playersSectionY - 20,
                        animated: true,
                      });
                    }
                  }, 300);
                }
              }}
              disabled={reservationBlocked || checkingBlockStatus}
            >
              <View style={[
                styles.gameTypeIconContainer,
                playerType === 'single' && styles.gameTypeIconContainerSelected
              ]}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={28} 
                  color={playerType === 'single' ? '#FFFFFF' : '#9CA3AF'} 
                />
              </View>
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
                playerType === 'double' && styles.gameTypeCardSelected,
                (reservationBlocked || checkingBlockStatus) && styles.gameTypeCardDisabled
              ]}
              onPress={() => {
                if (!reservationBlocked && !checkingBlockStatus) {
                  setPlayerType('double');
                  setSelectedPartner(null);
                  setSelectedOpponents([]);
                  // Auto scroll to players section after game type selection
                  setTimeout(() => {
                    if (playersSectionY > 0 && mainScrollViewRef.current) {
                      mainScrollViewRef.current.scrollTo({
                        y: playersSectionY - 20,
                        animated: true,
                      });
                    }
                  }, 300);
                }
              }}
              disabled={reservationBlocked || checkingBlockStatus}
            >
              <View style={[
                styles.gameTypeIconContainer,
                playerType === 'double' && styles.gameTypeIconContainerSelected
              ]}>
                <MaterialCommunityIcons 
                  name="account-group" 
                  size={28} 
                  color={playerType === 'double' ? '#FFFFFF' : '#9CA3AF'} 
                />
              </View>
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
        <View 
          ref={playersSectionRef}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setPlayersSectionY(y);
          }}
          style={styles.playersSection}
        >
          <Text style={styles.sectionTitle}>{t('reservation.players')}</Text>
          
          {/* Single Mode - Opponent Selection */}
          {playerType === 'single' && (
            <TouchableOpacity
              style={[
                styles.playerSelectorCard,
                (reservationBlocked || checkingBlockStatus) && styles.playerSelectorCardDisabled
              ]}
              onPress={() => {
                if (!reservationBlocked && !checkingBlockStatus) {
                  setSelectorMode('opponent');
                  setShowUserSelector(true);
                  loadUsers();
                }
              }}
              disabled={reservationBlocked || checkingBlockStatus}
            >
              {selectedPartner ? (
                <View style={styles.selectedPlayerCard}>
                  <Avatar.Text
                    size={48}
                    label={getInitials(selectedPartner.name)}
                    style={[
                      styles.playerAvatar,
                      selectorMode === 'partner' && { backgroundColor: '#54CE8F' }, // Partner: green
                      selectorMode === 'opponent' && { backgroundColor: '#B4AEBD' } // Opponent: purple
                    ]}
                    labelStyle={styles.playerAvatarLabel}
                  />
                  <View style={styles.selectedPlayerInfo}>
                    <Text style={styles.selectedPlayerName}>{selectedPartner.name}</Text>
                    <Text style={styles.selectedPlayerDetails}>
                      {selectedPartner.title || t('reservation.intermediate')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedPartner(null);
                    }}
                    style={styles.removePlayerButton}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.playerSelectorPlaceholder}>
                  <MaterialCommunityIcons name="account" size={32} color="#9CA3AF" />
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
                style={[
                  styles.playerSelectorCard,
                  (reservationBlocked || checkingBlockStatus) && styles.playerSelectorCardDisabled
                ]}
                onPress={() => {
                  if (!reservationBlocked && !checkingBlockStatus) {
                    setSelectorMode('partner');
                    setShowUserSelector(true);
                    loadUsers();
                  }
                }}
                disabled={reservationBlocked || checkingBlockStatus}
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
                        {selectedPartner.title || t('reservation.intermediate')}
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
                      style={[
                        styles.playerSelectorCard,
                        (reservationBlocked || checkingBlockStatus) && styles.playerSelectorCardDisabled
                      ]}
                      onPress={() => {
                        if (!reservationBlocked && !checkingBlockStatus) {
                          setSelectorMode('opponents');
                          setSelectedOpponentIndex(index);
                          setShowUserSelector(true);
                          loadUsers();
                        }
                      }}
                      disabled={reservationBlocked || checkingBlockStatus}
                    >
                      {currentOpponent ? (
                        <View style={styles.selectedPlayerCard}>
                          <Avatar.Text
                            size={48}
                            label={getInitials(currentOpponent.name)}
                            style={[styles.playerAvatar, { backgroundColor: '#B4AEBD' }]} // Opponent: purple
                            labelStyle={styles.playerAvatarLabel}
                          />
                          <View style={styles.selectedPlayerInfo}>
                            <Text style={styles.selectedPlayerName}>
                              {currentOpponent.name}
                            </Text>
                            <Text style={styles.selectedPlayerDetails}>
                              {currentOpponent.title || t('reservation.intermediate')}
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
        <View 
          ref={timeSlotsSectionRef}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setTimeSlotsSectionY(y);
          }}
          style={styles.timeSlotsSection}
        >
          <Text style={styles.sectionTitle}>{t('reservation.availableTimeSlots')}</Text>
          <View 
            style={styles.timeGrid}
            onLayout={(event) => {
              const { width: layoutWidth } = event.nativeEvent.layout;
              setContainerWidth(layoutWidth);
            }}
          >
            {allTimes.map((time, index) => {
              const isReserved = isTimeReserved(time);
              const isBlocked = isTimeBlocked(time);
              const blockedReason = getBlockedReason(time);
              const isAvailable = availableTimes.includes(time);
              // Rezerve edilmiş veya bloke edilmiş saatler disabled olmalı
              const isDisabled = isReserved || isBlocked;
              
              // RESTRICTED kullanıcı kontrolü
              const isDisabledForUser = isTimeSlotDisabledForUser(time);
              
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
              
              const finalDisabled = isDisabled || isPastTime || isDisabledForUser;
              
              // Hava durumu bilgisini al (sadece müsait saatler için)
              const weatherInfo = weatherCache[time];
              const showWeather = !!(weatherInfo && (weatherInfo.isRainy || weatherInfo.isSnowy) && !finalDisabled);
              
              // 3 sütunlu grid için pozisyon hesaplama
              const columnIndex = index % 3; // 0, 1, 2
              const isLastInRow = columnIndex === 2; // Her satırın son sütunu
              
              // 3 sütun için kesin width hesaplama
              // containerWidth zaten padding'ler dahil değil (timeGrid container'ı)
              // 3 kart arasında 2 gap var, her gap 12px = 24px toplam
              // Her kart genişliği: (container genişliği - gap*2) / 3
              const gapsBetweenCards = 12 * 2; // 24px (3 kart arasında 2 gap)
              const cardWidth = Math.floor((containerWidth - gapsBetweenCards) / 3);
               
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    {
                      // 3 sütunlu grid için width ve margin ayarları
                      width: cardWidth,
                      marginRight: isLastInRow ? 0 : 12,
                      marginBottom: 12,
                    },
                    styles.timeSlotCard,
                    selectedTime === time && styles.timeSlotCardSelected,
                    (finalDisabled || reservationBlocked || checkingBlockStatus) && styles.timeSlotCardDisabled,
                    isBlocked && styles.timeSlotCardBlocked
                  ]}
                  onPress={() => {
                    if (!finalDisabled && !reservationBlocked && !checkingBlockStatus) {
                      // Hava durumu kontrolü
                      if (showWeather && weatherInfo) {
                        setPendingTimeSelection(time);
                        setShowWeatherWarningModal(true);
                      } else {
                        setSelectedTime(time);
                      }
                    }
                  }}
                  disabled={finalDisabled || reservationBlocked || checkingBlockStatus}
                >
                  <View style={styles.timeSlotContent}>
                    <MaterialCommunityIcons 
                      name={finalDisabled ? (isBlocked ? "lock" : "lock") : "clock"} 
                      size={18} 
                      color={
                        isBlocked
                          ? "#F44336"
                          : finalDisabled 
                            ? "#9CA3AF" 
                            : selectedTime === time 
                              ? "#FFFFFF" 
                              : "#1F2937"
                      } 
                    />
                    <Text style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.timeSlotTextSelected,
                      finalDisabled && styles.timeSlotTextDisabled,
                      isBlocked && styles.timeSlotTextBlocked
                    ]}>
                      {time}
                    </Text>
                    {isBlocked && blockedReason && (
                      <Text style={styles.timeSlotBlockedReason} numberOfLines={1}>
                        {blockedReason}
                      </Text>
                    )}
                    {isDisabledForUser && !isBlocked && (
                      <Text style={styles.timeSlotBlockedReason} numberOfLines={1}>
                        {currentUserType?.toLowerCase() === 'restricted' 
                          ? (() => {
                              const dayOfWeek = new Date(selectedDate).getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                              return isWeekend 
                                ? 'Hafta sonu 18:00-24:00 arası' 
                                : 'Hafta içi 09:00-18:00 arası';
                            })()
                          : ''}
                      </Text>
                    )}
                  </View>
                  {showWeather && !finalDisabled && (
                    <MaterialCommunityIcons 
                      name={weatherInfo?.isSnowy ? "weather-snowy" : "weather-rainy"} 
                      size={16} 
                      color={selectedTime === time ? "#FFFFFF" : "#2196F3"} 
                      style={{ position: 'absolute', top: 4, right: 4 }}
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
      {(() => {
        // Tüm gerekli seçimlerin yapılıp yapılmadığını kontrol et
        const hasDate = !!selectedDate;
        const hasTime = !!selectedTime;
        const hasPlayers = playerType === 'single' 
          ? !!selectedPartner  // Single için opponent seçilmeli
          : (!!selectedPartner && selectedOpponents.length === 2); // Double için partner + 2 opponent
        
        return hasDate && hasTime && hasPlayers;
      })() && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (reservationBlocked || checkingBlockStatus || isCreatingReservation) && styles.continueButtonDisabled
            ]}
            onPress={handleReservation}
            disabled={reservationBlocked || checkingBlockStatus}
          >
            <View style={[
              styles.continueButtonGradient,
              (reservationBlocked || checkingBlockStatus) && { backgroundColor: '#BDBDBD' }
            ]}>
              <Text style={styles.continueButtonText}>
                {t('reservation.continueToBooking')}
              </Text>
            </View>
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
          <View style={styles.userSelectorCard}>
            {/* Bottom Sheet Handle */}
            <View style={styles.modalHandle} />
            
            <View style={styles.userSelectorCardContent}>
              <View style={styles.userModalHeader}>
                <View style={styles.userModalHeaderContent}>
                  <Text style={styles.userModalTitle}>
                    {selectorMode === 'partner'
                      ? t('reservation.selectPartner')
                      : selectorMode === 'opponent'
                      ? t('reservation.selectOpponent')
                      : t('reservation.selectOpponents')}
                  </Text>
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
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Searchbar
                placeholder={t('reservation.searchUsers')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.userSearchbar}
                iconColor={selectorMode === 'opponents' ? "#FF9800" : "#54CE8F"}
                inputStyle={styles.userSearchbarInput}
              />

              <View style={styles.userListContainer}>
                <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                style={styles.userList}
                contentContainerStyle={styles.userListContent}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => {
                  const isSelected = selectorMode === 'partner' || selectorMode === 'opponent'
                    ? selectedPartner?.id === item.id
                    : selectedOpponents.some(opp => opp.id === item.id);
                  
                  const isDisabledInPartnerMode = selectorMode === 'partner' &&
                    selectedOpponents.some(opp => opp.id === item.id);
                  
                  const isDisabledInOpponentsMode = selectorMode === 'opponents' &&
                    selectedPartner?.id === item.id;
                  
                  // Belirli bir pozisyon için seçim yapılıyorsa, aynı kullanıcının başka bir pozisyonda seçilip seçilmediğini kontrol et
                  const isDisabledInSamePosition = selectorMode === 'opponents' &&
                    selectedOpponentIndex !== null &&
                    selectedOpponents.some((opp, index) => 
                      opp && opp.id === item.id && index !== selectedOpponentIndex
                    );
                  
                  // Belirli bir pozisyon için seçim yapılıyorsa, limit kontrolü yapma
                  const isDisabledDueToLimit = selectorMode === 'opponents' &&
                    selectedOpponentIndex === null &&
                    selectedOpponents.length >= 2 && !isSelected;
                  
                  const isDisabled = isDisabledInPartnerMode || isDisabledInOpponentsMode || isDisabledInSamePosition || isDisabledDueToLimit;

                  return (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleUserSelect(item)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.userItemContent,
                        isSelected && styles.userItemContentSelected,
                        isDisabled && styles.disabledUserItem
                      ]}>
                        <Avatar.Text
                          size={48}
                          label={getInitials(item.name)}
                          style={[
                            styles.userItemAvatar,
                            isSelected && styles.userItemAvatarSelected
                          ]}
                          labelStyle={styles.userItemAvatarLabel}
                        />
                        <View style={styles.userItemInfo}>
                          <Text 
                            style={[
                              styles.userItemName,
                              isSelected && styles.userItemNameSelected,
                              isDisabled && styles.disabledText
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.name}
                          </Text>
                          <Text 
                            style={[
                              styles.userItemDetails,
                              isSelected && styles.userItemDetailsSelected,
                              isDisabled && styles.disabledText
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.title || t('reservation.intermediate')}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedIconContainer}>
                            <MaterialCommunityIcons 
                              name={selectorMode === 'opponents' ? "checkbox-marked-circle" : "check-circle"} 
                              size={28} 
                              color={selectorMode === 'opponents' ? "#FF9800" : "#54CE8F"}
                            />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyUserList}>
                    <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyUserListText}>{t('reservation.noUsersFound')}</Text>
                  </View>
                )}
                />
              </View>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Success Snackbar */}
      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={2000}
        style={styles.successSnackbar}
        action={{
          label: t('common.ok'),
          onPress: () => {
            setShowSuccessSnackbar(false);
            navigation.getParent()?.navigate('Home');
          },
        }}
      >
        <View style={styles.snackbarContent}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.snackbarText}>{t('reservation.success')}</Text>
        </View>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        visible={showErrorSnackbar}
        onDismiss={() => setShowErrorSnackbar(false)}
        duration={4000}
        style={styles.errorSnackbar}
        action={{
          label: t('common.ok'),
          onPress: () => setShowErrorSnackbar(false),
        }}
      >
        <View style={styles.snackbarContent}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.snackbarText}>{errorMessage}</Text>
        </View>
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24, // px-6
    paddingTop: 48, // pt-12
    paddingBottom: 16, // pb-4
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20, // text-2xl
    fontWeight: '600',
    color: '#030213', // Dark text from design
  },
  topVisualSection: {
    height: 224, // h-56 equivalent
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topChipsContainer: {
    position: 'absolute',
    top: 16, // top-4
    right: 16, // right-4
    flexDirection: 'row',
    gap: 8, // gap-2
    zIndex: 1,
  },
  topChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // white/90
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
  },
  topChipText: {
    fontSize: 11, // text-xs (sm in design)
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  tennisBallContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: 24, // px-6 py-6
    backgroundColor: '#FFFFFF',
  },
  courtName: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213', // Dark text
    marginBottom: 12, // mb-3
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // mb-4
    gap: 8, // gap-2
  },
  locationText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DBEAFE', // blue-50 from design
    padding: 16, // p-4
    borderRadius: 12, // rounded-xl
    gap: 12, // gap-3
  },
  infoText: {
    flex: 1,
    fontSize: 14, // text-sm
    color: '#374151', // gray-700
    lineHeight: 20,
  },
  dateSection: {
    padding: 24, // px-6 py-6
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213', // Dark text
    marginBottom: 16, // mb-4
  },
  dateScrollView: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  dateScrollContent: {
    gap: 12, // gap-3
    paddingHorizontal: 0,
  },
  dateCard: {
    width: 80, // w-20 equivalent
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    borderWidth: 2,
    borderColor: '#E5E7EB', // gray-200
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // py-4
    marginRight: 12, // gap-3
  },
  dateCardSelected: {
    backgroundColor: '#54CE8F', // Primary green
    borderColor: '#54CE8F',
  },
  dateDayName: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#6B7280', // gray-500
    marginBottom: 4, // mb-1
  },
  dateDayNameSelected: {
    color: '#FFFFFF',
  },
  dateDayNumber: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#1F2937', // gray-800
  },
  dateDayNumberSelected: {
    color: '#FFFFFF',
  },
  dateCardDisabled: {
    opacity: 0.5,
  },
  gameTypeCardDisabled: {
    opacity: 0.5,
  },
  playerSelectorCardDisabled: {
    opacity: 0.5,
  },
  timeSlotsSection: {
    padding: 24, // px-6
    paddingBottom: 128, // pb-32 (for button space)
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithButton: {
    paddingBottom: 128, // Buton için alan bırak
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  timeSlotCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 12, // rounded-xl
    paddingVertical: 16, // py-4
    paddingHorizontal: 12,
    gap: 4, // gap-1
    // NOT: width ve marginRight inline style ile dinamik hesaplanıyor (3 sütun için zorunlu)
    // marginBottom inline style'da tanımlı
  },
  timeSlotCardSelected: {
    backgroundColor: '#54CE8F', // Primary green
    borderColor: '#54CE8F',
  },
  timeSlotCardDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  timeSlotCardBlocked: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
  },
  timeSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // gap-1
  },
  timeSlotText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#1F2937', // gray-800
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#BDBDBD',
  },
  timeSlotTextBlocked: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  timeSlotBlockedReason: {
    fontSize: 10,
    color: '#D32F2F',
    marginTop: 2,
    fontStyle: 'italic',
    fontWeight: '500',
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
    padding: 24, // px-6 py-4 (py-6 in design but py-4 for button)
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16, // py-4
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54CE8F', // Primary green
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  blockCard: {
    margin: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 12,
  },
  blockCardContent: {
    padding: 20,
  },
  blockContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  blockText: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  blockButton: {
    marginTop: 8,
    borderRadius: 12,
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
    padding: 24, // px-6 py-6
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
  },
  gameTypeCards: {
    flexDirection: 'row',
    gap: 12, // gap-3
  },
  gameTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  gameTypeCardSelected: {
    backgroundColor: '#F0FDF4', // green-50
    borderColor: '#54CE8F', // Primary green
  },
  gameTypeIconContainer: {
    width: 56, // w-14
    height: 56, // h-14
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // gray-100
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // gap-2
  },
  gameTypeIconContainerSelected: {
    backgroundColor: '#54CE8F', // Primary green
  },
  gameTypeTitle: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#6B7280', // gray-500
    marginTop: 8, // gap-2
    marginBottom: 4,
  },
  gameTypeTitleSelected: {
    color: '#54CE8F', // Primary green
  },
  gameTypeSubtitle: {
    fontSize: 12, // text-xs
    color: '#9CA3AF', // gray-400
  },
  gameTypeSubtitleSelected: {
    color: '#54CE8F',
  },
  // Players Section Styles
  playersSection: {
    padding: 24, // px-6 py-6
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
  },
  playerSubsectionTitle: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8, // mb-2
    marginTop: 0,
  },
  playerSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB', // gray-300
    borderStyle: 'dashed',
    borderRadius: 16, // rounded-2xl
    padding: 16, // p-4
    marginBottom: 16, // gap-4 for space-y-4
    minHeight: 80,
  },
  selectedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerAvatar: {
    marginRight: 12, // gap-3
  },
  playerAvatarLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedPlayerInfo: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213', // Dark text
    marginBottom: 4,
  },
  selectedPlayerDetails: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // gray-400
  },
  removePlayerButton: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSelectorPlaceholder: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
  },
  playerSelectorPlaceholderText: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // gray-400
  },
  opponentsContainer: {
    gap: 12,
  },
  // User Selector Modal Styles
  userSelectorModal: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  userSelectorCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    maxHeight: height * 0.85,
    minHeight: height * 0.65,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  userSelectorCardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  userListContainer: {
    flex: 1,
    marginTop: 8,
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  userModalHeaderContent: {
    flex: 1,
    marginRight: 16,
    minWidth: 0,
  },
  userModalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 6,
  },
  userModalSubtitle: {
    fontSize: 14,
    color: '#717182',
    lineHeight: 20,
  },
  userModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userSearchbar: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  userSearchbarInput: {
    fontSize: 16,
    color: '#1F2937',
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    paddingBottom: 16,
  },
  userItem: {
    marginBottom: 12,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userItemContentSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#54CE8F',
  },
  userItemAvatar: {
    backgroundColor: '#D1FAE5',
    marginRight: 12,
    flexShrink: 0,
  },
  userItemAvatarSelected: {
    backgroundColor: '#54CE8F',
  },
  userItemAvatarLabel: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 16,
  },
  userItemInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  userItemNameSelected: {
    color: '#054F31',
  },
  userItemDetails: {
    fontSize: 14,
    color: '#717182',
  },
  userItemDetailsSelected: {
    color: '#2E7D32',
  },
  selectedIconContainer: {
    flexShrink: 0,
    marginLeft: 8,
  },
  disabledUserItem: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  emptyUserList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyUserListText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    elevation: 6,
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    elevation: 6,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

export default CourtDetailScreen;

