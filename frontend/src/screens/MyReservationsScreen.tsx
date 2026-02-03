import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Card, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { reservationService, authService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MyReservationsScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<any | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reservationToReject, setReservationToReject] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const profile = await authService.getProfile();
        setCurrentUserId(profile.id);
      } catch (error) {
        console.error('Kullanıcı profili yüklenirken hata:', error);
      }
    };
    loadCurrentUser();
    loadMyReservations();
  }, []);

  // Sayfa her açıldığında rezervasyonları yenile
  useFocusEffect(
    React.useCallback(() => {
      loadMyReservations();
    }, [])
  );

  const loadMyReservations = async () => {
    try {
      setLoading(true);
      const allReservations = await reservationService.getMyReservations();
      
      // Sadece gelecek/aktif rezervasyonları filtrele
      const now = new Date();
      const activeReservations = allReservations.filter((reservation: any) => {
        const endTime = new Date(reservation.endTime);
        return endTime >= now;
      });
      
      // Tarihe göre sırala (en yakın tarih önce)
      activeReservations.sort((a: any, b: any) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
      
      setMyReservations(activeReservations);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
      setMyReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
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

  const handleAcceptReservation = async (reservation: any) => {
    try {
      setActionLoading(true);
      await reservationService.acceptReservation(reservation.id);
      await loadMyReservations();
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
      await loadMyReservations();
      Alert.alert(t('common.success') || 'Başarılı', t('reservation.rejected') || 'Rezervasyon reddedildi ve iptal edildi');
      setReservationToReject(null);
    } catch (error: any) {
      Alert.alert(t('common.error') || 'Hata', error.response?.data?.message || t('reservation.rejectError') || 'Red işlemi başarısız');
      setReservationToReject(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Rezervasyon için takımları belirle (çiftlerde 4 oyuncu, takımlı gösterim)
  const getTeamsForReservation = (reservation: any) => {
    const owner = reservation.user;
    const participants = reservation.participants || [];
    const notes = reservation.notes || '';
    const responses = reservation.participantResponses || [];

    // Tam oyuncu listesi: participantResponses varsa sırayla (creator + participants), yoksa owner + participants
    let allPlayers: any[] = [];
    if (responses.length >= 4) {
      allPlayers = responses.map((r: any) => r.user).filter(Boolean);
    } else if (responses.length > 0) {
      allPlayers = responses.map((r: any) => r.user).filter(Boolean);
    }
    if (allPlayers.length < 4) {
      allPlayers = [owner, ...participants].filter(Boolean);
    }

    const totalCount = allPlayers.length;
    const isDoublesFromNotes = notes.includes('Çiftler') || notes.includes('doubles') || notes.includes('Doubles');
    const isDoubleMatch = isDoublesFromNotes || totalCount === 4;

    if (isDoubleMatch && totalCount >= 4) {
      // Çiftler: Takım 1 (ilk 2 oyuncu) vs Takım 2 (son 2 oyuncu)
      const team1 = allPlayers.slice(0, 2);
      const team2 = allPlayers.slice(2, 4);
      return {
        team1,
        team2,
        isDouble: true,
      };
    }
    if (isDoubleMatch && totalCount === 3) {
      // Eksik liste: 3 kişi var, yine de takımlı göster (2 vs 1)
      return {
        team1: allPlayers.slice(0, 2),
        team2: allPlayers.slice(2, 3),
        isDouble: true,
      };
    }
    // Tekler: 1 vs 1
    const opponent = allPlayers[1] || null;
    return {
      team1: [allPlayers[0]].filter(Boolean),
      team2: opponent ? [opponent] : [],
      isDouble: false,
    };
  };

  const handleDeleteReservation = (reservation: any) => {
    console.log('handleDeleteReservation çağrıldı, reservation:', reservation);
    setReservationToDelete(reservation);
    setShowDeleteDialog(true);
  };

  const confirmDeleteReservation = async () => {
    if (!reservationToDelete) return;
    
    console.log('Sil butonu tıklandı, rezervasyon iptal ediliyor...');
    setShowDeleteDialog(false);
    
    try {
      await reservationService.cancelReservation(reservationToDelete.id);
      console.log('Rezervasyon iptal edildi, liste yenileniyor...');
      await loadMyReservations();
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
        <Text style={styles.headerTitle}>{t('profile.myBookings')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Reservations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54CE8F" />
        </View>
      ) : myReservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-remove" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {t('reservationsList.noReservations') || 'Mevcut rezervasyonunuz bulunmamaktadır.'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {myReservations.map((reservation: any) => {
            const isPending = reservation.status === 'pending';
            const myResponse = getMyResponse(reservation);
            const canAcceptReject = myResponse && myResponse.acceptanceStatus === 'pending';
            return (
            <View key={reservation.id} style={styles.cardWrapper}>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#B45309" />
                  <Text style={styles.pendingBadgeText}>{t('reservation.pendingBadge')}</Text>
                </View>
              )}
              <Card style={[styles.reservationCard, isPending && styles.reservationCardPending]}>
                <Card.Content style={styles.cardContent}>
                  {/* Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateTimeContainer}>
                      <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#54CE8F" />
                        <Text style={styles.dateText}>{formatDate(reservation.startTime)}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#717182" />
                        <Text style={styles.timeText}>
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </Text>
                      </View>
                    </View>
                  </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Court Info */}
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="tennis" size={18} color="#B4AEBD" />
                  <Text style={styles.infoLabel}>{t('reservation.court') || 'Kort'}:</Text>
                  <Text style={styles.infoValue}>{reservation.court?.name || '-'}</Text>
                </View>

                {/* PENDING: Yanıt durumları (Kabul etti / Beklemede) */}
                {isPending && reservation.participantResponses?.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.responseStatusContainer}>
                      <Text style={styles.responseStatusLabel}>{t('reservation.responseStatus')}:</Text>
                      {reservation.participantResponses.map((resp: any) => (
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
                    <View style={styles.divider} />
                    <View style={styles.acceptRejectRow}>
                      <TouchableOpacity
                        style={[styles.acceptRejectButton, styles.acceptButton]}
                        onPress={() => handleAcceptReservation(reservation)}
                        disabled={actionLoading}
                      >
                        <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                        <Text style={styles.acceptRejectButtonText}>{t('reservation.accept')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptRejectButton, styles.rejectButton]}
                        onPress={() => handleRejectReservation(reservation)}
                        disabled={actionLoading}
                      >
                        <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                        <Text style={styles.acceptRejectButtonText}>{t('reservation.reject')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Players - Teams Display */}
                {(() => {
                  const teams = getTeamsForReservation(reservation);
                  const hasPlayers = teams.team1.length > 0 || teams.team2.length > 0;
                  
                  if (!hasPlayers) return null;
                  
                  const formatPlayerName = (player: any) =>
                    [player?.name, player?.surname].filter(Boolean).join(' ') || 'Bilinmiyor';

                  return (
                    <View style={styles.playersContainer}>
                      <View style={styles.playersLabelRow}>
                        <MaterialCommunityIcons name="account-group" size={18} color="#B4AEBD" />
                        <Text style={styles.playersLabel}>
                          {teams.isDouble ? (t('reservationsList.doublesMatch') || 'Çiftler Maçı') : (t('reservation.players') || 'Oyuncular')}:
                        </Text>
                      </View>
                      
                      <View style={styles.teamsContainer}>
                        {/* Takım 1 */}
                        <View style={[styles.teamContainer, teams.isDouble && styles.teamBlock]}>
                          {teams.isDouble && (
                            <Text style={[styles.teamLabel, styles.team1Label]}>{t('reservation.team1') || 'Takım 1'}</Text>
                          )}
                          {teams.team1.map((player: any, index: number) => (
                            <View key={player?.id || index} style={styles.playerNameContainer}>
                              <MaterialCommunityIcons name="account" size={16} color="#54CE8F" />
                              <Text style={styles.playerName}>{formatPlayerName(player)}</Text>
                            </View>
                          ))}
                        </View>

                        {teams.team2.length > 0 && (
                          <Text style={styles.vsText}>VS</Text>
                        )}

                        {/* Takım 2 */}
                        <View style={[styles.teamContainer, teams.isDouble && styles.teamBlock]}>
                          {teams.isDouble && (
                            <Text style={[styles.teamLabel, styles.team2Label]}>{t('reservation.team2') || 'Takım 2'}</Text>
                          )}
                          {teams.team2.map((player: any, index: number) => (
                            <View key={player?.id || index} style={styles.playerNameContainer}>
                              <MaterialCommunityIcons name="account" size={16} color="#FF9800" />
                              <Text style={styles.playerName}>{formatPlayerName(player)}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  );
                })()}
                </Card.Content>
              </Card>
              {!isPending && (
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButtonAbsolute,
                    pressed && styles.deleteButtonPressed
                  ]}
                  onPress={() => handleDeleteReservation(reservation)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <MaterialCommunityIcons name="delete-outline" size={22} color="#DC2626" />
                </Pressable>
              )}
            </View>
            );
          })}
        </ScrollView>
      )}

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
                  onPress={confirmDeleteReservation}
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

      {/* Reject Confirmation Modal */}
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
                <View style={[styles.deleteModalIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialCommunityIcons name="close-circle" size={32} color="#B45309" />
                </View>
                <Text style={styles.deleteModalTitle}>
                  {t('reservation.reject')}
                </Text>
              </View>
              
              <Text style={styles.deleteModalText}>
                {reservationToReject
                  ? (t('reservation.rejectConfirm') || 'Bu rezervasyonu reddedeceksiniz; rezervasyon iptal edilecek. Emin misiniz?')
                  : ''}
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
                  style={[styles.deleteModalConfirmButton, { backgroundColor: '#B45309' }]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
  },
  headerSection: {
    backgroundColor: '#B4AEBD',
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FAFCFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#717182',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
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
  reservationCard: {
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
  reservationCardPending: {
    borderColor: '#FDE68A',
    borderLeftWidth: 4,
  },
  cardContent: {
    padding: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonAbsolute: {
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
  deleteButtonPressed: {
    backgroundColor: '#FEE2E2',
    transform: [{ scale: 0.95 }],
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#030213',
    fontWeight: '400',
    flex: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#717182',
    flex: 1,
    fontStyle: 'italic',
  },
  playersContainer: {
    marginTop: 8,
  },
  playersLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  playersLabel: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    minWidth: '40%',
  },
  teamBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    flex: 1,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  team1Label: {
    color: '#059669',
  },
  team2Label: {
    color: '#EA580C',
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  playerName: {
    fontSize: 13,
    color: '#030213',
    fontWeight: '500',
  },
  vsText: {
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

export default MyReservationsScreen;

