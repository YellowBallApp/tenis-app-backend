import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { reservationService, courtService } from '../services/api';

const { width } = Dimensions.get('window');

const ReservationsListScreen = ({ navigation }: any) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsList = await courtService.getAllCourts();
        setCourts(courtsList);
      } catch (error) {
        console.error('Kortlar yüklenirken hata:', error);
      }
    };
    loadCourts();
  }, []);

  useEffect(() => {
    loadReservations();
  }, [selectedDate]);

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

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
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

  const getReservationForSlot = (courtId: number, timeSlot: string) => {
    return reservations.find(reservation => {
      const reservationTime = new Date(reservation.startTime);
      const hours = reservationTime.getHours();
      const minutes = reservationTime.getMinutes();
      const reservationTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return reservation.court.id === courtId && reservationTimeStr === timeSlot;
    });
  };

  const renderCell = (courtId: number, timeSlot: string) => {
    const reservation = getReservationForSlot(courtId, timeSlot);
    
    if (reservation) {
      return (
        <View style={styles.reservedCell}>
          <MaterialCommunityIcons name="account-check" size={16} color="#2E7D32" />
          <Text style={styles.reservedText}>{reservation.user.name}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyCell}>
        <Text style={styles.emptyText}>Boş</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Rezervasyonlar</Title>
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
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollView}
        >
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, styles.timeHeaderCell]}>
                <Text style={styles.headerCellText}>Saat</Text>
              </View>
              {courts.map(court => (
                <View key={court.id} style={[styles.headerCell, court.closed && styles.closedHeaderCell]}>
                  <MaterialCommunityIcons 
                    name={court.closed ? "lock" : "tennis"} 
                    size={20} 
                    color={court.closed ? "#BDBDBD" : "#FFFFFF"} 
                  />
                  <Text style={[styles.headerCellText, court.closed && styles.closedHeaderText]}>
                    {court.name}
                  </Text>
                  {court.closed && (
                    <Text style={styles.closedLabel}>Bakımda</Text>
                  )}
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
                    <View key={`${court.id}-${timeSlot}`} style={[styles.cell, court.closed && styles.closedCell]}>
                      {court.closed ? (
                        <View style={styles.closedCellContent}>
                          <MaterialCommunityIcons name="lock" size={16} color="#BDBDBD" />
                          <Text style={styles.closedCellText}>-</Text>
                        </View>
                      ) : (
                        renderCell(court.id, timeSlot)
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legendSection}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E8F5E8' }]} />
          <Text style={styles.legendText}>Rezerve Edilmiş</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#F5F5F5' }]} />
          <Text style={styles.legendText}>Boş</Text>
        </View>
      </View>

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
      </Portal>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  dateSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
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
  tableScrollView: {
    flex: 1,
  },
  tableContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  headerCell: {
    width: 120,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  closedHeaderCell: {
    backgroundColor: '#757575',
    opacity: 0.6,
  },
  closedHeaderText: {
    color: '#E0E0E0',
  },
  closedLabel: {
    fontSize: 10,
    color: '#E0E0E0',
    marginTop: 4,
  },
  timeHeaderCell: {
    width: 80,
    backgroundColor: '#1B5E20',
  },
  headerCellText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  tableBody: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  cell: {
    width: 120,
    minHeight: 60,
    padding: 10,
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
    borderRadius: 8,
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
  closedCell: {
    backgroundColor: '#F5F5F5',
    opacity: 0.4,
  },
  closedCellContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  closedCellText: {
    fontSize: 14,
    color: '#BDBDBD',
    fontWeight: 'bold',
  },
  emptyCell: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  legendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
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

