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
  Text,
  Portal,
  Modal,
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
          <MaterialCommunityIcons name="account-check" size={16} color="#54CE8F" />
          <Text style={styles.reservedText}>{reservation.user.name}</Text>
        </View>
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
      <View style={styles.emptyCell}>
        <Text style={styles.emptyText}>{t('reservationsList.empty')}</Text>
      </View>
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
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowCalendar(true)}
        >
          <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Reservations Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54CE8F" />
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
  dateSelector: {
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
  emptyText: {
    fontSize: 11, // text-xs
    color: '#9CA3AF', // gray-400
    fontStyle: 'italic',
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
});

export default ReservationsListScreen;

