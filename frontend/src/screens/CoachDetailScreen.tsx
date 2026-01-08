import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text,
  Avatar,
  Button,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { coachService, coachReviewService } from '../services/api';

const CoachDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { coachId } = route.params as { coachId: number };
  
  const [coach, setCoach] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadCoachData();
  }, [coachId]);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      const [coachData, reviewsData] = await Promise.all([
        coachService.getCoachById(coachId),
        coachReviewService.getCoachReviews(coachId)
      ]);
      
      console.log('📊 Coach Data:', coachData);
      console.log('⭐ Coach Rating:', coachData.rating, 'StarRating:', coachData.starRating);
      
      const reviewCount = Array.isArray(reviewsData) ? reviewsData.length : 0;
      const ratingValue = coachData.rating || coachData.starRating || 0;
      
      const formattedCoach = {
        ...coachData,
        name: coachData.name + (coachData.surname ? ` ${coachData.surname}` : ''),
        specialty: coachData.specialty || 'Genel',
        experience: coachData.experience || 'Deneyimli',
        rating: typeof ratingValue === 'number' ? ratingValue : parseFloat(ratingValue) || 0,
        reviewCount: reviewCount,
      };
      
      console.log('✨ Formatted Coach Rating:', formattedCoach.rating);
      
      setCoach(formattedCoach);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error('Antrenör detayları yüklenirken hata:', error);
      Alert.alert(t('common.error'), 'Antrenör bilgileri yüklenirken bir hata oluştu');
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

  const handleCall = () => {
    if (!coach?.phone) {
      Alert.alert(t('common.error'), 'Telefon numarası bulunamadı');
      return;
    }
    
    Alert.alert(
      t('coaches.callCoach'),
      `${coach.name} ${t('coaches.callConfirm')}\n\n${t('coaches.phone')} ${coach.phone}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('coaches.call'),
          onPress: () => {
            const phoneUrl = `tel:${coach.phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert(t('common.error'), t('coaches.phoneError'));
            });
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    if (!coach?.phone) {
      Alert.alert(t('common.error'), 'Telefon numarası bulunamadı');
      return;
    }
    
    // Telefon numarasını temizle (boşluk, tire, parantez gibi karakterleri kaldır)
    const cleanPhone = coach.phone.replace(/[\s\-\(\)]/g, '');
    
    // WhatsApp URL formatı: whatsapp://send?phone=PHONE_NUMBER veya https://wa.me/PHONE_NUMBER
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      // WhatsApp yüklü değilse veya açılamazsa, alternatif olarak web versiyonunu dene
      const webWhatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`;
      Linking.openURL(webWhatsappUrl).catch(() => {
        Alert.alert(t('common.error'), 'WhatsApp açılamadı. Lütfen WhatsApp\'ın yüklü olduğundan emin olun.');
      });
    });
  };

  const handleChallenge = () => {
    // TODO: Navigate to challenge/reservation screen
    Alert.alert('Bilgi', 'Meydan okuma özelliği yakında eklenecek');
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

  if (loading || !coach) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#54CE8F" />
      </View>
    );
  }

  const ratingDistribution = calculateRatingDistribution();
  const maxRatingCount = getMaxRatingCount();
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : coach.rating || 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 60 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('UsersList' as never);
              }
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {coach.profilePhoto ? (
            <Image
              source={{ uri: coach.profilePhoto }}
              style={styles.profileAvatar}
            />
          ) : (
            <Avatar.Text
              size={120}
              label={getInitials(coach.name)}
              style={styles.profileAvatar}
              labelStyle={{ color: '#FFFFFF', fontSize: 48, fontWeight: '700' }}
            />
          )}
          <Text style={styles.profileName}>{coach.name}</Text>
          <Text style={styles.profileRole}>{translateSpecialty(coach.specialty)}</Text>
          <View style={styles.profileTags}>
            <View style={styles.experienceTag}>
              <Text style={styles.experienceTagText}>{coach.experience}</Text>
            </View>
            <View style={styles.ratingTag}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingTagText}>
                {coach.rating && typeof coach.rating === 'number' ? coach.rating.toFixed(1) : '0.0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Meydan okuma butonu gizlendi */}
          {/* <TouchableOpacity style={styles.actionButton} onPress={handleChallenge}>
            <View style={[styles.actionIcon, styles.actionIconGreen]}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('coaches.challenge')}</Text>
          </TouchableOpacity> */}
          
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
            {coach.email && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                <Text style={styles.contactText}>{coach.email}</Text>
              </View>
            )}
            {coach.phone && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#9CA3AF" />
                <Text style={styles.contactText}>{coach.phone}</Text>
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
                <Text style={styles.writeReviewText}>{t('coaches.writeReview')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewsSummary}>
              <View style={styles.ratingSummary}>
                <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                {renderStars(Math.round(averageRating), 24)}
                <Text style={styles.reviewsCountText}>
                  {t('coaches.basedOn')} {reviews.length} {t('coaches.reviews')}
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
      </ScrollView>

      {/* Review Modal */}
      <Portal>
        <Modal
          dismissable={false}
          visible={showReviewModal}
          onDismiss={() => setShowReviewModal(false)}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={styles.reviewCard}>
            <Card.Content style={styles.reviewContent}>
              <View style={styles.reviewModalHeader}>
                <MaterialIcons name="star" size={32} color="#FFD700" />
                <Text style={styles.reviewModalTitle}>{t('coaches.rateCoach')}</Text>
                <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.reviewModalSubtitle}>
                {t('coaches.rateCoachSubtitle')} {coach.name}
              </Text>
              
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>{t('coaches.yourRating')}</Text>
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
                  onPress={async () => {
                    if (reviewRating === 0) {
                      Alert.alert(t('common.error'), t('coaches.ratingRequired'));
                      return;
                    }
                    if (reviewComment.trim() === '') {
                      Alert.alert(t('common.error'), t('coaches.commentRequired'));
                      return;
                    }
                    try {
                      await coachReviewService.createReview(coachId, reviewRating, reviewComment.trim());
                      Alert.alert(t('common.success'), t('coaches.reviewSuccess'));
                      setShowReviewModal(false);
                      setReviewRating(0);
                      setReviewComment('');
                      await loadCoachData();
                    } catch (error: any) {
                      Alert.alert(t('common.error'), error.response?.data?.message || 'Yorum kaydedilirken bir hata oluştu');
                    }
                  }}
                  style={styles.modalSubmitButton}
                  buttonColor="#E1BEE7"
                  textColor="#1B1B1B"
                >
                  {t('coaches.send')}
                </Button>
              </View>
            </Card.Content>
          </Card>
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
    top: 60,
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
    marginBottom: 8, // mb-2
  },
  profileRole: {
    fontSize: 14, // text-sm
    color: '#F3E5F5', // Light purple
    marginBottom: 16, // mb-4
  },
  profileTags: {
    flexDirection: 'row',
    gap: 8, // gap-2
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  experienceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
  },
  experienceTagText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
    color: '#FFFFFF',
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
    gap: 6, // gap-1.5
  },
  ratingTagText: {
    fontSize: 11, // text-xs
    fontWeight: '500',
    color: '#FFFFFF',
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
    marginBottom: 12, // mb-3
    gap: 12, // gap-3
  },
  contactText: {
    fontSize: 14, // text-sm
    color: '#717182', // Medium gray
    flex: 1,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  writeReviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  reviewsSummary: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  ratingSummary: {
    alignItems: 'center',
    marginRight: 24,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  reviewsCountText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  ratingDistribution: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    width: 20,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginLeft: 12,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  emptyReviews: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    marginHorizontal: 4,
  },
  reviewModal: {
    margin: Platform.OS === 'ios' ? 20 : 20,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 0,
  },
  reviewCard: {
    borderRadius: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: '#FFFFFF',
    maxHeight: Platform.OS === 'ios' ? Dimensions.get('window').height * 0.60 : Dimensions.get('window').height * 0.80,
    minHeight: Platform.OS === 'ios' ? Dimensions.get('window').height * 0.50 : undefined,
    width: Platform.OS === 'ios' ? '90%' : undefined,
    alignSelf: Platform.OS === 'ios' ? 'center' : undefined,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
});

export default CoachDetailScreen;

