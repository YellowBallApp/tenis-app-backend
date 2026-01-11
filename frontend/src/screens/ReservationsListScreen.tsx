import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Card,
  Text,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { reservationService, courtService, reservationTemplateService, reservationTimeSlotService, authService, matchHistoryService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Takvim için Türkçe locale ayarları
LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün'
};

// İngilizce locale ayarları
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'tr';

const { width, height } = Dimensions.get('window');

type ReservationsListScreenNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const ReservationsListScreen = () => {
  const navigation = useNavigation<ReservationsListScreenNavigationProp>();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockedHours, setBlockedHours] = useState<{[courtId: number]: Array<{hour: number, reason: string | null}>}>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showReservationDetailsModal, setShowReservationDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [loadingMatchResult, setLoadingMatchResult] = useState(false);

  // Dil değiştiğinde takvim locale'ini ayarla
  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsList = await courtService.getAllCourts();
        // Boolean değerleri normalize et (backend'den string olarak gelebilir)
        const normalizedCourts = courtsList.map((court: any) => ({
          ...court,
          closed: !!(court.closed),
          indoors: !!(court.indoors),
        }));
        // Kapalı kortları filtrele - sadece açık kortları göster
        const activeCourts = normalizedCourts.filter((court: any) => !court.closed);
        setCourts(activeCourts);
      } catch (error) {
        console.error('Kortlar yüklenirken hata:', error);
      }
    };
    loadCourts();
  }, []);

  // Zaman dilimlerini yükle
  const loadTimeSlots = React.useCallback(async () => {
    try {
      if (!selectedDate) {
        // Varsayılan saat dilimlerini kullan
        const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
        setTimeSlots(defaultSlots.length > 0 ? defaultSlots : [
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
          setTimeSlots(templateSlots);
          return;
        }
      } catch (error) {
        console.log('Şablon saat dilimleri alınamadı, varsayılan kullanılıyor:', error);
      }

      // Şablon yoksa, genel aktif saat dilimlerini kullan
      const defaultSlots = await reservationTimeSlotService.getActiveTimeSlots();
      setTimeSlots(defaultSlots.length > 0 ? defaultSlots : [
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ]);
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
      // Hata durumunda varsayılan saat dilimlerini kullan
      setTimeSlots([
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ]);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  useEffect(() => {
    loadReservations();
    loadBlockedHours();
  }, [selectedDate, courts]);

  // Aktif rezervasyon kontrolü
  useEffect(() => {
    const checkActiveReservation = async () => {
      try {
        const hasActive = await reservationService.hasActiveReservation();
        setHasActiveReservation(hasActive);
      } catch (error) {
        console.error('Aktif rezervasyon kontrolü yapılırken hata:', error);
        setHasActiveReservation(false);
      }
    };
    checkActiveReservation();
  }, []);

  // Sayfa her açıldığında rezervasyonları yenile ve seçimleri temizle
  useFocusEffect(
    React.useCallback(() => {
      // Seçimleri temizle (modal açık değilse)
      if (!showReservationModal) {
        setSelectedCourtId(null);
        setSelectedTimeSlot(null);
      }
      
      loadTimeSlots();
      loadReservations();
      loadBlockedHours();
      
      // Aktif rezervasyon kontrolünü de yenile
      const checkActiveReservation = async () => {
        try {
          const hasActive = await reservationService.hasActiveReservation();
          setHasActiveReservation(hasActive);
        } catch (error) {
          console.error('Aktif rezervasyon kontrolü yapılırken hata:', error);
          setHasActiveReservation(false);
        }
      };
      checkActiveReservation();
    }, [selectedDate, courts, loadTimeSlots, showReservationModal])
  );

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservationsByDate(selectedDate);
      setReservations(data);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedHours = async () => {
    if (!selectedDate || courts.length === 0) {
      return;
    }

    try {
      const blockedHoursMap: {[courtId: number]: Array<{hour: number, reason: string | null}>} = {};
      
      // Her kort için bloke edilmiş saatleri yükle
      const promises = courts.map(async (court) => {
        try {
          const blocked = await reservationService.getBlockedHours(court.id, selectedDate);
          blockedHoursMap[court.id] = blocked || [];
        } catch (error) {
          console.error(`Kort ${court.id} için bloke saatler yüklenirken hata:`, error);
          blockedHoursMap[court.id] = [];
        }
      });

      await Promise.all(promises);
      setBlockedHours(blockedHoursMap);
    } catch (error) {
      console.error('Bloke edilmiş saatler yüklenirken hata:', error);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
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

  const getReservationForSlot = (courtId: number, timeSlot: string) => {
    return reservations.find(reservation => {
      const reservationTime = new Date(reservation.startTime);
      const hours = reservationTime.getHours();
      const minutes = reservationTime.getMinutes();
      const reservationTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return reservation.court.id === courtId && reservationTimeStr === timeSlot;
    });
  };

  const isTimeSlotBlocked = (courtId: number, timeSlot: string): boolean => {
    const blocked = blockedHours[courtId] || [];
    const hour = parseInt(timeSlot.split(':')[0]);
    return blocked.some(bh => bh.hour === hour);
  };

  const getBlockedReason = (courtId: number, timeSlot: string): string | null => {
    const blocked = blockedHours[courtId] || [];
    const hour = parseInt(timeSlot.split(':')[0]);
    const blockedHour = blocked.find(bh => bh.hour === hour);
    return blockedHour ? blockedHour.reason : null;
  };

  // Geçmiş saatleri kontrol et
  const isTimeSlotInPast = (timeSlot: string): boolean => {
    if (!selectedDate) return false;

    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    const selectedDateTime = new Date(selectedDateObj);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDateObj);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      return true; // Geçmiş bir tarih
    }
    
    if (selectedDateOnly.getTime() === today.getTime()) {
      return selectedDateTime < now; // Bugün ise şu anki saatten önceki saatler geçmiş
    }
    
    return false;
  };

  // 1 hafta sonrasını kontrol et (sadece önümüzdeki 7 gün için)
  const isDateOutOfRange = (date: string): boolean => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7); // 7 gün sonra
    
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    return selectedDateObj < today || selectedDateObj > maxDate;
  };

  const handleEmptyCellPress = (courtId: number, timeSlot: string) => {
    // Geçmiş saatlere tıklanılamasın
    if (isTimeSlotInPast(timeSlot)) {
      return;
    }
    setSelectedCourtId(courtId);
    setSelectedTimeSlot(timeSlot);
    setShowReservationModal(true);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    const newDateString = newDate.toISOString().split('T')[0];
    
    // 1 hafta sınırını kontrol et
    if (!isDateOutOfRange(newDateString)) {
      setSelectedDate(newDateString);
    }
  };

  const handleReservationPress = async () => {
    if (selectedCourtId && selectedTimeSlot) {
      console.log('handleReservationPress called', { selectedCourtId, selectedTimeSlot, selectedDate });
      
      // State'leri temizle
      setSelectedCourtId(null);
      setSelectedTimeSlot(null);
      setShowReservationModal(false);
      
      // CourtDetail sayfasına navigate et (Reservation stack içinde)
      console.log('Navigating to CourtDetail');
      (navigation as any).navigate('Reservation', {
        screen: 'CourtDetail',
        params: {
          courtId: selectedCourtId,
          selectedDate: selectedDate,
          selectedTime: selectedTimeSlot,
        }
      });
      console.log('Navigation completed');
    } else {
      console.log('handleReservationPress: missing params', { selectedCourtId, selectedTimeSlot });
    }
  };

  const handleReservedCellPress = async (reservation: any) => {
    setSelectedReservation(reservation);
    setMatchResult(null);
    setShowReservationDetailsModal(true);
    
    // Maç sonucunu yükle (eğer varsa)
    try {
      setLoadingMatchResult(true);
      const allMatches = await matchHistoryService.getAllMatches();
      
      // Rezervasyon bilgileri
      const reservationDate = new Date(reservation.startTime);
      const reservationEndDate = new Date(reservation.endTime);
      
      const reservationUserId = reservation.user?.id;
      const participantIds = (reservation.participants || []).map((p: any) => p.id);
      const allPlayerIds = [reservationUserId, ...participantIds].filter(Boolean);
      
      // Aynı tarihte, aynı saat aralığında, AYNI OYUNCULARLA (TÜM OYUNCULAR) yapılmış maçı bul
      const match = allMatches.find((m: any) => {
        const matchDate = new Date(m.matchDate);
        
        // 1. Maç tarihi, rezervasyon başlangıç ve bitiş saati arasında mı kontrol et
        if (matchDate < reservationDate || matchDate > reservationEndDate) {
          return false;
        }
        
        // 2. Maçtaki tüm oyuncuları al
        const matchPlayerIds = [
          ...(m.winners || []).map((w: any) => w.id),
          ...(m.losers || []).map((l: any) => l.id),
        ];
        
        // 3. Rezervasyondaki TÜM oyuncular maçta var mı kontrol et
        // Eğer rezervasyonda 2 oyuncu varsa (tekler), maçta da 2 oyuncu olmalı
        // Eğer rezervasyonda 4 oyuncu varsa (çiftler), maçta da 4 oyuncu olmalı
        if (matchPlayerIds.length !== allPlayerIds.length) {
          return false;
        }
        
        // 4. Tüm oyuncuların eşleştiğinden emin ol
        return allPlayerIds.every((id: string) => matchPlayerIds.includes(id));
      });
      
      if (match) {
        setMatchResult(match);
      }
    } catch (error) {
      console.error('Maç sonucu yüklenirken hata:', error);
    } finally {
      setLoadingMatchResult(false);
    }
  };

  const renderCell = (courtId: number, timeSlot: string) => {
    const reservation = getReservationForSlot(courtId, timeSlot);
    const isBlocked = isTimeSlotBlocked(courtId, timeSlot);
    const blockedReason = getBlockedReason(courtId, timeSlot);
    const isPast = isTimeSlotInPast(timeSlot);
    const isDateDisabled = isPast || isDateOutOfRange(selectedDate);
    // Eğer kullanıcının aktif rezervasyonu varsa ve hücre boşsa, disabled yap
    const isEmptyAndUserHasActive = !reservation && hasActiveReservation;
    const isDisabled = isDateDisabled || isEmptyAndUserHasActive;
    
    if (reservation) {
      // Rezerve edilmiş hücreler her zaman tıklanabilir (kimlerin oynadığını görmek için)
      return (
        <TouchableOpacity 
          style={styles.reservedCell}
          onPress={() => handleReservedCellPress(reservation)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="account-check" size={16} color="#54CE8F" />
          <Text style={styles.reservedText}>{reservation.user?.name || 'Bilinmiyor'}</Text>
        </TouchableOpacity>
      );
    }

    if (isBlocked) {
      return (
        <View style={styles.blockedCell}>
          <MaterialCommunityIcons name="lock" size={16} color="#EF4444" />
          <Text style={styles.blockedText} numberOfLines={2}>
            {blockedReason || t('reservation.blocked')}
          </Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.emptyCell,
          isDisabled && styles.emptyCellDisabled
        ]}
        onPress={() => handleEmptyCellPress(courtId, timeSlot)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <Text style={[
          styles.emptyText,
          isDisabled && styles.emptyTextDisabled
        ]}>
          {t('reservationsList.empty')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.headerSection, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : insets.top + 12 }]}>
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
        <Text style={styles.headerTitle}>{t('reservationsList.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Date Selector */}
      <View style={styles.dateSection}>
        <View style={styles.dateSelectorContainer}>
          {(() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateString = prevDate.toISOString().split('T')[0];
            const isPrevDisabled = isDateOutOfRange(prevDateString);
            
            return (
              <TouchableOpacity
                style={[styles.dateNavButton, isPrevDisabled && styles.dateNavButtonDisabled]}
                onPress={() => handleDateChange('prev')}
                disabled={isPrevDisabled}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={24} 
                  color={isPrevDisabled ? "#D1D5DB" : "#54CE8F"} 
                />
              </TouchableOpacity>
            );
          })()}
          
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowCalendar(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          {(() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateString = nextDate.toISOString().split('T')[0];
            const isNextDisabled = isDateOutOfRange(nextDateString);
            
            return (
              <TouchableOpacity
                style={[styles.dateNavButton, isNextDisabled && styles.dateNavButtonDisabled]}
                onPress={() => handleDateChange('next')}
                disabled={isNextDisabled}
              >
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={isNextDisabled ? "#D1D5DB" : "#54CE8F"} 
                />
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>

      {/* Reservations Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54CE8F" />
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.tableScrollView}
          >
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.headerCell, styles.timeHeaderCell]}>
                  <Text style={styles.headerCellText}>{t('reservationsList.timeHeader')}</Text>
                </View>
                    {courts.map(court => (
                      <View key={court.id} style={styles.headerCell}>
                        <MaterialCommunityIcons 
                          name="tennis" 
                          size={18} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.headerCellText}>
                          {court.name}
                        </Text>
                      </View>
                    ))}
              </View>

              {/* Table Body */}
              <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
                {timeSlots.map(timeSlot => (
                  <View key={timeSlot} style={styles.tableRow}>
                    <View style={[styles.cell, styles.timeCell]}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#54CE8F" />
                      <Text style={styles.timeCellText}>{timeSlot}</Text>
                    </View>
                    {courts.map(court => (
                      <View key={`${court.id}-${timeSlot}`} style={styles.cell}>
                        {renderCell(court.id, timeSlot)}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendSection}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E8F5E8' }]} />
          <Text style={styles.legendText}>{t('reservationsList.legendReserved')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#F5F5F5' }]} />
          <Text style={styles.legendText}>{t('reservationsList.legendEmpty')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFEBEE' }]} />
          <Text style={styles.legendText}>{t('reservation.blocked')}</Text>
        </View>
      </View>

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
                <Text style={styles.calendarTitle}>{t('reservation.selectDate')}</Text>
                <TouchableOpacity 
                  onPress={() => setShowCalendar(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: '#54CE8F',
                    selectedTextColor: '#FFFFFF'
                  }
                }}
                theme={{
                  backgroundColor: '#FFFFFF',
                  calendarBackground: '#FFFFFF',
                  textSectionTitleColor: '#54CE8F',
                  selectedDayBackgroundColor: '#54CE8F',
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: '#54CE8F',
                  dayTextColor: '#030213',
                  textDisabledColor: '#9CA3AF',
                  dotColor: '#54CE8F',
                  selectedDotColor: '#FFFFFF',
                  arrowColor: '#54CE8F',
                  monthTextColor: '#030213',
                  indicatorColor: '#54CE8F',
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
      </Portal>

      {/* Rezervasyon Yap Modal */}
      <Portal>
        <Modal
          visible={showReservationModal}
          onDismiss={() => {
            setShowReservationModal(false);
            setSelectedCourtId(null);
            setSelectedTimeSlot(null);
          }}
          contentContainerStyle={styles.reservationModal}
        >
          <Card style={styles.reservationModalCard}>
            <Card.Content>
              <View style={styles.reservationModalHeader}>
                <Text style={styles.reservationModalTitle}>{t('reservation.bookNow')}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowReservationModal(false);
                    setSelectedCourtId(null);
                    setSelectedTimeSlot(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              {selectedCourtId && selectedTimeSlot && (
                <>
                  <View style={styles.reservationModalInfo}>
                    <View style={styles.reservationModalInfoRow}>
                      <MaterialCommunityIcons name="tennis" size={20} color="#54CE8F" />
                      <Text style={styles.reservationModalInfoText}>
                        {courts.find(c => c.id === selectedCourtId)?.name || 'Kort'}
                      </Text>
                    </View>
                    <View style={styles.reservationModalInfoRow}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
                      <Text style={styles.reservationModalInfoText}>
                        {formatDate(selectedDate)}
                      </Text>
                    </View>
                    <View style={styles.reservationModalInfoRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#54CE8F" />
                      <Text style={styles.reservationModalInfoText}>
                        {selectedTimeSlot}
                      </Text>
                    </View>
                  </View>
                  
                  <Button
                    mode="contained"
                    onPress={handleReservationPress}
                    style={styles.reservationModalButton}
                    buttonColor="#54CE8F"
                    contentStyle={styles.reservationModalButtonContent}
                    labelStyle={styles.reservationModalButtonLabel}
                    icon="arrow-right"
                  >
                    {t('reservation.bookNow')}
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Rezervasyon Detayları Modal */}
      <Portal>
        <Modal
          visible={showReservationDetailsModal}
          onDismiss={() => {
            setShowReservationDetailsModal(false);
            setSelectedReservation(null);
            setMatchResult(null);
          }}
          contentContainerStyle={styles.reservationDetailsModal}
        >
          <View style={styles.reservationDetailsModalCard}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.modalCloseIcon}
              onPress={() => {
                setShowReservationDetailsModal(false);
                setSelectedReservation(null);
                setMatchResult(null);
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#717182" />
            </TouchableOpacity>

            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedReservation && (() => {
                // Notes'tan partner ve rakip bilgisini çıkar
                const notes = selectedReservation.notes || '';
                const isDoubles = notes.includes('Çiftler') || notes.includes('doubles');
                const participants = selectedReservation.participants || [];
                
                // Çiftler maçında: ilk participant partner, diğerleri rakip
                // Tekler maçında: participant rakip
                let partner: any = null;
                let opponents: any[] = [];
                
                if (isDoubles && participants.length >= 3) {
                  // 4 kişi: owner + partner + 2 rakip
                  partner = participants[0];
                  opponents = participants.slice(1);
                } else if (isDoubles && participants.length === 1) {
                  // 2 kişi: owner + partner (henüz rakip seçilmemiş)
                  partner = participants[0];
                } else if (!isDoubles && participants.length > 0) {
                  // Tekler: participant rakip
                  opponents = participants;
                } else if (participants.length === 2) {
                  // 3 kişi: muhtemelen owner + partner + 1 rakip (henüz 2. rakip seçilmemiş)
                  partner = participants[0];
                  opponents = participants.slice(1);
                }
                
                return (
                  <View style={styles.detailsContent}>
                    {/* Header */}
                    <View style={styles.modalHeaderContent}>
                      <View style={styles.modalTitleRow}>
                        <MaterialCommunityIcons name="tennis" size={24} color="#54CE8F" />
                        <Text style={styles.modalTitle}>
                          {t('reservationsList.matchDetails')}
                        </Text>
                      </View>
                      <Text style={styles.modalSubtitle}>
                        {new Date(selectedReservation.startTime).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {selectedReservation.court?.name || t('reservationsList.unknownCourt')}
                      </Text>
                    </View>

                    {/* Players */}
                    <View style={styles.playersContainer}>
                      {/* Team 1: Owner + Partner */}
                      <View style={styles.teamContainer}>
                        <View style={styles.playerNameContainer}>
                          <MaterialCommunityIcons name="account" size={16} color="#54CE8F" />
                          <Text style={styles.playerName}>
                            {`${selectedReservation.user?.name || ''} ${selectedReservation.user?.surname || ''}`.trim() || 'Bilinmiyor'}
                          </Text>
                        </View>
                        {partner && (
                          <View style={styles.playerNameContainer}>
                            <MaterialCommunityIcons name="account" size={16} color="#54CE8F" />
                            <Text style={styles.playerName}>
                              {`${partner.name || ''} ${partner.surname || ''}`.trim() || 'Bilinmiyor'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* VS İkonu */}
                      {(opponents.length > 0 || (!partner && participants.length > 0)) && (
                        <Text style={styles.vsText}>
                          {t('reservationsList.vs')}
                        </Text>
                      )}

                      {/* Team 2: Opponents */}
                      <View style={styles.teamContainer}>
                        {opponents.length > 0 ? (
                          opponents.map((opponent: any, index: number) => (
                            <View key={opponent.id || index} style={styles.playerNameContainer}>
                              <MaterialCommunityIcons name="account" size={16} color="#FF9800" />
                              <Text style={styles.playerName}>
                                {`${opponent.name || ''} ${opponent.surname || ''}`.trim() || 'Bilinmiyor'}
                              </Text>
                            </View>
                          ))
                        ) : !partner && participants.length > 0 ? (
                          participants.map((participant: any, index: number) => (
                            <View key={participant.id || index} style={styles.playerNameContainer}>
                              <MaterialCommunityIcons name="account" size={16} color="#FF9800" />
                              <Text style={styles.playerName}>
                                {`${participant.name || ''} ${participant.surname || ''}`.trim() || 'Bilinmiyor'}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noOpponentText}>
                            {t('reservationsList.empty')}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Match Result Section */}
                    {loadingMatchResult ? (
                      <View style={styles.matchResultSection}>
                        <ActivityIndicator size="small" color="#54CE8F" />
                        <Text style={styles.loadingText}>{t('reservationsList.loadingResult')}</Text>
                      </View>
                    ) : matchResult ? (
                      <View style={styles.matchResultSection}>
                        <View style={styles.resultHeader}>
                          <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                          <Text style={styles.resultTitle}>{t('reservationsList.matchResult')}</Text>
                        </View>
                        
                        {/* Score Display */}
                        {matchResult.score && (
                          <View style={styles.scoreContainer}>
                            {(() => {
                              // Parse score (örn: "6-4, 6-3" veya "6-4 6-3")
                              const sets = matchResult.score
                                .split(/[,\s]+/)
                                .map((s: string) => s.trim())
                                .filter((s: string) => s.length > 0);
                              
                              return (
                                <View style={styles.setsContainer}>
                                  {sets.map((set: string, index: number) => {
                                    const [score1, score2] = set.split('-').map(s => s.trim());
                                    return (
                                      <View key={index} style={styles.setScore}>
                                        <Text style={styles.setLabel}>
                                          {t('reservationsList.set')} {index + 1}
                                        </Text>
                                        <Text style={styles.setScoreText}>
                                          {score1} - {score2}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              );
                            })()}
                          </View>
                        )}

                        {/* Winners */}
                        {matchResult.winners && matchResult.winners.length > 0 && (
                          <View style={styles.winnersSection}>
                            <View style={styles.winnerLabelContainer}>
                              <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
                              <Text style={styles.winnerLabel}>{t('reservationsList.winners')}</Text>
                            </View>
                            <View style={styles.winnersList}>
                              {matchResult.winners.map((winner: any, index: number) => (
                                <View key={winner.id || index} style={styles.winnerItem}>
                                  <MaterialCommunityIcons name="check-circle" size={16} color="#54CE8F" />
                                  <Text style={styles.winnerName}>
                                    {`${winner.name || ''} ${winner.surname || ''}`.trim() || 'Bilinmiyor'}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
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
  headerTitle: {
    fontSize: 24, // text-2xl
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  dateSection: {
    padding: 24, // px-6
    paddingTop: 20, // pt-5
    paddingBottom: 16, // pb-4
    backgroundColor: '#FAFCFB',
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3
  },
  dateNavButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavButtonDisabled: {
    opacity: 0.5,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16, // p-4
    borderRadius: 16, // rounded-2xl
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
    gap: 12, // gap-3
  },
  dateText: {
    fontSize: 16, // text-base
    fontWeight: '500',
    color: '#030213',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40, // p-10
    backgroundColor: '#FAFCFB',
  },
  loadingText: {
    marginTop: 16, // mt-4
    color: '#717182', // Medium gray
    fontSize: 14, // text-sm
  },
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 24, // px-6
    paddingBottom: 16, // pb-4
  },
  tableScrollView: {
    flex: 1,
  },
  tableContainer: {
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#54CE8F', // Primary green
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  headerCell: {
    width: 100,
    padding: 12, // p-3
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
    gap: 4, // gap-1
  },
  timeHeaderCell: {
    width: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Dark overlay
  },
  headerCellText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12, // text-xs
    textAlign: 'center',
  },
  tableBody: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  cell: {
    width: 100,
    minHeight: 60,
    padding: 8, // p-2
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  timeCell: {
    width: 80,
    backgroundColor: '#F3F4F6', // gray-100
    flexDirection: 'row',
    gap: 8, // gap-2
    alignItems: 'center',
  },
  timeCellText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#030213',
  },
  reservedCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0FDF4', // green-50
    borderRadius: 12, // rounded-xl
    padding: 8, // p-2
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4, // gap-1
    borderWidth: 1,
    borderColor: '#D1FAE5', // green-100
  },
  reservedText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
    color: '#030213',
    textAlign: 'center',
  },
  emptyCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F3F4F6', // gray-100
    borderRadius: 12, // rounded-xl
    padding: 8, // p-2
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCellDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    fontSize: 11, // text-xs
    color: '#9CA3AF', // gray-400
    fontStyle: 'italic',
  },
  emptyTextDisabled: {
    color: '#D1D5DB',
  },
  blockedCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FEF2F2', // red-50
    borderRadius: 12, // rounded-xl
    padding: 8, // p-2
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4, // gap-1
    borderWidth: 1,
    borderColor: '#FEE2E2', // red-100
  },
  blockedText: {
    fontSize: 10, // text-xs
    fontWeight: '500',
    color: '#EF4444', // red-500
    textAlign: 'center',
    flexShrink: 1,
  },
  legendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // p-5
    gap: 16, // gap-4
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
  },
  legendBox: {
    width: 16, // w-4
    height: 16, // h-4
    borderRadius: 4, // rounded
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  legendText: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
  },
  calendarModal: {
    margin: 20, // m-5
    flex: 1,
    justifyContent: 'center',
  },
  calendarCard: {
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  calendarTitle: {
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
  reservationModal: {
    margin: 20,
    justifyContent: 'center',
  },
  reservationModalCard: {
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  reservationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  reservationModalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  reservationModalInfo: {
    marginBottom: 24,
    gap: 12,
  },
  reservationModalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reservationModalInfoText: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '500',
  },
  reservationModalButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  reservationModalButtonContent: {
    paddingVertical: 8,
  },
  reservationModalButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reservationDetailsModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  reservationDetailsModalCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    maxHeight: Platform.OS === 'ios' ? height * 0.75 : height * 0.70,
    minHeight: Platform.OS === 'ios' ? height * 0.58 : height * 0.55,
    width: Platform.OS === 'ios' ? '92%' : '95%',
    maxWidth: 500,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 22,
  },
  detailsContent: {
    gap: 18,
  },
  modalHeaderContent: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#030213',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#717182',
    fontWeight: '500',
  },
  playersContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#717182',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  noOpponentText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  matchResultSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#030213',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  setsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  setScore: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    minWidth: 75,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  setLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#717182',
    marginBottom: 4,
  },
  setScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#030213',
  },
  winnersSection: {
    gap: 8,
  },
  winnerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
  },
  winnersList: {
    gap: 8,
  },
  winnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  winnerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#030213',
  },
  closeButton: {
    backgroundColor: '#54CE8F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#54CE8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ReservationsListScreen;

