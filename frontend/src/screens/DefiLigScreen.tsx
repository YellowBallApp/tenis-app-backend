import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Text,
  Avatar,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { authService, leagueService, leagueStandingsService, matchHistoryService, leagueApplicationService } from '../services/api';
import { User } from '../types';
import { calculateAge } from '../utils/age.utils';

const { width } = Dimensions.get('window');

const DefiLigScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [showLigModal, setShowLigModal] = useState(false);
  const [selectedLig, setSelectedLig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const leaguesPerPage = 2;
  const [matchStats, setMatchStats] = useState({
    leagueWins: 0,
    totalMatches: 0,
    winRate: 0,
    badges: 0,
  });


  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı verisini çek
      const profileData = await authService.getProfile();
      
      // Kullanıcının maç geçmişini çek
      const matchHistory = await matchHistoryService.getUserMatchHistory(profileData.id);
      
      // Maç istatistiklerini hesapla
      const totalMatches = matchHistory.length;
      const wins = matchHistory.filter((match: any) => 
        match.winners.some((winner: any) => winner.id === profileData.id)
      ).length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      
      // Lig maçlarını say (leagueStanding'i olan maçlar)
      const leagueMatches = matchHistory.filter((match: any) => match.leagueStanding);
      const leagueWins = leagueMatches.filter((match: any) => 
        match.winners.some((winner: any) => winner.id === profileData.id)
      ).length;
      
      // İstatistikleri güncelle
      setMatchStats({
        leagueWins: leagueWins,
        totalMatches: totalMatches,
        winRate: winRate,
        badges: 0, // TODO: Rozet sistemi eklenecek
      });
      
      // Backend'den gelen profil verisini UI formatına dönüştür
      const formattedUser = {
        id: profileData.id,
        name: profileData.name || t('defiLeague.defaultPlayerName'),
        email: profileData.email,
        age: calculateAge((profileData as any).birthDate),
        birthDate: (profileData as any).birthDate,
        level: profileData.title || t('profile.member'),
        rank: t('profile.gold'), // TODO: Rank sistemi eklenecek
        points: 0, // TODO: Match history'den hesaplanacak
        position: 0, // TODO: League ranking'den alınacak
        winRate: winRate,
        matchesPlayed: totalMatches,
      };
      
      setCurrentUser(formattedUser);
      
      // Tüm ligleri çek
      const allLeagues = await leagueService.getAllLeagues();
      
      // Her lig için ikon ve renk tanımla
      const leagueColors = ['#2E7D32', '#1976D2', '#D32F2F'];
      const leagueIcons = ['trophy', 'weather-sunny', 'account-multiple'];
      
      // Her lig için standings'leri çek ve format düzenle
      const defaultDescription = t('defiLeague.defaultDescription');
      const defaultRules = [
        t('defiLeague.rules.format'),
        t('defiLeague.rules.challenge'),
        t('defiLeague.rules.score'),
        t('defiLeague.rules.update'),
      ];

      // Kullanıcının tüm başvurularını çek
      const userApplications = await leagueApplicationService.getUserApplications();
      
      const formattedLeagues = await Promise.all(
        allLeagues.map(async (league: any, index: number) => {
          const standings = await leagueStandingsService.getStandingsByLeagueId(league.id);
          
          // Kullanıcının bu ligde olup olmadığını kontrol et
          const isUserInThisLeague = standings.some((standing: any) => 
            standing.user.id === profileData.id
          );
          
          // Kullanıcının bu lig için başvurusu var mı kontrol et
          const application = userApplications.find((app: any) => app.league.id === league.id);
          const applicationStatus = application ? application.status : null;
          
          return {
            id: league.id,
            name: league.name || league.code,
            code: league.code,
            description: league.description || defaultDescription,
            playerCount: standings.length || 0,
            isUserInLeague: isUserInThisLeague,
            applicationStatus: applicationStatus, // 'pending', 'approved', 'rejected' veya null
            settings: league.settings,
            color: leagueColors[index % leagueColors.length],
            icon: leagueIcons[index % leagueIcons.length],
            rewards: [], // Artık settings'ten alınacak
            rules: defaultRules,
          };
        })
      );
      
      setLeagues(formattedLeagues);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('defiLeague.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const openLigModal = (lig: any) => {
    setSelectedLig(lig);
    setShowLigModal(true);
  };

  const startLig = async () => {
    try {
      // Eğer kullanıcı ligde değilse, başvuru yap
      if (!selectedLig.isUserInLeague) {
        // Başvuru durumunu kontrol et
        if (selectedLig.applicationStatus === 'pending') {
          Alert.alert(
            'Başvuru Beklemede',
            'Başvurunuz alınmıştır. Onay bekleniyor.'
          );
          setShowLigModal(false);
          return;
        }
        
        if (selectedLig.applicationStatus === 'rejected') {
          Alert.alert(
            'Başvuru Reddedildi',
            'Lig başvurunuz reddedilmiştir.'
          );
          setShowLigModal(false);
          return;
        }
        
        // Yaş aralığı kontrolü yap
        const settings = selectedLig.settings;
        const userAge = currentUser.age;
        
        if (settings && !isUserAgeInRange(settings, userAge)) {
          if (!userAge) {
            Alert.alert(
              t('defiLeague.alerts.ageInfoTitle'),
              t('defiLeague.alerts.ageInfoMessage'),
              [{ text: t('common.ok') }]
            );
            setShowLigModal(false);
            return;
          }
          
          const ageRange = formatAgeRange(settings);
          Alert.alert(
            'Yaş Aralığı Uygun Değil',
            `Bu lig için yaş aralığı: ${ageRange}. Sizin yaşınız: ${userAge}`,
            [{ text: t('common.ok') }]
          );
          setShowLigModal(false);
          return;
        }
        
        setLoading(true);
        
        // Başvuru yap
        await leagueApplicationService.createApplication(selectedLig.id);
        
        Alert.alert(
          'Başvuru Alındı',
          'Başvurunuz alınmıştır. Onay bekleniyor.'
        );
        
        // Ligleri yeniden yükle
        await loadData();
        setLoading(false);
        setShowLigModal(false);
        return;
      }
      
      setShowLigModal(false);
      // Navigate to Lig Sıralama screen
      navigation.navigate('LigSiralama', { lig: selectedLig });
    } catch (error: any) {
      console.error('Lige başvuru hatası:', error);
      const errorMessage = error.response?.data?.message || 'Başvuru yapılırken bir hata oluştu';
      Alert.alert(t('common.error'), errorMessage);
      setLoading(false);
    }
  };

  // Pagination yardımcı fonksiyonlar
  const totalPages = Math.ceil(leagues.length / leaguesPerPage);
  const startIndex = currentPage * leaguesPerPage;
  const endIndex = startIndex + leaguesPerPage;
  const currentLeagues = leagues.slice(startIndex, endIndex);
  const pageIndicatorText = t('defiLeague.pageIndicator')
    .replace('{{current}}', String(totalPages === 0 ? 0 : currentPage + 1))
    .replace('{{total}}', String(totalPages));

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatAgeRange = (settings?: any) => {
    if (!settings || (settings.minAge === null && settings.maxAge === null)) {
      return t('defiLeague.modal.noAgeLimit');
    }

    // İki sayı girilmişse: "18 - 24"
    if (settings.minAge !== null && settings.maxAge !== null) {
      return `${settings.minAge} - ${settings.maxAge}`;
    }

    // Sadece minAge girilmişse: "18+"
    if (settings.minAge !== null && settings.maxAge === null) {
      return `${settings.minAge}+`;
    }

    // Sadece maxAge girilmişse: "65-"
    if (settings.maxAge !== null && settings.minAge === null) {
      return `-${settings.maxAge}`;
    }

    return t('defiLeague.modal.noAgeLimit');
  };

  // Yaş aralığı kontrolü - kullanıcı yaş aralığında mı?
  const isUserAgeInRange = (settings?: any, userAge?: number | null): boolean => {
    if (!settings || !userAge) return true; // Yaş bilgisi yoksa engelleme
    
    const { minAge, maxAge } = settings;
    
    // Yaş sınırı yoksa herkes girebilir
    if (minAge === null && maxAge === null) return true;
    
    // İki sayı girilmişse: aralık kontrolü
    if (minAge !== null && maxAge !== null) {
      return userAge >= minAge && userAge <= maxAge;
    }
    
    // Sadece minAge girilmişse: o yaş ve üzeri
    if (minAge !== null && maxAge === null) {
      return userAge >= minAge;
    }
    
    // Sadece maxAge girilmişse: o yaş ve altı
    if (maxAge !== null && minAge === null) {
      return userAge <= maxAge;
    }
    
    return true;
  };

  const currentUserLevelLabel = currentUser?.level || t('profile.member');
  const currentUserRankLabel = currentUser?.rank || t('profile.gold');

  if (loading || !currentUser) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ width: 40 }} />
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="trophy" size={28} color="#FFD700" />
            <Text style={styles.headerTitle}>{t('defiLeague.headerTitle') || 'Defi Lig'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#54CE8F" />
          <Text style={{ marginTop: 16, fontSize: 14, color: '#717182' }}>{t('defiLeague.loadingText') || 'Yükleniyor...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ width: 40 }} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('defiLeague.headerTitle') || 'Defi Lig'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Current User Card */}
        <View style={styles.currentUserSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={20} color="#54CE8F" />
            <Text style={styles.sectionTitle}>{t('defiLeague.you') || 'Siz'}</Text>
          </View>
          <Card style={styles.currentUserCard}>
            <Card.Content style={styles.currentUserCardContent}>
              <View style={styles.currentUserHeader}>
                <Avatar.Text 
                  size={64} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.currentUserAvatar}
                />
                <View style={styles.currentUserInfo}>
                  <Text style={styles.currentUserName}>{currentUser.name}</Text>
                  <View style={styles.currentUserBadges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{currentUserLevelLabel}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{currentUserRankLabel}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.currentUserPosition}>
                  <MaterialCommunityIcons 
                    name="trophy" 
                    size={24} 
                    color="#54CE8F" 
                  />
                  <Text style={styles.currentUserPositionText}>#{currentUser.position || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.currentUserStats}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="percent" size={20} color="#54CE8F" />
                  </View>
                  <Text style={styles.statNumber}>{currentUser.winRate || 0}%</Text>
                  <Text style={styles.statLabel}>{t('defiLeague.currentUserStats.win') || 'Kazanma'}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="tennis" size={20} color="#54CE8F" />
                  </View>
                  <Text style={styles.statNumber}>{currentUser.matchesPlayed || 0}</Text>
                  <Text style={styles.statLabel}>{t('defiLeague.currentUserStats.matches') || 'Maç'}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="star" size={20} color="#54CE8F" />
                  </View>
                  <Text style={styles.statNumber}>{currentUser.points || 0}</Text>
                  <Text style={styles.statLabel}>{t('defiLeague.currentUserStats.points') || 'Puan'}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Ligler Listesi */}
        <View style={styles.leaguesSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color="#54CE8F" />
            <Text style={styles.sectionTitle}>{t('defiLeague.activeLeagues') || 'Aktif Ligler'}</Text>
            {totalPages > 1 && (
              <Text style={styles.pageIndicator}>{pageIndicatorText}</Text>
            )}
          </View>
          
          {currentLeagues.map((lig, index) => (
            <Card key={lig.id} style={styles.leagueCard}>
              <TouchableOpacity onPress={() => openLigModal(lig)} activeOpacity={0.7}>
                <Card.Content style={styles.leagueCardContent}>
                  <View style={styles.leagueHeader}>
                    <View style={[styles.leagueIcon, { backgroundColor: '#B4AEBD' }]}>
                      <MaterialCommunityIcons 
                        name={lig.icon as any} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.leagueInfo}>
                      <Text style={styles.leagueName}>{lig.name}</Text>
                      <View style={styles.leagueMeta}>
                        <MaterialCommunityIcons name="account-group" size={16} color="#717182" />
                        <Text style={styles.leaguePlayerCount}>
                          {lig.playerCount} {t('defiLeague.playerCountSuffix') || 'oyuncu'}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={24} 
                      color="#9CA3AF" 
                    />
                  </View>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))}
          
          {/* Pagination Kontrolleri */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                onPress={goToPreviousPage}
                disabled={!!(currentPage === 0)}
                style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={20} 
                  color={currentPage === 0 ? '#9CA3AF' : '#54CE8F'} 
                />
                <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
                  {t('defiLeague.pagination.previous') || 'Önceki'}
                </Text>
              </TouchableOpacity>

              <View style={styles.paginationDots}>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentPage && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity 
                onPress={goToNextPage}
                disabled={!!(currentPage === totalPages - 1)}
                style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
                  {t('defiLeague.pagination.next') || 'Sonraki'}
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={currentPage === totalPages - 1 ? '#9CA3AF' : '#54CE8F'} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#54CE8F" />
            <Text style={styles.sectionTitle}>{t('defiLeague.statsTitle') || 'İstatistikler'}</Text>
          </View>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <View style={styles.statIconBox}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#54CE8F" />
                </View>
                <Text style={styles.statNumber}>{matchStats.leagueWins}</Text>
                <Text style={styles.statLabel}>{t('defiLeague.stats.leagueWins') || 'Lig Galibiyeti'}</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <View style={styles.statIconBox}>
                  <MaterialCommunityIcons name="tennis" size={24} color="#54CE8F" />
                </View>
                <Text style={styles.statNumber}>{matchStats.totalMatches}</Text>
                <Text style={styles.statLabel}>{t('defiLeague.stats.totalMatches') || 'Toplam Maç'}</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <View style={styles.statIconBox}>
                  <MaterialCommunityIcons name="percent" size={24} color="#54CE8F" />
                </View>
                <Text style={styles.statNumber}>{matchStats.winRate}%</Text>
                <Text style={styles.statLabel}>{t('defiLeague.stats.winRate') || 'Kazanma Oranı'}</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <View style={styles.statIconBox}>
                  <MaterialCommunityIcons name="medal" size={24} color="#54CE8F" />
                </View>
                <Text style={styles.statNumber}>{matchStats.badges}</Text>
                <Text style={styles.statLabel}>{t('defiLeague.stats.badges') || 'Rozetler'}</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Lig Detay Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={!!showLigModal}
          onDismiss={() => setShowLigModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScrollView}
            >
              <Card.Content style={styles.modalContent}>
                {selectedLig && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderLeft}>
                        <View style={[styles.modalIcon, { backgroundColor: '#B4AEBD' }]}>
                          <MaterialCommunityIcons 
                            name={selectedLig.icon as any} 
                            size={28} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <View style={styles.modalInfo}>
                          <Text style={styles.modalTitle}>{selectedLig.name}</Text>
                          <Text style={styles.modalSubtitle}>{selectedLig.description}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowLigModal(false)}
                        style={styles.modalCloseButton}
                      >
                        <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    <Divider style={styles.modalDivider} />

                    <View style={styles.modalDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialCommunityIcons name="account-group" size={20} color="#54CE8F" />
                        </View>
                        <Text style={styles.detailLabel}>{t('defiLeague.modal.playerCount') || 'Oyuncu Sayısı'}</Text>
                        <Text style={styles.detailValue}>{selectedLig.playerCount}</Text>
                      </View>
                      {selectedLig.settings && (selectedLig.settings.minAge !== null || selectedLig.settings.maxAge !== null) && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailIconContainer}>
                            <MaterialCommunityIcons name="calendar-account" size={20} color="#B4AEBD" />
                          </View>
                          <Text style={styles.detailLabel}>{t('defiLeague.modal.ageRange') || 'Yaş Aralığı'}</Text>
                          <Text style={styles.detailValue}>
                            {formatAgeRange(selectedLig.settings)}
                          </Text>
                        </View>
                      )}
                      {selectedLig.settings && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailIconContainer}>
                            <MaterialCommunityIcons name="currency-try" size={20} color="#54CE8F" />
                          </View>
                          <Text style={styles.detailLabel}>{t('defiLeague.modal.fee') || 'Katılım Ücreti'}</Text>
                          <Text style={styles.detailValue}>
                            {selectedLig.settings.registrationFee != null ? `${selectedLig.settings.registrationFee} ₺` : '-'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Lig Açıklaması */}
                    {selectedLig.settings?.leagueDescription && (
                      <View style={styles.modalDescriptionBox}>
                        <Text style={styles.modalDescriptionText}>
                          {selectedLig.settings.leagueDescription}
                        </Text>
                      </View>
                    )}

                    {/* Ödüller */}
                    {selectedLig.settings?.rewards && selectedLig.settings.rewards.trim() !== '' && (
                      <View style={styles.modalRewards}>
                        <Text style={styles.modalRewardsTitle}>{t('defiLeague.rewardsTitle') || 'Ödüller'}</Text>
                        {selectedLig.settings.rewards.split('\n').filter((line: string) => line.trim() !== '').map((reward: string, index: number) => (
                          <View key={index} style={styles.modalRewardItem}>
                            <MaterialCommunityIcons name="gift" size={18} color="#54CE8F" />
                            <Text style={styles.modalRewardText}>{reward.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {!selectedLig.isUserInLeague && selectedLig.settings && (selectedLig.settings.minAge !== null || selectedLig.settings.maxAge !== null) && (() => {
                      const userAge = currentUser.age;
                      const settings = selectedLig.settings;
                      const isAgeValid = userAge && 
                        (settings.minAge === null || userAge >= settings.minAge) &&
                        (settings.maxAge === null || userAge <= settings.maxAge);
                      
                      if (!isAgeValid) {
                        return (
                          <View style={styles.ageWarning}>
                            <View style={styles.ageWarningIconContainer}>
                              <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                            </View>
                            <Text style={styles.ageWarningText}>
                              {!userAge 
                                ? t('defiLeague.ageWarnings.infoRequired') || 'Yaş bilgisi gereklidir'
                                : t('defiLeague.ageWarnings.notEligible') || 'Yaş aralığı uygun değil'}
                            </Text>
                          </View>
                        );
                      }
                    })()}

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        onPress={() => setShowLigModal(false)}
                        style={styles.modalCancelButton}
                      >
                        <Text style={styles.modalCancelButtonText}>{t('common.cancel') || 'İptal'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={startLig}
                        style={[
                          styles.modalStartButton,
                          (selectedLig.applicationStatus === 'pending' || 
                           selectedLig.applicationStatus === 'rejected' ||
                           (!selectedLig.isUserInLeague && !isUserAgeInRange(selectedLig.settings, currentUser.age))) && 
                          styles.modalStartButtonDisabled
                        ]}
                        disabled={
                          selectedLig.applicationStatus === 'pending' || 
                          selectedLig.applicationStatus === 'rejected' ||
                          (!selectedLig.isUserInLeague && !isUserAgeInRange(selectedLig.settings, currentUser.age))
                        }
                      >
                        <MaterialCommunityIcons 
                          name={
                            selectedLig.isUserInLeague ? "eye" : 
                            selectedLig.applicationStatus === 'pending' ? "clock-outline" :
                            selectedLig.applicationStatus === 'rejected' ? "close-circle" :
                            "account-plus"
                          } 
                          size={20} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.modalStartButtonText}>
                          {selectedLig.isUserInLeague ? t('defiLeague.modal.view') || 'Görüntüle' : 
                           selectedLig.applicationStatus === 'pending' ? 'Başvuru Beklemede' :
                           selectedLig.applicationStatus === 'rejected' ? 'Başvuru Reddedildi' :
                           !isUserAgeInRange(selectedLig.settings, currentUser.age) ? 'Yaş Aralığı Uygun Değil' :
                           t('defiLeague.modal.join') || 'Katıl'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                </>
              )}
              </Card.Content>
            </ScrollView>
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
  header: {
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  currentUserSection: {
    padding: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
  },
  currentUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  currentUserCardContent: {
    padding: 24,
  },
  currentUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentUserAvatar: {
    backgroundColor: '#54CE8F',
    marginRight: 16,
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  currentUserBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(84, 206, 143, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#54CE8F',
  },
  currentUserPosition: {
    alignItems: 'center',
  },
  currentUserPositionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#54CE8F',
    marginTop: 4,
  },
  currentUserStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#54CE8F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#717182',
    textAlign: 'center',
  },
  leaguesSection: {
    padding: 24,
    paddingTop: 0,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  leagueCardContent: {
    padding: 20,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  leagueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaguePlayerCount: {
    fontSize: 14,
    color: '#717182',
  },
  pageIndicator: {
    fontSize: 14,
    color: '#717182',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  statsSection: {
    padding: 24,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    margin: 16,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: '85%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#717182',
    lineHeight: 20,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalDivider: {
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
    height: 1,
  },
  modalDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#717182',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
  },
  modalDescriptionBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#030213',
    lineHeight: 20,
  },
  modalRewards: {
    marginBottom: 20,
  },
  modalRewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 12,
  },
  modalRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  modalRewardText: {
    fontSize: 14,
    color: '#717182',
    flex: 1,
  },
  ageWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  ageWarningIconContainer: {
    marginRight: 12,
  },
  ageWarningText: {
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
  },
  modalStartButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#54CE8F',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalStartButtonDisabled: {
    opacity: 0.5,
  },
  modalStartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#54CE8F',
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  paginationDotActive: {
    backgroundColor: '#54CE8F',
    width: 24,
    borderRadius: 4,
  },
});

export default DefiLigScreen;
