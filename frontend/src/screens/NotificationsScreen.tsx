import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
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
import { notificationService, leagueStandingsService, authService } from '../services/api';
import { Notification } from '../types';

const NotificationsScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingNotification, setProcessingNotification] = useState<number | null>(null);

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
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
      Alert.alert('Hata', 'Bildirimler yüklenemedi');
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
      Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi');
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenemedi:', error);
      Alert.alert('Hata', 'İşlem başarısız oldu');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);
              setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
              Alert.alert('Başarılı', 'Bildirim silindi');
            } catch (error) {
              console.error('Bildirim silinemedi:', error);
              Alert.alert('Hata', 'Bildirim silinemedi');
            }
          },
        },
      ]
    );
  };

  const handleAcceptChallenge = async (notification: Notification) => {
    if (!notification.challenger || !notification.league) return;

    // Zaten işleniyor mu kontrol et
    if (processingNotification === notification.id) {
      return;
    }

    setProcessingNotification(notification.id);
    
    try {
      // Kullanıcı bilgilerini al
      const profile = await authService.getProfile();
      
      // Maç kabul et - challengeStatus'leri ACCEPTED olarak güncelle
      // Backend notification'ı otomatik olarak siler
      await leagueStandingsService.matchAccepted(
        profile.id,
        notification.challenger.id,
        notification.league.id
      );
      
      // Listeyi güncelle (backend notification'ı sildi)
      setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
      
      Alert.alert('Başarılı', 'Maç kabul edildi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'İşlem başarısız oldu');
    } finally {
      setProcessingNotification(null);
    }
  };

  const handleRejectChallenge = async (notification: Notification) => {
    if (!notification.challenger || !notification.league) {
      Alert.alert('Hata', 'Gerekli bilgiler eksik');
      return;
    }

    // Zaten işleniyor mu kontrol et
    if (processingNotification === notification.id) {
      return;
    }

    setProcessingNotification(notification.id);
    try {
      // Kullanıcı bilgilerini al
      const profile = await authService.getProfile();
      
      // Maç reddet - challengeStatus'leri temizle
      // Backend notification'ı otomatik olarak siler
      await leagueStandingsService.matchRejected(
        profile.id,
        notification.challenger.id,
        notification.league.id
      );
      
      // Listeyi güncelle (backend notification'ı sildi)
      setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id));
      
      Alert.alert('Başarılı', 'Meydan okuma reddedildi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'İşlem başarısız oldu');
    } finally {
      setProcessingNotification(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInHours < 48) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const renderNotification = (notification: Notification) => {
    const isPendingMatch = notification.type === 'pendingMatchRequest';
    const isProcessing = processingNotification === notification.id;

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
                {isPendingMatch ? 'Yeni Meydan Okuma' : 'Sistem Bildirimi'}
              </Text>
              <Text style={styles.notificationDate}>
                {formatDate(notification.notificationReceivedDate)}
              </Text>
            </View>
            {!notification.isRead && (
              <Chip
                mode="flat"
                style={styles.unreadChip}
                textStyle={styles.unreadChipText}
                compact
              >
                Yeni
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

          {isPendingMatch && notification.challenger && notification.league ? (
            <View style={styles.matchChallengeContent}>
              <Text style={styles.challengeText}>
                <Text style={styles.challengerName}>{notification.challenger.name}</Text>
                {' '}
                <Text style={styles.leagueName}>{notification.league.description}</Text>
                {' liginde sana meydan okudu!'}
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
                    Kabul Et
                  </Button>
                  <Button
                    mode="outlined"
                    textColor="#DC3545"
                    icon="close"
                    onPress={() => handleRejectChallenge(notification)}
                    style={styles.rejectButton}
                  >
                    Reddet
                  </Button>
                </View>
              )}

              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                  <Text style={styles.processingText}>İşleniyor...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.systemNotificationContent}>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {!notification.isRead && (
                <Button
                  mode="text"
                  onPress={() => handleMarkAsRead(notification.id)}
                  style={styles.markReadButton}
                >
                  Okundu İşaretle
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
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
          <Appbar.Content title="Bildirimler" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <View style={styles.container}>
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
          <Appbar.Content title="Bildirimler" titleStyle={styles.appbarTitle} />
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
                <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
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
              Önceki
            </Button>
            <Text style={styles.pageInfo}>
              Sayfa {page} / {totalPages}
            </Text>
            <Button
              mode="outlined"
              onPress={handleNextPage}
              disabled={page === totalPages}
              icon="chevron-right"
            >
              Sonraki
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

