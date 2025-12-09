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

      // Rezervasyondaki kortu kullan (değiştirilemez)
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
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home' as never);
        }
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

    // Kort seçimi rezervasyondan alınır, kontrol etmeye gerek yok
    if (!reservation?.court?.id) {
      Alert.alert(t('common.error') || 'Hata', 'Rezervasyon kort bilgisi bulunamadı');
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
      Alert.alert(t('common.error') || 'Hata', t('notifications.opponentNotFound') || 'Rakip bulunamadı');
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
        courtId: reservation.court?.id,
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
      setSnackbarMessage(`${t('notifications.matchResultSaved') || 'Maç sonucu kaydedildi'}: ${scoreString}`);
      setSnackbarVisible(true);

      // 2 saniye sonra geri dön
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home' as never);
        }
      }, 2000);
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert(t('common.error') || 'Hata', error.response?.data?.message || t('notifications.matchResultSaveError') || 'Maç sonucu kaydedilemedi');
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
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="trophy" size={28} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{t('notifications.enterMatchResult') || 'Maç Sonucu Gir'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner Selection Card */}
        <Card style={styles.winnerCard}>
          <Card.Content style={styles.winnerCardContent}>
            <View style={styles.winnerCardHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color="#54CE8F" />
              <Text style={styles.sectionLabel}>{t('notifications.selectWinner') || 'Kazanan Oyuncu'}</Text>
            </View>
            
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
                  size={40} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.winnerAvatar}
                />
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName}>{currentUser.name}</Text>
                  <Text style={styles.winnerLabel}>{t('notifications.you') || '(Siz)'}</Text>
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
                    size={40} 
                    label={opponents[0].name.charAt(0)} 
                    style={styles.winnerAvatar}
                  />
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName}>{opponents[0].name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Court Selection Card */}
        <Card style={styles.courtCard}>
          <Card.Content style={styles.courtCardContent}>
            <View style={styles.courtCardHeader}>
              <MaterialCommunityIcons name="tennis" size={20} color="#54CE8F" />
              <Text style={styles.sectionLabel}>{t('notifications.selectCourt') || 'Kort'}</Text>
            </View>
            <View style={[styles.courtDropdownButton, styles.courtDropdownButtonDisabled]}>
              <View style={styles.courtDropdownContent}>
                <MaterialCommunityIcons 
                  name="tennis" 
                  size={20} 
                  color="#9CA3AF" 
                />
                <Text style={[styles.courtDropdownText, styles.courtDropdownTextDisabled]}>
                  {reservation?.court?.name || 'Kort'}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="lock" 
                size={20} 
                color="#9CA3AF" 
              />
            </View>
          </Card.Content>
        </Card>

        {/* Scores Card */}
        <Card style={styles.scoresCard}>
          <Card.Content style={styles.scoresCardContent}>
            <View style={styles.scoresSectionHeader}>
              <View style={styles.scoresHeaderTitle}>
                <MaterialCommunityIcons name="scoreboard" size={20} color="#54CE8F" />
                <Text style={styles.sectionLabel}>{t('notifications.setScores') || 'Set Skorları (Minimum 2 Set Zorunlu)'}</Text>
              </View>
              {matchSets.length < 5 && (
                <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#54CE8F" />
                  <Text style={styles.addSetText}>{t('notifications.addSet') || 'Set Ekle'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {scoreError && (
              <View style={styles.scoreErrorContainer}>
                <View style={styles.scoreErrorIconContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <Text style={styles.scoreErrorText}>
                  {t('notifications.minTwoSetsRequired') || 'En az 2 set skoru girilmesi zorunludur'}
                </Text>
              </View>
            )}

            <View style={styles.scoresHeader}>
              <Text style={styles.scorePlayerLabel}>{currentUser.name}</Text>
              <View style={styles.vsContainer}>
                <Text style={styles.scoreDivider}>VS</Text>
              </View>
              <Text style={styles.scorePlayerLabel}>
                {opponents.length > 0 ? opponents[0].name : t('notifications.opponent') || 'Rakip'}
              </Text>
            </View>

            {matchSets.map((set, index) => {
              const isSetFilled = set.userScore && set.opponentScore;
              const shouldShowError = (scoreError && !isSetFilled && index < 2) || scoreMismatch;
              
              return (
                <View key={index} style={styles.setRow}>
                  <Text style={[styles.setLabel, shouldShowError && styles.setLabelError]}>
                    {t('notifications.set') || 'Set'} {index + 1}{index < 2 ? ' *' : ''}:
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
                    outlineColor={shouldShowError ? "#EF4444" : "#E5E7EB"}
                    activeOutlineColor={shouldShowError ? "#EF4444" : "#54CE8F"}
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
                    outlineColor={shouldShowError ? "#EF4444" : "#E5E7EB"}
                    activeOutlineColor={shouldShowError ? "#EF4444" : "#54CE8F"}
                    error={shouldShowError}
                    dense
                  />
                  {matchSets.length > 1 && (
                    <TouchableOpacity onPress={() => removeSet(index)} style={styles.removeSetButton}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {scoreMismatch && (
              <View style={styles.scoreErrorContainer}>
                <View style={styles.scoreErrorIconContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <Text style={styles.scoreErrorText}>
                  {t('notifications.scoreMismatch') || 'Kazanan oyuncu ve yazılan skorlar uyuşmuyor'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home' as never);
              }
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel') || 'İptal'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submitMatchResult}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>{t('common.save') || 'Kaydet'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  winnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  winnerCardContent: {
    padding: 24,
  },
  winnerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerSelectionContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorBorder: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  winnerOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#54CE8F',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#54CE8F',
  },
  winnerAvatar: {
    marginRight: 14,
    backgroundColor: '#54CE8F',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 13,
    color: '#717182',
  },
  courtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  courtCardContent: {
    padding: 24,
  },
  courtCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 18,
    backgroundColor: '#F9FAFB',
  },
  courtDropdownButtonDisabled: {
    opacity: 0.7,
  },
  courtDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtDropdownText: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '500',
  },
  courtDropdownTextDisabled: {
    color: '#717182',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  scoresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  scoresCardContent: {
    padding: 24,
  },
  scoresSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoresHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSetText: {
    color: '#54CE8F',
    fontWeight: '600',
    fontSize: 14,
  },
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  scoreErrorIconContainer: {
    marginRight: 8,
  },
  scoreErrorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  scorePlayerLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#030213',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  scoreDivider: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  setLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#030213',
    width: 70,
  },
  setLabelError: {
    color: '#EF4444',
  },
  scoreInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  scoreInputContent: {
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#717182',
    paddingHorizontal: 8,
  },
  removeSetButton: {
    padding: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#54CE8F',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  snackbar: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#717182',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
});

export default ReservationMatchResultScreen;

