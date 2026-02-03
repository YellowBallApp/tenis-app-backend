import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  Pressable,
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
  const [activeReservation, setActiveReservation] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reservationToReject, setReservationToReject] = useState<any | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const step2Ref = useRef<View>(null);
  const step3Ref = useRef<View>(null);
  const step4Ref = useRef<View>(null);
  const previousRouteParamsRef = useRef<any>(null);
  const hasProcessedParamsRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const previousFocusTimeRef = useRef<number>(0);
  const currentSelectionsRef = useRef<{date: string, time: string, court: string}>({date: '', time: '', court: ''});

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
              // Aktif rezervasyonun detaylarını al
              const allReservations = await reservationService.getMyReservations();
              const now = new Date();
              const activeRes = allReservations.find((reservation: any) => {
                const endTime = new Date(reservation.endTime);
                return endTime >= now;
              });
              setActiveReservation(activeRes || null);
              setReservationBlocked(true);
              setBlockReason('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
              setCheckingBlockStatus(false);
              return;
            }
            setActiveReservation(null);

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

  // Component mount olduğunda state'leri resetle (sadece ilk mount'ta)
  useEffect(() => {
    // Sadece eğer route params yoksa reset yap
    const currentRouteParams = route.params as { courtId?: number; selectedDate?: string; selectedTime?: string } | undefined;
    const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
    const hasValidParams = paramsExists && 
      (currentRouteParams?.courtId !== undefined || 
       (currentRouteParams?.selectedDate !== undefined && currentRouteParams?.selectedDate !== '') ||
       (currentRouteParams?.selectedTime !== undefined && currentRouteParams?.selectedTime !== ''));
    
    if (!hasValidParams) {
      const todayDate = new Date().toISOString().split('T')[0];
      setSelectedDate(todayDate);
      setSelectedTime('');
      setSelectedCourt('');
      setCurrentStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece mount'ta çalış

  // Rezervasyon engeli kontrolü - sadece useFocusEffect içinde yapılıyor

  // Navigation listener - route değişikliklerini dinle
  // SADECE sayfa ilk açıldığında veya gerçekten params değiştiğinde çalışır
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentRouteParams = route.params as { courtId?: number; selectedDate?: string; selectedTime?: string } | undefined;
      
      // Kullanıcı etkileşimlerini kontrol et - eğer varsa hiçbir şey yapma
      // selectedDate, selectedTime, selectedCourt state'lerini direkt kontrol et (ref yerine)
      if (selectedDate || selectedTime || selectedCourt) {
        // Kullanıcı etkileşimleri var, sadece params'ları temizle ama state'leri resetleme
        const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
        const hasValidParams = paramsExists && 
          (currentRouteParams?.courtId !== undefined || 
           (currentRouteParams?.selectedDate !== undefined && currentRouteParams?.selectedDate !== '') ||
           (currentRouteParams?.selectedTime !== undefined && currentRouteParams?.selectedTime !== ''));
        
        // Eğer params varsa ama artık kullanılmıyorsa, sessizce temizle
        if (hasValidParams) {
          setTimeout(() => {
            navigation.setParams({
              courtId: undefined,
              selectedDate: undefined,
              selectedTime: undefined,
            });
          }, 0);
        }
        
        // Route params'ı güncelle (değişiklik takibi için)
        previousRouteParamsRef.current = currentRouteParams;
        return; // Erken çık, state'leri resetleme
      }
      
      // ÖNCE: Her zaman params kontrolü yap (değişiklik kontrolü yapmadan)
      const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
      const hasValidParams = paramsExists && 
        (currentRouteParams.courtId !== undefined || 
         (currentRouteParams.selectedDate !== undefined && currentRouteParams.selectedDate !== '') ||
         (currentRouteParams.selectedTime !== undefined && currentRouteParams.selectedTime !== ''));
      
    // Params yoksa VEYA route name ReservationList değilse state'leri resetle ve params'ları temizle
    // ANCAK sadece state'ler boşsa reset yap
    if (!hasValidParams || route.name !== 'ReservationList') {
      // Sadece eğer state'ler zaten boşsa reset yap
      if (!selectedDate && !selectedTime && !selectedCourt) {
        const todayDate = new Date().toISOString().split('T')[0];
        setSelectedDate(todayDate);
        setSelectedTime('');
        setSelectedCourt('');
        setCurrentStep(1);
      }
      hasProcessedParamsRef.current = false;
      
      // Params varsa ama geçersizse veya route name ReservationList değilse, params'ları temizle
      // ANCAK sadece gerçekten params varsa ve undefined değilse
      if (paramsExists && (!hasValidParams || route.name !== 'ReservationList')) {
        // setParams çağrısını setTimeout ile geciktir ki bu listener tekrar tetiklenmesin
        setTimeout(() => {
          navigation.setParams({
            courtId: undefined,
            selectedDate: undefined,
            selectedTime: undefined,
          });
        }, 0);
      }
    }
      
      // Route params'ı güncelle (değişiklik takibi için)
      previousRouteParamsRef.current = currentRouteParams;
    });

    return unsubscribe;
  }, [navigation, route.params, selectedDate, selectedTime, selectedCourt]);

  // Sayfa her açıldığında engel kontrolü yap (reset yapma, sadece route params kontrolü)
  useFocusEffect(
    React.useCallback(() => {
      // Route params kontrol et
      const currentRouteParams = route.params as { courtId?: number; selectedDate?: string; selectedTime?: string } | undefined;
      const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
      const hasValidParams = paramsExists && 
        (currentRouteParams?.courtId !== undefined || 
         (currentRouteParams?.selectedDate !== undefined && currentRouteParams?.selectedDate !== '') ||
         (currentRouteParams?.selectedTime !== undefined && currentRouteParams?.selectedTime !== ''));
      
      // Eğer kullanıcı zaten bir şeyler seçmişse ve params yoksa, state'leri koru
      // Sadece gerçekten yeni params geldiğinde veya state'ler boşsa işlem yap
      // DİREKT state kontrolü yap (ref yerine) çünkü ref güncellemesi asenkron olabilir
      const hasUserSelections = selectedDate || selectedTime || selectedCourt;
      if (!hasValidParams && hasUserSelections) {
        // Kullanıcı etkileşimleri var, sadece modal state'lerini temizle ve verileri yenile
        setShowCalendar(false);
        setShowUserSelector(false);
        setShowWeatherWarningModal(false);
        setPendingTimeSelection(null);
        
        // Verileri yeniden yükle ama state'leri koru
        const loadDataOnly = async () => {
          try {
            const courtsList = await courtService.getActiveCourts();
            const normalizedCourts = courtsList.map((court: any) => ({
              ...court,
              closed: !!(court.closed),
              indoors: !!(court.indoors),
            }));
            setCourts(normalizedCourts);
            
            // Rezervasyonları yükle
            // DİREKT state kontrolü yap (ref yerine)
            const dateToLoad = selectedDate || new Date().toISOString().split('T')[0];
            if (dateToLoad) {
              await loadReservationsForDate(dateToLoad, normalizedCourts);
            }
          } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
          }
        };
        
        // Rezervasyon engeli kontrolü
        const checkReservationBlock = async () => {
          try {
            setCheckingBlockStatus(true);
            setReservationBlocked(false);
            
            const profile = await authService.getProfile();
            const userId = profile.id;
            
            if (!userId) {
              setCheckingBlockStatus(false);
              return;
            }

            const hasActive = await reservationService.hasActiveReservation();
            if (hasActive) {
              // Aktif rezervasyonun detaylarını al
              const allReservations = await reservationService.getMyReservations();
              const now = new Date();
              const activeRes = allReservations.find((reservation: any) => {
                const endTime = new Date(reservation.endTime);
                return endTime >= now;
              });
              setActiveReservation(activeRes || null);
              setReservationBlocked(true);
              setBlockReason('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
              setCheckingBlockStatus(false);
              return;
            }
            setActiveReservation(null);

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

        Promise.all([loadDataOnly(), checkReservationBlock()]).then(() => {
          setIsInitializing(false);
        }).catch((error) => {
          console.error('Sayfa yüklenirken hata:', error);
          setIsInitializing(false);
        });
        
        return; // Erken çık, state'leri resetleme
      }

      // Async işlemleri yapmak için IIFE kullan
      (async () => {
        let savedCourtId: number | null = null;
        let savedDate: string | null = null;
        let savedTime: string | null = null;
        let hasParams = false;
        
        // Eğer kullanıcı zaten bir şeyler seçmişse, params'ları işleme (kullanıcı etkileşimlerini koru)
        // DİREKT state kontrolü yap (ref yerine) çünkü ref güncellemesi asenkron olabilir
        const hasUserSelections = selectedDate || selectedTime || selectedCourt;
        
        // Sadece eğer kullanıcı etkileşimleri YOKSA ve params varsa, state'leri güncelle
        if (!hasUserSelections && hasValidParams && route.name === 'ReservationList') {
          // Params varsa state'leri güncelle
          hasParams = true;
          savedCourtId = currentRouteParams!.courtId ? parseInt(String(currentRouteParams!.courtId)) : null;
          savedDate = currentRouteParams!.selectedDate || null;
          savedTime = currentRouteParams!.selectedTime || null;
          
          if (savedDate) setSelectedDate(savedDate);
          if (savedTime) setSelectedTime(savedTime);
          if (savedCourtId) {
            setCurrentStep(2);
          }
          
          // Route params kullanıldıktan sonra temizle
          // setTimeout ile geciktir ki useFocusEffect tekrar tetiklenmesin
          setTimeout(() => {
            navigation.setParams({
              courtId: undefined,
              selectedDate: undefined,
              selectedTime: undefined,
            });
          }, 0);
          hasProcessedParamsRef.current = true;
        } else {
          // Params yoksa veya route name ReservationList değilse, params'ları temizle
          // Bu, önceki navigation'lardan kalan params'ları temizler
          // ANCAK sadece kullanıcı etkileşimleri yoksa
          if (!hasUserSelections && paramsExists && (!hasValidParams || route.name !== 'ReservationList')) {
            // Route params'ları açıkça temizle
            // setTimeout ile geciktir ki useFocusEffect tekrar tetiklenmesin
            setTimeout(() => {
              navigation.setParams({
                courtId: undefined,
                selectedDate: undefined,
                selectedTime: undefined,
              });
            }, 0);
          }
          // Kullanıcı etkileşimleri varsa, params'ları işleme
          if (hasUserSelections) {
            hasProcessedParamsRef.current = true;
          } else {
            hasProcessedParamsRef.current = false;
          }
        }
        
        // AsyncStorage kontrolü (sadece route params yoksa VE kullanıcı etkileşimleri yoksa)
        if (!hasValidParams && !hasUserSelections) {
          const paramsStr = await AsyncStorage.getItem('reservationParams');
          
          if (paramsStr) {
            try {
              const params = JSON.parse(paramsStr);
              if (params.courtId || params.selectedDate || params.selectedTime) {
                hasParams = true;
                savedCourtId = params.courtId ? parseInt(String(params.courtId)) : null;
                savedDate = params.selectedDate || null;
                savedTime = params.selectedTime || null;
                
                // AsyncStorage'dan gelen params varsa state'leri güncelle
                if (savedDate) setSelectedDate(savedDate);
                if (savedTime) setSelectedTime(savedTime);
                if (savedCourtId) {
                  setCurrentStep(2);
                }
                hasProcessedParamsRef.current = true;
              }
              // Params'ları temizle
              AsyncStorage.removeItem('reservationParams');
            } catch (error) {
              console.error('Reservation params parse error:', error);
              AsyncStorage.removeItem('reservationParams');
            }
          }
        }

      // Ortak state'leri sıfırlama - sadece modal state'lerini temizle
      setShowCalendar(false);
      setShowUserSelector(false);
      setShowWeatherWarningModal(false);
      setPendingTimeSelection(null);

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
          
          // Kortlar yüklendikten sonra, eğer params'tan courtId varsa VE kullanıcı etkileşimleri yoksa, seçili kortu set et
          // DİREKT state kontrolü yap (ref yerine)
          const hasUserSelectionsNow = selectedDate || selectedTime || selectedCourt;
          if (savedCourtId && normalizedCourts.some((c: any) => c.id === savedCourtId) && !hasUserSelectionsNow) {
            setSelectedCourt(savedCourtId.toString());
          } else if (!hasParams && !selectedCourt && !hasUserSelectionsNow) {
            // Params yoksa VE court seçimi de yoksa VE kullanıcı etkileşimleri yoksa, court seçimini temizle
            // Eğer kullanıcı zaten bir court seçmişse, onu koru
            setSelectedCourt('');
          }
          // Eğer kullanıcı etkileşimleri varsa, hiçbir şey yapma (mevcut seçimi koru)
          
          // Kortlar yüklendikten sonra rezervasyonları da yükle
          // DİREKT state kontrolü yap (ref yerine)
          const dateToLoad = savedDate || selectedDate || new Date().toISOString().split('T')[0];
          if (dateToLoad) {
            await loadReservationsForDate(dateToLoad, normalizedCourts);
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
            // Aktif rezervasyonun detaylarını al
            const allReservations = await reservationService.getMyReservations();
            const now = new Date();
            const activeRes = allReservations.find((reservation: any) => {
              const endTime = new Date(reservation.endTime);
              return endTime >= now;
            });
            setActiveReservation(activeRes || null);
            setReservationBlocked(true);
            setBlockReason('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
            setCheckingBlockStatus(false);
            return;
          }
          setActiveReservation(null);

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
      })(); // IIFE'yi çağır
    }, [fadeAnim, slideAnim, loadCourts, loadReservationsForDate, navigation, selectedDate, selectedTime, selectedCourt, route.params, route.name])
  );


  // Route params değiştiğinde state'leri kontrol et ve resetle
  // SADECE yeni params geldiğinde çalışır, kullanıcı etkileşimlerinde reset yapmaz
  useEffect(() => {
    const currentRouteParams = route.params as { courtId?: number; selectedDate?: string; selectedTime?: string } | undefined;
    
    // Kullanıcı etkileşimlerini kontrol et - eğer varsa hiçbir şey yapma
    // selectedDate, selectedTime, selectedCourt state'lerini direkt kontrol et (ref yerine)
    // Çünkü ref güncellemesi asenkron olabilir
    if (selectedDate || selectedTime || selectedCourt) {
      // Kullanıcı etkileşimleri var, sadece params'ları temizle ama state'leri resetleme
      const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
      const hasValidParams = paramsExists && 
        (currentRouteParams?.courtId !== undefined || 
         (currentRouteParams?.selectedDate !== undefined && currentRouteParams?.selectedDate !== '') ||
         (currentRouteParams?.selectedTime !== undefined && currentRouteParams?.selectedTime !== ''));
      
      // Eğer params varsa ama artık kullanılmıyorsa, sessizce temizle
      if (hasValidParams) {
        setTimeout(() => {
          navigation.setParams({
            courtId: undefined,
            selectedDate: undefined,
            selectedTime: undefined,
          });
        }, 0);
      }
      
      // Önceki params'ı güncelle
      previousRouteParamsRef.current = currentRouteParams;
      return; // Erken çık, state'leri resetleme
    }
    
    // Önceki params ile karşılaştır - sadece gerçekten değiştiyse işlem yap
    const previousParams = previousRouteParamsRef.current;
    const paramsChanged = JSON.stringify(previousParams) !== JSON.stringify(currentRouteParams);
    
    // Eğer params değişmediyse, hiçbir şey yapma
    if (!paramsChanged) {
      return;
    }
    
    // Route params'ı kontrol et - daha agresif kontrol
    // route.params undefined, null, boş obje {} veya tüm değerler undefined/boş ise geçersiz say
    const paramsExists = currentRouteParams !== undefined && currentRouteParams !== null;
    const isEmptyObject = paramsExists && Object.keys(currentRouteParams).length === 0;
    const hasValidParams = paramsExists && !isEmptyObject &&
      (currentRouteParams.courtId !== undefined || 
       (currentRouteParams.selectedDate !== undefined && currentRouteParams.selectedDate !== '') ||
       (currentRouteParams.selectedTime !== undefined && currentRouteParams.selectedTime !== ''));
    
    // Params yoksa VEYA route name ReservationList değilse state'leri resetle ve params'ları temizle
    // ANCAK sadece gerçekten params yoksa veya route name farklıysa
    if (!hasValidParams || route.name !== 'ReservationList') {
      // Sadece eğer state'ler zaten boşsa veya ilk yüklemedeyse reset yap
      if (!selectedDate && !selectedTime && !selectedCourt) {
        const todayDate = new Date().toISOString().split('T')[0];
        setSelectedDate(todayDate);
        setSelectedTime('');
        setSelectedCourt('');
        setCurrentStep(1);
      }
      
      // Params varsa ama geçersizse veya route name ReservationList değilse, params'ları temizle
      // ANCAK sadece gerçekten params varsa ve undefined değilse
      if (paramsExists && (!hasValidParams || route.name !== 'ReservationList')) {
        // setParams çağrısını setTimeout ile geciktir ki bu useEffect tekrar tetiklenmesin
        setTimeout(() => {
          navigation.setParams({
            courtId: undefined,
            selectedDate: undefined,
            selectedTime: undefined,
          });
        }, 0);
      }
    }
    
    // Önceki params'ı güncelle
    previousRouteParamsRef.current = currentRouteParams;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, route.name, selectedDate, selectedTime, selectedCourt]);

  // Seçimleri ref'te sakla (navigation listener için)
  useEffect(() => {
    currentSelectionsRef.current = {
      date: selectedDate,
      time: selectedTime,
      court: selectedCourt,
    };
  }, [selectedDate, selectedTime, selectedCourt]);

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

  // Route params'tan opponent bilgisini al
  useEffect(() => {
    const params = route.params as { opponentId?: string; opponentName?: string; matchChallengeId?: number } | undefined;
    const opponentId = params?.opponentId;
    if (opponentId && !selectedPartner && users.length > 0) {
      const opponentUser = users.find((user: User) => user.id === opponentId);
      if (opponentUser) {
        setSelectedPartner(opponentUser);
      }
    }
  }, [users, route.params]);

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
        // Tarih ve saati birleştir (yerel saat diliminde)
        const [hours, minutes] = selectedTime.split(':');
        const [year, month, day] = selectedDate.split('-').map(Number);
        const startDateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

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
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Seçilen tarih ve saati birleştir (yerel saat diliminde)
    const selectedDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Eğer seçilen tarih bugünden önceyse, tüm saatler geçmiş
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(year, month - 1, day, 0, 0, 0, 0);
    
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

      // Tarih ve saati birleştir (yerel saat diliminde)
      const [hours, minutes] = selectedTime.split(':');
      const [year, month, day] = selectedDate.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

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
        try {
          (navigation as any).navigate('MainTabs', {
            screen: 'Home',
            params: { showReservationSuccess: true }
          });
        } catch (err) {
          // Fallback: direkt Home'a git
          try {
            (navigation as any).navigate('Home', { showReservationSuccess: true });
          } catch (err2) {
            navigation.goBack();
          }
        }
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

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // PENDING rezervasyonda kullanıcının kendi yanıt kaydı (participant ise ve bekliyorsa butonlar gösterilir)
  const getMyResponse = (reservation: any) => {
    if (!currentUserId || !reservation.participantResponses?.length) return null;
    return reservation.participantResponses.find((r: any) => r.userId === currentUserId) ?? null;
  };

  // Rezervasyon için takımları belirle
  const getTeamsForReservation = (reservation: any) => {
    const owner = reservation.user;
    const participants = reservation.participants || [];
    const notes = reservation.notes || '';
    
    // Notes'tan maç tipini anla
    const isDoubles = notes.includes('Çiftler') || notes.includes('doubles') || notes.includes('Doubles');
    
    // Participants sayısına göre de anla
    // 1 participant = tekler, 3 participant = çiftler
    const participantCount = participants.length;
    const isDoubleMatch = isDoubles || participantCount === 3;
    
    if (isDoubleMatch) {
      // Çiftler: owner + partner vs 2 rakip
      const partner = participants[0] || null;
      const opponents = participants.slice(1) || [];
      return {
        team1: [owner, partner].filter(Boolean),
        team2: opponents,
        isDouble: true,
      };
    } else {
      // Tekler: owner vs 1 rakip
      const opponent = participants[0] || null;
      return {
        team1: [owner].filter(Boolean),
        team2: opponent ? [opponent] : [],
        isDouble: false,
      };
    }
  };

  const handleCancelReservation = (reservation: any) => {
    console.log('handleCancelReservation çağrıldı, reservation:', reservation);
    setReservationToDelete(reservation);
    setShowDeleteDialog(true);
  };

  const confirmCancelReservation = async () => {
    if (!reservationToDelete) return;
    
    console.log('Sil butonu tıklandı, rezervasyon iptal ediliyor...');
    setShowDeleteDialog(false);
    
    try {
      await reservationService.cancelReservation(reservationToDelete.id);
      console.log('Rezervasyon iptal edildi');
      setActiveReservation(null);
      setReservationBlocked(false);
      setBlockReason('');
      // Rezervasyon engeli kontrolünü yeniden yap
      const checkReservationBlock = async () => {
        try {
          setCheckingBlockStatus(true);
          const hasActive = await reservationService.hasActiveReservation();
          if (hasActive) {
            const allReservations = await reservationService.getMyReservations();
            const now = new Date();
            const activeRes = allReservations.find((reservation: any) => {
              const endTime = new Date(reservation.endTime);
              return endTime >= now;
            });
            setActiveReservation(activeRes || null);
            setReservationBlocked(true);
            setBlockReason('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
          } else {
            setActiveReservation(null);
            setReservationBlocked(false);
            setBlockReason('');
          }
          setCheckingBlockStatus(false);
        } catch (error) {
          setCheckingBlockStatus(false);
          setReservationBlocked(false);
        }
      };
      await checkReservationBlock();
      Alert.alert(
        t('common.success') || 'Başarılı',
        t('reservation.cancelled') || 'Rezervasyon iptal edildi'
      );
      setReservationToDelete(null);
    } catch (error: any) {
      console.error('Rezervasyon iptal hatası:', error);
      Alert.alert(
        t('common.error') || 'Hata',
        error.response?.data?.message || t('reservation.cancelError') || 'Rezervasyon iptal edilemedi'
      );
      setReservationToDelete(null);
    }
  };

  const handleAcceptReservation = async (reservation: any) => {
    try {
      setActionLoading(true);
      await reservationService.acceptReservation(reservation.id);
      const allReservations = await reservationService.getMyReservations();
      const now = new Date();
      const activeRes = allReservations.find((r: any) => new Date(r.endTime) >= now);
      setActiveReservation(activeRes || null);
      if (!activeRes) {
        setReservationBlocked(false);
        setBlockReason('');
      }
      Alert.alert(t('common.success') || 'Başarılı', t('reservation.acceptSuccess') || 'Rezervasyon kabul edildi');
    } catch (error: any) {
      Alert.alert(t('common.error') || 'Hata', error.response?.data?.message || t('reservation.acceptError') || 'Kabul işlemi başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReservation = (reservation: any) => {
    setReservationToReject(reservation);
    setShowRejectDialog(true);
  };

  const confirmRejectReservation = async () => {
    if (!reservationToReject) return;
    setShowRejectDialog(false);
    try {
      setActionLoading(true);
      await reservationService.rejectReservation(reservationToReject.id);
      setActiveReservation(null);
      setReservationBlocked(false);
      setBlockReason('');
      setReservationToReject(null);
      Alert.alert(t('common.success') || 'Başarılı', t('reservation.rejected') || 'Rezervasyon reddedildi ve iptal edildi');
    } catch (error: any) {
      Alert.alert(t('common.error') || 'Hata', error.response?.data?.message || t('reservation.rejectError') || 'Red işlemi başarısız');
      setReservationToReject(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="light" />
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
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home' as never);
              }
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} theme={{ colors: { text: '#FFFFFF' } }}>{t('reservation.title')}</Text>
          </View>
        </View>

        {/* Rezervasyon Engeli Mesajı */}
        {(checkingBlockStatus || reservationBlocked) && (
          <View style={styles.blockCardWrapper}>
            <Card style={styles.blockCard}>
              <Card.Content style={styles.blockCardContent}>
                {checkingBlockStatus ? (
                  <View style={styles.blockContent}>
                    <View style={styles.blockIconContainer}>
                      <ActivityIndicator size="large" color="#54CE8F" />
                    </View>
                  </View>
                ) : reservationBlocked ? (
                  <View style={styles.blockContent}>
                    <View style={styles.blockIconContainer}>
                      <View style={styles.blockIconCircle}>
                        <MaterialCommunityIcons name="alert-circle" size={32} color="#EF4444" />
                      </View>
                    </View>
                    <Text style={styles.blockTitle}>Rezervasyon Oluşturulamaz</Text>
                    <Text style={styles.blockText}>{blockReason}</Text>
                    {/* Sadece bekleyen maç sonucu durumunda "Bildirimlere Git" butonu göster */}
                    {blockReason.includes('maç sonucu') && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={styles.blockActionButton}
                      >
                        <MaterialCommunityIcons name="bell" size={18} color="#FFFFFF" />
                        <Text style={styles.blockActionButtonText}>Bildirimlere Git</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Aktif Rezervasyon Detayları - Rezervasyonlarım sayfasındaki ile aynı yapı (pending badge, yanıt durumları, kabul/red) */}
        {activeReservation && reservationBlocked && blockReason.includes('aktif bir rezervasyonunuz var') && (() => {
          const isPending = activeReservation.status === 'pending';
          const myResponse = getMyResponse(activeReservation);
          const canAcceptReject = myResponse && myResponse.acceptanceStatus === 'pending';
          const formatPlayerName = (player: any) => [player?.name, player?.surname].filter(Boolean).join(' ') || 'Bilinmiyor';
          const teams = getTeamsForReservation(activeReservation);
          const hasPlayers = teams.team1.length > 0 || teams.team2.length > 0;
          return (
            <View style={styles.activeReservationWrapper}>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#B45309" />
                  <Text style={styles.pendingBadgeText}>{t('reservation.pendingBadge')}</Text>
                </View>
              )}
              <View style={styles.activeReservationCardWrapper}>
                <Card style={[styles.activeReservationCard, isPending && styles.reservationCardPending]}>
                  <Card.Content style={styles.activeReservationContent}>
                    <View style={styles.activeReservationHeader}>
                      <View style={styles.activeReservationDateTimeContainer}>
                        <View style={styles.activeReservationDateRow}>
                          <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
                          <Text style={styles.activeReservationDateText}>{formatDate(activeReservation.startTime)}</Text>
                        </View>
                        <View style={styles.activeReservationTimeRow}>
                          <MaterialCommunityIcons name="clock-outline" size={18} color="#717182" />
                          <Text style={styles.activeReservationTimeText}>
                            {formatTime(activeReservation.startTime)} - {formatTime(activeReservation.endTime)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.activeReservationDivider} />
                    <View style={styles.activeReservationInfoRow}>
                      <MaterialCommunityIcons name="tennis" size={18} color="#B4AEBD" />
                      <Text style={styles.activeReservationInfoLabel}>{t('reservation.court') || 'Kort'}:</Text>
                      <Text style={styles.activeReservationInfoValue}>{activeReservation.court?.name || '-'}</Text>
                    </View>
                    {/* PENDING: Yanıt durumları (Kabul etti / Beklemede) */}
                    {isPending && activeReservation.participantResponses?.length > 0 && (
                      <>
                        <View style={styles.activeReservationDivider} />
                        <View style={styles.responseStatusContainer}>
                          <Text style={styles.responseStatusLabel}>{t('reservation.responseStatus')}:</Text>
                          {activeReservation.participantResponses.map((resp: any) => (
                            <View key={resp.id} style={styles.responseStatusRow}>
                              <Text style={styles.responseUserName}>
                                {resp.user?.name} {resp.user?.surname || ''}
                              </Text>
                              <View style={[styles.responseStatusBadge, resp.acceptanceStatus === 'accepted' ? styles.responseStatusAccepted : styles.responseStatusWaiting]}>
                                <MaterialCommunityIcons
                                  name={resp.acceptanceStatus === 'accepted' ? 'check-circle' : 'clock-outline'}
                                  size={14}
                                  color={resp.acceptanceStatus === 'accepted' ? '#059669' : '#B45309'}
                                />
                                <Text style={[styles.responseStatusText, resp.acceptanceStatus === 'accepted' ? styles.responseStatusTextAccepted : styles.responseStatusTextWaiting]}>
                                  {resp.acceptanceStatus === 'accepted' ? t('reservation.accepted') : t('reservation.waiting')}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                    {/* Davetli bekleyen: Kabul Et / Reddet butonları */}
                    {canAcceptReject && (
                      <>
                        <View style={styles.activeReservationDivider} />
                        <View style={styles.acceptRejectRow}>
                          <TouchableOpacity
                            style={[styles.acceptRejectButton, styles.acceptButton]}
                            onPress={() => handleAcceptReservation(activeReservation)}
                            disabled={actionLoading}
                          >
                            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                            <Text style={styles.acceptRejectButtonText}>{t('reservation.accept')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.acceptRejectButton, styles.rejectButton]}
                            onPress={() => handleRejectReservation(activeReservation)}
                            disabled={actionLoading}
                          >
                            <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                            <Text style={styles.acceptRejectButtonText}>{t('reservation.reject')}</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                    {/* Oyuncular */}
                    {hasPlayers && (
                      <>
                        <View style={styles.activeReservationDivider} />
                        <View style={styles.activeReservationPlayersContainer}>
                          <View style={styles.activeReservationPlayersLabelRow}>
                            <MaterialCommunityIcons name="account-group" size={18} color="#B4AEBD" />
                            <Text style={styles.activeReservationPlayersLabel}>{t('reservation.players') || 'Oyuncular'}:</Text>
                          </View>
                          <View style={styles.activeReservationTeamsContainer}>
                            <View style={styles.activeReservationTeamContainer}>
                              {teams.team1.map((player: any, index: number) => (
                                <View key={player?.id || index} style={styles.activeReservationPlayerNameContainer}>
                                  <MaterialCommunityIcons name="account" size={16} color="#54CE8F" />
                                  <Text style={styles.activeReservationPlayerName}>{formatPlayerName(player)}</Text>
                                </View>
                              ))}
                            </View>
                            {teams.team2.length > 0 && (
                              <Text style={styles.activeReservationVsText}>VS</Text>
                            )}
                            <View style={styles.activeReservationTeamContainer}>
                              {teams.team2.map((player: any, index: number) => (
                                <View key={player?.id || index} style={styles.activeReservationPlayerNameContainer}>
                                  <MaterialCommunityIcons name="account" size={16} color="#FF9800" />
                                  <Text style={styles.activeReservationPlayerName}>{formatPlayerName(player)}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      </>
                    )}
                  </Card.Content>
                </Card>
                {!isPending && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.activeReservationDeleteButtonAbsolute,
                      pressed && styles.activeReservationDeleteButtonPressed
                    ]}
                    onPress={() => handleCancelReservation(activeReservation)}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#DC2626" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })()}

        {isInitializing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#54CE8F" />
          </View>
        ) : !reservationBlocked || !blockReason.includes('aktif bir rezervasyonunuz var') ? (
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
                      iconColor="#9CA3AF"
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
                        color={courtFilter === 'outdoor' ? "#FFFFFF" : "#374151"} 
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
                        const isSelected = selectedCourt === court.id.toString();
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
                              (reservationBlocked || checkingBlockStatus) && styles.newCourtCardContainerDisabled,
                              isSelected && styles.newCourtCardContainerSelected
                            ]}
                            disabled={reservationBlocked || checkingBlockStatus}
                          >
                            <View style={[
                              styles.newCourtCard,
                              isSelected && styles.newCourtCardSelected
                            ]}>
                              {/* Court Image Area */}
                              <LinearGradient
                                colors={isSelected ? ['#54CE8F', '#4CAF50'] : ['#D1FAE5', '#ECFDF5']} // Selected: green, Default: from-green-100 to-green-50
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.newCourtImageArea}
                              >
                                {/* Seçili ikon */}
                                {isSelected && (
                                  <View style={styles.newCourtSelectedIcon}>
                                    <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
                                  </View>
                                )}
                                {/* Top Right Chips */}
                                <View style={styles.newCourtChipsContainer}>
                                  <View style={styles.newCourtChip}>
                                    <Text style={styles.newCourtChipText}>{displayCourt.surface}</Text>
                                  </View>
                                  <View style={styles.newCourtChip}>
                                    <MaterialCommunityIcons 
                                      name={displayCourt.icon as any} 
                                      size={12} 
                                      color="#374151" 
                                    />
                                    <Text style={styles.newCourtChipText}>{displayCourt.type}</Text>
                                  </View>
                                </View>

                                {/* Tennis Ball Icon */}
                                <View style={styles.newCourtTennisBallContainer}>
                                  <Text style={{ fontSize: 64 }}>🎾</Text>
                                </View>
                              </LinearGradient>

                              {/* Court Info Area */}
                              <View style={styles.newCourtInfoArea}>
                                {/* Court Name */}
                                <Text style={[
                                  styles.newCourtName,
                                  isSelected && styles.newCourtNameSelected
                                ]}>{displayCourt.name}</Text>

                                {/* Location and Type */}
                                <View style={styles.newCourtLocationContainer}>
                                  <MaterialCommunityIcons 
                                    name="map-marker" 
                                    size={14} 
                                    color="#717182" 
                                  />
                                  <Text style={styles.newCourtLocationText}>
                                    {`${displayCourt.surface} • ${displayCourt.type}`}
                                  </Text>
                                </View>

                                {/* Available Button and Next Available */}
                                <View style={styles.newCourtBottomContainer}>
                                  {nextAvailable ? (
                                    <Text style={styles.newCourtNextAvailable}>
                                      {t('reservation.nextAvailable')} {nextAvailable}
                                    </Text>
                                  ) : (
                                    <View style={styles.newCourtAvailableButton}>
                                      <Text style={styles.newCourtAvailableText}>
                                        {t('reservation.available')}
                                      </Text>
                                    </View>
                                  )}
                                  <TouchableOpacity
                                    style={styles.newCourtBookButton}
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
                                      size={16} 
                                      color={(reservationBlocked || checkingBlockStatus) ? "#BDBDBD" : "#54CE8F"} 
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
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
        ) : null}
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
                  <Text style={styles.calendarTitle}>{t('reservation.selectDate')}</Text>
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
            <Card.Content style={[styles.userSelectorCardContent, { paddingHorizontal: 16, paddingVertical: 16 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectorMode === 'partner' 
                    ? (playerType === 'single' ? t('reservation.selectOpponent') : t('reservation.selectPartner'))
                    : t('reservation.selectOpponents')}
                </Text>
                <TouchableOpacity 
                  onPress={handleOpponentSelectorClose}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
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

              <View style={styles.userListContainer}>
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
                          <Text 
                            style={[
                              styles.userName,
                              isDisabled && styles.disabledText
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.name}
                            {isDisabledInPartnerMode && ` ${t('reservation.selectedAsOpponent')}`}
                            {isDisabledInOpponentsMode && ` ${t('reservation.selectedAsPartner')}`}
                          </Text>
                          <Text 
                            style={[
                              styles.userEmail,
                              isDisabled && styles.disabledText
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.email}
                          </Text>
                        </View>
                        {!!isSelected && (
                          <MaterialCommunityIcons 
                            name={selectorMode === 'opponents' ? "checkbox-marked-circle" : "check-circle"} 
                            size={24} 
                            color={selectorMode === 'opponents' ? "#FF9800" : "#4CAF50"}
                            style={{ flexShrink: 0 }}
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
              </View>

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
                <Text style={styles.weatherModalTitle}>
                  {t('reservation.weatherWarningTitle')}
                </Text>
              </View>
              
              <Text style={styles.weatherModalMessage}>
                {pendingTimeSelection && Boolean(weatherCache[pendingTimeSelection]?.isSnowy)
                  ? t('reservation.weatherWarningSnowy')
                  : t('reservation.weatherWarningRainy')}
                {'\n\n'}
                {t('reservation.weatherWarningMessage')}
              </Text>

              <View style={styles.weatherModalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowWeatherWarningModal(false);
                    setPendingTimeSelection(null);
                  }}
                  style={[styles.weatherModalButton, styles.weatherModalCancelButton]}
                >
                  <Text style={styles.weatherModalCancelButtonLabel}>
                    {t('reservation.weatherWarningCancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (pendingTimeSelection) {
                      confirmTimeSelection(pendingTimeSelection);
                    }
                    setShowWeatherWarningModal(false);
                    setPendingTimeSelection(null);
                  }}
                  style={[styles.weatherModalButton, styles.weatherModalContinueButton]}
                >
                  <Text style={styles.weatherModalContinueButtonLabel}>
                    {t('reservation.weatherWarningContinue')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={showDeleteDialog}
          onDismiss={() => {
            setShowDeleteDialog(false);
            setReservationToDelete(null);
          }}
          contentContainerStyle={styles.deleteModalContainer}
          dismissable={true}
        >
          <Card style={styles.deleteModalCard}>
            <Card.Content style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <View style={styles.deleteModalIconContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={32} color="#DC2626" />
                </View>
                <Text style={styles.deleteModalTitle}>
                  {t('reservation.cancelReservation') || 'Rezervasyonu İptal Et'}
                </Text>
              </View>
              
              <Text style={styles.deleteModalText}>
                {reservationToDelete
                  ? (t('reservation.cancelConfirm') || `${formatDate(reservationToDelete.startTime)} tarihindeki rezervasyonunuzu iptal etmek istediğinizden emin misiniz?`)
                  : ''}
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => {
                    setShowDeleteDialog(false);
                    setReservationToDelete(null);
                  }}
                >
                  <Text style={styles.deleteModalCancelButtonText}>
                    {t('common.cancel') || 'İptal'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirmButton}
                  onPress={confirmCancelReservation}
                >
                  <Text style={styles.deleteModalConfirmButtonText}>
                    {t('common.delete') || 'Sil'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Reject Reservation Confirmation Modal */}
      <Portal>
        <Modal
          visible={showRejectDialog}
          onDismiss={() => {
            setShowRejectDialog(false);
            setReservationToReject(null);
          }}
          contentContainerStyle={styles.deleteModalContainer}
          dismissable={true}
        >
          <Card style={styles.deleteModalCard}>
            <Card.Content style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <View style={styles.deleteModalIconContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={32} color="#DC2626" />
                </View>
                <Text style={styles.deleteModalTitle}>
                  {t('reservation.reject')}
                </Text>
              </View>
              <Text style={styles.deleteModalText}>
                {t('reservation.rejectConfirm')}
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => {
                    setShowRejectDialog(false);
                    setReservationToReject(null);
                  }}
                >
                  <Text style={styles.deleteModalCancelButtonText}>
                    {t('common.cancel') || 'İptal'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirmButton}
                  onPress={confirmRejectReservation}
                >
                  <Text style={styles.deleteModalConfirmButtonText}>
                    {t('reservation.reject')}
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: '#FAFCFB', // New design background
  },
  header: {
    backgroundColor: '#B4AEBD', // New design purple
    paddingTop: 48, // pt-12 equivalent
    paddingBottom: 24, // pb-6 equivalent
    paddingHorizontal: 24, // px-6 equivalent
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    minHeight: 120, // Minimum yükseklik (dikey ortalama için)
    justifyContent: 'center', // Dikey ortalama
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24, // px-6
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingLeft: 40, // Back button için sol padding
    paddingRight: 40, // Simetri için sağ padding
    paddingTop: 8, // Biraz daha aşağı indirmek için
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0, // marginBottom kaldırıldı
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
    padding: 24, // px-6 equivalent
    backgroundColor: '#FAFCFB', // New design background
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
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  userSelectorCardContent: {
    flex: 1,
  },
  userListContainer: {
    flex: 1,
    minHeight: 0,
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
    flex: 1,
    marginRight: 12,
  },
  modalCloseButton: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    overflow: 'hidden',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
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
  blockCardWrapper: {
    paddingHorizontal: 24, // px-6
    paddingTop: 20, // pt-5
    paddingBottom: 16, // pb-4
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#FEE2E2', // red-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  blockCardContent: {
    padding: 24, // p-6
  },
  blockContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockIconContainer: {
    marginBottom: 16, // mb-4
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockIconCircle: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32, // rounded-full
    backgroundColor: '#FEF2F2', // red-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213',
    marginBottom: 12, // mb-3
    textAlign: 'center',
  },
  blockText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    textAlign: 'center',
    marginBottom: 24, // mb-6
    lineHeight: 20,
  },
  blockLoadingText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginTop: 12, // mt-3
    textAlign: 'center',
  },
  blockActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54CE8F', // Primary green
    paddingVertical: 12, // py-3
    paddingHorizontal: 24, // px-6
    borderRadius: 16, // rounded-2xl
    gap: 8, // gap-2
    width: '100%',
  },
  blockActionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
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
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  weatherModalContent: {
    padding: 24, // p-6
  },
  weatherModalHeader: {
    alignItems: 'center',
    marginBottom: 20, // mb-5
  },
  weatherModalIconContainer: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32, // rounded-full
    backgroundColor: '#DBEAFE', // blue-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // mb-4
  },
  weatherModalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213',
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
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
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
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 9999, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    borderWidth: 0,
  },
  courtFilterChipActive: {
    backgroundColor: '#54CE8F', // Primary green from design
    borderWidth: 0,
  },
  courtFilterChipText: {
    fontSize: 12, // text-sm
    fontWeight: '500',
    color: '#374151', // gray-700
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
  newCourtCardContainerSelected: {
    // Seçili kort için özel stil
  },
  newCourtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  newCourtCardSelected: {
    borderWidth: 2,
    borderColor: '#54CE8F', // Primary green
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newCourtImageArea: {
    height: 160, // h-40 equivalent
    backgroundColor: '#D1FAE5', // green-100 from design
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCourtSelectedIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    backgroundColor: 'rgba(84, 206, 143, 0.9)', // Primary green with opacity
    borderRadius: 9999, // rounded-full
    padding: 4,
  },
  newCourtChipsContainer: {
    position: 'absolute',
    top: 12, // top-3
    right: 12, // right-3
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  newCourtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // white/90
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
    gap: 4,
  },
  newCourtChipText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  newCourtTennisBallContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCourtInfoArea: {
    padding: 20, // p-5 equivalent
  },
  newCourtName: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213', // Dark text from design
    marginBottom: 8,
  },
  newCourtNameSelected: {
    color: '#54CE8F', // Primary green when selected
  },
  newCourtLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8, // gap-2
  },
  newCourtLocationText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  newCourtBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12, // pt-3
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // gray-100
  },
  newCourtAvailableButton: {
    backgroundColor: '#54CE8F', // Primary green from design
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
  },
  newCourtAvailableText: {
    color: '#FFFFFF',
    fontSize: 11, // text-xs
    fontWeight: '500',
  },
  newCourtNextAvailable: {
    fontSize: 12, // text-sm
    color: '#717182', // Medium gray
  },
  newCourtBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newCourtBookText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#54CE8F', // Primary green
  },
  newCourtBookButtonDisabled: {
    opacity: 0.5,
  },
  newCourtBookTextDisabled: {
    color: '#BDBDBD',
  },
  activeReservationWrapper: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pendingBadge: {
    position: 'absolute',
    top: 12,
    right: 48,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  reservationCardPending: {
    borderColor: '#FDE68A',
    borderLeftWidth: 4,
  },
  responseStatusContainer: {
    marginTop: 8,
  },
  responseStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#717182',
    marginBottom: 8,
  },
  responseStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  responseUserName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  responseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  responseStatusAccepted: {
    backgroundColor: '#D1FAE5',
  },
  responseStatusWaiting: {
    backgroundColor: '#FEF3C7',
  },
  responseStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  responseStatusTextAccepted: {
    color: '#059669',
  },
  responseStatusTextWaiting: {
    color: '#B45309',
  },
  acceptRejectRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  acceptRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  acceptRejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeReservationCardWrapper: {
    position: 'relative',
  },
  activeReservationCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeReservationContent: {
    padding: 20,
  },
  activeReservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activeReservationDateTimeContainer: {
    flex: 1,
  },
  activeReservationDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  activeReservationDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  activeReservationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeReservationTimeText: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  activeReservationDeleteButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeReservationDeleteButtonAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  activeReservationDeleteButtonPressed: {
    backgroundColor: '#FEE2E2',
    transform: [{ scale: 0.95 }],
  },
  activeReservationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  activeReservationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  activeReservationInfoLabel: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  activeReservationInfoValue: {
    fontSize: 14,
    color: '#030213',
    fontWeight: '400',
    flex: 1,
  },
  activeReservationNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  activeReservationNotesText: {
    fontSize: 13,
    color: '#717182',
    flex: 1,
    fontStyle: 'italic',
  },
  activeReservationPlayersContainer: {
    marginTop: 8,
  },
  activeReservationPlayersLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  activeReservationPlayersLabel: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  activeReservationTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeReservationTeamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    minWidth: '40%',
  },
  activeReservationPlayerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  activeReservationPlayerName: {
    fontSize: 13,
    color: '#030213',
    fontWeight: '500',
  },
  activeReservationVsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#717182',
    marginHorizontal: 8,
  },
  deleteModalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  deleteModalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteModalContent: {
    padding: 24,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#717182',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#717182',
  },
  deleteModalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReservationScreen;