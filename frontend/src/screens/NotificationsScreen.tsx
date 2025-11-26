import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
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
  IconButton,
  Divider,
  Appbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificationService, matchChallengeService } from '../services/api';
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
        .filter((notif) => 
          (notif.type === NotificationType.MATCH_CHALLENGE || notif.type === NotificationType.PENDING_MATCH_REQUEST) && 
          notif.relatedEntityId
        )
        .map(async (notif) => {
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

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error: any) {
      console.error('Bildirim silinemedi:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('notifications.deleteError'));
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

  const renderNotification = (notification: Notification) => {
    const isPendingMatch = notification.type === NotificationType.PENDING_MATCH_REQUEST || notification.type === NotificationType.MATCH_CHALLENGE;
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
                name={isPendingMatch ? 'tennis' : 'information'}
                size={32}
                color={isPendingMatch ? '#2E7D32' : '#1976D2'}
              />
            </View>
            <View style={styles.notificationHeaderText}>
              <Text style={styles.notificationTitle}>
                {isPendingMatch ? t('notifications.challengeTitle') : t('notifications.systemTitle')}
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
            <IconButton
              icon="delete"
              size={20}
              iconColor="#DC3545"
              onPress={() => handleDeleteNotification(notification.id)}
            />
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
              disabled={page === 1}
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
              disabled={page === totalPages}
              icon="chevron-right"
            >
              {t('notifications.next')}
            </Button>
          </View>
        )}
      </ScrollView>
      </View>
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

