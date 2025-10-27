import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
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
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { userService, reservationService, authService, courtService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type ReservationScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Reservation'>;

const ReservationScreen = () => {
  const navigation = useNavigation<ReservationScreenNavigationProp>();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [currentScrollY, setCurrentScrollY] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const step2Ref = useRef<View>(null);
  const step3Ref = useRef<View>(null);
  const step4Ref = useRef<View>(null);

  // Mevcut kullanıcıyı yükle
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profile = await authService.getProfile();
        setCurrentUserId(profile.id);
        setCurrentUserType(profile.userType);
      } catch (error) {
        console.error('Kullanıcı profili yüklenirken hata:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Kortları yükle
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const courtsList = await courtService.getActiveCourts();
        setCourts(courtsList);
      } catch (error) {
        console.error('Kortlar yüklenirken hata:', error);
      }
    };

    fetchCourts();
  }, []);

  // Sayfa her açıldığında tüm seçimleri resetle
  useFocusEffect(
    React.useCallback(() => {
      // Tüm state'leri sıfırla
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCourt('');
      setPlayerType('single');
      setPartnerName('');
      setSelectedPartner(null);
      setSelectedOpponents([]);
      setCurrentStep(1);
      setSearchQuery('');
      setCurrentScrollY(0);
      
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
    }, [fadeAnim, slideAnim])
  );

  // Tarih veya saat değiştiğinde seçimleri sıfırla
  useEffect(() => {
    // Partner ve rakipleri sıfırla
    setSelectedPartner(null);
    setSelectedOpponents([]);
  }, [selectedDate, selectedTime]);

  // Seçilen tarih ve kort için rezervasyonları yükle
  useEffect(() => {
    const fetchCourtReservations = async () => {
      if (!selectedDate || !selectedCourt) {
        setCourtReservations([]);
        return;
      }

      try {
        // Seçilen tarihteki tüm rezervasyonları çek
        const allReservations = await reservationService.getReservationsByDate(selectedDate);
        
        // Sadece seçilen korta ait rezervasyonları filtrele
        const courtSpecificReservations = allReservations.filter(
          (reservation: any) => reservation.court.id === parseInt(selectedCourt)
        );
        
        setCourtReservations(courtSpecificReservations);
      } catch (error) {
        console.error('Kort rezervasyonları yüklenirken hata:', error);
        setCourtReservations([]);
      }
    };

    fetchCourtReservations();
  }, [selectedDate, selectedCourt]);

  // Seçilen tarih ve saate göre müsait kullanıcıları yükle
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!selectedDate || !selectedTime) {
        // Tarih veya saat seçilmemişse tüm kullanıcıları yükle
        try {
          const usersList = await userService.getAllUsers();
          // Mevcut kullanıcıyı listeden çıkar
          const filteredUsers = currentUserId 
            ? usersList.filter(user => user.id !== currentUserId)
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
          ? availableUsersList.filter(user => user.id !== currentUserId)
          : availableUsersList;
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Müsait kullanıcılar yüklenirken hata:', error);
      }
    };

    fetchAvailableUsers();
  }, [selectedDate, selectedTime, currentUserId]);

  const availableTimes = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Kullanıcı tipine göre saatin disabled olup olmadığını kontrol et
  const isTimeSlotDisabledForUser = (timeSlot: string): boolean => {
    // RESTRICTED kullanıcı değilse, tüm saatler müsait
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
      grass: { surface: 'Çim', gradient: ['#4CAF50', '#2E7D32'] },
      clay: { surface: 'Kil', gradient: ['#FF9800', '#F57C00'] },
      hard: { surface: 'Sert', gradient: ['#2196F3', '#1976D2'] },
    };

    const surfaceInfo = surfaceMap[court.groundType] || surfaceMap.hard;

    return {
      ...court,
      type: court.indoors ? 'Kapalı' : 'Açık',
      surface: surfaceInfo.surface,
      gradient: surfaceInfo.gradient,
      icon: court.indoors ? 'home-roof' : 'weather-sunny',
    };
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
    setSelectedCourt(courtId);
    if (currentStep === 2) {
      setCurrentStep(3);
      scrollToStep(step3Ref);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (currentStep === 3) {
      setCurrentStep(4);
      scrollToStep(step4Ref);
    }
  };

  const handleReservation = async () => {
    try {
      setIsLoading(true);

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
        ? `Tekler maçı${selectedPartner ? ` - Rakip: ${selectedPartner.name}` : ''}` 
        : `Çiftler maçı${selectedPartner ? ` - Partner: ${selectedPartner.name}` : ''}${selectedOpponents.length > 0 ? ` - Rakipler: ${selectedOpponents.map(o => o.name).join(', ')}` : ''}`;

      // Backend'e gönder
      const reservation = await reservationService.createReservation({
        courtId: parseInt(selectedCourt),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: participantIds.length > 0 ? participantIds : undefined,
        notes,
      });

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
      console.error('Rezervasyon hatası:', error);
      Alert.alert(
        'Hata',
        error.response?.data?.message || 'Rezervasyon oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const filteredUsers = users.filter((user) =>
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
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setCurrentScrollY(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={['#2E7D32', '#1B5E20', '#0D4A12']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonContainer}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Geri</Text>
            </View>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="calendar-star" size={40} color="#FFFFFF" />
            </View>
            <Title style={styles.headerTitle}>Kort Rezervasyonu</Title>
            <Text style={styles.headerSubtitle}>
              Mükemmel tenis deneyimi için rezervasyon yapın
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: `${getStepProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>Adım {currentStep}/4</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Step 1: Date Selection */}
          <Card style={[styles.stepCard, currentStep >= 1 && styles.activeStepCard]}>
            <Card.Content>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, currentStep >= 1 && styles.activeStepNumber]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Title style={styles.stepTitle}>Tarih Seçin</Title>
              </View>
              
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowCalendar(true)}
              >
                <LinearGradient
                  colors={selectedDate ? ['#4CAF50', '#2E7D32'] : ['#F5F5F5', '#E0E0E0']}
                  style={styles.dateSelectorGradient}
                >
                  <MaterialCommunityIcons 
                    name="calendar" 
                    size={24} 
                    color={selectedDate ? "#FFFFFF" : "#757575"} 
                  />
                  <Text style={[
                    styles.dateSelectorText,
                    selectedDate && styles.selectedDateText
                  ]}>
                    {selectedDate ? formatDate(selectedDate) : 'Tarih seçmek için tıklayın'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Step 2: Court Selection */}
          {selectedDate && (
            <View ref={step2Ref} collapsable={false}>
              <Card style={[styles.stepCard, currentStep >= 2 && styles.activeStepCard]}>
                <Card.Content>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Title style={styles.stepTitle}>Kort Seçin</Title>
                  </View>
                
                <View style={styles.courtGrid}>
                  {courts.map((court) => {
                    const displayCourt = getCourtDisplayInfo(court);
                    const isClosed = court.closed;
                    return (
                      <TouchableOpacity
                        key={court.id}
                        onPress={() => !isClosed && handleCourtSelect(court.id.toString())}
                        style={styles.courtCardContainer}
                        disabled={isClosed}
                      >
                        <LinearGradient
                          colors={
                            isClosed 
                              ? ['#E0E0E0', '#BDBDBD'] 
                              : selectedCourt === court.id.toString() 
                                ? displayCourt.gradient as [string, string] 
                                : ['#FFFFFF', '#F8F9FA']
                          }
                          style={[
                            styles.courtCard,
                            selectedCourt === court.id.toString() && styles.selectedCourtCard,
                            isClosed && styles.disabledCourtCard
                          ]}
                        >
                          <View style={styles.courtIconContainer}>
                            <MaterialCommunityIcons 
                              name={isClosed ? "lock" : displayCourt.icon as any} 
                              size={32} 
                              color={
                                isClosed 
                                  ? "#757575" 
                                  : selectedCourt === court.id.toString() 
                                    ? "#FFFFFF" 
                                    : displayCourt.gradient[0]
                              } 
                            />
                          </View>
                          <Text style={[
                            styles.courtName,
                            selectedCourt === court.id.toString() && styles.selectedCourtName,
                            isClosed && styles.disabledCourtText
                          ]}>
                            {displayCourt.name}
                          </Text>
                          <Text style={[
                            styles.courtDetails,
                            selectedCourt === court.id.toString() && styles.selectedCourtDetails,
                            isClosed && styles.disabledCourtText
                          ]}>
                            {isClosed ? 'Bakımda' : `${displayCourt.type} • ${displayCourt.surface}`}
                          </Text>
                          {selectedCourt === court.id.toString() && !isClosed && (
                            <View style={styles.selectedIcon}>
                              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                            </View>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
            </View>
          )}

          {/* Step 3: Time Selection */}
          {selectedCourt && (
            <View ref={step3Ref} collapsable={false}>
              <Card style={[styles.stepCard, currentStep >= 3 && styles.activeStepCard]}>
                <Card.Content>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Title style={styles.stepTitle}>Saat Seçin</Title>
                  </View>
                
                <View style={styles.timeGrid}>
                  {availableTimes.map((time) => {
                    const reservation = getReservationForTime(time);
                    const isReserved = !!reservation;
                    const isDisabledForUserType = isTimeSlotDisabledForUser(time);
                    const isDisabled = isReserved || isDisabledForUserType;
                    
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => !isDisabled && handleTimeSelect(time)}
                        style={styles.timeChipContainer}
                        disabled={isDisabled}
                      >
                        <LinearGradient
                          colors={
                            isDisabled 
                              ? ['#E0E0E0', '#BDBDBD']
                              : selectedTime === time 
                                ? ['#2E7D32', '#1B5E20'] 
                                : ['#FFFFFF', '#F5F5F5']
                          }
                          style={[
                            styles.timeChip,
                            selectedTime === time && styles.selectedTimeChip,
                            isDisabled && styles.disabledTimeChip
                          ]}
                        >
                          <View style={styles.timeChipContent}>
                            <View style={styles.timeRow}>
                              <MaterialCommunityIcons 
                                name={isDisabled ? "lock" : "clock"} 
                                size={16} 
                                color={
                                  isDisabled 
                                    ? "#757575" 
                                    : selectedTime === time 
                                      ? "#FFFFFF" 
                                      : "#757575"
                                } 
                              />
                              <Text style={[
                                styles.timeChipText,
                                selectedTime === time && styles.selectedTimeChipText,
                                isDisabled && styles.disabledTimeChipText
                              ]}>
                                {time}
                              </Text>
                            </View>
                            {isReserved && reservation && (
                              <Text style={styles.reservedByText}>
                                {reservation.user.name}
                              </Text>
                            )}
                            {isDisabledForUserType && !isReserved && (
                              <Text style={styles.reservedByText}>
                                İzin yok
                              </Text>
                            )}
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
            </View>
          )}

          {/* Step 4: Player Type & Final Details */}
          {selectedTime && (
            <View ref={step4Ref} collapsable={false}>
              <Card style={[styles.stepCard, currentStep >= 4 && styles.activeStepCard]}>
                <Card.Content>
                  <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, currentStep >= 4 && styles.activeStepNumber]}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Title style={styles.stepTitle}>Oyuncu Tipi</Title>
                </View>
                
                <RadioButton.Group onValueChange={handlePlayerTypeChange} value={playerType}>
                  <Surface style={styles.radioContainer}>
                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => handlePlayerTypeChange('single')}
                    >
                      <RadioButton value="single" />
                      <View style={styles.radioContent}>
                        <MaterialCommunityIcons name="account" size={24} color="#2E7D32" />
                        <Text style={styles.radioLabel}>Tekler (1 vs 1)</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => handlePlayerTypeChange('double')}
                    >
                      <RadioButton value="double" />
                      <View style={styles.radioContent}>
                        <MaterialCommunityIcons name="account-group" size={24} color="#2E7D32" />
                        <Text style={styles.radioLabel}>Çiftler (2 vs 2)</Text>
                      </View>
                    </TouchableOpacity>
                  </Surface>
                </RadioButton.Group>

                {playerType === 'single' && (
                  <View style={styles.partnerSection}>
                    <Text style={styles.partnerLabel}>Rakip Seç</Text>
                    <TouchableOpacity 
                      style={styles.userSelector}
                      onPress={async () => {
                        setSelectorMode('partner');
                        // Modal açılmadan önce kullanıcıları yükle
                        if (users.length === 0) {
                          try {
                            const usersList = await userService.getAllUsers();
                            const filteredUsers = currentUserId 
                              ? usersList.filter(user => user.id !== currentUserId)
                              : usersList;
                            setUsers(filteredUsers);
                          } catch (error) {
                            console.error('Kullanıcılar yüklenirken hata:', error);
                          }
                        }
                        setShowUserSelector(true);
                      }}
                    >
                      <LinearGradient
                        colors={selectedPartner ? ['#4CAF50', '#2E7D32'] : ['#FFFFFF', '#F5F5F5']}
                        style={styles.userSelectorGradient}
                      >
                        <MaterialCommunityIcons 
                          name="account-search" 
                          size={24} 
                          color={selectedPartner ? "#FFFFFF" : "#757575"} 
                        />
                        <Text style={[
                          styles.userSelectorText,
                          selectedPartner && styles.selectedUserText
                        ]}>
                          {selectedPartner ? selectedPartner.name : 'Rakip seçmek için tıklayın'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {playerType === 'double' && (
                  <>
                    <View style={styles.partnerSection}>
                      <Text style={styles.partnerLabel}>Partner Seç</Text>
                      <TouchableOpacity 
                        style={styles.userSelector}
                        onPress={async () => {
                          setSelectorMode('partner');
                          // Modal açılmadan önce kullanıcıları yükle
                          if (users.length === 0) {
                            try {
                              const usersList = await userService.getAllUsers();
                              const filteredUsers = currentUserId 
                                ? usersList.filter(user => user.id !== currentUserId)
                                : usersList;
                              setUsers(filteredUsers);
                            } catch (error) {
                              console.error('Kullanıcılar yüklenirken hata:', error);
                            }
                          }
                          setShowUserSelector(true);
                        }}
                      >
                        <LinearGradient
                          colors={selectedPartner ? ['#4CAF50', '#2E7D32'] : ['#FFFFFF', '#F5F5F5']}
                          style={styles.userSelectorGradient}
                        >
                          <MaterialCommunityIcons 
                            name="account-search" 
                            size={24} 
                            color={selectedPartner ? "#FFFFFF" : "#757575"} 
                          />
                          <Text style={[
                            styles.userSelectorText,
                            selectedPartner && styles.selectedUserText
                          ]}>
                            {selectedPartner ? selectedPartner.name : 'Partner seçmek için tıklayın'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.opponentsSection}>
                      <Text style={styles.partnerLabel}>Rakipler Seç (2 Kişi)</Text>
                      <TouchableOpacity 
                        style={styles.userSelector}
                        onPress={async () => {
                          setSelectorMode('opponents');
                          // Modal açılmadan önce kullanıcıları yükle
                          if (users.length === 0) {
                            try {
                              const usersList = await userService.getAllUsers();
                              const filteredUsers = currentUserId 
                                ? usersList.filter(user => user.id !== currentUserId)
                                : usersList;
                              setUsers(filteredUsers);
                            } catch (error) {
                              console.error('Kullanıcılar yüklenirken hata:', error);
                            }
                          }
                          setShowUserSelector(true);
                        }}
                      >
                        <LinearGradient
                          colors={selectedOpponents.length > 0 ? ['#FF9800', '#F57C00'] : ['#FFFFFF', '#F5F5F5']}
                          style={styles.userSelectorGradient}
                        >
                          <MaterialCommunityIcons 
                            name="account-multiple" 
                            size={24} 
                            color={selectedOpponents.length > 0 ? "#FFFFFF" : "#757575"} 
                          />
                          <Text style={[
                            styles.userSelectorText,
                            selectedOpponents.length > 0 && styles.selectedUserText
                          ]}>
                            {selectedOpponents.length > 0 
                              ? `${selectedOpponents.length}/2 rakip seçildi` 
                              : 'Rakipleri seçmek için tıklayın'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      {selectedOpponents.length > 0 && (
                        <View style={styles.selectedOpponentsContainer}>
                          {selectedOpponents.map((opponent, index) => (
                            <View key={opponent.id} style={styles.selectedOpponentChip}>
                              <Text style={styles.selectedOpponentText}>{opponent.name}</Text>
                              <TouchableOpacity
                                onPress={() => setSelectedOpponents(selectedOpponents.filter(opp => opp.id !== opponent.id))}
                              >
                                <MaterialCommunityIcons name="close-circle" size={20} color="#F57C00" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
            </View>
          )}

          {/* Reservation Summary */}
          {selectedDate && selectedTime && selectedCourt && (
            <Card style={styles.summaryCard}>
              <LinearGradient
                colors={['#E8F5E8', '#FFFFFF']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryHeader}>
                  <MaterialCommunityIcons name="clipboard-check" size={28} color="#2E7D32" />
                  <Title style={styles.summaryTitle}>Rezervasyon Özeti</Title>
                </View>
                
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.summaryText}>{formatDate(selectedDate)}</Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <MaterialCommunityIcons name="clock" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.summaryText}>{selectedTime}</Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <MaterialCommunityIcons name="tennis" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.summaryText}>
                      {courts.find(c => c.id.toString() === selectedCourt)?.name || 'Kort seçilmedi'}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <MaterialCommunityIcons name="account-group" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.summaryText}>
                      {playerType === 'single' ? 'Tekler' : 'Çiftler'}
                    </Text>
                  </View>

                  {selectedPartner && (
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <MaterialCommunityIcons 
                          name={playerType === 'single' ? "account" : "account-heart"} 
                          size={20} 
                          color="#2E7D32" 
                        />
                      </View>
                      <Text style={styles.summaryText}>
                        {playerType === 'single' ? 'Rakip: ' : 'Partner: '}
                        {selectedPartner.name}
                      </Text>
                    </View>
                  )}

                  {playerType === 'double' && selectedOpponents.length > 0 && (
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <MaterialCommunityIcons name="account-multiple" size={20} color="#FF9800" />
                      </View>
                      <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryText}>
                          Rakipler: {selectedOpponents.map(opp => opp.name).join(', ')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Card>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleReservation}
            disabled={!selectedDate || !selectedTime || !selectedCourt || isLoading}
            style={[
              styles.reservationButtonContainer,
              (!selectedDate || !selectedTime || !selectedCourt || isLoading) && styles.disabledButton
            ]}
          >
            <LinearGradient
              colors={(!selectedDate || !selectedTime || !selectedCourt || isLoading) 
                ? ['#BDBDBD', '#9E9E9E'] 
                : ['#4CAF50', '#2E7D32']
              }
              style={styles.reservationButton}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.reservationButtonText}>İşleniyor...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={24} 
                    color="#FFFFFF" 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.reservationButtonText}>
                    Rezervasyonu Onayla
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Calendar Modal */}
      <Portal>
        <Modal
          visible={showCalendar}
          onDismiss={() => setShowCalendar(false)}
          contentContainerStyle={styles.calendarModal}
        >
          <Card style={styles.calendarCard}>
            <Card.Content>
              <View style={styles.calendarHeader}>
                <Title style={styles.calendarTitle}>Tarih Seçin</Title>
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
                firstDay={1}
              />
            </Card.Content>
          </Card>
        </Modal>

        {/* User Selector Modal */}
        <Modal
          visible={showUserSelector}
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
                    ? (playerType === 'single' ? 'Rakip Seç' : 'Partner Seç')
                    : 'Rakipler Seç (2 Kişi)'}
                </Title>
                <TouchableOpacity onPress={handleOpponentSelectorClose}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>

              {selectorMode === 'opponents' && (
                <View style={styles.selectedCountInfo}>
                  <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
                  <Text style={styles.selectedCountText}>
                    {selectedOpponents.length}/2 rakip seçildi
                  </Text>
                </View>
              )}

              <Searchbar
                placeholder="Kullanıcı ara..."
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
                  const isSelected = selectorMode === 'partner' 
                    ? selectedPartner?.id === item.id
                    : selectedOpponents.some(opp => opp.id === item.id);
                  
                  // Partner modundaysa, rakiplerde seçili olanları disable et
                  const isDisabledInPartnerMode = selectorMode === 'partner' && 
                    playerType === 'double' && 
                    selectedOpponents.some(opp => opp.id === item.id);
                  
                  // Opponents modundaysa, partner olarak seçili olanı disable et
                  const isDisabledInOpponentsMode = selectorMode === 'opponents' && 
                    selectedPartner?.id === item.id;
                  
                  // Opponents modunda 2 kişi seçildiyse ve bu kullanıcı seçili değilse disable et
                  const isDisabledDueToLimit = selectorMode === 'opponents' && 
                    selectedOpponents.length >= 2 && 
                    !isSelected;
                  
                  const isDisabled = isDisabledInPartnerMode || 
                    isDisabledInOpponentsMode || 
                    isDisabledDueToLimit;
                  
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
                            {isDisabledInPartnerMode && ' (Rakip olarak seçili)'}
                            {isDisabledInOpponentsMode && ' (Partner olarak seçili)'}
                          </Text>
                          <Text style={[
                            styles.userEmail,
                            isDisabled && styles.disabledText
                          ]}>{item.email}</Text>
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
                  <View style={styles.emptyList}>
                    <MaterialCommunityIcons name="account-search" size={48} color="#BDBDBD" />
                    <Text style={styles.emptyListText}>Kullanıcı bulunamadı</Text>
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
                    <Text style={styles.confirmButtonText}>Tamam</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Success Snackbar */}
      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={2000}
        style={styles.successSnackbar}
        action={{
          label: 'Tamam',
          onPress: () => {
            setShowSuccessSnackbar(false);
            navigation.navigate('Home');
          },
        }}
      >
        <View style={styles.snackbarContent}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.snackbarText}>Rezervasyonunuz onaylandı!</Text>
        </View>
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
  },
  stepCard: {
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
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
});

export default ReservationScreen;