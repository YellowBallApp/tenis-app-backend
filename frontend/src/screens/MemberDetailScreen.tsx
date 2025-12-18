import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text,
  Avatar,
  Portal,
  Modal,
  TextInput,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { userService, matchHistoryService, leagueStandingsService, memberReviewService } from '../services/api';

const { width } = Dimensions.get('window');

const MemberDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { memberId } = route.params as { memberId: string };
  
  const [member, setMember] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);
  const [userStandings, setUserStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      const [memberData, matchesData, statsData, standingsData, reviewsData] = await Promise.all([
        userService.getUserById(memberId),
        matchHistoryService.getUserMatchHistory(memberId),
        matchHistoryService.getUserMatchStats(memberId).catch(() => null),
        leagueStandingsService.getStandingsByUserId(memberId).catch(() => []),
        memberReviewService.getMemberReviews(memberId).catch(() => [])
      ]);
      
      const formattedMember = {
        ...memberData,
        name: memberData.name + (memberData.surname ? ` ${memberData.surname}` : ''),
        level: memberData.title || t('members.member'),
        currentRank: memberData.currentRank || 0,
        joinYear: memberData.createdAt ? new Date(memberData.createdAt).getFullYear() : new Date().getFullYear(),
      };
      
      setMember(formattedMember);
      setMatchHistory(Array.isArray(matchesData) ? matchesData : []);
      setMatchStats(statsData);
      
      // Lig sıralamalarını kaydet
      if (standingsData && Array.isArray(standingsData)) {
        setUserStandings(standingsData);
      } else {
        setUserStandings([]);
      }

      // Yorumları kaydet
      console.log('📝 Yorumlar yüklendi:', reviewsData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error('Üye detayları yüklenirken hata:', error);
      Alert.alert(t('common.error'), 'Üye bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  const getLevelColor = (level: string) => {
    if (level === t('members.beginner')) return '#4CAF50';
    if (level === t('members.intermediate')) return '#FF9800';
    if (level === t('members.advanced')) return '#F44336';
    if (level === t('members.expert')) return '#9C27B0';
    return '#9E9E9E';
  };

  const handleCall = () => {
    if (!member?.phone) {
      Alert.alert(t('common.error'), 'Telefon numarası bulunamadı');
      return;
    }
    
    Alert.alert(
      'Arama Yap',
      `${member.name} adlı üyeyi aramak istediğinizden emin misiniz?\n\nTelefon: ${member.phone}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Ara',
          onPress: () => {
            const phoneUrl = `tel:${member.phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert(t('common.error'), 'Telefon uygulaması açılamadı');
            });
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    Alert.alert('Bilgi', 'Mesaj özelliği yakında eklenecek');
  };

  const handleChallenge = () => {
    Alert.alert('Bilgi', 'Meydan okuma özelliği yakında eklenecek');
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If for some reason we can't go back, navigate to the Users screen
      navigation.navigate('UsersList' as never);
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  const renderStars = (rating: number, size: number = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : 'star-border'}
            size={size}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const calculateRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const getMaxRatingCount = () => {
    const distribution = calculateRatingDistribution();
    return Math.max(...Object.values(distribution), 1);
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('common.today');
    if (diffDays === 1) return t('common.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('common.daysAgo')}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${t('common.weeksAgo')}`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${t('common.monthsAgo')}`;
    }
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getMatchResult = (match: any, userId: string) => {
    // Match'te winners ve losers dizileri var
    const isWinner = match.winners?.some((winner: any) => winner.id === userId);
    return isWinner ? 'Won' : 'Lost';
  };

  const getOpponentName = (match: any, userId: string) => {
    // Önce winners ve losers dizilerinden rakip kullanıcıyı bul
    const allPlayers = [...(match.winners || []), ...(match.losers || [])];
    const opponent = allPlayers.find((player: any) => player.id !== userId);
    
    if (opponent) {
      return opponent.name + (opponent.surname ? ` ${opponent.surname}` : '');
    }
    
    // Fallback: participants varsa onu kullan
    if (match.participants && Array.isArray(match.participants)) {
      const opponentFromParticipants = match.participants.find((p: any) => p.id !== userId);
      if (opponentFromParticipants) {
        return opponentFromParticipants.name + (opponentFromParticipants.surname ? ` ${opponentFromParticipants.surname}` : '');
      }
    }
    
    // Son fallback: winnerIds veya loserIds'den bul
    const allIds = [...(match.winnerIds || []), ...(match.loserIds || [])];
    const opponentId = allIds.find((id: string) => id !== userId);
    return opponentId ? `User ${opponentId.substring(0, 8)}` : 'Unknown';
  };

  const getMatchScore = (match: any) => {
    return match.score || 'N/A';
  };

  const matchesPlayed = matchHistory.length;
  const wins = matchHistory.filter((m: any) => getMatchResult(m, memberId) === 'Won').length;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const ratingDistribution = calculateRatingDistribution();
  const maxRatingCount = getMaxRatingCount();
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading || !member) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#54CE8F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 60 }]}>
          {member.profilePhoto ? (
            <Image
              source={{ uri: member.profilePhoto }}
              style={styles.profileAvatar}
            />
          ) : (
            <Avatar.Text
              size={120}
              label={getInitials(member.name)}
              style={styles.profileAvatar}
              labelStyle={{ color: '#FFFFFF', fontSize: 48, fontWeight: '700' }}
            />
          )}
          <Text style={styles.profileName}>{member.name}</Text>
          <View style={styles.profileTags}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{member.level}</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statisticsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trophy" size={24} color="#666666" />
            <Text style={styles.statNumber}>{matchesPlayed}</Text>
            <Text style={styles.statLabel}>{t('members.matches')}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#666666" />
            <Text style={styles.statNumber}>{winRate}%</Text>
            <Text style={styles.statLabel}>{t('members.winRate')}</Text>
          </View>
          {/* Current Rank - Tüm Ligler */}
          <View style={[styles.statCard, styles.rankCard]}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="trophy" size={20} color="#B4AEBD" />
            </View>
            <Text style={styles.statLabel}>{t('profile.currentRank')}</Text>
            {userStandings.length > 0 ? (
              <View style={styles.rankingsList}>
                {userStandings.map((standing: any, index: number) => (
                  <View 
                    key={standing.id || index} 
                    style={styles.rankingItem}
                  >
                    <Text style={styles.leagueName} numberOfLines={1}>
                      {standing.league?.name || t('profile.league')}
                    </Text>
                    <Text style={styles.rankingNumber}>
                      #{standing.leagueRanking || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.statNumber}>-</Text>
            )}
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color="#B4AEBD" />
            </View>
            <Text style={styles.statNumber}>{member.joinYear}</Text>
            <Text style={styles.statLabel}>{t('members.memberSince')}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleChallenge}>
            <View style={[styles.actionIcon, styles.actionIconGreen]}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('coaches.challenge')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <View style={[styles.actionIcon, styles.actionIconGrey]}>
              <MaterialCommunityIcons name="message-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('coaches.message')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionIcon, styles.actionIconGreen]}>
              <MaterialCommunityIcons name="phone-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('coaches.call')}</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('coaches.contactInformation')}</Text>
            {member.email && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                <Text style={styles.contactText}>{member.email}</Text>
              </View>
            )}
            {member.phone && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#9CA3AF" />
                <Text style={styles.contactText}>{member.phone}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Reviews */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.reviewsHeader}>
              <Text style={styles.cardTitle}>{t('coaches.reviews')}</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                <Text style={styles.writeReviewText}>{t('members.writeReview')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewsSummary}>
              <View style={styles.ratingSummary}>
                <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                {renderStars(Math.round(averageRating), 24)}
                <Text style={styles.reviewsCountText}>
                  {t('members.basedOn')} {reviews.length} {t('coaches.reviews')}
                </Text>
              </View>
              
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
                  return (
                    <View key={rating} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{rating}</Text>
                      <View style={styles.ratingBarContainer}>
                        <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewUserName}>
                        {review.user?.name || 'Kullanıcı'}
                      </Text>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating, 16)}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>{t('coaches.noReviews')}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Matches */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('members.recentMatches')}</Text>
            {matchHistory.length > 0 ? (
              <View style={styles.matchesList}>
                {matchHistory.slice(0, 10).map((match: any) => {
                  const result = getMatchResult(match, memberId);
                  const opponentName = getOpponentName(match, memberId);
                  const score = getMatchScore(match);
                  
                  return (
                    <View key={match.id} style={styles.matchItem}>
                      <View style={styles.matchInfo}>
                        <Text style={styles.matchOpponent}>vs {opponentName}</Text>
                        <Text style={styles.matchScore}>{score}</Text>
                      </View>
                      <View style={styles.matchResultContainer}>
                        <View style={[
                          styles.resultBadge,
                          result === 'Won' ? styles.resultBadgeWon : styles.resultBadgeLost
                        ]}>
                          <Text style={styles.resultBadgeText}>
                            {result === 'Won' ? t('members.won') : t('members.lost')}
                          </Text>
                        </View>
                        <Text style={styles.matchDate}>{formatMatchDate(match.matchDate || match.createdAt)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyMatches}>
                <Text style={styles.emptyMatchesText}>{t('members.noMatches')}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 20 }]}
        onPress={handleGoBack}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

      {/* Review Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={showReviewModal}
          onDismiss={() => setShowReviewModal(false)}
          contentContainerStyle={styles.reviewModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Card style={styles.reviewCard}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Card.Content style={styles.reviewContent}>
                  <View style={styles.reviewModalHeader}>
                    <MaterialIcons name="star" size={32} color="#FFD700" />
                    <Text style={styles.reviewModalTitle}>{t('members.rateMember')}</Text>
                    <TouchableOpacity 
                      onPress={() => setShowReviewModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.reviewModalSubtitle}>
                    {member?.name} {t('members.rateMemberSubtitle')}
                  </Text>
                  
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingLabel}>{t('members.yourRating')}</Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setReviewRating(star)}
                        >
                          <MaterialIcons
                            name={star <= reviewRating ? 'star' : 'star-border'}
                            size={32}
                            color="#FFD700"
                            style={styles.star}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <TextInput
                    mode="outlined"
                    label={t('members.yourComment')}
                    placeholder={t('members.commentPlaceholder')}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={4}
                    style={styles.commentInput}
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#54CE8F"
                  />

                  <View style={styles.reviewModalButtons}>
                    <TouchableOpacity
                      onPress={() => setShowReviewModal(false)}
                      style={[styles.modalCancelButton, { paddingVertical: 16 }]}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        if (reviewRating === 0) {
                          Alert.alert(t('common.error'), t('members.ratingRequired'));
                          return;
                        }
                        if (reviewComment.trim() === '') {
                          Alert.alert(t('common.error'), t('members.commentRequired'));
                          return;
                        }
                        try {
                          console.log('📤 Yorum gönderiliyor:', { memberId, rating: reviewRating, comment: reviewComment.trim() });
                          const newReview = await memberReviewService.createReview(memberId, reviewRating, reviewComment.trim());
                          console.log('✅ Yorum gönderildi:', newReview);
                          Alert.alert(t('common.success'), t('members.reviewSuccess'));
                          setShowReviewModal(false);
                          setReviewRating(0);
                          setReviewComment('');
                          // Yorumları yeniden yükle
                          await loadMemberData();
                        } catch (error: any) {
                          console.error('❌ Yorum gönderme hatası:', error);
                          Alert.alert(t('common.error'), error.response?.data?.message || error.message || 'Yorum kaydedilirken bir hata oluştu');
                        }
                      }}
                      style={[styles.modalSubmitButton, { paddingVertical: 16 }]}
                    >
                      <Text style={styles.saveButtonText}>{t('members.send')}</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB', // New design background
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 24, // px-6
    width: 40,
    height: 40,
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileHeader: {
    backgroundColor: '#B4AEBD', // New design purple
    paddingBottom: 40, // pb-10
    paddingHorizontal: 24, // px-6
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileAvatar: {
    width: 120, // w-30
    height: 120, // h-30
    borderRadius: 60, // rounded-full
    marginBottom: 20, // mb-5
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // white/30
  },
  profileName: {
    fontSize: 24, // text-2xl
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20, // mb-5
  },
  profileTags: {
    flexDirection: 'row',
    gap: 8, // gap-2
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11, // text-xs
    fontWeight: '500',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11, // text-xs
    fontWeight: '500',
  },
  statisticsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24, // px-6
    paddingVertical: 24, // py-6
    gap: 12, // gap-3
    backgroundColor: '#FAFCFB',
    justifyContent: 'center',
  },
  statCard: {
    width: (width - 72) / 2, // Account for padding and gap
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    marginBottom: 0,
    alignItems: 'flex-start', // Left align
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
  statNumber: {
    fontSize: 28, // text-3xl
    fontWeight: '600',
    color: '#54CE8F', // Primary green
    marginTop: 12, // mt-3
    marginBottom: 4, // mb-1
  },
  statLabel: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    textAlign: 'left',
  },
  rankCard: {
    alignItems: 'center',
    minHeight: 100,
  },
  rankingsList: {
    marginTop: 8,
  },
  rankingsListWrapped: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
    justifyContent: 'center',
  },
  rankingItemWrapped: {
    columnGap: 10,
    width: '48%',
    borderBottomWidth: 0,
    paddingVertical: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  leagueName: {
    fontSize: 13,
    color: 'gray',
    fontWeight: '400',
    width: '100%',
    flex: 1,
    marginRight: 4,
  },
  rankingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54CE8F', // Primary green
  },
  statIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24, // px-6
    paddingVertical: 24, // py-6
    gap: 12, // gap-3
    backgroundColor: '#FAFCFB',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 16, // rounded-2xl
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  actionIconGreen: {
    backgroundColor: '#54CE8F', // Primary green
  },
  actionIconGrey: {
    backgroundColor: '#B4AEBD', // Purple/gray
  },
  actionButtonText: {
    fontSize: 12, // text-xs
    fontWeight: '500',
    color: '#030213', // Dark text
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    marginHorizontal: 24, // mx-6
    marginBottom: 24, // mb-6
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
  cardTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600',
    color: '#030213',
    marginBottom: 16, // mb-4
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    flex: 1,
  },
  matchesList: {
    marginTop: 8, // mt-2
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16, // pb-4
    marginBottom: 16, // mb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4, // mb-1
  },
  matchScore: {
    fontSize: 14, // text-sm
    color: '#717182',
  },
  matchResultContainer: {
    alignItems: 'flex-end',
  },
  resultBadge: {
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    marginBottom: 4, // mb-1
  },
  resultBadgeWon: {
    backgroundColor: '#D1FAE5', // green-100
  },
  resultBadgeLost: {
    backgroundColor: '#FEE2E2', // red-100
  },
  resultBadgeText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
    color: '#030213',
  },
  matchDate: {
    fontSize: 11, // text-xs
    color: '#9CA3AF', // gray-400
  },
  emptyMatches: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyMatchesText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // mb-5
  },
  writeReviewText: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: '#54CE8F', // Primary green
  },
  reviewsSummary: {
    flexDirection: 'row',
    marginBottom: 24, // mb-6
  },
  ratingSummary: {
    alignItems: 'center',
    marginRight: 24, // mr-6
  },
  averageRating: {
    fontSize: 48, // text-5xl
    fontWeight: '600',
    color: '#54CE8F', // Primary green
    marginBottom: 8, // mb-2
  },
  reviewsCountText: {
    fontSize: 12, // text-xs
    color: '#717182', // Medium gray
    marginTop: 8, // mt-2
  },
  ratingDistribution: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  ratingBarLabel: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: '#030213',
    width: 20, // w-5
  },
  ratingBarContainer: {
    flex: 1,
    height: 8, // h-2
    backgroundColor: '#F3F4F6', // gray-100
    borderRadius: 4, // rounded
    marginLeft: 12, // ml-3
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#54CE8F', // Primary green
    borderRadius: 4, // rounded
  },
  reviewsList: {
    marginTop: 8, // mt-2
  },
  reviewItem: {
    paddingBottom: 16, // pb-4
    marginBottom: 16, // mb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  reviewUserName: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    lineHeight: 20,
    marginBottom: 8, // mb-2
  },
  reviewDate: {
    fontSize: 11, // text-xs
    color: '#9CA3AF', // gray-400
  },
  emptyReviews: {
    paddingVertical: 24, // py-6
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    marginHorizontal: 4,
  },
  reviewModal: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  reviewCard: {
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF',
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
  reviewContent: {
    padding: 24, // px-6 py-6
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  reviewModalTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  reviewModalSubtitle: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    marginBottom: 24, // mb-6
    lineHeight: 20,
  },
  ratingSection: {
    marginBottom: 24, // mb-6
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16, // text-base
    fontWeight: '600',
    color: '#030213',
    marginBottom: 12, // mb-3
  },
  commentInput: {
    marginBottom: 24, // mb-6
    backgroundColor: '#FFFFFF',
  },
  reviewModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // gap-3
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitButton: {
    flex: 1,
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#54CE8F', // Primary green
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030213',
    textAlign: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default MemberDetailScreen;

