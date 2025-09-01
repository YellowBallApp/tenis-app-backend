import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type ReservationScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Reservation'>;

const ReservationScreen = () => {
  const navigation = useNavigation<ReservationScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [playerType, setPlayerType] = useState('single');
  const [partnerName, setPartnerName] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
  }, []);

  const availableTimes = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const courts = [
    { 
      id: 'court1', 
      name: 'Kort 1', 
      type: 'Açık', 
      surface: 'Çim',
      gradient: ['#4CAF50', '#2E7D32'],
      icon: 'weather-sunny'
    },
    { 
      id: 'court2', 
      name: 'Kort 2', 
      type: 'Açık', 
      surface: 'Kil',
      gradient: ['#FF9800', '#F57C00'],
      icon: 'weather-sunny'
    },
    { 
      id: 'court3', 
      name: 'Kort 3', 
      type: 'Kapalı', 
      surface: 'Sert',
      gradient: ['#2196F3', '#1976D2'],
      icon: 'home-roof'
    },
    { 
      id: 'court4', 
      name: 'Kort 4', 
      type: 'Kapalı', 
      surface: 'Sert',
      gradient: ['#9C27B0', '#7B1FA2'],
      icon: 'home-roof'
    },
  ];

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
    if (currentStep === 1) setCurrentStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (currentStep === 2) setCurrentStep(3);
  };

  const handleCourtSelect = (courtId: string) => {
    setSelectedCourt(courtId);
    if (currentStep === 3) setCurrentStep(4);
  };

  const handleReservation = () => {
    console.log('Rezervasyon yapıldı:', {
      date: selectedDate,
      time: selectedTime,
      court: selectedCourt,
      playerType,
      partnerName,
    });
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

          {/* Step 2: Time Selection */}
          {selectedDate && (
            <Card style={[styles.stepCard, currentStep >= 2 && styles.activeStepCard]}>
              <Card.Content>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Title style={styles.stepTitle}>Saat Seçin</Title>
                </View>
                
                <View style={styles.timeGrid}>
                  {availableTimes.map((time) => (
                    <TouchableOpacity
                      key={time}
                      onPress={() => handleTimeSelect(time)}
                      style={styles.timeChipContainer}
                    >
                      <LinearGradient
                        colors={selectedTime === time ? ['#2E7D32', '#1B5E20'] : ['#FFFFFF', '#F5F5F5']}
                        style={[
                          styles.timeChip,
                          selectedTime === time && styles.selectedTimeChip
                        ]}
                      >
                        <MaterialCommunityIcons 
                          name="clock" 
                          size={16} 
                          color={selectedTime === time ? "#FFFFFF" : "#757575"} 
                        />
                        <Text style={[
                          styles.timeChipText,
                          selectedTime === time && styles.selectedTimeChipText
                        ]}>
                          {time}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Step 3: Court Selection */}
          {selectedTime && (
            <Card style={[styles.stepCard, currentStep >= 3 && styles.activeStepCard]}>
              <Card.Content>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Title style={styles.stepTitle}>Kort Seçin</Title>
                </View>
                
                <View style={styles.courtGrid}>
                  {courts.map((court) => (
                    <TouchableOpacity
                      key={court.id}
                      onPress={() => handleCourtSelect(court.id)}
                      style={styles.courtCardContainer}
                    >
                      <LinearGradient
                        colors={selectedCourt === court.id ? court.gradient as [string, string] : ['#FFFFFF', '#F8F9FA']}
                        style={[
                          styles.courtCard,
                          selectedCourt === court.id && styles.selectedCourtCard
                        ]}
                      >
                        <View style={styles.courtIconContainer}>
                          <MaterialCommunityIcons 
                            name={court.icon as any} 
                            size={32} 
                            color={selectedCourt === court.id ? "#FFFFFF" : court.gradient[0]} 
                          />
                        </View>
                        <Text style={[
                          styles.courtName,
                          selectedCourt === court.id && styles.selectedCourtName
                        ]}>
                          {court.name}
                        </Text>
                        <Text style={[
                          styles.courtDetails,
                          selectedCourt === court.id && styles.selectedCourtDetails
                        ]}>
                          {court.type} • {court.surface}
                        </Text>
                        {selectedCourt === court.id && (
                          <View style={styles.selectedIcon}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Step 4: Player Type & Final Details */}
          {selectedCourt && (
            <Card style={[styles.stepCard, currentStep >= 4 && styles.activeStepCard]}>
              <Card.Content>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, currentStep >= 4 && styles.activeStepNumber]}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Title style={styles.stepTitle}>Oyuncu Tipi</Title>
                </View>
                
                <RadioButton.Group onValueChange={setPlayerType} value={playerType}>
                  <Surface style={styles.radioContainer}>
                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => setPlayerType('single')}
                    >
                      <RadioButton value="single" />
                      <View style={styles.radioContent}>
                        <MaterialCommunityIcons name="account" size={24} color="#2E7D32" />
                        <Text style={styles.radioLabel}>Tekler (1 vs 1)</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => setPlayerType('double')}
                    >
                      <RadioButton value="double" />
                      <View style={styles.radioContent}>
                        <MaterialCommunityIcons name="account-group" size={24} color="#2E7D32" />
                        <Text style={styles.radioLabel}>Çiftler (2 vs 2)</Text>
                      </View>
                    </TouchableOpacity>
                  </Surface>
                </RadioButton.Group>

                {playerType === 'double' && (
                  <View style={styles.partnerSection}>
                    <Text style={styles.partnerLabel}>Partner Adı</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="Partner adını girin"
                      value={partnerName}
                      onChangeText={setPartnerName}
                      style={styles.textInput}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#2E7D32"
                      left={<TextInput.Icon icon="account-plus" />}
                    />
                  </View>
                )}
              </Card.Content>
            </Card>
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
                      {courts.find(c => c.id === selectedCourt)?.name}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <MaterialCommunityIcons name="account-group" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.summaryText}>
                      {playerType === 'single' ? 'Tekler' : 'Çiftler'}
                      {playerType === 'double' && partnerName && ` - ${partnerName}`}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Card>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleReservation}
            disabled={!selectedDate || !selectedTime || !selectedCourt}
            style={[
              styles.reservationButtonContainer,
              (!selectedDate || !selectedTime || !selectedCourt) && styles.disabledButton
            ]}
          >
            <LinearGradient
              colors={(!selectedDate || !selectedTime || !selectedCourt) 
                ? ['#BDBDBD', '#9E9E9E'] 
                : ['#4CAF50', '#2E7D32']
              }
              style={styles.reservationButton}
            >
              <MaterialCommunityIcons 
                name="check-circle" 
                size={24} 
                color="#FFFFFF" 
                style={styles.buttonIcon}
              />
              <Text style={styles.reservationButtonText}>
                Rezervasyonu Onayla
              </Text>
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
      </Portal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
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
  partnerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
});

export default ReservationScreen;