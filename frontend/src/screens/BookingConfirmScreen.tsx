import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Text,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { reservationService, authService } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface BookingConfirmScreenParams {
  courtId: number;
  selectedDate: string;
  selectedTime: string;
  playerType: 'single' | 'double';
  selectedPartner: any;
  selectedOpponents: any[];
  court: any;
}

const BookingConfirmScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = route.params as BookingConfirmScreenParams;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authService.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Kullanıcı bilgisi yüklenirken hata:', error);
      }
    };
    loadCurrentUser();
  }, []);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);

      // Tarih ve saati birleştir (yerel saat diliminde)
      const [hours, minutes] = params.selectedTime.split(':');
      const [year, month, day] = params.selectedDate.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

      // Bitiş saatini hesapla (1 saat sonra)
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 1);

      // Participant ID'lerini oluştur
      const participantIds: string[] = [];
      
      if (params.playerType === 'single' && params.selectedPartner) {
        participantIds.push(params.selectedPartner.id);
      } else if (params.playerType === 'double') {
        if (params.selectedPartner) {
          participantIds.push(params.selectedPartner.id);
        }
        params.selectedOpponents.forEach(opp => participantIds.push(opp.id));
      }

      // Notes oluştur
      const notes = params.playerType === 'single' 
        ? `${t('reservation.singlesMatch')}${params.selectedPartner ? ` - ${t('reservation.opponent')} ${params.selectedPartner.name}` : ''}` 
        : `${t('reservation.doublesMatch')}${params.selectedPartner ? ` - ${t('reservation.partner')} ${params.selectedPartner.name}` : ''}${params.selectedOpponents.length > 0 ? ` - ${t('reservation.opponents')} ${params.selectedOpponents.map(o => o.name).join(', ')}` : ''}`;

      const reservationData = {
        courtId: params.courtId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: participantIds.length > 0 ? participantIds : undefined,
        notes,
      };

      // Backend'e gönder
      await reservationService.createReservation(reservationData);

      setIsConfirming(false);

      // Hemen ana sayfaya yönlendir (snackbar Ana Sayfada gösterilir)
      try {
        const parent = navigation.getParent();
        if (parent) {
          (parent as any).navigate('Home', { showReservationSuccess: true });
        } else {
          const rootState = navigation.getRootState();
          if (rootState) {
            (navigation as any).navigate('Home' as never, { showReservationSuccess: true });
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' as never, params: { showReservationSuccess: true } }],
              })
            );
          }
        }
      } catch (err) {
        console.error('❌ Navigation hatası:', err);
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' as never, params: { showReservationSuccess: true } }],
            })
          );
        } catch (resetErr) {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      setIsConfirming(false);
      
      let errorMsg = t('reservation.errorCreating');
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      Alert.alert(
        t('common.error'),
        errorMsg,
        [{ text: t('common.ok') }]
      );
    }
  };

  const createChallengesForOpponents = async (reservationStartTime: Date) => {
    if (!currentUser || !currentUser.id) {
      return;
    }

    // Determine opponents based on game type
    const opponents: any[] = [];
    
    if (params.playerType === 'single' && params.selectedPartner) {
      // Singles mode: selectedPartner is the opponent
      opponents.push(params.selectedPartner);
    } else if (params.playerType === 'double' && params.selectedOpponents.length > 0) {
      // Doubles mode: selectedOpponents are the opponents (not the partner)
      opponents.push(...params.selectedOpponents);
    }

    if (opponents.length === 0) {
      return;
    }

    try {
      // Get current user's leagues
      const currentUserStandings = await leagueStandingsService.getStandingsByUserId(currentUser.id);
      const currentUserLeagueIds = currentUserStandings
        .filter((standing: any) => standing.league && standing.league.id)
        .map((standing: any) => standing.league.id);

      if (currentUserLeagueIds.length === 0) {
        return;
      }

      // Get opponent's leagues and find common leagues
      const challengePromises = opponents.map(async (opponent) => {
        try {
          const opponentStandings = await leagueStandingsService.getStandingsByUserId(opponent.id);
          const opponentLeagueIds = opponentStandings
            .filter((standing: any) => standing.league && standing.league.id)
            .map((standing: any) => standing.league.id);

          // Find common leagues
          const commonLeagueIds = currentUserLeagueIds.filter(id => opponentLeagueIds.includes(id));

          // Create challenges for each common league
          const leagueChallengePromises = commonLeagueIds.map(async (leagueId) => {
            try {
              await matchChallengeService.createChallenge({
                opponentId: opponent.id,
                leagueId: leagueId,
                matchDate: reservationStartTime.toISOString(),
              });
            } catch (error) {
              // Silently handle errors
            }
          });

          await Promise.all(leagueChallengePromises);
        } catch (error) {
          // Silently handle errors
        }
      });

      await Promise.all(challengePromises);
    } catch (error) {
      // Silently handle errors
    }
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const endHour = hour + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
    
    // Rezervasyon süresi 1 saat (60 dakika)
    const durationMinutes = 60;
    return `${timeString} - ${endTime} (${durationMinutes} ${t('reservation.minutes')})`;
  };

  const getGameTypeText = () => {
    if (params.playerType === 'single') {
      return t('reservation.singles');
    } else {
      return t('reservation.doubles');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ReservationList' as never);
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reservation.confirmBooking') || 'Confirm Booking'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reservation Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content style={styles.detailsCardContent}>
            <Text style={styles.detailsTitle}>{t('reservation.reservationDetails')}</Text>
            
            {/* Court */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#B4AEBD' }]}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('reservation.court')}</Text>
                <Text style={styles.detailValue}>
                  {params.court?.name || 'Court'} - {params.court?.groundType ? t(`reservation.${params.court.groundType}`) : t('reservation.hard')}
                </Text>
              </View>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#54CE8F' }]}>
                <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('reservation.date')}</Text>
                <Text style={styles.detailValue}>{formatDate(params.selectedDate)}</Text>
              </View>
            </View>

            {/* Time */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#B4AEBD' }]}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('reservation.time')}</Text>
                <Text style={styles.detailValue}>{formatTime(params.selectedTime)}</Text>
              </View>
            </View>

            {/* Game Type */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#54CE8F' }]}>
                <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('reservation.gameType')}</Text>
                <Text style={styles.detailValue}>{getGameTypeText()}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Players Card */}
        <Card style={styles.playersCard}>
          <Card.Content style={styles.playersCardContent}>
            <Text style={styles.playersTitle}>{t('reservation.players')}</Text>
            
            {/* Team 1: Current User + Partner (for doubles) */}
            <View style={styles.teamContainer}>
              {currentUser && (
                <View style={styles.playerItem}>
                  <View style={styles.playerAvatarContainer}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {getInitials(currentUser.name)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerLabel}>{t('reservation.you')}</Text>
                    <Text style={styles.playerName}>{currentUser.name}</Text>
                  </View>
                </View>
              )}

              {/* Partner (for double) - same team as current user */}
              {params.playerType === 'double' && params.selectedPartner && (
                <View style={styles.playerItem}>
                  <View style={styles.playerAvatarContainer}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {getInitials(params.selectedPartner.name)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerLabel}>{t('reservation.partner')}</Text>
                    <Text style={styles.playerName}>{params.selectedPartner.name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* VS Separator */}
            {((params.selectedPartner || params.selectedOpponents.length > 0) || currentUser) && (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            )}

            {/* Team 2: Opponents */}
            <View style={styles.teamContainer}>
              {/* Single mode opponent */}
              {params.playerType === 'single' && params.selectedPartner && (
                <View style={styles.playerItem}>
                  <View style={styles.playerAvatarContainer}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {getInitials(params.selectedPartner.name)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerLabel}>{t('reservation.opponent')}</Text>
                    <Text style={styles.playerName}>{params.selectedPartner.name}</Text>
                  </View>
                </View>
              )}

              {/* Double mode opponents - same team */}
              {params.playerType === 'double' && params.selectedOpponents.map((opponent, index) => (
                <View key={opponent.id} style={styles.playerItem}>
                  <View style={styles.playerAvatarContainer}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {getInitials(opponent.name)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerLabel}>{t('reservation.opponent')}</Text>
                    <Text style={styles.playerName}>{opponent.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Confirm Button - Fixed at bottom */}
      <View style={[styles.confirmButtonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>
{t('reservation.confirm')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24, // px-6
    paddingBottom: 100, // Space for fixed button
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
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
    marginBottom: 16, // mb-4
  },
  detailsCardContent: {
    padding: 20, // p-5
  },
  detailsTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213',
    marginBottom: 20, // mb-5
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // mb-4
  },
  detailIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 20, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // mr-3
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
    marginBottom: 4, // mb-1
  },
  detailValue: {
    fontSize: 16, // text-base
    fontWeight: '500',
    color: '#030213',
  },
  playersCard: {
    backgroundColor: '#FFFFFF',
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
  },
  playersCardContent: {
    padding: 20, // p-5
  },
  playersTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213',
    marginBottom: 20, // mb-5
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // green-50
    borderRadius: 12, // rounded-xl
    padding: 16, // p-4
    marginBottom: 12, // mb-3
    borderWidth: 1,
    borderColor: '#D1FAE5', // green-100
    width: '100%',
  },
  playerAvatarContainer: {
    marginRight: 12, // mr-3
  },
  playerAvatar: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 24, // rounded-full
    backgroundColor: '#54CE8F', // Primary green
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerLabel: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
    marginBottom: 4, // mb-1
  },
  playerName: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
  },
  teamContainer: {
    gap: 12,
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: 8, // my-2
  },
  vsText: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: '#9CA3AF', // gray-400
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24, // px-6
    paddingTop: 16, // pt-4
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#54CE8F', // Primary green
    borderRadius: 16, // rounded-2xl
    paddingVertical: 16, // py-4
    paddingHorizontal: 24, // px-6
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
  },
  confirmButtonText: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BookingConfirmScreen;

