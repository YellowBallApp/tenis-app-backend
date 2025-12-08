import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ReservationStackParamList, MainTabParamList } from '../navigation/MainTabNavigator';
import {
  Card,
  Title,
  Button,
  Text,
  TextInput,
  Chip,
  RadioButton,
  Surface,
  Portal,
  Modal,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';

// Takvim için Türkçe locale ayarları
LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık'
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün'
};

// İngilizce locale ayarları
LocaleConfig.locales['en'] = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'tr';
import { userService, reservationService, authService, courtService, weatherService, notificationService, reservationTemplateService, reservationTimeSlotService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { User, NotificationType } from '../types';

const { width, height } = Dimensions.get('window');

type ReservationScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ReservationStackParamList, 'ReservationList'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const ReservationScreen = () => {
  const navigation = useNavigation<ReservationScreenNavigationProp>();
  const route = useRoute();
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [playerType, setPlayerType] = useState('single');
  const [partnerName, setPartnerName] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [selectedOpponents, setSelectedOpponents] = useState<any[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'partner' | 'opponents'>('partner');
  const [currentStep, setCurrentStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [courtReservations, setCourtReservations] = useState<any[]>([]);
  const [allReservationsForDate, setAllReservationsForDate] = useState<any[]>([]);
  const [allBlockedHours, setAllBlockedHours] = useState<{[courtId: number]: Array<{hour: number, reason: string | null}>}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [courtSearchQuery, setCourtSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [weatherCache, setWeatherCache] = useState<{[key: string]: {isRainy: boolean, isSnowy: boolean}}>({});
  const [showWeatherWarningModal, setShowWeatherWarningModal] = useState(false);
  const [pendingTimeSelection, setPendingTimeSelection] = useState<string | null>(null);
  const [reservationBlocked, setReservationBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true);
  const [blockedHours, setBlockedHours] = useState<Array<{hour: number, reason: string | null}>>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const step2Ref = useRef<View>(null);
  const step3Ref = useRef<View>(null);
  const step4Ref = useRef<View>(null);

  // Dil değiştiğinde takvim locale'ini ayarla
  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  // Mevcut kullanıcıyı yükle
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profile = await authService.getProfile();
        setCurrentUserId(profile.id);
        setCurrentUserType(profile.userType || null);
        
        // Kullanıcı yüklendikten sonra rezervasyon engeli kontrolü yap
        const checkReservationBlock = async () => {
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
        };
        
        checkReservationBlock();
      } catch (error) {
        console.error('Kullanıcı profili yüklenirken hata:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Rezervasyonları yükleme fonksiyonu (yeniden kullanılabilir)
  const loadReservationsForDate = React.useCallback(async (date: string, courtsList: any[]) => {
    if (!date) {
      setAllReservationsForDate([]);
      setAllBlockedHours({});
      return;
    }

    try {
      // Seçilen tarihteki tüm rezervasyonları çek
      const allReservations = await reservationService.getReservationsByDate(date);
      setAllReservationsForDate(allReservations);

      // Her kort için bloke edilmiş saatleri çek
      const blockedHoursMap: {[courtId: number]: Array<{hour: number, reason: string | null}>} = {};
      
      if (courtsList.length > 0) {
        const promises = courtsList.map(async (court) => {
          try {
            const blocked = await reservationService.getBlockedHours(court.id, date);
            blockedHoursMap[court.id] = blocked || [];
          } catch (error) {
            console.error(`Kort ${court.id} için bloke saatler yüklenirken hata:`, error);
            blockedHoursMap[court.id] = [];
          }
        });
        await Promise.all(promises);
      }
      
      setAllBlockedHours(blockedHoursMap);
    } catch (error) {
      console.error('Tüm rezervasyonlar yüklenirken hata:', error);
      setAllReservationsForDate([]);
      setAllBlockedHours({});
    }
  }, []);

  // Kortları yükle (hem ilk yüklemede hem de focus olduğunda)
  const loadCourts = React.useCallback(async () => {
    try {
      const courtsList = await courtService.getActiveCourts();
      // Boolean değerleri normalize et (backend'den string olarak gelebilir)
      const normalizedCourts = courtsList.map((court: any) => ({
        ...court,
        closed: !!(court.closed),
        indoors: !!(court.indoors),
      }));
      setCourts(normalizedCourts);
    } catch (error) {
      console.error('Kortlar yüklenirken hata:', error);
    }
  }, []);

  // İlk yüklemede kortları yükle
  useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  // Rezervasyon engeli kontrolü - sadece useFocusEffect içinde yapılıyor

  // Sayfa her açıldığında tüm seçimleri resetle ve engel kontrolü yap
  useFocusEffect(
    React.useCallback(() => {
      // ÖNEMLİ: State'leri hemen sıfırla, async işlemlerden önce
      // Bugünün tarihini varsayılan olarak ayarla (court listesi için next available time hesaplaması için)
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Tüm state'leri sıfırla (ama selectedDate'i bugünün tarihi olarak ayarla)
      setSelectedDate(todayDate);
      setSelectedTime('');
      setSelectedCourt('');
      setPlayerType('single');
      setPartnerName('');
      setSelectedPartner(null);
      setSelectedOpponents([]);
      setCurrentStep(1);
      setSearchQuery('');
      setCourtSearchQuery('');
      setCourtFilter('all');
      setCurrentScrollY(0);
      setShowCalendar(false);
      setShowUserSelector(false);
      setShowSuccessSnackbar(false);
      setShowWeatherWarningModal(false);
      setPendingTimeSelection(null);
      setWeatherCache({});
      setCourtReservations([]);
      setBlockedHours([]);
      setAllReservationsForDate([]);
      setAllBlockedHours({});
      
      // İlk yükleme başladı
      setIsInitializing(true);
      
      // Kortları ve verileri yeniden yükle
      const loadAllData = async () => {
        try {
          const courtsList = await courtService.getActiveCourts();
          const normalizedCourts = courtsList.map((court: any) => ({
            ...court,
            closed: !!(court.closed),
            indoors: !!(court.indoors),
          }));
          setCourts(normalizedCourts);
          
          // Kortlar yüklendikten sonra rezervasyonları da yükle
          if (todayDate) {
            await loadReservationsForDate(todayDate, normalizedCourts);
          }
        } catch (error) {
          console.error('Veriler yüklenirken hata:', error);
        }
      };
      
      // Rezervasyon engeli kontrolü - her sayfa açıldığında kontrol et
      const checkReservationBlock = async () => {
        try {
          setCheckingBlockStatus(true);
          setReservationBlocked(false); // Önce sıfırla
          
          const profile = await authService.getProfile();
          const userId = profile.id;
          
          if (!userId) {
            setCheckingBlockStatus(false);
            return;
          }

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
          // Hata durumunda da kontrolü bitir
          setCheckingBlockStatus(false);
          setReservationBlocked(false);
        }
      };

      // Paralel olarak verileri yükle ve engel kontrolü yap
      Promise.all([loadAllData(), checkReservationBlock()]).then(() => {
        setIsInitializing(false);
        
        // Scroll'u en üste getir
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        
        // Animasyonları başlat
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }).catch((error) => {
        console.error('Sayfa yüklenirken hata:', error);
        setIsInitializing(false);
      });
    }, [fadeAnim, slideAnim, loadCourts, loadReservationsForDate])
  );

  // Tarih veya saat değiştiğinde seçimleri sıfırla
  useEffect(() => {
    // Partner ve rakipleri sıfırla
    setSelectedPartner(null);
    setSelectedOpponents([]);
  }, [selectedDate, selectedTime]);

  // Seçilen tarih için tüm kortların rezervasyonlarını yükle (court listesi için)
  useEffect(() => {
    if (selectedDate && courts.length > 0) {
      loadReservationsForDate(selectedDate, courts);
    }
  }, [selectedDate, courts, loadReservationsForDate]);

  // Seçilen tarih ve kort için rezervasyonları yükle
  useEffect(() => {
    const fetchCourtReservations = async () => {
      if (!selectedDate || !selectedCourt) {
        setCourtReservations([]);
        setBlockedHours([]);
        return;
      }

      try {
        // Seçilen tarihteki tüm rezervasyonları çek
        const allReservations = await reservationService.getReservationsByDate(selectedDate);
        
        // Sadece seçilen korta ait rezervasyonları filtrele
        const courtSpecificReservations = allReservations.filter(
          (reservation: any) => reservation.court.id === parseInt(selectedCourt)
        );
        
        // Reservation objelerini normalize et
        const normalizedReservations = courtSpecificReservations.map((reservation: any) => ({
          ...reservation,
          // Eğer reservation içinde boolean field'lar varsa normalize et
        }));
        setCourtReservations(normalizedReservations);

        // Bloke edilmiş saatleri çek
        try {
          const blocked = await reservationService.getBlockedHours(parseInt(selectedCourt), selectedDate);
          setBlockedHours(blocked || []);
        } catch (error) {
          console.error('Bloke edilmiş saatler yüklenirken hata:', error);
          setBlockedHours([]);
        }
      } catch (error) {
        console.error('Kort rezervasyonları yüklenirken hata:', error);
        setCourtReservations([]);
        setBlockedHours([]);
      }
    };

    fetchCourtReservations();
  }, [selectedDate, selectedCourt]);

  // Hava durumu bilgilerini yükle (açık kortlar için)
  useEffect(() => {
    const loadWeatherForTimes = async () => {
      if (!selectedDate || !selectedCourt) {
        setWeatherCache({});
        return;
      }

      const selectedCourtObj = courts.find(c => c.id === parseInt(selectedCourt));
      // Sadece açık kortlar için hava durumu kontrolü
      if (!selectedCourtObj || !!(selectedCourtObj.indoors)) {
        setWeatherCache({});
        return;
      }

      try {
        const cache: {[key: string]: {isRainy: boolean, isSnowy: boolean}} = {};
        
        // Mevcut saatleri al
        const times = availableTimes;
        
        // Paralel olarak tüm saatler için hava durumu bilgisini çek (daha hızlı)
        const weatherPromises = times.map(async (time) => {
          try {
            const weather = await weatherService.getWeatherForDateTime(selectedDate, time);
            if (weather) {
              // Debug: Yağmurlu saatleri logla
              if (weather.isRainy || weather.isSnowy) {
                console.log(`🌧️ Hava durumu: ${selectedDate} ${time} - Yağmur: ${weather.isRainy}, Kar: ${weather.isSnowy}, Code: ${weather.weatherCode}, Precipitation: ${weather.precipitation}`);
              }
              return { time, weather };
            } else {
              // Debug: Veri null döndü
              if (__DEV__) {
                console.log(`⚠️ Hava durumu verisi null: ${selectedDate} ${time}`);
              }
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
            // API'den gelen boolean değerleri normalize et (string olarak gelebilir)
            cache[result.time] = {
              isRainy: !!(result.weather.isRainy),
              isSnowy: !!(result.weather.isSnowy),
            };
          }
        });
        
        const rainyCount = Object.values(cache).filter(w => w.isRainy || w.isSnowy).length;
        if (rainyCount > 0) {
          console.log(`✅ Hava durumu cache yüklendi: ${selectedDate}, ${Object.keys(cache).length} saat için veri, ${rainyCount} yağmurlu saat`);
        }
        setWeatherCache(cache);
      } catch (error) {
        console.error('Hava durumu yüklenirken hata:', error);
        setWeatherCache({});
      }
    };

    loadWeatherForTimes();
    // availableTimes sabit olduğu için dependency'den çıkarıyoruz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedCourt, courts]);

  // Route params'tan opponent bilgisini al (sadece ilk yüklemede)
  useEffect(() => {
    const params = route.params as { opponentId?: string; opponentName?: string; matchChallengeId?: number } | undefined;
    const opponentId = params?.opponentId;
    if (opponentId && !selectedPartner && users.length > 0) {
      const opponentUser = users.find((user: User) => user.id === opponentId);
      if (opponentUser) {
        setSelectedPartner(opponentUser);
      }
    }
  }, [users, route.params]); // Sadece users ve route.params değiştiğinde çalış

  // Zaman dilimlerini yükle
  const loadTimeSlots = React.useCallback(async () => {
    try {
      if (!selectedDate) {
        // Varsayılan saat dilimlerini kullan
        const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
        setAvailableTimes(defaultSlots.length > 0 ? defaultSlots : [
          '09:00', '10:00', '11:00', '12:00', '13:00', 
          '14:00', '15:00', '16:00', '17:00', '18:00',
          '19:00', '20:00', '21:00', '22:00', '23:00'
        ]);
        return;
      }

      // Seçilen tarihin haftanın gününü hesapla (0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi)
      const dateObj = new Date(selectedDate);
      const dayOfWeek = dateObj.getDay();

      // Önce şablondan saat dilimlerini al
      try {
        const templateSlots = await reservationTemplateService.getActiveTimeSlotsForDay(dayOfWeek);
        if (templateSlots && templateSlots.length > 0) {
          setAvailableTimes(templateSlots);
          return;
        }
      } catch (error) {
        console.log('Şablon saat dilimleri alınamadı, varsayılan kullanılıyor:', error);
      }

      // Şablon yoksa, genel aktif saat dilimlerini kullan
      const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
      setAvailableTimes(defaultSlots.length > 0 ? defaultSlots : [
        '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ]);
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
      // Hata durumunda varsayılan saat dilimlerini kullan
      setAvailableTimes([
        '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ]);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  // Seçilen tarih ve saate göre müsait kullanıcıları yükle
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!selectedDate || !selectedTime) {
        // Tarih veya saat seçilmemişse tüm kullanıcıları yükle
        try {
          const usersList = await userService.getAllUsers();
          // Mevcut kullanıcıyı listeden çıkar
          const filteredUsers = currentUserId 
            ? usersList.filter((user: User) => user.id !== currentUserId)
            : usersList;
          setUsers(filteredUsers);
        } catch (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
        }
        return;
      }

      // Tarih ve saat seçilmişse o saat aralığında müsait kullanıcıları yükle
      try {
        // Tarih ve saati birleştir
        const [hours, minutes] = selectedTime.split(':');
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Bitiş saatini hesapla (1 saat sonra)
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);

        const availableUsersList = await userService.getAvailableUsersForTimeSlot(
          startDateTime.toISOString(),
          endDateTime.toISOString()
        );
        // Mevcut kullanıcıyı listeden çıkar
        const filteredUsers = currentUserId 
          ? availableUsersList.filter((user: User) => user.id !== currentUserId)
          : availableUsersList;
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Müsait kullanıcılar yüklenirken hata:', error);
      }
    };

    fetchAvailableUsers();
  }, [selectedDate, selectedTime, currentUserId]);

  // Sayfa her açıldığında zaman dilimlerini yükle
  useFocusEffect(
    React.useCallback(() => {
      loadTimeSlots();
    }, [loadTimeSlots])
  );

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Geçmiş saatleri kontrol et
  const isTimeSlotInPast = (timeSlot: string): boolean => {
    // Tarih seçilmemişse false döndür
    if (!selectedDate) {
      return false;
    }

    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Seçilen tarih ve saati birleştir
    const selectedDateTime = new Date(selectedDateObj);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Eğer seçilen tarih bugünden önceyse, tüm saatler geçmiş
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDateObj);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      return true; // Geçmiş bir tarih
    }
    
    // Eğer seçilen tarih bugünse, şu anki saatten önceki saatler geçmiş
    if (selectedDateOnly.getTime() === today.getTime()) {
      return selectedDateTime < now;
    }
    
    // Gelecekteki tarihler için false
    return false;
  };

  // Saatin bloke edilip edilmediğini kontrol et
  const isTimeSlotBlocked = (timeSlot: string): boolean => {
    if (!selectedCourt || blockedHours.length === 0) {
      return false;
    }

    const hour = parseInt(timeSlot.split(':')[0]);
    return blockedHours.some(bh => bh.hour === hour);
  };

  // Saatin bloke edilme nedeni
  const getBlockedReason = (timeSlot: string): string | null => {
    if (!selectedCourt || blockedHours.length === 0) {
      return null;
    }

    const hour = parseInt(timeSlot.split(':')[0]);
    const blockedHour = blockedHours.find(bh => bh.hour === hour);
    return blockedHour ? blockedHour.reason : null;
  };

  // Kullanıcı tipine göre saatin disabled olup olmadığını kontrol et
  const isTimeSlotDisabledForUser = (timeSlot: string): boolean => {
    // RESTRICTED kullanıcı değilse, sadece bloke kontrolü yap
    if (currentUserType !== 'restricted') {
      return false;
    }

    // Tarih seçilmemişse kontrol yapma
    if (!selectedDate) {
      return false;
    }

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay(); // 0 = Pazar, 6 = Cumartesi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Saati parse et
    const hour = parseInt(timeSlot.split(':')[0]);

    if (isWeekend) {
      // Hafta sonu: Sadece 18:00-24:00 arası izinli
      return hour < 18;
    } else {
      // Hafta içi: Sadece 9:00-18:00 arası izinli
      return hour < 9 || hour >= 18;
    }
  };

  // Belirli bir saatin rezerve olup olmadığını kontrol et
  const getReservationForTime = (timeSlot: string) => {
    return courtReservations.find((reservation: any) => {
      const reservationTime = new Date(reservation.startTime);
      const hours = reservationTime.getHours();
      const minutes = reservationTime.getMinutes();
      const reservationTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return reservationTimeStr === timeSlot;
    });
  };

  // Kort bilgilerini zenginleştir (UI için gradient ve icon)
  const getCourtDisplayInfo = (court: any) => {
    const surfaceMap: any = {
      grass: { surface: t('reservation.grass'), gradient: ['#4CAF50', '#2E7D32'] },
      clay: { surface: t('reservation.clay'), gradient: ['#FF9800', '#F57C00'] },
      hard: { surface: t('reservation.hard'), gradient: ['#2196F3', '#1976D2'] },
    };

    const surfaceInfo = surfaceMap[court.groundType] || surfaceMap.hard;
    const isIndoor = !!(court.indoors);

    return {
      ...court,
      type: isIndoor ? t('reservation.indoor') : t('reservation.outdoor'),
      surface: surfaceInfo.surface,
      gradient: surfaceInfo.gradient,
      icon: isIndoor ? 'home-roof' : 'weather-sunny',
    };
  };

  // Bir kort için sonraki müsait saati hesapla
  const getNextAvailableTime = (courtId: number, date: string): string | null => {
    if (!date) return null;

    const availableTimes = [
      '09:00', '10:00', '11:00', '12:00', '13:00', 
      '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    // Şu anki saati al
    const now = new Date();
    const selectedDateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDateObj);
    selectedDateOnly.setHours(0, 0, 0, 0);

    // Bu kort için rezervasyonları al (tüm rezervasyonlardan)
    const courtReservationsForDate = allReservationsForDate.filter(
      (res: any) => res.court.id === courtId
    );

    // Rezerve edilmiş saatleri bul
    const reservedTimes = courtReservationsForDate.map((res: any) => {
      const resTime = new Date(res.startTime);
      const hours = resTime.getHours();
      const minutes = resTime.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    // Bu kort için bloke saatleri al
    const courtBlockedHours = allBlockedHours[courtId] || [];

    // Müsait saati bul
    for (const time of availableTimes) {
      // Geçmiş saatleri atla (bugün ise)
      if (selectedDateOnly.getTime() === today.getTime()) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeDate = new Date(selectedDateObj);
        timeDate.setHours(hours, minutes, 0, 0);
        if (timeDate < now) continue;
      }

      // Rezerve edilmiş mi kontrol et
      if (reservedTimes.includes(time)) continue;

      // Bloke edilmiş mi kontrol et
      const hour = parseInt(time.split(':')[0]);
      if (courtBlockedHours.some(bh => bh.hour === hour)) continue;

      return time;
    }

    return null;
  };

  // Kortları filtrele (search ve filter'a göre)
  const getFilteredCourts = () => {
    let filtered = courts.filter((court) => !court.closed);

    // Search filter
    if (courtSearchQuery) {
      filtered = filtered.filter((court) => {
        const searchLower = courtSearchQuery.toLowerCase();
        return (
          court.name?.toLowerCase().includes(searchLower) ||
          court.groundType?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Type filter
    if (courtFilter === 'indoor') {
      filtered = filtered.filter((court) => !!(court.indoors));
    } else if (courtFilter === 'outdoor') {
      filtered = filtered.filter((court) => !(court.indoors));
    }

    return filtered;
  };

  const scrollToStep = (stepRef: React.RefObject<View | null>) => {
    setTimeout(() => {
      if (stepRef.current && scrollViewRef.current) {
        // measureInWindow: elementin ekrandaki pozisyonunu verir
        stepRef.current.measureInWindow((x, y, width, height) => {
          if (scrollViewRef.current && y !== undefined) {
            // y: step'in ekranın üstünden uzaklığı (şu anki scroll pozisyonunda)
            // currentScrollY: mevcut scroll pozisyonu
            // Step'i ekranın en üstüne getirmek için: mevcut scroll + step'in ekrandaki pozisyonu
            const targetScrollY = currentScrollY + y;
            
            scrollViewRef.current.scrollTo({ 
              y: targetScrollY,
              animated: true 
            });
          }
        });
      }
    }, 700);
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
    if (currentStep === 1) {
      setCurrentStep(2);
      scrollToStep(step2Ref);
    }
  };

  const handleCourtSelect = (courtId: string) => {
    navigation.navigate('CourtDetail', { courtId: parseInt(courtId) });
  };

  const handleTimeSelect = (time: string) => {
    // Açık kort ise ve yağışlı hava varsa uyarı göster
    const selectedCourtObj = courts.find(c => c.id === parseInt(selectedCourt));
    const isOutdoor = !!(selectedCourtObj && !selectedCourtObj.indoors);
    const weatherInfo = isOutdoor ? weatherCache[time] : null;
    const isWeatherBad = !!(weatherInfo && (!!(weatherInfo.isRainy) || !!(weatherInfo.isSnowy)));
    
    if (isWeatherBad) {
      // Uyarı göster, kullanıcı onaylarsa devam et
      setPendingTimeSelection(time);
      setShowWeatherWarningModal(true);
    } else {
      // Normal seçim
      confirmTimeSelection(time);
    }
  };

  const confirmTimeSelection = (time: string) => {
    setSelectedTime(time);
    if (currentStep === 3) {
      setCurrentStep(4);
      scrollToStep(step4Ref);
    }
  };

  const handleReservation = async () => {
    // Validasyon kontrolü
    if (!selectedDate || !selectedTime || !selectedCourt) {
      Alert.alert(
        t('common.error'),
        'Lütfen tarih, saat ve kort seçin',
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Rezervasyon başlatılıyor...', {
        courtId: selectedCourt,
        date: selectedDate,
        time: selectedTime,
        playerType,
      });

      // Tarih ve saati birleştir
      const [hours, minutes] = selectedTime.split(':');
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Bitiş saatini hesapla (1 saat sonra)
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 1);

      // Participant ID'lerini oluştur
      const participantIds: string[] = [];
      
      if (playerType === 'single' && selectedPartner) {
        participantIds.push(selectedPartner.id);
      } else if (playerType === 'double') {
        if (selectedPartner) {
          participantIds.push(selectedPartner.id);
        }
        selectedOpponents.forEach(opp => participantIds.push(opp.id));
      }

      // Notes oluştur
      const notes = playerType === 'single' 
        ? `${t('reservation.singlesMatch')}${selectedPartner ? ` - ${t('reservation.opponent')} ${selectedPartner.name}` : ''}` 
        : `${t('reservation.doublesMatch')}${selectedPartner ? ` - ${t('reservation.partner')} ${selectedPartner.name}` : ''}${selectedOpponents.length > 0 ? ` - ${t('reservation.opponents')} ${selectedOpponents.map(o => o.name).join(', ')}` : ''}`;

      const reservationData = {
        courtId: parseInt(selectedCourt),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: participantIds.length > 0 ? participantIds : undefined,
        notes,
      };

      console.log('📤 Rezervasyon verisi gönderiliyor:', reservationData);

      // Backend'e gönder
      const reservation = await reservationService.createReservation(reservationData);

      console.log('✅ Rezervasyon başarılı:', reservation);
      setIsLoading(false);

      // Formu temizle
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCourt('');
      setPlayerType('single');
      setSelectedPartner(null);
      setPartnerName('');
      setSelectedOpponents([]);
      setCurrentStep(1);

      // Başarılı mesajını göster
      setShowSuccessSnackbar(true);

      // 2 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
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
    }
  };

  const filteredUsers = users.filter((user: User) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: any) => {
    if (selectorMode === 'partner') {
      setSelectedPartner(user);
      setPartnerName(user.name);
      setShowUserSelector(false);
      setSearchQuery('');
    } else {
      // opponents mode - multiple select
      const isAlreadySelected = selectedOpponents.some(opp => opp.id === user.id);
      if (isAlreadySelected) {
        setSelectedOpponents(selectedOpponents.filter(opp => opp.id !== user.id));
      } else {
        if (selectedOpponents.length < 2) {
          setSelectedOpponents([...selectedOpponents, user]);
        }
      }
    }
  };

  const handleOpponentSelectorClose = () => {
    setShowUserSelector(false);
    setSearchQuery('');
  };

  const handlePlayerTypeChange = (type: string) => {
    setPlayerType(type);
    // Oyuncu tipi değiştiğinde seçimleri temizle
    setSelectedPartner(null);
    setPartnerName('');
    setSelectedOpponents([]);
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setCurrentScrollY(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1B1B1B" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Title style={styles.headerTitle}>{t('reservation.title')}</Title>
          </View>
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
                      onPress={() => navigation.navigate('Notifications')}
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

        {isInitializing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              },
              (reservationBlocked || checkingBlockStatus) && styles.disabledContainer
            ]}
            pointerEvents={reservationBlocked || checkingBlockStatus ? 'none' : 'auto'}
          >
          {/* Court Selection - Direct Display */}
          <View ref={step2Ref}>
            <Card style={styles.stepCard}>
              <Card.Content>

                  {/* Search Bar */}
                  <View style={styles.courtSearchContainer}>
                    <Searchbar
                      placeholder={t('reservation.searchCourts')}
                      onChangeText={setCourtSearchQuery}
                      value={courtSearchQuery}
                      style={styles.courtSearchBar}
                      iconColor="#2E7D32"
                      inputStyle={styles.courtSearchInput}
                    />
                  </View>

                  {/* Filter Chips */}
                  <View style={styles.courtFilterContainer}>
                    <TouchableOpacity
                      style={[
                        styles.courtFilterChip,
                        courtFilter === 'all' && styles.courtFilterChipActive
                      ]}
                      onPress={() => setCourtFilter('all')}
                    >
                      <Text style={[
                        styles.courtFilterChipText,
                        courtFilter === 'all' && styles.courtFilterChipTextActive
                      ]}>
                        {t('reservation.allCourts')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.courtFilterChip,
                        courtFilter === 'indoor' && styles.courtFilterChipActive
                      ]}
                      onPress={() => setCourtFilter('indoor')}
                    >
                      <Text style={[
                        styles.courtFilterChipText,
                        courtFilter === 'indoor' && styles.courtFilterChipTextActive
                      ]}>
                        {t('reservation.indoor')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.courtFilterChip,
                        courtFilter === 'outdoor' && styles.courtFilterChipActive
                      ]}
                      onPress={() => setCourtFilter('outdoor')}
                    >
                      <MaterialCommunityIcons 
                        name="weather-sunny" 
                        size={16} 
                        color={courtFilter === 'outdoor' ? "#FFFFFF" : "#666666"} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[
                        styles.courtFilterChipText,
                        courtFilter === 'outdoor' && styles.courtFilterChipTextActive
                      ]}>
                        {t('reservation.outdoor')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                
                <View style={styles.courtGrid}>
                  {getFilteredCourts().length === 0 ? (
                    <View style={styles.emptyCourtsContainer}>
                      <MaterialCommunityIcons name="tennis" size={48} color="#BDBDBD" />
                      <Text style={styles.emptyCourtsText}>
                        {t('reservation.noAvailableCourts')}
                      </Text>
                    </View>
                  ) : (
                    getFilteredCourts().map((court) => {
                        const displayCourt = getCourtDisplayInfo(court);
                        // selectedDate'i kullan (useFocusEffect'te bugünün tarihi olarak ayarlanıyor)
                        const nextAvailable = getNextAvailableTime(court.id, selectedDate);
                        return (
                          <TouchableOpacity
                            key={court.id}
                            onPress={() => {
                              if (!reservationBlocked && !checkingBlockStatus) {
                                handleCourtSelect(court.id.toString());
                              }
                            }}
                            style={[
                              styles.newCourtCardContainer,
                              (reservationBlocked || checkingBlockStatus) && styles.newCourtCardContainerDisabled
                            ]}
                            disabled={reservationBlocked || checkingBlockStatus}
                          >
                            <View style={styles.newCourtCard}>
                              {/* Top Right Chips */}
                              <View style={styles.newCourtChipsContainer}>
                                <View style={styles.newCourtChip}>
                                  <Text style={styles.newCourtChipText}>{displayCourt.surface}</Text>
                                </View>
                                <View style={styles.newCourtChip}>
                                  <MaterialCommunityIcons 
                                    name={displayCourt.icon as any} 
                                    size={14} 
                                    color="#666666" 
                                  />
                                  <Text style={styles.newCourtChipText}>{displayCourt.type}</Text>
                                </View>
                              </View>

                              {/* Tennis Ball Icon */}
                              <View style={styles.newCourtTennisBallContainer}>
                                <MaterialCommunityIcons 
                                  name="tennis-ball" 
                                  size={64} 
                                  color="#2E7D32" 
                                />
                              </View>

                              {/* Court Name */}
                              <Text style={styles.newCourtName}>{displayCourt.name}</Text>

                              {/* Location and Type */}
                              <View style={styles.newCourtLocationContainer}>
                                <MaterialCommunityIcons 
                                  name="map-marker-outline" 
                                  size={16} 
                                  color="#666666" 
                                />
                                <Text style={styles.newCourtLocationText}>
                                  {`${displayCourt.surface} • ${displayCourt.type}`}
                                </Text>
                              </View>

                              {/* Available Button and Next Available */}
                              <View style={styles.newCourtBottomContainer}>
                                <View style={styles.newCourtAvailableButton}>
                                  <Text style={styles.newCourtAvailableText}>
                                    {t('reservation.available')}
                                  </Text>
                                </View>
                                {nextAvailable && (
                                  <Text style={styles.newCourtNextAvailable}>
                                    {t('reservation.nextAvailable')} {nextAvailable}
                                  </Text>
                                )}
                              </View>

                              {/* Book Now Button */}
                              <TouchableOpacity
                                style={[
                                  styles.newCourtBookButton,
                                  (reservationBlocked || checkingBlockStatus) && styles.newCourtBookButtonDisabled
                                ]}
                                onPress={() => handleCourtSelect(court.id.toString())}
                                disabled={reservationBlocked || checkingBlockStatus}
                              >
                                <Text style={[
                                  styles.newCourtBookText,
                                  (reservationBlocked || checkingBlockStatus) && styles.newCourtBookTextDisabled
                                ]}>
                                  {t('reservation.bookNow')}
                                </Text>
                                <MaterialCommunityIcons 
                                  name="arrow-right" 
                                  size={20} 
                                  color={(reservationBlocked || checkingBlockStatus) ? "#BDBDBD" : "#2E7D32"} 
                                />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>

          </Animated.View>
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={!!showCalendar}
          onDismiss={() => setShowCalendar(false)}
          contentContainerStyle={styles.calendarModal}
        >
          <Card style={styles.calendarCard}>
            <Card.Content>
              <View style={styles.calendarHeader}>
                <View style={styles.calendarHeaderContent}>
                  <Title style={styles.calendarTitle}>{t('reservation.selectDate')}</Title>
                  <Text style={styles.calendarSubtitle}>
                    {t('reservation.maxDateRange') || 'Maksimum 1 hafta ileri tarih seçebilirsiniz'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: '#2E7D32',
                    selectedTextColor: '#FFFFFF'
                  }
                }}
                theme={{
                  backgroundColor: '#FFFFFF',
                  calendarBackground: '#FFFFFF',
                  textSectionTitleColor: '#2E7D32',
                  selectedDayBackgroundColor: '#2E7D32',
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: '#2E7D32',
                  dayTextColor: '#2F4F4F',
                  textDisabledColor: '#BDBDBD',
                  dotColor: '#2E7D32',
                  selectedDotColor: '#FFFFFF',
                  arrowColor: '#2E7D32',
                  monthTextColor: '#2E7D32',
                  indicatorColor: '#2E7D32',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
                minDate={new Date().toISOString().split('T')[0]}
                maxDate={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 7); // Bugünden 7 gün sonra
                  return maxDate.toISOString().split('T')[0];
                })()}
                firstDay={1}
              />
            </Card.Content>
          </Card>
        </Modal>

        {/* User Selector Modal */}
        <Modal
          dismissable={false}
          visible={!!showUserSelector}
          onDismiss={() => {
            setShowUserSelector(false);
            setSearchQuery('');
          }}
          contentContainerStyle={styles.userSelectorModal}
        >
          <Card style={styles.userSelectorCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>
                  {selectorMode === 'partner' 
                    ? (playerType === 'single' ? t('reservation.selectOpponent') : t('reservation.selectPartner'))
                    : t('reservation.selectOpponents')}
                </Title>
                <TouchableOpacity onPress={handleOpponentSelectorClose}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              {selectorMode === 'opponents' && (
                <View style={styles.selectedCountInfo}>
                  <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
                  <Text style={styles.selectedCountText}>
                    {selectedOpponents.length}/2 {t('reservation.opponentsSelected')}
                  </Text>
                </View>
              )}

              <Searchbar
                placeholder={t('reservation.searchUsers')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                iconColor={selectorMode === 'opponents' ? "#FF9800" : "#2E7D32"}
              />

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                style={styles.userList}
                renderItem={({ item }) => {
                  const isSelected = !!(selectorMode === 'partner' 
                    ? selectedPartner?.id === item.id
                    : selectedOpponents.some(opp => opp.id === item.id));
                  
                  // Partner modundaysa, rakiplerde seçili olanları disable et
                  const isDisabledInPartnerMode = !!(selectorMode === 'partner' && 
                    playerType === 'double' && 
                    selectedOpponents.some(opp => opp.id === item.id));
                  
                  // Opponents modundaysa, partner olarak seçili olanı disable et
                  const isDisabledInOpponentsMode = !!(selectorMode === 'opponents' && 
                    selectedPartner?.id === item.id);
                  
                  // Opponents modunda 2 kişi seçildiyse ve bu kullanıcı seçili değilse disable et
                  const isDisabledDueToLimit = !!(selectorMode === 'opponents' && 
                    selectedOpponents.length >= 2 && 
                    !isSelected);
                  
                  const isDisabled = !!(isDisabledInPartnerMode || 
                    isDisabledInOpponentsMode || 
                    isDisabledDueToLimit);
                  
                  return (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleUserSelect(item)}
                      disabled={!!isDisabled}
                    >
                      <View style={[
                        styles.userItemContent,
                        isDisabled && styles.disabledUserItem
                      ]}>
                        <View style={styles.userAvatar}>
                          <MaterialCommunityIcons name="account" size={24} color={
                            isDisabled
                              ? "#BDBDBD" 
                              : (selectorMode === 'opponents' ? "#FF9800" : "#2E7D32")
                          } />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={[
                            styles.userName,
                            isDisabled && styles.disabledText
                          ]}>
                            {item.name}
                            {isDisabledInPartnerMode && ` ${t('reservation.selectedAsOpponent')}`}
                            {isDisabledInOpponentsMode && ` ${t('reservation.selectedAsPartner')}`}
                          </Text>
                          <Text style={[
                            styles.userEmail,
                            isDisabled && styles.disabledText
                          ]}>{item.email}</Text>
                        </View>
                        {!!isSelected && (
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
                  <View style={styles.emptyList}>
                    <MaterialCommunityIcons name="account-search" size={48} color="#BDBDBD" />
                    <Text style={styles.emptyListText}>{t('reservation.noUsersFound')}</Text>
                  </View>
                )}
              />

              {selectorMode === 'opponents' && selectedOpponents.length > 0 && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleOpponentSelectorClose}
                >
                  <LinearGradient
                    colors={['#FF9800', '#F57C00']}
                    style={styles.confirmButtonGradient}
                  >
                    <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>{t('common.ok')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={2000}
        style={styles.successSnackbar}
        action={{
          label: t('common.ok'),
          onPress: () => {
            setShowSuccessSnackbar(false);
            navigation.navigate('Home');
          },
        }}
      >
        <View style={styles.snackbarContent}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.snackbarText}>{t('reservation.success')}</Text>
        </View>
      </Snackbar>

      {/* Weather Warning Modal */}
      <Portal>
        <Modal
          visible={!!showWeatherWarningModal}
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
                      pendingTimeSelection && !!(weatherCache[pendingTimeSelection]?.isSnowy)
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
                {pendingTimeSelection && Boolean(weatherCache[pendingTimeSelection]?.isSnowy)
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  progressText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  stepCard: {
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeStepCard: {
    borderColor: '#4CAF50',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activeStepNumber: {
    backgroundColor: '#4CAF50',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  dateSelector: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  dateSelectorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
  },
  dateSelectorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#757575',
    flex: 1,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeChipContainer: {
    width: (width - 60) / 3,
    marginBottom: 12,
  },
  timeChip: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  selectedTimeChip: {
    borderColor: '#2E7D32',
  },
  timeChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  selectedTimeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledTimeChip: {
    opacity: 0.7,
    borderColor: '#BDBDBD',
  },
  disabledTimeChipText: {
    color: '#9E9E9E',
  },
  timeChipContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservedByText: {
    fontSize: 10,
    color: '#757575',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  courtGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  courtCardContainer: {
    width: (width - 50) / 2,
    marginBottom: 15,
  },
  courtCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  selectedCourtCard: {
    borderColor: '#FFFFFF',
  },
  disabledCourtCard: {
    opacity: 0.5,
    borderColor: '#BDBDBD',
  },
  disabledCourtText: {
    color: '#757575',
  },
  courtIconContainer: {
    marginBottom: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 6,
    textAlign: 'center',
  },
  selectedCourtName: {
    color: '#FFFFFF',
  },
  courtDetails: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  selectedCourtDetails: {
    color: 'rgba(255,255,255,0.9)',
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  radioContainer: {
    borderRadius: 16,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioLabel: {
    fontSize: 16,
    color: '#1B1B1B',
    marginLeft: 12,
    fontWeight: '500',
  },
  partnerSection: {
    marginTop: 20,
  },
  opponentsSection: {
    marginTop: 20,
  },
  partnerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  selectedOpponentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedOpponentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9800',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOpponentText: {
    color: '#F57C00',
    fontWeight: '600',
    marginRight: 8,
    fontSize: 14,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  userSelector: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  userSelectorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userSelectorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#757575',
    flex: 1,
  },
  selectedUserText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userSelectorModal: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  userSelectorCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  userList: {
    maxHeight: height * 0.45,
  },
  userItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 12,
  },
  disabledUserItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#BDBDBD',
  },
  selectedCountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  summaryGradient: {
    padding: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginLeft: 12,
  },
  summaryContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#1B1B1B',
    fontWeight: '500',
    flex: 1,
  },
  summaryTextContainer: {
    flex: 1,
  },
  reservationButtonContainer: {
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  reservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonIcon: {
    marginRight: 12,
  },
  reservationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarModal: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  calendarCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  calendarHeaderContent: {
    flex: 1,
    marginRight: 10,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  calendarSubtitle: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
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
  disabledContainer: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  disabledSelector: {
    opacity: 0.5,
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
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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
  emptyCourtsContainer: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCourtsText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
  },
  courtSearchContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  courtSearchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  courtSearchInput: {
    fontSize: 16,
  },
  courtFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  courtFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  courtFilterChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  courtFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  courtFilterChipTextActive: {
    color: '#FFFFFF',
  },
  newCourtCardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  newCourtCardContainerDisabled: {
    opacity: 0.5,
  },
  newCourtCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  newCourtChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  newCourtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  newCourtChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  newCourtTennisBallContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  newCourtName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  newCourtLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  newCourtLocationText: {
    fontSize: 14,
    color: '#666666',
  },
  newCourtBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newCourtAvailableButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newCourtAvailableText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  newCourtNextAvailable: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
    textAlign: 'right',
  },
  newCourtBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    gap: 4,
  },
  newCourtBookText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  newCourtBookButtonDisabled: {
    opacity: 0.5,
  },
  newCourtBookTextDisabled: {
    color: '#BDBDBD',
  },
});

export default ReservationScreen;