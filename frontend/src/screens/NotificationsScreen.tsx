import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Text,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  Menu,
  Avatar,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificationService, matchChallengeService, reservationService, matchHistoryService, courtService, authService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Notification, NotificationType } from '../types';

const NotificationsScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingNotification, setProcessingNotification] = useState<number | null>(null);
  const [challengeDetails, setChallengeDetails] = useState<{[key: number]: any}>({});
  const [failedChallengeIds, setFailedChallengeIds] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'challenges' | 'matches' | 'reservations'>('all');
  
  // Reservation match result modal states
  const [showReservationMatchResultModal, setShowReservationMatchResultModal] = useState(false);
  const [reservationForMatch, setReservationForMatch] = useState<any>(null);
  const [currentReservationId, setCurrentReservationId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [submittingMatchResult, setSubmittingMatchResult] = useState(false);
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

  // Sayfa her odaklandığında bildirimleri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [page])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getUserNotifications(page, 20);
      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
      
      // Match challenge notifications için challenge detaylarını çek
      const challengeDetailsMap: {[key: number]: any} = {};
      const failedIds = new Set<number>();
      
      // Challenge detaylarını paralel olarak çek (daha hızlı)
      const challengePromises = result.notifications
        .filter((notif: Notification) => 
          (notif.type === NotificationType.MATCH_CHALLENGE || 
           notif.type === NotificationType.PENDING_MATCH_REQUEST ||
           notif.type === NotificationType.MATCH_COMPLETED) && 
          notif.relatedEntityId
        )
        .map(async (notif: Notification) => {
          try {
            const challenge = await matchChallengeService.getChallengeById(notif.relatedEntityId!);
            return { notificationId: notif.id, challenge, success: true };
          } catch (error: any) {
            // Challenge bulunamadı (silinmiş, geçersiz veya süresi dolmuş)
            // Sadece 400/404 gibi "not found" hatalarını sessizce handle et
            const status = error?.response?.status;
            const errorKey = error?.response?.data?.data?.errorKey;
            
            // CHALLENGE_NOT_FOUND hatası normal bir durum, sessizce handle et
            if (status === 400 && errorKey === 'CHALLENGE_NOT_FOUND') {
              // Bu durum normal (challenge silinmiş/süresi dolmuş), sessizce handle et
              return { notificationId: notif.id, challenge: null, success: false };
            }
            
            // Diğer hatalar için de sessizce handle et ama log'la (debug için)
            if (__DEV__) {
              console.log(`Challenge ${notif.relatedEntityId} yüklenemedi (durum: ${status})`);
            }
            return { notificationId: notif.id, challenge: null, success: false };
          }
        });

      // Tüm challenge isteklerini bekle
      const challengeResults = await Promise.all(challengePromises);
      
      // Sonuçları işle
      challengeResults.forEach((result) => {
        if (result.success && result.challenge) {
          challengeDetailsMap[result.notificationId] = result.challenge;
        } else {
          failedIds.add(result.notificationId);
        }
      });
      setChallengeDetails(challengeDetailsMap);
      setFailedChallengeIds(failedIds);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('notifications.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Bildirim okundu işaretlenemedi:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      Alert.alert(t('common.success'), t('notifications.markAllSuccess'));
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenemedi:', error);
      Alert.alert(t('common.error'), t('notifications.markAllError'));
    }
  };

  const handleAcceptChallenge = async (notification: Notification) => {
    // relatedEntityId challenge ID'si olmalı
    if (!notification.relatedEntityId) {
      Alert.alert(t('common.error'), t('notifications.challengeIdMissing'));
      return;
    }

    // Zaten işleniyor mu kontrol et
    if (processingNotification === notification.id) {
      return;
    }

    setProcessingNotification(notification.id);
    
    try {
      // Yeni endpoint kullanarak challenge'ı kabul et
      await matchChallengeService.acceptChallenge(notification.relatedEntityId);
      
      // Notification'ı sil
      await notificationService.deleteNotification(notification.id);
      
      // Listeyi güncelle
      setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
      
      Alert.alert(t('common.success'), t('notifications.challengeAcceptSuccess'));
    } catch (error: any) {
      const errorData = error.response?.data?.data || error.response?.data;
      const errorKey = errorData?.errorKey;
      
      // Challenge zaten işleme alınmışsa (başka bir sayfadan kabul/reddedilmiş)
      if (errorKey === 'CHALLENGE_NOT_PENDING') {
        // Kullanıcıya bilgi ver ve bildirimi listeden kaldır
        Alert.alert(
          t('common.info'), 
          t('notifications.challengeAlreadyProcessed'),
          [
            {
              text: t('common.ok'),
              onPress: async () => {
                // Bildirimi backend'den silmeyi dene (başarısız olsa bile listeden kaldır)
                try {
                  await notificationService.deleteNotification(notification.id);
                } catch (deleteError) {
                  // Silme hatası olsa bile devam et
                }
                // Listeyi güncelle
                setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
              }
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.actionError'));
      }
    } finally {
      setProcessingNotification(null);
    }
  };

  const handleRejectChallenge = async (notification: Notification) => {
    // relatedEntityId challenge ID'si olmalı
    if (!notification.relatedEntityId) {
      Alert.alert(t('common.error'), t('notifications.challengeIdMissing'));
      return;
    }

    // Zaten işleniyor mu kontrol et
    if (processingNotification === notification.id) {
      return;
    }

    setProcessingNotification(notification.id);
    try {
      // Yeni endpoint kullanarak challenge'ı reddet
      await matchChallengeService.rejectChallenge(notification.relatedEntityId);
      
      // Notification'ı sil
      await notificationService.deleteNotification(notification.id);
      
      // Listeyi güncelle
      setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
      
      Alert.alert(t('common.success'), t('notifications.challengeRejectSuccess'));
    } catch (error: any) {
      const errorData = error.response?.data?.data || error.response?.data;
      const errorKey = errorData?.errorKey;
      
      // Challenge zaten işleme alınmışsa (başka bir sayfadan kabul/reddedilmiş)
      if (errorKey === 'CHALLENGE_NOT_PENDING') {
        // Kullanıcıya bilgi ver ve bildirimi listeden kaldır
        Alert.alert(
          t('common.info'), 
          t('notifications.challengeAlreadyProcessed'),
          [
            {
              text: t('common.ok'),
              onPress: async () => {
                // Bildirimi backend'den silmeyi dene (başarısız olsa bile listeden kaldır)
                try {
                  await notificationService.deleteNotification(notification.id);
                } catch (deleteError) {
                  // Silme hatası olsa bile devam et
                }
                // Listeyi güncelle
                setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
              }
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.actionError'));
      }
    } finally {
      setProcessingNotification(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) {
      return diffInMinutes === 1
        ? `1 ${t('notifications.minuteAgo')}`
        : `${diffInMinutes} ${t('notifications.minutesAgo')}`;
    }

    if (diffInHours < 24) {
      return diffInHours === 1
        ? `1 ${t('notifications.hourAgo')}`
        : `${diffInHours} ${t('notifications.hoursAgo')}`;
    }

    if (diffInHours < 48) {
      return t('notifications.yesterday');
    }

    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenMatchResult = async (notification: Notification) => {
    // Eğer notification reservation'a bağlıysa (relatedEntityType === 'reservation')
    if (notification.relatedEntityType === 'reservation' && notification.relatedEntityId) {
      try {
        setLoadingReservation(true);
        const reservationId = notification.relatedEntityId;
        setCurrentReservationId(reservationId);
        
        // Mevcut kullanıcıyı al
        const user = await authService.getProfile();
        setCurrentUser(user);
        
        // Rezervasyonu yükle
        const reservationData = await reservationService.getReservationById(reservationId);
        setReservationForMatch(reservationData);
        
      // Rezervasyondaki kortu kullan (değiştirilemez)
      if (reservationData.court) {
        setSelectedCourt(reservationData.court.id);
      }
        
        // State'leri sıfırla
        setMatchSets([
          { userScore: '', opponentScore: '' },
          { userScore: '', opponentScore: '' },
          { userScore: '', opponentScore: '' },
        ]);
        setSelectedWinner(null);
        setScoreError(false);
        setScoreMismatch(false);
        
        setLoadingReservation(false);
        setShowReservationMatchResultModal(true);
      } catch (error: any) {
        console.error('Rezervasyon yükleme hatası:', error);
        Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.reservationLoadError'));
        setLoadingReservation(false);
      }
    } else {
      // Eski sistem: Challenge'a bağlı bildirimler için
      const challenge = challengeDetails[notification.id];
      if (challenge && challenge.league) {
        // LigSiralamaScreen'e yönlendir ve challenge'ı parametre olarak gönder
        navigation.navigate('DefiLig', {
          screen: 'LigSiralama',
          params: {
            lig: challenge.league,
            openMatchResultModal: true,
            challengeId: challenge.id,
          },
        });
      }
    }
  };

  // Reservation match result modal functions
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
    if (!reservationForMatch || !currentUser) return [];
    
    const opponents: any[] = [];
    
    if (reservationForMatch.user && reservationForMatch.user.id !== currentUser.id) {
      opponents.push(reservationForMatch.user);
    }
    
    if (reservationForMatch.participants && reservationForMatch.participants.length > 0) {
      reservationForMatch.participants.forEach((participant: any) => {
        if (participant.id !== currentUser.id && !opponents.find(o => o.id === participant.id)) {
          opponents.push(participant);
        }
      });
    }
    
    return opponents;
  };

  const submitMatchResult = async () => {
    if (!selectedWinner) {
      Alert.alert(t('notifications.warning'), t('notifications.selectWinnerRequired'));
      return;
    }

    // Kort seçimi rezervasyondan alınır, kontrol etmeye gerek yok
    if (!reservationForMatch?.court?.id) {
      Alert.alert(t('common.error') || 'Hata', 'Rezervasyon kort bilgisi bulunamadı');
      return;
    }

    const filledSets = matchSets.filter(set => set.userScore && set.opponentScore);
    if (filledSets.length < 2) {
      setScoreError(true);
      Alert.alert(t('notifications.warning'), t('notifications.minTwoSetsRequired'));
      return;
    }

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
      Alert.alert(t('common.error'), t('notifications.opponentNotFound'));
      return;
    }

    const opponentId = opponents[0].id;
    const actualWinnerId = userWonSets > opponentWonSets 
      ? currentUser.id 
      : opponentId;

    if (selectedWinner !== actualWinnerId) {
      setScoreMismatch(true);
      return;
    } else {
      setScoreMismatch(false);
    }

    const scoreString = filledSets
      .map(set => `${set.userScore}-${set.opponentScore}`)
      .join(', ');

    const winnerId = selectedWinner;
    const loserId = selectedWinner === currentUser.id 
      ? opponentId 
      : currentUser.id;

    try {
      setSubmittingMatchResult(true);

      await matchHistoryService.createMatch({
        winnerIds: [winnerId],
        loserIds: [loserId],
        score: scoreString,
        matchDate: new Date(reservationForMatch.startTime),
        indoorCourt: reservationForMatch.court?.indoors || false,
        courtGround: reservationForMatch.court?.groundType || 'hard',
        courtId: reservationForMatch.court?.id,
      });

      // Bildirimleri sil (hem backend hem frontend)
      try {
        await notificationService.deleteByRelatedEntity(reservationForMatch.id, 'reservation');
        
        // Frontend'deki listeden de bu rezervasyona ait tüm MATCH_COMPLETED bildirimlerini sil
        setNotifications((prev) => 
          prev.filter((notif) => 
            !(notif.relatedEntityType === 'reservation' && 
              notif.relatedEntityId === reservationForMatch.id && 
              notif.type === NotificationType.MATCH_COMPLETED)
          )
        );
      } catch (notificationError) {
        // Hata olsa bile devam et, maç sonucu kaydedildi
      }

      setSubmittingMatchResult(false);
      setSnackbarMessage(`${t('notifications.matchResultSaved')}: ${scoreString}`);
      setSnackbarVisible(true);
      setShowReservationMatchResultModal(false);
      
      // loadNotifications() çağrısını kaldırdık çünkü zaten frontend'deki listeden sildik
      // Backend'den de silindi, diğer kullanıcılar için de silindi
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.matchResultSaveError'));
      setSubmittingMatchResult(false);
    }
  };

  const getReservationNotificationTitle = (type: string) => {
    switch (type) {
      case NotificationType.RESERVATION_CONFIRMED:
        return t('notifications.reservationConfirmed');
      case NotificationType.RESERVATION_CANCELLED:
        return t('notifications.reservationCancelled');
      case NotificationType.RESERVATION_REQUEST:
        return t('notifications.reservationRequest');
      default:
        return t('notifications.reservationConfirmed');
    }
  };

  const renderNotification = (notification: Notification) => {
    const isPendingMatch = notification.type === NotificationType.PENDING_MATCH_REQUEST || notification.type === NotificationType.MATCH_CHALLENGE;
    const isMatchCompleted = notification.type === NotificationType.MATCH_COMPLETED;
    const isProcessing = processingNotification === notification.id;
    const challenge = challengeDetails[notification.id];
    const challengeFailed = failedChallengeIds.has(notification.id);
    const isReservation = notification.relatedEntityType === 'reservation';
    const reservationTitle = isReservation ? getReservationNotificationTitle(notification.type) : null;

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.isRead && styles.unreadCard,
        ]}
        activeOpacity={0.7}
        onPress={() => !notification.isRead && handleMarkAsRead(notification.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.notificationIconContainer}>
            <MaterialCommunityIcons
              name={isPendingMatch ? 'sword-cross' : isMatchCompleted ? 'trophy' : isReservation ? 'calendar' : 'bell'}
              size={24}
              color="#54CE8F"
            />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>
                {isPendingMatch ? t('notifications.newChallengeReceived') : isMatchCompleted ? t('notifications.matchReminder') : reservationTitle ?? t('notifications.newMessage')}
              </Text>
              {!notification.isRead && (
                <View style={styles.unreadDot} />
              )}
            </View>

            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationDate}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
        </View>

        {/* Action Buttons - Only show if needed (not for reservation notifications) */}
        {isPendingMatch && challenge && notification.relatedEntityType !== 'reservation' && (
          <View style={styles.cardActionsContainer}>
            {!isProcessing ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleAcceptChallenge(notification)}
                  style={styles.acceptButton}
                >
                  <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.acceptButtonText}>{t('notifications.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRejectChallenge(notification)}
                  style={styles.rejectButton}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                  <Text style={styles.rejectButtonText}>{t('notifications.reject')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#54CE8F" />
                <Text style={styles.processingText}>{t('notifications.processing')}</Text>
              </View>
            )}
          </View>
        )}

        {isMatchCompleted && (
          <View style={styles.cardActionsContainer}>
            <TouchableOpacity
              onPress={() => handleOpenMatchResult(notification)}
              style={styles.matchResultButton}
            >
              <MaterialCommunityIcons name="clipboard-check" size={18} color="#FFFFFF" />
              <Text style={styles.matchResultButtonText}>{t('notifications.enterMatchResult')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') return notifications;
    if (filterType === 'challenges') {
      return notifications.filter(n => n.type === NotificationType.MATCH_CHALLENGE || n.type === NotificationType.PENDING_MATCH_REQUEST);
    }
    if (filterType === 'matches') {
      return notifications.filter(n => n.type === NotificationType.MATCH_COMPLETED);
    }
    if (filterType === 'reservations') {
      return notifications.filter(n => n.relatedEntityType === 'reservation');
    }
    return notifications;
  };

  if (loading && !refreshing) {
    return (
      <>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home' as never);
            }
          }} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54CE8F" />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home' as never);
            }
          }} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {notifications.some((n) => !n.isRead) && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllText}>{t('notifications.markAllAsRead')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                {t('notifications.filterAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'challenges' && styles.filterButtonActive]}
              onPress={() => setFilterType('challenges')}
            >
              <Text style={[styles.filterButtonText, filterType === 'challenges' && styles.filterButtonTextActive]}>
                {t('notifications.filterChallenges')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'matches' && styles.filterButtonActive]}
              onPress={() => setFilterType('matches')}
            >
              <Text style={[styles.filterButtonText, filterType === 'matches' && styles.filterButtonTextActive]}>
                {t('notifications.filterMatches')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'reservations' && styles.filterButtonActive]}
              onPress={() => setFilterType('reservations')}
            >
              <Text style={[styles.filterButtonText, filterType === 'reservations' && styles.filterButtonTextActive]}>
                {t('notifications.filterReservations')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#54CE8F']} />
        }
      >
        {getFilteredNotifications().length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off" size={64} color="#CED4DA" />
                <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          getFilteredNotifications().map((notification) => renderNotification(notification))
        )}

        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={handlePreviousPage}
              disabled={page === 1}
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={page === 1 ? "#9CA3AF" : "#030213"} />
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                {t('notifications.previous')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              {t('notifications.page')} {page} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={handleNextPage}
              disabled={page === totalPages}
              style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            >
              <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>
                {t('notifications.next')}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={page === totalPages ? "#9CA3AF" : "#030213"} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </View>

      {/* Reservation Match Result Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={showReservationMatchResultModal}
          onDismiss={() => setShowReservationMatchResultModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalCard}>
              {/* Bottom Sheet Handle */}
              <View style={styles.modalHandle} />
              
              <ScrollView showsVerticalScrollIndicator={true} style={styles.modalScrollView}>
                <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <View style={styles.modalTitleRow}>
                      <MaterialCommunityIcons name="trophy" size={28} color="#54CE8F" />
                      <Text style={styles.modalTitle}>{t('notifications.enterMatchResult')}</Text>
                    </View>
                    <Text style={styles.modalSubtitle}>
                      {t('notifications.enterMatchResultDescription')}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setShowReservationMatchResultModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {loadingReservation ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#54CE8F" />
                    <Text style={styles.modalLoadingText}>{t('notifications.loading')}</Text>
                  </View>
                ) : currentUser && reservationForMatch ? (
                  <>
                    {/* Reservation Details */}
                    <View style={styles.reservationDetailsContainer}>
                      <View style={styles.reservationDetailRow}>
                        <MaterialCommunityIcons name="tennis-ball" size={16} color="#9CA3AF" />
                        <Text style={styles.reservationDetailText}>
                          {t('notifications.court')} {reservationForMatch.court?.name || t('notifications.unknown')}
                        </Text>
                      </View>
                      <View style={styles.reservationDetailRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#9CA3AF" />
                        <Text style={styles.reservationDetailText}>
                          {t('notifications.date')} {new Date(reservationForMatch.startTime).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.reservationDetailRow}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.reservationDetailText}>
                          {t('notifications.time')} {new Date(reservationForMatch.startTime).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(reservationForMatch.endTime).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>

                    {/* Kazanan Seçimi */}
                    <View style={styles.winnerSectionHeader}>
                      <MaterialCommunityIcons name="trophy" size={20} color="#54CE8F" />
                      <Text style={styles.sectionLabel}>{t('notifications.selectWinner')}</Text>
                    </View>
                    <View style={[
                      styles.winnerSelectionContainer,
                      scoreMismatch && styles.errorBorder
                    ]}>
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
                          <Text style={styles.winnerLabel}>({t('notifications.you')})</Text>
                        </View>
                      </TouchableOpacity>

                      {getOpponents().length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.winnerOption,
                            selectedWinner === getOpponents()[0].id && styles.winnerOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedWinner(getOpponents()[0].id);
                            setScoreMismatch(false);
                          }}
                        >
                          <View style={styles.radioButton}>
                            {selectedWinner === getOpponents()[0].id && (
                              <View style={styles.radioButtonInner} />
                            )}
                          </View>
                          <Avatar.Text 
                            size={40} 
                            label={getOpponents()[0].name.charAt(0)} 
                            style={styles.winnerAvatar}
                          />
                          <View style={styles.winnerInfo}>
                            <Text style={styles.winnerName}>{getOpponents()[0].name}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Kort Seçimi */}
                    <View style={styles.courtSelectionSection}>
                      <View style={styles.courtSectionHeader}>
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
                            {reservationForMatch?.court?.name || 'Kort'}
                          </Text>
                        </View>
                        <MaterialCommunityIcons 
                          name="lock" 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </View>

                    {/* Set Skorları */}
                    <View style={styles.scoresSection}>
                      <View style={styles.scoresSectionHeader}>
                        <View style={styles.scoresHeaderTitle}>
                          <MaterialCommunityIcons name="scoreboard" size={20} color="#54CE8F" />
                          <Text style={styles.sectionLabel}>{t('notifications.setScores')}</Text>
                        </View>
                        {matchSets.length < 5 && (
                          <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
                            <MaterialCommunityIcons name="plus-circle" size={20} color="#54CE8F" />
                            <Text style={styles.addSetText}>{t('notifications.addSet')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {scoreError && (
                        <View style={styles.scoreErrorContainer}>
                          <View style={styles.scoreErrorIconContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                          </View>
                          <Text style={styles.scoreErrorText}>
                            {t('notifications.minTwoSetsRequired')}
                          </Text>
                        </View>
                      )}

                      <View style={styles.scoresHeader}>
                        <Text style={styles.scorePlayerLabel}>{currentUser.name}</Text>
                        <View style={styles.vsContainer}>
                          <Text style={styles.scoreDivider}>{t('notifications.vs') || 'VS'}</Text>
                        </View>
                        <Text style={styles.scorePlayerLabel}>
                          {getOpponents().length > 0 ? getOpponents()[0].name : t('notifications.opponent')}
                        </Text>
                      </View>

                      {matchSets.map((set, index) => {
                        const isSetFilled = set.userScore && set.opponentScore;
                        const shouldShowError = (scoreError && !isSetFilled && index < 2) || scoreMismatch;
                        
                        return (
                          <View key={index} style={styles.setRow}>
                            <Text style={[styles.setLabel, shouldShowError && styles.setLabelError]}>
                              {t('notifications.set')} {index + 1}{index < 2 ? ' *' : ''}:
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
                            {t('notifications.scoreMismatch')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        onPress={() => setShowReservationMatchResultModal(false)}
                        style={[styles.modalCancelButton, submittingMatchResult && styles.modalButtonDisabled]}
                        disabled={submittingMatchResult}
                      >
                        <Text style={styles.cancelButtonText}>{t('notifications.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={submitMatchResult}
                        style={[styles.modalSendButton, submittingMatchResult && styles.modalButtonDisabled]}
                        disabled={submittingMatchResult}
                      >
                        {submittingMatchResult ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.saveButtonText}>{t('notifications.save')}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'X',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24, // px-6
    paddingTop: 60,
    paddingBottom: 24, // pb-6
    backgroundColor: '#B4AEBD', // New design purple
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
    marginLeft: 16, // ml-4
    textAlign: 'center',
  },
  markAllText: {
    fontSize: 14, // text-sm
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#FAFCFB',
    paddingHorizontal: 24, // px-6
    paddingBottom: 16, // pb-4
    paddingTop: 16, // pt-4
  },
  filterScrollContent: {
    gap: 12, // gap-3
  },
  filterButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 10, // py-2.5
    borderRadius: 9999, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
  },
  filterButtonActive: {
    backgroundColor: '#54CE8F', // Primary green
  },
  filterButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#717182', // Medium gray
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFB',
  },
  loadingText: {
    marginTop: 16, // mt-4
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAFCFB',
  },
  notificationCard: {
    marginHorizontal: 24, // mx-6
    marginVertical: 6, // my-1.5
    padding: 20, // p-5
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#54CE8F', // Primary green
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 24, // rounded-full
    backgroundColor: '#F0FDF4', // green-50
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // mr-3
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    lineHeight: 20,
    marginBottom: 8, // mb-2
  },
  notificationDate: {
    fontSize: 12, // text-xs
    color: '#9CA3AF', // gray-400
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54CE8F', // Primary green
    marginLeft: 8, // ml-2
  },
  cardActionsContainer: {
    marginTop: 16, // mt-4
    paddingTop: 16, // pt-4
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
  },
  notificationCardOld: {
    margin: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  unreadCardOld: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  unreadChip: {
    backgroundColor: '#D4EDDA',
    marginRight: 8,
  },
  unreadChipText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorChip: {
    backgroundColor: '#F8D7DA',
    marginTop: 8,
    marginBottom: 8,
  },
  errorChipText: {
    color: '#DC3545',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12, // gap-3
  },
  acceptButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
  },
  acceptButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
  },
  rejectButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#EF4444', // red-500
  },
  matchResultButton: {
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
    width: '100%',
  },
  matchResultButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#FFFFFF',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  processingText: {
    marginLeft: 8, // ml-2
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  // Reservation Match Result Modal Styles
  modalContainer: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: Platform.OS === 'ios' ? Dimensions.get('window').height * 0.85 : Dimensions.get('window').height * 0.85,
    maxHeight: Platform.OS === 'ios' ? Dimensions.get('window').height * 0.90 : Dimensions.get('window').height * 0.90,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 16,
    minWidth: 0,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#030213',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#717182',
    lineHeight: 20,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  reservationDetailsContainer: {
    backgroundColor: '#F0FDF4', // green-50
    borderRadius: 12, // rounded-xl
    padding: 20, // p-5
    marginBottom: 24, // mb-6
    borderWidth: 1,
    borderColor: '#D1FAE5', // green-100
  },
  reservationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // mb-3
    gap: 12, // gap-3
  },
  reservationDetailText: {
    fontSize: 14, // text-sm
    color: '#030213',
  },
  sectionLabel: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    marginLeft: 8,
    marginBottom: 16,
  },
  winnerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  winnerSelectionContainer: {
    gap: 16,
    borderRadius: 12,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: '#EF4444', // red-500
    backgroundColor: '#FEF2F2', // red-50
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFCFB',
    marginBottom: 12,
  },
  winnerOptionSelected: {
    borderColor: '#54CE8F',
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
    backgroundColor: '#54CE8F', // Primary green
  },
  winnerAvatar: {
    backgroundColor: '#54CE8F', // Primary green
    marginRight: 14, // mr-3.5
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 13, // text-sm
    color: '#717182', // Medium gray
  },
  courtSelectionSection: {
    marginBottom: 24,
  },
  courtSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18, // p-4.5
    backgroundColor: '#F9FAFB',
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
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
    fontSize: 16, // text-base
    color: '#030213',
    fontWeight: '500',
  },
  courtDropdownTextDisabled: {
    color: '#717182',
  },
  selectedMenuItem: {
    backgroundColor: '#F0FDF4', // green-50
  },
  menuContent: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scoresSection: {
    marginBottom: 24,
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  addSetText: {
    fontSize: 13,
    color: '#54CE8F',
    fontWeight: '600',
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scorePlayerLabel: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: '#030213',
    flex: 1,
    textAlign: 'center',
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
    height: 52, // h-13
    backgroundColor: '#FFFFFF',
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
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2', // red-50
    padding: 12, // p-3
    borderRadius: 12, // rounded-xl
    marginBottom: 16, // mb-4
    borderWidth: 1,
    borderColor: '#FEE2E2', // red-100
  },
  scoreErrorIconContainer: {
    marginRight: 8,
  },
  scoreErrorText: {
    flex: 1,
    fontSize: 14, // text-sm
    color: '#EF4444', // red-500
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28, // mt-7
    gap: 16, // gap-4
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    paddingVertical: 18, // py-4.5
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSendButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
    paddingVertical: 18, // py-4.5
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    textAlign: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  snackbar: {
    backgroundColor: '#54CE8F', // Primary green
    marginBottom: 20, // mb-5
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8, // py-2
  },
  emptyCard: {
    marginHorizontal: 24, // mx-6
    marginTop: 40, // mt-10
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48, // py-12
  },
  emptyText: {
    marginTop: 16, // mt-4
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, // p-4
    backgroundColor: '#FAFCFB',
    marginTop: 8, // mt-2
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // py-2.5
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    gap: 8, // gap-2
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#030213',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageInfo: {
    fontSize: 14, // text-sm
    color: '#030213',
    fontWeight: '500',
  },
});

export default NotificationsScreen;

