import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Searchbar,
  Portal,
  Modal,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { coachService, coachReviewService } from '../services/api';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const CoachesScreen = () => {
  const { themedStyles, theme } = useThemedStyles();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedCoachForReviews, setSelectedCoachForReviews] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [180, 100],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const compactOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadCoaches();
  }, []);

  // Sayfa her odaklandığında verileri yenile (admin panelden onaylanan yorumları görmek için)
  useFocusEffect(
    React.useCallback(() => {
      loadCoaches();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoaches();
    setRefreshing(false);
  };

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const coachesData = await coachService.getAllCoaches();
      
      // Her antrenör için review sayısını çek ve User verilerini Coach formatına dönüştür
      const coachesWithReviewCounts = await Promise.all(
        coachesData.map(async (coach: any) => {
          try {
            // Sadece onaylı yorumları say
            const reviews = await coachReviewService.getCoachReviews(coach.id);
            // Backend zaten sadece onaylı yorumları gönderiyor, direkt kullan
            const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
            
            // User entity'sinden gelen verileri Coach formatına dönüştür
            return {
              ...coach,
              // User entity'sinde olmayan field'lar için default değerler
              name: coach.name + (coach.surname ? ` ${coach.surname}` : ''),
              specialty: coach.specialty || 'Genel',
              experience: coach.experience || 'Deneyimli',
              hourlyRate: coach.hourlyRate || 'N/A',
              availability: coach.availability || 'Available',
              bio: coach.bio || (coach.title ? `${coach.title} antrenörü` : 'Antrenör'),
              languages: Array.isArray(coach.languages) ? coach.languages : ['Türkçe'],
              certifications: Array.isArray(coach.certifications) ? coach.certifications : [],
              rating: coach.rating || coach.starRating || 0,
              reviews: [], // Review'lar ayrı modal'da gösterilecek
              reviewCount: reviewCount,
            };
          } catch (error) {
            console.error(`Antrenör ${coach.id} için review sayısı alınamadı:`, error);
            return {
              ...coach,
              // User entity'sinden gelen verileri Coach formatına dönüştür
              name: coach.name + (coach.surname ? ` ${coach.surname}` : ''),
              specialty: coach.specialty || 'Genel',
              experience: coach.experience || 'Deneyimli',
              hourlyRate: coach.hourlyRate || 'N/A',
              availability: coach.availability || 'Available',
              bio: coach.bio || (coach.title ? `${coach.title} antrenörü` : 'Antrenör'),
              languages: Array.isArray(coach.languages) ? coach.languages : ['Türkçe'],
              certifications: Array.isArray(coach.certifications) ? coach.certifications : [],
              rating: coach.rating || coach.starRating || 0,
              reviews: [],
              reviewCount: 0,
            };
          }
        })
      );
      
      setCoaches(coachesWithReviewCounts);
    } catch (error) {
      console.error('Antrenörler yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('coaches.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const openReviewsModal = async (coach: any) => {
    setSelectedCoachForReviews(coach);
    setShowReviewsModal(true);
    setLoadingReviews(true);
    
    try {
      // Sadece onaylı yorumları getir (onlyApproved=true varsayılan)
      const coachReviews = await coachReviewService.getCoachReviews(coach.id);
      // Backend zaten sadece onaylı yorumları gönderiyor
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

  const filters = [
    { key: 'all', label: t('coaches.all') },
    { key: 'singles', label: t('coaches.singles') },
    { key: 'doubles', label: t('coaches.doubles') },
    { key: 'beginner', label: t('coaches.beginner') },
    { key: 'advanced', label: t('coaches.advanced') },
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.8) return '#4CAF50';
    if (rating >= 4.5) return '#8BC34A';
    if (rating >= 4.0) return '#FFC107';
    return '#FF5722';
  };

  const translateAvailability = (availability: string) => {
    switch (availability) {
      case 'Müsait':
      case 'Available':
        return t('coaches.available');
      case 'Sınırlı':
      case 'Limited':
        return t('coaches.limited');
      case 'Müsait Değil':
      case 'Not Available':
      case 'NotAvailable':
        return t('coaches.notAvailable');
      default:
        return availability;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    const normalized = translateAvailability(availability);
    switch (normalized) {
      case t('coaches.available'): return '#4CAF50';
      case t('coaches.limited'): return '#FF9800';
      case t('coaches.notAvailable'): return '#F44336';
      default: return '#6C757D';
    }
  };

  const translateSpecialty = (specialty: string) => {
    // Backend'den gelen specialty değerlerini çevir
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

  const filteredCoaches = coaches.filter(coach => {
    if (selectedFilter === 'all') return true;
    // Backend'den gelen specialty'yi normalize et ve kontrol et
    const normalizedSpecialty = coach.specialty.toLowerCase();
    if (selectedFilter === 'singles' && (normalizedSpecialty === 'tekler' || normalizedSpecialty === 'singles')) return true;
    if (selectedFilter === 'doubles' && (normalizedSpecialty === 'çiftler' || normalizedSpecialty === 'doubles')) return true;
    if (selectedFilter === 'beginner' && (normalizedSpecialty === 'başlangıç' || normalizedSpecialty === 'beginner')) return true;
    if (selectedFilter === 'advanced' && (normalizedSpecialty === 'i̇leri seviye' || normalizedSpecialty === 'ileri seviye' || normalizedSpecialty === 'advanced')) return true;
    return false;
  });

  const searchFilteredCoaches = filteredCoaches.filter(coach =>
    coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      // Antrenörleri yeniden yükle (rating güncellenmiş olabilir)
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#9E9E9E' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      {/* Animated Header Section */}
      <Animated.View style={[
        styles.headerSection, 
        { 
          backgroundColor: '#E1BEE7',
          height: headerHeight 
        }
      ]}>
        {/* Kompakt Başlık */}
        <Animated.View style={[
          styles.compactHeader,
          { opacity: compactOpacity }
        ]}>
          <Title style={styles.compactTitle}>🎾 {t('coaches.coachCount')} ({coaches.length})</Title>
        </Animated.View>
        
        {/* Normal İçerik */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <Title style={styles.headerTitle}>🎾 {t('coaches.title')}</Title>
          <Text style={styles.headerSubtitle}>
            {t('coaches.subtitle')}
          </Text>
        </Animated.View>
      </Animated.View>
      
      {/* Main ScrollView - Tüm içerik scrollable */}
      <Animated.ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
            colors={["#2E7D32"]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('coaches.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#2E7D32"
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <Chip
                key={filter.key}
                mode={selectedFilter === filter.key ? 'flat' : 'outlined'}
                onPress={() => setSelectedFilter(filter.key)}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.selectedFilterChip
                ]}
                textStyle={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.selectedFilterText
                ]}
              >
                {filter.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Coaches List */}
        <View style={styles.coachesList}>
          {searchFilteredCoaches.map((coach) => (
            <Card key={coach.id} style={[styles.coachCard, themedStyles.card]}>
              <Card.Content>
                <View style={styles.coachHeader}>
                  <Avatar.Text 
                    size={80} 
                    label={(coach.name || 'A').split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()} 
                    style={styles.coachAvatar}
                  />
                  <View style={styles.coachInfo}>
                    <Title style={[styles.coachName, themedStyles.title]}>{coach.name || 'Antrenör'}</Title>
                    <Text style={[styles.coachSpecialty, themedStyles.subtitle]}>{translateSpecialty(coach.specialty || 'Genel')}</Text>
                    <View style={styles.ratingContainer}>
                      <View style={styles.ratingBadgeContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{coach.rating || '0.0'}</Text>
                        </View>
                      </View>
                      {coach.reviewCount > 0 && (
                        <View style={styles.reviewCountBadgeContainer}>
                          <MaterialCommunityIcons name="comment-text" size={16} color="#2E7D32" />
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{coach.reviewCount}</Text>
                          </View>
                        </View>
                      )}
                      {coach.availability && (
                        <Chip 
                          mode="outlined" 
                          style={[styles.availabilityChip, { borderColor: getAvailabilityColor(coach.availability) }]}
                        >
                          {translateAvailability(coach.availability)}
                        </Chip>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.coachDetails}>
                  {coach.experience && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock" size={20} color="#666666" />
                      <Text style={[styles.detailText, themedStyles.text]}>{coach.experience} {t('coaches.experience')}</Text>
                    </View>
                  )}
                  {coach.hourlyRate && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="currency-try" size={20} color="#666666" />
                      <Text style={[styles.detailText, themedStyles.text]}>{coach.hourlyRate}{t('coaches.perHour')}</Text>
                    </View>
                  )}
                  {coach.languages && Array.isArray(coach.languages) && coach.languages.length > 0 && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="translate" size={20} color="#666666" />
                      <Text style={[styles.detailText, themedStyles.text]}>{coach.languages.join(', ')}</Text>
                    </View>
                  )}
                </View>

                {coach.bio && (
                  <Text style={[styles.coachBio, themedStyles.text]}>{coach.bio}</Text>
                )}

                {coach.certifications && Array.isArray(coach.certifications) && coach.certifications.length > 0 && (
                  <View style={styles.certificationsContainer}>
                    <Text style={[styles.certificationsTitle, themedStyles.text]}>{t('coaches.certifications')}</Text>
                    {coach.certifications.map((cert: string, index: number) => (
                      <Chip key={index} mode="outlined" style={styles.certificationChip}>
                        {cert}
                      </Chip>
                    ))}
                  </View>
                )}

                {/* Reviews Section - Şimdilik yorumlar devre dışı */}
                {coach.reviews && coach.reviews.length > 0 && (
                  <View style={styles.reviewsSection}>
                    <Text style={styles.reviewsTitle}>{t('coaches.reviews')} ({coach.reviews.length})</Text>
                    {coach.reviews.slice(0, 2).map((review: any) => (
                      <View key={review.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewUser}>{review.user}</Text>
                          {renderStars(review.rating, 14)}
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      </View>
                    ))}
                    {coach.reviews.length > 2 && (
                      <Text style={styles.moreReviews}>+{coach.reviews.length - 2} {t('coaches.moreReviews')}</Text>
                    )}
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    style={styles.actionButton}
                    textColor="#666666"
                    icon="star"
                    onPress={() => openReviewModal(coach)}
                    contentStyle={styles.buttonContent}
                  >
                    {t('coaches.rate')}
                  </Button>
                  <Button
                    mode="outlined"
                    style={styles.actionButton}
                    textColor="#666666"
                    icon="comment-text"
                    onPress={() => openReviewsModal(coach)}
                    contentStyle={styles.buttonContent}
                  >
                    {t('coaches.reviews')}
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.actionButton}
                    buttonColor="#2E7D32"
                    icon="phone"
                    onPress={() => handleCallCoach(coach.phone, coach.name)}
                    contentStyle={styles.buttonContent}
                  >
                    {t('coaches.contact')}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Reviews List Modal */}
      <Portal>
        <Modal
        dismissable={false}
          visible={!!showReviewsModal}
          onDismiss={closeReviewsModal}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={[styles.reviewCard, themedStyles.card]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.reviewContent}>
                <View style={styles.reviewModalHeader}>
                  <MaterialCommunityIcons name="comment-text" size={32} color="#E1BEE7" />
                  <Title style={[styles.reviewModalTitle, themedStyles.title]}>
                    {selectedCoachForReviews?.name} - {t('coaches.reviews')}
                  </Title>
                  <TouchableOpacity onPress={closeReviewsModal}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.placeholder} />
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
                              <Text style={[styles.reviewListUserName, themedStyles.title]}>
                                {review.user?.name || 'Kullanıcı'}
                              </Text>
                              <Text style={[styles.reviewListDate, themedStyles.subtitle]}>
                                {formatReviewDate(review.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.reviewListRatingStars}>
                            {renderStars(review.rating, 20)}
                          </View>
                        </View>
                        <Text style={[styles.reviewListComment, themedStyles.text]}>
                          {review.comment}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyReviewsContainer}>
                    <MaterialCommunityIcons name="comment-off-outline" size={48} color="#BDBDBD" />
                    <Text style={[styles.emptyReviewsText, themedStyles.subtitle]}>
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
          visible={!!showReviewModal}
          onDismiss={() => setShowReviewModal(false)}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={[styles.reviewCard, themedStyles.card]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.reviewContent}>
                <View style={styles.reviewModalHeader}>
                  <MaterialCommunityIcons name="star" size={32} color="#FFD700" />
                  <Title style={[styles.reviewModalTitle, themedStyles.title]}>{t('coaches.rateCoach')}</Title>
                  <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.placeholder} />
                  </TouchableOpacity>
                </View>
                
                {selectedCoach && (
                  <>
                    <Text style={[styles.reviewModalSubtitle, themedStyles.subtitle]}>
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
  mainScrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#E1BEE7',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
    textAlign: 'center',
    paddingTop: 50,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterChip: {
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F0F0',
  },
  selectedFilterChip: {
    backgroundColor: '#E1BEE7',
    borderColor: '#E1BEE7',
  },
  filterText: {
    color: '#666666',
  },
  selectedFilterText: {
    color: '#1B1B1B',
    fontWeight: '600',
  },
  coachesList: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  coachCard: {
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
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coachAvatar: {
    backgroundColor: '#2E7D32',
  },
  coachInfo: {
    flex: 1,
    marginLeft: 15,
  },
  coachName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  coachSpecialty: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewCountBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  availabilityChip: {
    backgroundColor: '#FFFFFF',
  },
  coachDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
  },
  coachBio: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 15,
  },
  certificationsContainer: {
    marginBottom: 20,
  },
  certificationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  certificationChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: '#2E7D32',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  singleActionButton: {
    borderRadius: 12,
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  reviewsSection: {
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  reviewItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  moreReviews: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
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

export default CoachesScreen;
