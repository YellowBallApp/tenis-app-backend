import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text,
  Avatar,
  Searchbar,
  Portal,
  Modal,
  TextInput,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLanguage } from '../context/LanguageContext';
import { userService, coachService, coachReviewService, matchHistoryService } from '../services/api';
import { UsersStackParamList } from '../navigation/MainTabNavigator';

type UsersScreenNavigationProp = StackNavigationProp<UsersStackParamList, 'UsersList'>;

const UsersScreen = () => {
  const navigation = useNavigation<UsersScreenNavigationProp>();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'coaches'>('coaches');
  const [members, setMembers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [coachesLoaded, setCoachesLoaded] = useState(false);
  
  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedCoachForReviews, setSelectedCoachForReviews] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // İlk yükleme - hem members hem coaches verilerini bir kere çek
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        // Paralel olarak hem members hem coaches verilerini yükle
        await Promise.all([
          loadMembers(false),
          loadCoaches(false)
        ]);
      } catch (error) {
        console.error('İlk yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
  }, []); // Sadece component mount olduğunda çalışır

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'members') {
      await loadMembers(false);
    } else {
      await loadCoaches(false);
    }
    setRefreshing(false);
  };


  const loadMembers = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const usersData = await userService.getAllUsers();
      
      // Coach ve admin kullanıcılarını filtrele - sadece admin ve coach olmayan kullanıcıları göster
      const filteredUsers = usersData.filter((user: any) => {
        const userType = user.userType?.toLowerCase();
        return userType !== 'coach' && userType !== 'admin';
      });
      
      // Her kullanıcı için maç istatistiklerini çek
      const membersWithStats = await Promise.all(
        filteredUsers.map(async (user: any) => {
          try {
            // Kullanıcının maç geçmişini çek
            const matchHistory = await matchHistoryService.getUserMatchHistory(user.id);
            
            // Kazanılan ve kaybedilen maçları hesapla
            // winners array'ini kullan (winners bir User object array'i)
            const wins = matchHistory.filter((match: any) => {
              if (match.winners && Array.isArray(match.winners)) {
                return match.winners.some((winner: any) => winner.id === user.id);
              }
              // Fallback: winnerIds varsa onu kullan
              if (match.winnerIds && Array.isArray(match.winnerIds)) {
                return match.winnerIds.includes(user.id);
              }
              return false;
            }).length;
            
            const totalMatches = matchHistory.length;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            
            return {
              id: user.id,
              name: user.name + (user.surname ? ` ${user.surname}` : ''),
              level: user.title || t('members.member'),
              currentRank: user.currentRank || 0,
              matchesPlayed: totalMatches,
              winRate: winRate,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              profilePhoto: user.profilePhoto,
            };
          } catch (error) {
            // Maç geçmişi çekilemezse default değerlerle döndür
            return {
              id: user.id,
              name: user.name + (user.surname ? ` ${user.surname}` : ''),
              level: user.title || t('members.member'),
              currentRank: user.currentRank || 0,
              matchesPlayed: 0,
              winRate: 0,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              profilePhoto: user.profilePhoto,
            };
          }
        })
      );
      
      setMembers(membersWithStats);
      setMembersLoaded(true);
    } catch (error: any) {
      console.error('Üyeler yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('members.notLoaded'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadCoaches = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const coachesData = await coachService.getAllCoaches();
      
      // Her antrenör için review sayısını çek
      const coachesWithReviewCounts = await Promise.all(
        coachesData.map(async (coach: any) => {
          try {
            const reviews = await coachReviewService.getCoachReviews(coach.id);
            const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
            
            const ratingValue = coach.rating || coach.starRating || 0;
            return {
              ...coach,
              name: coach.name + (coach.surname ? ` ${coach.surname}` : ''),
              specialty: coach.specialty || 'Genel',
              experience: coach.experience || 'Deneyimli',
              rating: typeof ratingValue === 'number' ? ratingValue : parseFloat(ratingValue) || 0,
              reviewCount: reviewCount,
            };
          } catch (error) {
            const ratingValue = coach.rating || coach.starRating || 0;
            return {
              ...coach,
              name: coach.name + (coach.surname ? ` ${coach.surname}` : ''),
              specialty: coach.specialty || 'Genel',
              experience: coach.experience || 'Deneyimli',
              rating: typeof ratingValue === 'number' ? ratingValue : parseFloat(ratingValue) || 0,
              reviewCount: 0,
            };
          }
        })
      );
      
      setCoaches(coachesWithReviewCounts);
      setCoachesLoaded(true);
    } catch (error) {
      console.error('Antrenörler yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('coaches.loadError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const openReviewsModal = async (coach: any) => {
    setSelectedCoachForReviews(coach);
    setShowReviewsModal(true);
    setLoadingReviews(true);
    
    try {
      const coachReviews = await coachReviewService.getCoachReviews(coach.id);
      const reviewsData = Array.isArray(coachReviews) ? coachReviews : [];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      Alert.alert(t('common.error'), 'Yorumlar yüklenirken bir hata oluştu');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedCoachForReviews(null);
    setReviews([]);
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCallCoach = (phone: string, name: string) => {
    Alert.alert(
      t('coaches.callCoach'),
      `${name} ${t('coaches.callConfirm')}\n\n${t('coaches.phone')} ${phone}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('coaches.call'),
          onPress: () => {
            const phoneUrl = `tel:${phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert(t('common.error'), t('coaches.phoneError'));
            });
          },
        },
      ]
    );
  };

  const openReviewModal = (coach: any) => {
    setSelectedCoach(coach);
    setReviewRating(0);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert(t('common.error'), t('coaches.ratingRequired'));
      return;
    }
    if (reviewComment.trim() === '') {
      Alert.alert(t('common.error'), t('coaches.commentRequired'));
      return;
    }

    if (!selectedCoach) {
      Alert.alert(t('common.error'), 'Antrenör seçilmedi');
      return;
    }

    try {
      await coachReviewService.createReview(
        selectedCoach.id,
        reviewRating,
        reviewComment.trim()
      );

      await loadCoaches();

      Alert.alert(t('common.success'), t('coaches.reviewSuccess'));
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      setSelectedCoach(null);
    } catch (error: any) {
      console.error('Review submit error:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || 'Değerlendirme kaydedilirken bir hata oluştu'
      );
    }
  };

  const renderStars = (rating: number, size: number = 20, onPress?: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <MaterialIcons
              name={star <= rating ? 'star' : 'star-border'}
              size={size}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
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

  const translateSpecialty = (specialty: string) => {
    switch (specialty) {
      case 'Tekler':
      case 'Singles':
        return t('coaches.singles');
      case 'Çiftler':
      case 'Doubles':
        return t('coaches.doubles');
      case 'Başlangıç':
      case 'Beginner':
        return t('coaches.beginner');
      case 'İleri Seviye':
      case 'Advanced':
        return t('coaches.advanced');
      default:
        return specialty;
    }
  };

  const filteredData = activeTab === 'members' 
    ? members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.level.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coaches.filter(coach =>
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Sadece ilk yüklemede ve veriler yoksa loading göster
  const showLoading = loading && 
    ((activeTab === 'members' && !membersLoaded) || 
     (activeTab === 'coaches' && !coachesLoaded));

  if (showLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#9E9E9E' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
            colors={["#2E7D32"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('users.directory')}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('users.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#666666"
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === 'members' && styles.toggleButtonActive
            ]}
            onPress={() => setActiveTab('members')}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={activeTab === 'members' ? '#FFFFFF' : '#666666'}
            />
            <Text style={[
              styles.toggleButtonText,
              activeTab === 'members' && styles.toggleButtonTextActive
            ]}>
              {t('users.members')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === 'coaches' && styles.toggleButtonActive
            ]}
            onPress={() => setActiveTab('coaches')}
          >
            <MaterialCommunityIcons
              name="medal"
              size={20}
              color={activeTab === 'coaches' ? '#FFFFFF' : '#666666'}
            />
            <Text style={[
              styles.toggleButtonText,
              activeTab === 'coaches' && styles.toggleButtonTextActive
            ]}>
              {t('users.coaches')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {activeTab === 'members' ? (
            filteredData.map((member: any) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => navigation.navigate('MemberDetail', { memberId: member.id })}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    {member.profilePhoto ? (
                      <Image
                        source={{ uri: member.profilePhoto }}
                        style={styles.avatarImage}
                        onError={(e) => {
                          console.log('Image load error for', member.name, e.nativeEvent.error);
                        }}
                      />
                    ) : (
                      <Avatar.Text
                        size={56}
                        label={getInitials(member.name)}
                        style={styles.avatar}
                        labelStyle={{ color: '#FFFFFF' }}
                      />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{member.name}</Text>
                      <View style={styles.badgesRow}>
                        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(member.level) }]}>
                          <Text style={styles.levelBadgeText}>{member.level}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                      {t('users.matches')} <Text style={styles.statValue}>{member.matchesPlayed || 0}</Text>
                    </Text>
                    <Text style={styles.statText}>
                      {t('users.winRate')} <Text style={styles.statValueGreen}>{member.winRate || 0}%</Text>
                    </Text>
                  </View>
                </Card.Content>
              </Card>
              </TouchableOpacity>
            ))
          ) : (
            filteredData.map((coach: any) => (
              <TouchableOpacity
                key={coach.id}
                onPress={() => navigation.navigate('CoachDetail', { coachId: coach.id })}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    {coach.profilePhoto ? (
                      <Image
                        source={{ uri: coach.profilePhoto }}
                        style={styles.coachAvatarImage}
                      />
                    ) : (
                      <Avatar.Text
                        size={72}
                        label={getInitials(coach.name)}
                        style={styles.coachAvatar}
                        labelStyle={{ color: '#FFFFFF', fontSize: 28, fontWeight: '600' }}
                      />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.coachCardName}>{coach.name}</Text>
                      <Text style={styles.coachCardRole}>{translateSpecialty(coach.specialty)}</Text>
                      <View style={styles.badgesRow}>
                        <View style={styles.coachBadge}>
                          <Text style={styles.coachBadgeText}>Coach</Text>
                        </View>
                        {coach.experience && (
                          <Text style={styles.experienceText}>{coach.experience}</Text>
                        )}
                      </View>
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={20} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {coach.rating && typeof coach.rating === 'number' ? coach.rating.toFixed(1) : '0.0'}
                        </Text>
                        <Text style={styles.reviewsText}>({coach.reviewCount || 0} {t('users.reviews')})</Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Reviews List Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={showReviewsModal}
          onDismiss={closeReviewsModal}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={styles.reviewCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.reviewContent}>
                <View style={styles.reviewModalHeader}>
                  <MaterialCommunityIcons name="comment-text" size={32} color="#E1BEE7" />
                  <Text style={styles.reviewModalTitle}>
                    {selectedCoachForReviews?.name} - {t('coaches.reviews')}
                  </Text>
                  <TouchableOpacity onPress={closeReviewsModal}>
                    <MaterialCommunityIcons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                {loadingReviews ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2E7D32" />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                  </View>
                ) : reviews.length > 0 ? (
                  <View style={styles.reviewsListContainer}>
                    {reviews.map((review) => (
                      <View key={review.id} style={styles.reviewListItem}>
                        <View style={styles.reviewListItemHeader}>
                          <View style={styles.reviewListUserInfo}>
                            <MaterialCommunityIcons name="account-circle" size={32} color="#666666" />
                            <View style={styles.reviewListUserDetails}>
                              <Text style={styles.reviewListUserName}>
                                {review.user?.name || 'Kullanıcı'}
                              </Text>
                              <Text style={styles.reviewListDate}>
                                {formatReviewDate(review.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.reviewListRatingStars}>
                            {renderStars(review.rating, 20)}
                          </View>
                        </View>
                        <Text style={styles.reviewListComment}>
                          {review.comment}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyReviewsContainer}>
                    <MaterialCommunityIcons name="comment-off-outline" size={48} color="#BDBDBD" />
                    <Text style={styles.emptyReviewsText}>
                      {t('coaches.noReviews')}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </ScrollView>
          </Card>
        </Modal>
      </Portal>

      {/* Review Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={showReviewModal}
          onDismiss={() => setShowReviewModal(false)}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={styles.reviewCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.reviewContent}>
                <View style={styles.reviewModalHeader}>
                  <MaterialIcons name="star" size={32} color="#FFD700" />
                  <Text style={styles.reviewModalTitle}>{t('coaches.rateCoach')}</Text>
                  <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                {selectedCoach && (
                  <>
                    <Text style={styles.reviewModalSubtitle}>
                      {t('coaches.rateCoachSubtitle')} {selectedCoach.name}
                    </Text>
                    
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingLabel}>{t('coaches.yourRating')}</Text>
                      {renderStars(reviewRating, 32, setReviewRating)}
                    </View>
                    
                    <TextInput
                      mode="outlined"
                      label={t('coaches.yourComment')}
                      placeholder={t('coaches.commentPlaceholder')}
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      multiline
                      numberOfLines={4}
                      style={styles.commentInput}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#E1BEE7"
                    />

                    <View style={styles.reviewModalButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowReviewModal(false)}
                        style={styles.modalCancelButton}
                        textColor="#666666"
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        mode="contained"
                        onPress={submitReview}
                        style={styles.modalSubmitButton}
                        buttonColor="#E1BEE7"
                        textColor="#1B1B1B"
                      >
                        {t('coaches.send')}
                      </Button>
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
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  searchInput: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#9E9E9E',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9E9E9E',
  },
  coachAvatar: {
    backgroundColor: '#E1BEE7',
    color: '#FFFFFF',
  },
  coachAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E1BEE7',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  coachCardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  coachCardRole: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rankBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  levelBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  coachBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coachBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  experienceText: {
    fontSize: 14,
    color: '#1B1B1B',
    marginLeft: 8,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
  },
  statValue: {
    fontWeight: '600',
    color: '#1B1B1B',
  },
  statValueGreen: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 6,
  },
  actionButtonPrimary: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 1,
  },
  reviewModal: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  reviewCard: {
    borderRadius: 20,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewContent: {
    padding: 24,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 12,
  },
  reviewModalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  ratingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  commentInput: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  reviewModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
  },
  modalSubmitButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 10,
  },
  reviewsListContainer: {
    marginTop: 20,
  },
  reviewListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewListUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reviewListUserDetails: {
    flex: 1,
  },
  reviewListUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  reviewListDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  reviewListRatingStars: {
    marginLeft: 8,
  },
  reviewListComment: {
    fontSize: 14,
    color: '#1B1B1B',
    lineHeight: 20,
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default UsersScreen;

