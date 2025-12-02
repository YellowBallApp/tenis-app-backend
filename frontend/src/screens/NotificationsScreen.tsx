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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Title,
  Text,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  Appbar,
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
      Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.actionError'));
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
      Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.actionError'));
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
        
        // Kortları yükle
        const courtsData = await courtService.getActiveCourts();
        setCourts(courtsData);
        
        // Rezervasyondaki kortu varsayılan olarak seç
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
        Alert.alert(t('common.error'), error.response?.data?.message || 'Rezervasyon bilgisi yüklenemedi.');
        setLoadingReservation(false);
      }
    } else {
      // Eski sistem: Challenge'a bağlı bildirimler için
      const challenge = challengeDetails[notification.id];
      if (challenge && challenge.league) {
        // LigSiralamaScreen'e yönlendir ve challenge'ı parametre olarak gönder
        navigation.navigate('GameModes', {
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
      Alert.alert('Uyarı', 'Lütfen kazananı seçin');
      return;
    }

    if (!selectedCourt) {
      Alert.alert('Uyarı', 'Lütfen kort seçin');
      return;
    }

    const filledSets = matchSets.filter(set => set.userScore && set.opponentScore);
    if (filledSets.length < 2) {
      setScoreError(true);
      Alert.alert('Uyarı', 'En az 2 set skoru girilmesi zorunludur');
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
      Alert.alert('Hata', 'Rakip bulunamadı');
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
      setSnackbarMessage(`Maç sonucu kaydedildi: ${scoreString}`);
      setSnackbarVisible(true);
      setShowReservationMatchResultModal(false);
      
      // loadNotifications() çağrısını kaldırdık çünkü zaten frontend'deki listeden sildik
      // Backend'den de silindi, diğer kullanıcılar için de silindi
    } catch (error: any) {
      console.error('Maç sonucu kaydetme hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Maç sonucu kaydedilemedi');
      setSubmittingMatchResult(false);
    }
  };

  const renderNotification = (notification: Notification) => {
    const isPendingMatch = notification.type === NotificationType.PENDING_MATCH_REQUEST || notification.type === NotificationType.MATCH_CHALLENGE;
    const isMatchCompleted = notification.type === NotificationType.MATCH_COMPLETED;
    const isProcessing = processingNotification === notification.id;
    const challenge = challengeDetails[notification.id];
    const challengeFailed = failedChallengeIds.has(notification.id);

    return (
      <Card
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.isRead && styles.unreadCard,
        ]}
      >
        <Card.Content>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIconContainer}>
              <MaterialCommunityIcons
                name={isPendingMatch ? 'tennis' : isMatchCompleted ? 'trophy' : 'information'}
                size={32}
                color={isPendingMatch ? '#2E7D32' : isMatchCompleted ? '#FFD700' : '#1976D2'}
              />
            </View>
            <View style={styles.notificationHeaderText}>
              <Text style={styles.notificationTitle}>
                {isPendingMatch ? t('notifications.challengeTitle') : isMatchCompleted ? 'Maç Tamamlandı' : t('notifications.systemTitle')}
              </Text>
              <Text style={styles.notificationDate}>
                {formatDate(notification.createdAt)}
              </Text>
            </View>
            {!notification.isRead && (
              <Chip
                mode="flat"
                style={styles.unreadChip}
                textStyle={styles.unreadChipText}
                compact
              >
              {t('notifications.newLabel')}
              </Chip>
            )}
          </View>

          <Divider style={styles.divider} />

          {isPendingMatch && challenge ? (
            <View style={styles.matchChallengeContent}>
              <Text style={styles.challengeText}>
                <Text style={styles.challengerName}>{challenge.challenger.name}</Text>
                {' '}
                {language === 'tr' ? (
                  <>
                    <Text style={styles.leagueName}>{challenge.league.description}</Text>
                    {' '}
                    {t('notifications.challengeOutro')}
                  </>
                ) : (
                  <>
                    {t('notifications.challengeIntro')} {' '}
                    <Text style={styles.leagueName}>{challenge.league.description}</Text>
                    {' '}
                    {t('notifications.challengeOutro')}
                  </>
                )}
              </Text>

              {!isProcessing && (
                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    buttonColor="#2E7D32"
                    icon="check"
                    onPress={() => handleAcceptChallenge(notification)}
                    style={styles.acceptButton}
                  >
                    {t('notifications.accept')}
                  </Button>
                  <Button
                    mode="outlined"
                    textColor="#DC3545"
                    icon="close"
                    onPress={() => handleRejectChallenge(notification)}
                    style={styles.rejectButton}
                  >
                    {t('notifications.reject')}
                  </Button>
                </View>
              )}

              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                  <Text style={styles.processingText}>{t('notifications.processing')}</Text>
                </View>
              )}
            </View>
          ) : isPendingMatch && challengeFailed ? (
            // Challenge yüklenemedi, notification mesajını göster
            <View style={styles.systemNotificationContent}>
              <Text style={styles.notificationMessage}>
                {notification.message || t('notifications.challengeNotFound')}
              </Text>
              <Chip
                mode="flat"
                style={styles.errorChip}
                textStyle={styles.errorChipText}
                icon="alert-circle"
              >
                {t('notifications.challengeExpired')}
              </Chip>
              {!notification.isRead && (
                <Button
                  mode="text"
                  onPress={() => handleMarkAsRead(notification.id)}
                  style={styles.markReadButton}
                >
                  {t('notifications.markAsRead')}
                </Button>
              )}
            </View>
          ) : isPendingMatch ? (
            // Challenge yükleniyor
            <View style={styles.systemNotificationContent}>
              <Text style={styles.notificationMessage}>{t('notifications.loadingDetails')}</Text>
            </View>
          ) : isMatchCompleted ? (
            // Maç tamamlandı bildirimi - Maç sonucu girme butonu (rezervasyon veya challenge bazlı)
            <View style={styles.systemNotificationContent}>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Button
                mode="contained"
                buttonColor="#2E7D32"
                icon="clipboard-check"
                onPress={() => handleOpenMatchResult(notification)}
                style={styles.matchResultButton}
              >
                Maç Sonucu Gir
              </Button>
              {!notification.isRead && (
                <Button
                  mode="text"
                  onPress={() => handleMarkAsRead(notification.id)}
                  style={styles.markReadButton}
                >
                  {t('notifications.markAsRead')}
                </Button>
              )}
            </View>
          ) : (
            // Normal sistem bildirimi
            <View style={styles.systemNotificationContent}>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {!notification.isRead && (
                <Button
                  mode="text"
                  onPress={() => handleMarkAsRead(notification.id)}
                  style={styles.markReadButton}
                >
                  {t('notifications.markAsRead')}
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  if (loading && !refreshing) {
    return (
      <>
        <StatusBar style="light" />
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title={t('notifications.title')} titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
          <Appbar.Content title={t('notifications.title')} titleStyle={styles.appbarTitle} />
          {notifications.some((n) => !n.isRead) && (
            <Appbar.Action 
              icon="check-all" 
              onPress={handleMarkAllAsRead} 
              color="#FFFFFF"
            />
          )}
        </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off" size={64} color="#CED4DA" />
                <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          notifications.map((notification) => renderNotification(notification))
        )}

        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Button
              mode="outlined"
              onPress={handlePreviousPage}
              disabled={!!(page === 1)}
              icon="chevron-left"
            >
              {t('notifications.previous')}
            </Button>
            <Text style={styles.pageInfo}>
              {t('notifications.page')} {page} / {totalPages}
            </Text>
            <Button
              mode="outlined"
              onPress={handleNextPage}
              disabled={!!(page === totalPages)}
              icon="chevron-right"
            >
              {t('notifications.next')}
            </Button>
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
            <Card style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={true} style={styles.modalScrollView}>
                <Card.Content>
                <View style={styles.modalHeader}>
                  <MaterialCommunityIcons name="trophy" size={40} color="#FFD700" />
                  <Title style={styles.modalTitle}>Maç Sonucu Gir</Title>
                  <TouchableOpacity onPress={() => setShowReservationMatchResultModal(false)}>
                    <MaterialCommunityIcons name="close" size={28} color="#757575" />
                  </TouchableOpacity>
                </View>

                {loadingReservation ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.modalLoadingText}>Yükleniyor...</Text>
                  </View>
                ) : currentUser && reservationForMatch ? (
                  <>
                    <Text style={styles.modalSubtitle}>
                      Maç sonucunu ve set skorlarını girin
                    </Text>

                    {/* Reservation Details */}
                    <View style={styles.reservationDetailsContainer}>
                      <Text style={styles.reservationDetailText}>
                        <MaterialCommunityIcons name="tennis-ball" size={16} color="#6C757D" /> Kort: {reservationForMatch.court?.name || 'Bilinmiyor'}
                      </Text>
                      <Text style={styles.reservationDetailText}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#6C757D" /> Tarih: {new Date(reservationForMatch.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Text style={styles.reservationDetailText}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#6C757D" /> Saat: {new Date(reservationForMatch.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(reservationForMatch.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {/* Kazanan Seçimi */}
                    <Text style={styles.sectionLabel}>Kazanan Oyuncu</Text>
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
                          <Text style={styles.winnerLabel}>(Siz)</Text>
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
                            size={36} 
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
                                color="#2E7D32" 
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
                            style={selectedCourt === court.id && styles.selectedMenuItem}
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
                            <MaterialCommunityIcons name="plus-circle" size={24} color="#2E7D32" />
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
                          {getOpponents().length > 0 ? getOpponents()[0].name : 'Rakip'}
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
                              outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                              activeOutlineColor={shouldShowError ? "#DC3545" : "#2E7D32"}
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
                              outlineColor={shouldShowError ? "#DC3545" : "#E0E0E0"}
                              activeOutlineColor={shouldShowError ? "#DC3545" : "#2E7D32"}
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

                    <View style={styles.modalButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowReservationMatchResultModal(false)}
                        style={styles.modalCancelButton}
                        disabled={submittingMatchResult}
                      >
                        İptal
                      </Button>
                      <Button
                        mode="contained"
                        onPress={submitMatchResult}
                        style={styles.modalSendButton}
                        buttonColor="#2E7D32"
                        loading={submittingMatchResult}
                        disabled={submittingMatchResult}
                      >
                        Kaydet
                      </Button>
                    </View>
                  </>
                ) : null}
                </Card.Content>
              </ScrollView>
            </Card>
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
  appbarHeader: {
    backgroundColor: '#2E7D32',
    elevation: 4,
  },
  appbarTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    margin: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  notificationDate: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
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
  divider: {
    marginVertical: 12,
  },
  matchChallengeContent: {
    paddingVertical: 8,
  },
  challengeText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 16,
  },
  challengerName: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  leagueName: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
    borderColor: '#DC3545',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6C757D',
  },
  processedText: {
    fontSize: 14,
    color: '#6C757D',
  },
  // Reservation Match Result Modal Styles
  modalContainer: {
    margin: 16,
    flex: 1,
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    maxHeight: '95%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6C757D',
    marginBottom: 20,
    lineHeight: 22,
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
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  reservationDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 14,
    marginTop: 10,
  },
  winnerSelectionContainer: {
    marginVertical: 20,
    gap: 15,
    padding: 10,
    borderRadius: 12,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: '#DC3545',
    backgroundColor: '#FFF5F5',
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  winnerOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  radioButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#757575',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2E7D32',
  },
  winnerAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 16,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  winnerLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  courtSelectionSection: {
    marginVertical: 20,
  },
  courtDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  courtDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtDropdownText: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '500',
  },
  selectedMenuItem: {
    backgroundColor: '#E8F5E9',
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
    marginTop: 10,
    marginBottom: 20,
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
    gap: 4,
  },
  addSetText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 4,
  },
  scoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  scorePlayerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
    textAlign: 'center',
  },
  scoreDivider: {
    fontSize: 12,
    color: '#6C757D',
    paddingHorizontal: 8,
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
    height: 48,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
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
  scoreErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  scoreErrorText: {
    fontSize: 13,
    color: '#DC3545',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  modalSendButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  snackbar: {
    backgroundColor: '#2E7D32',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  systemNotificationContent: {
    paddingVertical: 8,
  },
  notificationMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 12,
  },
  markReadButton: {
    alignSelf: 'flex-start',
  },
  matchResultButton: {
    marginTop: 12,
    marginBottom: 8,
  },
  emptyCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  pageInfo: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
});

export default NotificationsScreen;

