import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Text,
  Button,
  ActivityIndicator,
  Avatar,
  Menu,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reservationService, matchHistoryService, courtService, authService, notificationService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ReservationMatchResultScreen = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { reservationId } = route.params as { reservationId: number };

  const [reservation, setReservation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [courtMenuVisible, setCourtMenuVisible] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [matchSets, setMatchSets] = useState<Array<{ userScore: string; opponentScore: string }>>([
    { userScore: '', opponentScore: '' },
    { userScore: '', opponentScore: '' },
    { userScore: '', opponentScore: '' },
  ]);
  const [scoreError, setScoreError] = useState(false);
  const [scoreMismatch, setScoreMismatch] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mevcut kullanıcıyı al
      const user = await authService.getProfile();
      setCurrentUser(user);

      // Rezervasyonu yükle
      const reservationData = await reservationService.getReservationById(reservationId);
      setReservation(reservationData);

      // Kortları yükle
      const courtsData = await courtService.getActiveCourts();
      setCourts(courtsData);

      // Rezervasyondaki kortu varsayılan olarak seç
      if (reservationData.court) {
        setSelectedCourt(reservationData.court.id);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Rezervasyon bilgileri yüklenemedi.');
      setLoading(false);
      // Hata durumunda da geri dön
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  };

  const updateSetScore = (setIndex: number, field: 'userScore' | 'opponentScore', value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newSets = [...matchSets];
    newSets[setIndex][field] = value;
    setMatchSets(newSets);
    
    if (scoreError) {
      setScoreError(false);
    }
  };

  const addSet = () => {
    if (matchSets.length < 5) {
      setMatchSets([...matchSets, { userScore: '', opponentScore: '' }]);
    }
  };

  const removeSet = (index: number) => {
    if (matchSets.length > 1) {
      const newSets = matchSets.filter((_, i) => i !== index);
      setMatchSets(newSets);
    }
  };

  const getOpponents = () => {
    if (!reservation || !currentUser) return [];
    
    const opponents: any[] = [];
    
    // Rezervasyon sahibi currentUser değilse ekle
    if (reservation.user && reservation.user.id !== currentUser.id) {
      opponents.push(reservation.user);
    }
    
    // Participants'ları ekle
    if (reservation.participants && reservation.participants.length > 0) {
      reservation.participants.forEach((participant: any) => {
        if (participant.id !== currentUser.id && !opponents.find(o => o.id === participant.id)) {
          opponents.push(participant);
        }
      });
    }
    
    return opponents;
  };

  const submitMatchResult = async () => {
    if (!selectedWinner) {
      Alert.alert('Uyarı', 'Lütfen kazananı seçin');
      return;
    }

    if (!selectedCourt) {
      Alert.alert('Uyarı', 'Lütfen kort seçin');
      return;
    }

    // Skor validasyonu
    const filledSets = matchSets.filter(set => set.userScore && set.opponentScore);
    if (filledSets.length < 2) {
      setScoreError(true);
      Alert.alert('Uyarı', 'En az 2 set skoru girilmesi zorunludur');
      return;
    }

    // Set skorlarına göre gerçek kazananı belirle
    let userWonSets = 0;
    let opponentWonSets = 0;
    
    filledSets.forEach(set => {
      const userScore = parseInt(set.userScore);
      const opponentScore = parseInt(set.opponentScore);
      
      if (userScore > opponentScore) {
        userWonSets++;
      } else if (opponentScore > userScore) {
        opponentWonSets++;
      }
    });

    const opponents = getOpponents();
    if (opponents.length === 0) {
      Alert.alert('Hata', 'Rakip bulunamadı');
      return;
    }

    // İlk rakibi kullan (tekli maç için)
    const opponentId = opponents[0].id;

    // Gerçek kazananı belirle
    const actualWinnerId = userWonSets > opponentWonSets 
      ? currentUser.id 
      : opponentId;

    // Seçilen kazanan ile gerçek kazananı karşılaştır
    if (selectedWinner !== actualWinnerId) {
      setScoreMismatch(true);
      return;
    } else {
      setScoreMismatch(false);
    }

    // Skor formatını oluştur
    const scoreString = filledSets
      .map(set => `${set.userScore}-${set.opponentScore}`)
      .join(', ');

    const winnerId = selectedWinner;
    const loserId = selectedWinner === currentUser.id 
      ? opponentId 
      : currentUser.id;

    try {
      setSubmitting(true);

      // Maç geçmişini oluştur (lig bağlantısı olmadan)
      await matchHistoryService.createMatch({
        winnerIds: [winnerId],
        loserIds: [loserId],
        score: scoreString,
        matchDate: new Date(reservation.startTime),
        indoorCourt: reservation.court?.indoors || false,
        courtGround: reservation.court?.groundType || 'hard',
      });

      // Bu rezervasyon için gönderilen tüm bildirimleri sil
      try {
        await notificationService.deleteByRelatedEntity(reservationId, 'reservation');
        console.log('Rezervasyon bildirimleri silindi');
      } catch (notificationError) {
        console.error('Bildirim silme hatası:', notificationError);
        // Bildirim silme hatası maç sonucunu etkilemez
      }

      setSubmitting(false);

      // Başarı bildirimi göster
      setSnackbarMessage(`Maç sonucu kaydedildi: ${scoreString}`);
      setSnackbarVisible(true);

      // 2 saniye sonra geri dön
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç sonucu kaydedilemedi');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00B050" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!reservation || !currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Rezervasyon bulunamadı</Text>
        <Button onPress={() => navigation.goBack()}>Geri Dön</Button>
      </View>
    );
  }

  const opponents = getOpponents();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
              <Title style={styles.title}>Maç Sonucu Gir</Title>
            </View>

            <Text style={styles.subtitle}>
              Maç sonucunu ve set skorlarını girin
            </Text>

            {/* Kazanan Seçimi */}
            <Text style={styles.sectionLabel}>Kazanan Oyuncu</Text>
            <View style={[
              styles.winnerSelectionContainer,
              scoreMismatch && styles.errorBorder
            ]}>
              {/* Kullanıcı seçeneği */}
              <TouchableOpacity
                style={[
                  styles.winnerOption,
                  selectedWinner === currentUser.id && styles.winnerOptionSelected
                ]}
                onPress={() => {
                  setSelectedWinner(currentUser.id);
                  setScoreMismatch(false);
                }}
              >
                <View style={styles.radioButton}>
                  {selectedWinner === currentUser.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Avatar.Text 
                  size={36} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.winnerAvatar}
                />
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName}>{currentUser.name}</Text>
                  <Text style={styles.winnerLabel}>(Siz)</Text>
                </View>
              </TouchableOpacity>

              {/* Rakip seçeneği */}
              {opponents.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.winnerOption,
                    selectedWinner === opponents[0].id && styles.winnerOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedWinner(opponents[0].id);
                    setScoreMismatch(false);
                  }}
                >
                  <View style={styles.radioButton}>
                    {selectedWinner === opponents[0].id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Avatar.Text 
                    size={36} 
                    label={opponents[0].name.charAt(0)} 
                    style={styles.winnerAvatar}
                  />
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName}>{opponents[0].name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Kort Seçimi */}
            <View style={styles.courtSelectionSection}>
              <Text style={styles.sectionLabel}>Kort Seçin *</Text>
              <Menu
                visible={courtMenuVisible}
                onDismiss={() => setCourtMenuVisible(false)}
                anchorPosition="bottom"
                contentStyle={styles.menuContent}
                anchor={
                  <TouchableOpacity
                    style={styles.courtDropdownButton}
                    onPress={() => setCourtMenuVisible(true)}
                  >
                    <View style={styles.courtDropdownContent}>
                      <MaterialCommunityIcons 
                        name="tennis" 
                        size={20} 
                        color="#00B050" 
                      />
                      <Text style={styles.courtDropdownText}>
                        {selectedCourt 
                          ? courts.find(c => c.id === selectedCourt)?.name 
                          : 'Kort seçin'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-down" 
                      size={24} 
                      color="#757575" 
                    />
                  </TouchableOpacity>
                }
              >
                {courts.map((court) => (
                  <Menu.Item
                    key={court.id}
                    onPress={() => {
                      setSelectedCourt(court.id);
                      setCourtMenuVisible(false);
                    }}
                    title={court.name}
                    leadingIcon="tennis"
                  />
                ))}
              </Menu>
            </View>

            {/* Set Skorları */}
            <View style={styles.scoresSection}>
              <View style={styles.scoresSectionHeader}>
                <Text style={styles.sectionLabel}>Set Skorları (Minimum 2 Set Zorunlu)</Text>
                {matchSets.length < 5 && (
                  <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#00B050" />
                    <Text style={styles.addSetText}>Set Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>

              {scoreError && (
                <View style={styles.scoreErrorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#DC3545" />
                  <Text style={styles.scoreErrorText}>
                    En az 2 set skoru girilmesi zorunludur
                  </Text>
                </View>
              )}

              <View style={styles.scoresHeader}>
                <Text style={styles.scorePlayerLabel}>{currentUser.name}</Text>
                <Text style={styles.scoreDivider}>vs</Text>
                <Text style={styles.scorePlayerLabel}>
                  {opponents.length > 0 ? opponents[0].name : 'Rakip'}
                </Text>
              </View>

              {matchSets.map((set, index) => {
                const isSetFilled = set.userScore && set.opponentScore;
                const shouldShowError = (scoreError && !isSetFilled && index < 2) || scoreMismatch;
                
                return (
                  <View key={index} style={styles.setRow}>
                    <Text style={[styles.setLabel, shouldShowError && styles.setLabelError]}>
                      Set {index + 1}{index < 2 ? ' *' : ''}:
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={set.userScore}
                      onChangeText={(value) => {
                        updateSetScore(index, 'userScore', value);
                        setScoreMismatch(false);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      style={styles.scoreInput}
                      contentStyle={styles.scoreInputContent}
                      outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                      activeOutlineColor={shouldShowError ? "#DC3545" : "#00B050"}
                      error={shouldShowError}
                      dense
                    />
                    <Text style={styles.scoreSeparator}>-</Text>
                    <TextInput
                      mode="outlined"
                      value={set.opponentScore}
                      onChangeText={(value) => {
                        updateSetScore(index, 'opponentScore', value);
                        setScoreMismatch(false);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      style={styles.scoreInput}
                      contentStyle={styles.scoreInputContent}
                      outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                      activeOutlineColor={shouldShowError ? "#DC3545" : "#00B050"}
                      error={shouldShowError}
                      dense
                    />
                    {matchSets.length > 1 && (
                      <TouchableOpacity onPress={() => removeSet(index)} style={styles.removeSetButton}>
                        <MaterialCommunityIcons name="close-circle" size={24} color="#DC3545" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {scoreMismatch && (
                <View style={styles.scoreErrorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#DC3545" />
                  <Text style={styles.scoreErrorText}>
                    Kazanan oyuncu ve yazılan skorlar uyuşmuyor
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttons}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              >
                İptal
              </Button>
              <Button
                mode="contained"
                onPress={submitMatchResult}
                style={styles.submitButton}
                buttonColor="#00B050"
                loading={submitting}
                disabled={submitting}
              >
                Kaydet
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 12,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212121',
  },
  winnerSelectionContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 24,
  },
  errorBorder: {
    borderColor: '#DC3545',
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  winnerOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00B050',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B050',
  },
  winnerAvatar: {
    marginRight: 12,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  winnerLabel: {
    fontSize: 12,
    color: '#757575',
  },
  courtSelectionSection: {
    marginBottom: 24,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  courtDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courtDropdownText: {
    marginLeft: 8,
    fontSize: 16,
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
  },
  scoresSection: {
    marginBottom: 24,
  },
  scoresSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSetText: {
    marginLeft: 4,
    color: '#00B050',
    fontWeight: '600',
  },
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scoreErrorText: {
    marginLeft: 8,
    color: '#DC3545',
    fontSize: 14,
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  scorePlayerLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scoreDivider: {
    fontSize: 14,
    color: '#757575',
    marginHorizontal: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
    width: 50,
  },
  setLabelError: {
    color: '#DC3545',
  },
  scoreInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  scoreInputContent: {
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C757D',
    paddingHorizontal: 8,
  },
  removeSetButton: {
    marginLeft: 8,
    padding: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  snackbar: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    marginBottom: 16,
  },
});

export default ReservationMatchResultScreen;

