import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Searchbar,
  FAB,
  Portal,
  Modal,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CoachesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const coaches = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      specialty: 'Tekler',
      experience: '15 yıl',
      rating: 4.8,
      hourlyRate: '₺200',
      availability: 'Müsait',
      bio: 'Profesyonel tenis oyuncusu ve antrenör. ATP turnuvalarında oynamış, şimdi genç yetenekleri yetiştiriyor.',
      languages: ['Türkçe', 'İngilizce'],
      certifications: ['ATP Coach', 'ITF Intermediate'],
      image: 'https://via.placeholder.com/100',
      phone: '+90 532 123 45 67',
      reviews: [
        { id: 1, rating: 5, comment: 'Harika bir antrenör!', user: 'Mehmet A.' },
        { id: 2, rating: 4, comment: 'Çok sabırlı ve öğretici.', user: 'Ayşe K.' }
      ],
    },
    {
      id: 2,
      name: 'Fatma Kaya',
      specialty: 'Çiftler',
      experience: '12 yıl',
      rating: 4.9,
      hourlyRate: '₺180',
      availability: 'Müsait',
      bio: 'Çiftler oyununda uzmanlaşmış antrenör. Takım koordinasyonu ve strateji konularında deneyimli.',
      languages: ['Türkçe', 'Almanca'],
      certifications: ['ITF Advanced', 'Doubles Specialist'],
      image: 'https://via.placeholder.com/100',
      phone: '+90 535 987 65 43',
      reviews: [
        { id: 1, rating: 5, comment: 'Çiftler stratejisinde uzman!', user: 'Ali B.' }
      ],
    },
    {
      id: 3,
      name: 'Mehmet Demir',
      specialty: 'Başlangıç',
      experience: '8 yıl',
      rating: 4.7,
      hourlyRate: '₺150',
      availability: 'Sınırlı',
      bio: 'Yeni başlayanlar için ideal antrenör. Sabırlı ve anlayışlı yaklaşımıyla tanınıyor.',
      languages: ['Türkçe'],
      certifications: ['ITF Beginner', 'Beginner Specialist'],
      image: 'https://via.placeholder.com/100',
      phone: '+90 505 234 56 78',
      reviews: [
        { id: 1, rating: 5, comment: 'Başlangıç için mükemmel!', user: 'Zeynep C.' },
        { id: 2, rating: 4, comment: 'Çok sabırlı bir antrenör.', user: 'Can D.' }
      ],
    },
    {
      id: 4,
      name: 'Ayşe Özkan',
      specialty: 'İleri Seviye',
      experience: '20 yıl',
      rating: 5.0,
      hourlyRate: '₺250',
      availability: 'Müsait',
      bio: 'Elite seviye oyuncular için antrenör. Grand Slam turnuvalarında oyuncular yetiştirmiş.',
      languages: ['Türkçe', 'İngilizce', 'Fransızca'],
      certifications: ['ATP Elite Coach', 'Grand Slam Experience'],
      image: 'https://via.placeholder.com/100',
      phone: '+90 541 876 54 32',
      reviews: [
        { id: 1, rating: 5, comment: 'Dünya seviyesinde antrenörlük!', user: 'Emre F.' },
        { id: 2, rating: 5, comment: 'Profesyonel ve disiplinli.', user: 'Selin G.' },
        { id: 3, rating: 4, comment: 'İleri seviye için ideal.', user: 'Burak H.' }
      ],
    },
  ];

  const filters = [
    { key: 'all', label: 'Tümü' },
    { key: 'singles', label: 'Tekler' },
    { key: 'doubles', label: 'Çiftler' },
    { key: 'beginner', label: 'Başlangıç' },
    { key: 'advanced', label: 'İleri Seviye' },
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.8) return '#4CAF50';
    if (rating >= 4.5) return '#8BC34A';
    if (rating >= 4.0) return '#FFC107';
    return '#FF5722';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Müsait': return '#4CAF50';
      case 'Sınırlı': return '#FF9800';
      case 'Müsait Değil': return '#F44336';
      default: return '#6C757D';
    }
  };

  const filteredCoaches = coaches.filter(coach => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'singles' && coach.specialty === 'Tekler') return true;
    if (selectedFilter === 'doubles' && coach.specialty === 'Çiftler') return true;
    if (selectedFilter === 'beginner' && coach.specialty === 'Başlangıç') return true;
    if (selectedFilter === 'advanced' && coach.specialty === 'İleri Seviye') return true;
    return false;
  });

  const searchFilteredCoaches = filteredCoaches.filter(coach =>
    coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCallCoach = (phone: string, name: string) => {
    Alert.alert(
      'Arama Yap',
      `${name} adlı antrenörü aramak istediğinizden emin misiniz?\n\nTelefon: ${phone}`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Ara',
          onPress: () => {
            const phoneUrl = `tel:${phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert('Hata', 'Telefon uygulaması açılamadı.');
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

  const submitReview = () => {
    if (reviewRating === 0) {
      Alert.alert('Hata', 'Lütfen bir yıldız puanı verin.');
      return;
    }
    if (reviewComment.trim() === '') {
      Alert.alert('Hata', 'Lütfen bir yorum yazın.');
      return;
    }

    // Burada review'ı backend'e gönderebiliriz
    console.log('Review submitted:', {
      coachId: selectedCoach.id,
      rating: reviewRating,
      comment: reviewComment,
    });

    Alert.alert('Başarılı', 'Yorumunuz başarıyla gönderildi!');
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewComment('');
    setSelectedCoach(null    );
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

  return (
    <View style={styles.container}>
      {/* Main ScrollView - Tüm içerik scrollable */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Title style={styles.headerTitle}>🎾 Antrenörler</Title>
          <Text style={styles.headerSubtitle}>
            Deneyimli antrenörlerimizle tenis becerilerinizi geliştirin
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Antrenör ara..."
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
            <Card key={coach.id} style={styles.coachCard}>
              <Card.Content>
                <View style={styles.coachHeader}>
                  <Avatar.Text 
                    size={80} 
                    label={coach.name.split(' ').map(n => n.charAt(0)).join('')} 
                    style={styles.coachAvatar}
                  />
                  <View style={styles.coachInfo}>
                    <Title style={styles.coachName}>{coach.name}</Title>
                    <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{coach.rating}</Text>
                      <Chip 
                        mode="outlined" 
                        style={[styles.availabilityChip, { borderColor: getAvailabilityColor(coach.availability) }]}
                      >
                        {coach.availability}
                      </Chip>
                    </View>
                  </View>
                </View>

                <View style={styles.coachDetails}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="clock" size={20} color="#2E7D32" />
                    <Text style={styles.detailText}>{coach.experience} deneyim</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="currency-try" size={20} color="#4CAF50" />
                    <Text style={styles.detailText}>{coach.hourlyRate}/saat</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="translate" size={20} color="#81C784" />
                    <Text style={styles.detailText}>{coach.languages.join(', ')}</Text>
                  </View>
                </View>

                <Text style={styles.coachBio}>{coach.bio}</Text>

                <View style={styles.certificationsContainer}>
                  <Text style={styles.certificationsTitle}>Sertifikalar:</Text>
                  {coach.certifications.map((cert: string, index: number) => (
                    <Chip key={index} mode="outlined" style={styles.certificationChip}>
                      {cert}
                    </Chip>
                  ))}
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                  <Text style={styles.reviewsTitle}>Yorumlar ({coach.reviews.length})</Text>
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
                    <Text style={styles.moreReviews}>+{coach.reviews.length - 2} yorum daha</Text>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    style={styles.actionButton}
                    textColor="#2E7D32"
                    icon="star"
                    onPress={() => openReviewModal(coach)}
                    contentStyle={styles.buttonContent}
                  >
                    Değerlendir
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.actionButton}
                    buttonColor="#2E7D32"
                    icon="phone"
                    onPress={() => handleCallCoach(coach.phone, coach.name)}
                    contentStyle={styles.buttonContent}
                  >
                    İletişim
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        color="#FFFFFF"
      />

      {/* Review Modal */}
      <Portal>
        <Modal
          visible={showReviewModal}
          onDismiss={() => setShowReviewModal(false)}
          contentContainerStyle={styles.reviewModal}
        >
          <Card style={styles.reviewCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.reviewContent}>
                <View style={styles.reviewModalHeader}>
                  <MaterialCommunityIcons name="star" size={32} color="#FFD700" />
                  <Title style={styles.reviewModalTitle}>Antrenör Değerlendir</Title>
                  <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#757575" />
                  </TouchableOpacity>
                </View>
                
                {selectedCoach && (
                  <>
                    <Text style={styles.reviewModalSubtitle}>
                      {selectedCoach.name} için puan ve yorumunuzu paylaşın
                    </Text>
                    
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingLabel}>Puanınız:</Text>
                      {renderStars(reviewRating, 32, setReviewRating)}
                    </View>
                    
                    <TextInput
                      mode="outlined"
                      label="Yorumunuz"
                      placeholder="Deneyiminizi paylaşın..."
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      multiline
                      numberOfLines={4}
                      style={styles.commentInput}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#2E7D32"
                    />

                    <View style={styles.reviewModalButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowReviewModal(false)}
                        style={styles.modalCancelButton}
                        textColor="#757575"
                      >
                        İptal
                      </Button>
                      <Button
                        mode="contained"
                        onPress={submitReview}
                        style={styles.modalSubmitButton}
                        buttonColor="#2E7D32"
                      >
                        Gönder
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
    backgroundColor: '#FFFFFF',
  },
  mainScrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#F8F9FA',
    borderColor: '#E9ECEF',
  },
  selectedFilterChip: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterText: {
    color: '#6C757D',
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  coachesList: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for FAB
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
    color: '#6C757D',
    marginBottom: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginLeft: 5,
    marginRight: 15,
  },
  availabilityChip: {
    backgroundColor: '#F8F9FA',
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
    color: '#6C757D',
    marginLeft: 10,
  },
  coachBio: {
    fontSize: 14,
    color: '#6C757D',
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
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
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
    color: '#2E7D32',
  },
  reviewComment: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  moreReviews: {
    fontSize: 12,
    color: '#2E7D32',
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
    borderBottomColor: '#E9ECEF',
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
    color: '#6C757D',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
  },
});

export default CoachesScreen;
