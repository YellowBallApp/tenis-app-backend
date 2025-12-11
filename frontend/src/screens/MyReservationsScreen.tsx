import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { reservationService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MyReservationsScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  const handleDeleteReservation = (reservation: any) => {
    Alert.alert(
      t('reservation.cancelReservation') || 'Rezervasyonu İptal Et',
      t('reservation.cancelConfirm') || `${formatDate(reservation.startTime)} tarihindeki rezervasyonunuzu iptal etmek istediğinizden emin misiniz?`,
      [
        {
          text: t('common.cancel') || 'İptal',
          style: 'cancel',
        },
        {
          text: t('common.delete') || 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancelReservation(reservation.id);
              await loadMyReservations();
              Alert.alert(
                t('common.success') || 'Başarılı',
                t('reservation.cancelled') || 'Rezervasyon iptal edildi'
              );
            } catch (error: any) {
              console.error('Rezervasyon iptal hatası:', error);
              Alert.alert(
                t('common.error') || 'Hata',
                error.response?.data?.message || t('reservation.cancelError') || 'Rezervasyon iptal edilemedi'
              );
            }
          },
        },
      ]
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
        <Text style={styles.headerTitle}>{t('profile.myBookings')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Reservations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54CE8F" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          {myReservations.map((reservation: any) => (
            <Card key={reservation.id} style={styles.reservationCard}>
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
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReservation(reservation)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Court Info */}
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="tennis" size={18} color="#B4AEBD" />
                  <Text style={styles.infoLabel}>{t('reservation.court') || 'Kort'}:</Text>
                  <Text style={styles.infoValue}>{reservation.court?.name || '-'}</Text>
                </View>

                {/* Participants */}
                {reservation.participants && reservation.participants.length > 0 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="account-group" size={18} color="#B4AEBD" />
                    <Text style={styles.infoLabel}>{t('reservation.players') || 'Oyuncular'}:</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {reservation.participants.map((p: any) => p.name).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {reservation.notes && (
                  <View style={styles.notesContainer}>
                    <MaterialCommunityIcons name="note-text" size={16} color="#9CA3AF" />
                    <Text style={styles.notesText}>{reservation.notes}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
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
  reservationCard: {
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
  cardContent: {
    padding: 20,
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
});

export default MyReservationsScreen;

