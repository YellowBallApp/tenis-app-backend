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
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Title,
  Text,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { reservationService, courtService, reservationTemplateService, reservationTimeSlotService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

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

const { width } = Dimensions.get('window');

const ReservationsListScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockedHours, setBlockedHours] = useState<{[courtId: number]: Array<{hour: number, reason: string | null}>}>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

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

      // Seçilen tarihin haftanın gününü hesapla (0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi)
      const dateObj = new Date(selectedDate);
      const dayOfWeek = dateObj.getDay();

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

  // Sayfa her açıldığında rezervasyonları yenile
  useFocusEffect(
    React.useCallback(() => {
      loadTimeSlots();
      loadReservations();
      loadBlockedHours();
    }, [selectedDate, courts, loadTimeSlots])
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

  const renderCell = (courtId: number, timeSlot: string) => {
    const reservation = getReservationForSlot(courtId, timeSlot);
    const isBlocked = isTimeSlotBlocked(courtId, timeSlot);
    const blockedReason = getBlockedReason(courtId, timeSlot);
    
    if (reservation) {
      return (
        <View style={styles.reservedCell}>
          <MaterialCommunityIcons name="account-check" size={16} color="#2E7D32" />
          <Text style={styles.reservedText}>{reservation.user.name}</Text>
        </View>
      );
    }

    if (isBlocked) {
      return (
        <View style={styles.blockedCell}>
          <MaterialCommunityIcons name="lock" size={16} color="#D32F2F" />
          <Text style={styles.blockedText} numberOfLines={2}>
            {blockedReason || t('reservation.blocked')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyCell}>
        <Text style={styles.emptyText}>{t('reservationsList.empty')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.headerSection, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1B1B1B" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>{t('reservationsList.title')}</Title>
        <View style={styles.placeholder} />
      </View>

      {/* Date Selector */}
      <View style={styles.dateSection}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowCalendar(true)}
        >
          <MaterialCommunityIcons name="calendar" size={24} color="#2E7D32" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Reservations Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>{t('reservationsList.loading')}</Text>
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
                      size={20} 
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
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#2E7D32" />
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
                <Title style={styles.calendarTitle}>{t('reservation.selectDate')}</Title>
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
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  dateSection: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginHorizontal: 10,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#6C757D',
    fontSize: 16,
  },
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tableScrollView: {
    flex: 1,
  },
  tableContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  headerCell: {
    width: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  timeHeaderCell: {
    width: 80,
    backgroundColor: '#1B5E20',
  },
  headerCellText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  tableBody: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  cell: {
    width: 100,
    minHeight: 60,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  timeCell: {
    width: 80,
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    gap: 6,
  },
  timeCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  reservedCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  reservedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  emptyCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  blockedCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  blockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D32F2F',
    textAlign: 'center',
    flexShrink: 1,
  },
  legendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  legendText: {
    fontSize: 14,
    color: '#6C757D',
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
});

export default ReservationsListScreen;

