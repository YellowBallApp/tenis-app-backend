import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Searchbar,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/api';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width } = Dimensions.get('window');

const MembersScreen = () => {
  const { themedStyles, theme } = useThemedStyles();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    loadMembers();
  }, []);

  // Dil değiştiğinde üyeleri yeniden yükle
  useEffect(() => {
    if (members.length > 0) {
      loadMembers();
    }
  }, [language]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      
      // Backend'den gelen kullanıcıları members formatına dönüştür
      const formattedMembers = usersData.map((user: any) => ({
        id: user.id,
        name: user.name + (user.surname ? ` ${user.surname}` : ''),
        level: user.title || t('members.member'),
        status: t('members.active'),
        surface: 'Sert',
        matchesPlayed: 0, // TODO: Match history'den hesaplanacak
        winRate: 0, // TODO: Match history'den hesaplanacak
        lastActive: new Date(user.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        achievements: [],
      }));
      
      setMembers(formattedMembers);
    } catch (error) {
      console.error('Üyeler yüklenirken hata:', error);
      Alert.alert(t('common.error'), t('members.notLoaded'));
    } finally {
      setLoading(false);
    }
  };

  // İsim ve soyisimin ilk harflerini almak için fonksiyon
  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  const filters = [
    { key: 'all', label: t('members.all') },
    { key: 'beginner', label: t('members.beginner') },
    { key: 'intermediate', label: t('members.intermediate') },
    { key: 'advanced', label: t('members.advanced') },
    { key: 'expert', label: t('members.expert') },
  ];

  const getLevelColor = (level: string) => {
    if (level === t('members.beginner')) return '#4CAF50';
    if (level === t('members.intermediate')) return '#FF9800';
    if (level === t('members.advanced')) return '#F44336';
    if (level === t('members.expert')) return '#9C27B0';
    return '#6C757D';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case t('members.active'): return '#4CAF50';
      case t('members.new'): return '#2196F3';
      case 'Pasif': return '#9E9E9E';
      default: return '#6C757D';
    }
  };

  const getSurfaceColor = (surface: string) => {
    switch (surface) {
      case 'Sert': return '#795548';
      case 'Toprak': return '#8D6E63';
      case 'Çim': return '#4CAF50';
      default: return '#6C757D';
    }
  };

  const filteredMembers = members.filter(member => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'beginner' && member.level === t('members.beginner')) return true;
    if (selectedFilter === 'intermediate' && member.level === t('members.intermediate')) return true;
    if (selectedFilter === 'advanced' && member.level === t('members.advanced')) return true;
    if (selectedFilter === 'expert' && member.level === t('members.expert')) return true;
    return false;
  });

  const searchFilteredMembers = filteredMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMemberCard = (member: any) => (
    <Card key={member.id} style={[styles.memberCard, themedStyles.card]}>
      <Card.Content>
        <View style={styles.memberHeader}>
          <Avatar.Text size={60} label={getInitials(member.name)} />
          <View style={styles.memberInfo}>
            <Title style={[styles.memberName, themedStyles.title]}>{member.name}</Title>
            <View style={styles.memberBadges}>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getLevelColor(member.level), marginRight: 8 }}
              >
                {member.level}
              </Chip>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getStatusColor(member.status) }}
              >
                {member.status}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="tennis" size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, themedStyles.statNumber]}>{member.matchesPlayed}</Text>
            <Text style={[styles.statLabel, themedStyles.statLabel]}>{t('members.matches')}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="percent" size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, themedStyles.statNumber]}>{member.winRate}%</Text>
            <Text style={[styles.statLabel, themedStyles.statLabel]}>{t('members.successRate')}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, themedStyles.statNumber]}>{member.surface}</Text>
            <Text style={[styles.statLabel, themedStyles.statLabel]}>{t('members.surface')}</Text>
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          {member.achievements.map((achievement: string, index: number) => (
            <Chip key={index} mode="outlined" style={styles.achievementChip}>
              {achievement}
            </Chip>
          ))}
        </View>

        <View style={styles.memberFooter}>
          <Text style={[styles.lastActive, themedStyles.subtitle]}>{t('members.lastActive')} {member.lastActive}</Text>
          <View style={styles.actionButtons}>
            <IconButton
              icon="account"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => {}}
            />
            <IconButton
              icon="message"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => {}}
            />
            <IconButton
              icon="calendar"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => {}}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMemberGrid = (member: any) => (
    <Card key={member.id} style={[styles.memberGridCard, themedStyles.card]}>
      <Card.Content style={styles.memberGridContent}>
        <Avatar.Text size={80} label={getInitials(member.name)} />
        <Title style={[styles.memberGridName, themedStyles.title]}>{member.name}</Title>
        <Chip 
          mode="outlined" 
          style={{ borderColor: getLevelColor(member.level), marginBottom: 8 }}
        >
          {member.level}
        </Chip>
        <Text style={[styles.memberGridStats, themedStyles.text]}>
          {member.matchesPlayed} {t('members.matchCount')} • {member.winRate}% {t('members.successRate')}
        </Text>
        <View style={styles.memberGridActions}>
          <IconButton
            icon="account"
            size={20}
            iconColor={theme.colors.primary}
            onPress={() => {}}
          />
          <IconButton
            icon="message"
            size={20}
            iconColor={theme.colors.primary}
            onPress={() => {}}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <StatusBar style="light" />
      
      {/* Animated Header Section */}
      <Animated.View style={[
        styles.headerSection, 
        { 
          backgroundColor: theme.colors.primary,
          height: headerHeight 
        }
      ]}>
        {/* Kompakt Başlık */}
        <Animated.View style={[
          styles.compactHeader,
          { opacity: compactOpacity }
        ]}>
          <Title style={styles.compactTitle}>👥 {t('members.title')} ({members.length})</Title>
        </Animated.View>
        
        {/* Normal İçerik */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <Title style={styles.headerTitle}>👥 {t('members.title')}</Title>
          <Text style={styles.headerSubtitle}>
            {t('members.subtitle')}
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
      >

        {/* Search and View Toggle */}
        <View style={styles.controlsContainer}>
          <Searchbar
            placeholder={t('members.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, themedStyles.input]}
            iconColor={theme.colors.primary}
            inputStyle={styles.searchInput}
          />
          <View style={styles.viewToggle}>
            <IconButton
              icon="view-list"
              size={24}
              iconColor={viewMode === 'list' ? theme.colors.primary : theme.colors.placeholder}
              onPress={() => setViewMode('list')}
            />
            <IconButton
              icon="view-grid"
              size={24}
              iconColor={viewMode === 'grid' ? '#2E7D32' : '#6C757D'}
              onPress={() => setViewMode('grid')}
            />
          </View>
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

        {/* Members List/Grid */}
        <View style={styles.membersContainer}>
          {viewMode === 'list' ? (
            searchFilteredMembers.map(renderMemberCard)
          ) : (
            <View style={styles.gridContainer}>
              {searchFilteredMembers.map(renderMemberGrid)}
            </View>
          )}
        </View>
      </Animated.ScrollView>
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    paddingTop: 50,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
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
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
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
  membersContainer: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  memberBadges: {
    flexDirection: 'row',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  achievementChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: '#2E7D32',
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActive: {
    fontSize: 12,
    color: '#6C757D',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberGridCard: {
    width: (width - 60) / 2,
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
  memberGridContent: {
    alignItems: 'center',
    padding: 15,
  },
  memberGridName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  memberGridStats: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 10,
  },
  memberGridActions: {
    flexDirection: 'row',
  },
});

export default MembersScreen;
