import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
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
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CoachesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  return (
    <View style={styles.container}>
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
      <ScrollView style={styles.coachesList} showsVerticalScrollIndicator={false}>
        {searchFilteredCoaches.map((coach) => (
          <Card key={coach.id} style={styles.coachCard}>
            <Card.Content>
              <View style={styles.coachHeader}>
                <Avatar.Image size={80} source={{ uri: coach.image }} />
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

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor="#2E7D32"
                  icon="calendar"
                >
                  Rezervasyon
                </Button>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor="#2E7D32"
                  icon="message"
                >
                  İletişim
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    flex: 1,
    paddingHorizontal: 20,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
  },
});

export default CoachesScreen;
