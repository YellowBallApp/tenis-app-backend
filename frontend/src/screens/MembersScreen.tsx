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
import { LinearGradient } from 'expo-linear-gradient';
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
      
      // Coach ve admin kullanıcılarını filtrele
      const filteredUsers = usersData.filter((user: any) => {
        return user.userType !== 'coach' && user.userType !== 'admin';
      });
      
      // Backend'den gelen kullanıcıları members formatına dönüştür
      const formattedMembers = filteredUsers.map((user: any) => ({
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
    } catch (error: any) {
      console.error('Üyeler yüklenirken hata:', error);
      
      // Network error için daha açıklayıcı mesaj
      let errorMessage = t('members.notLoaded');
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network error')) {
        errorMessage = 'Backend sunucusuna bağlanılamıyor. Lütfen sunucunun çalıştığından emin olun.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
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
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[getLevelColor(member.level), getLevelColor(member.level) + 'DD']}
              style={styles.avatarGradient}
            >
              <Avatar.Text 
                size={80} 
                label={getInitials(member.name)}
                style={styles.memberAvatar}
              />
            </LinearGradient>
          </View>
          <View style={styles.memberInfo}>
            <Title style={[styles.memberName, themedStyles.title]}>{member.name}</Title>
            <View style={styles.badgesContainer}>
              <View style={styles.levelBadgeContainer}>
                <MaterialCommunityIcons name="trophy" size={16} color={getLevelColor(member.level)} />
                <View style={[styles.badge, { backgroundColor: getLevelColor(member.level) }]}>
                  <Text style={styles.badgeText}>{member.level}</Text>
                </View>
              </View>
              <Chip 
                mode="outlined" 
                style={[styles.statusChip, { borderColor: getStatusColor(member.status) }]}
                textStyle={{ color: getStatusColor(member.status), fontSize: 12 }}
              >
                {member.status}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.memberDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="tennis" size={20} color="#666666" />
            <Text style={[styles.detailText, themedStyles.text]}>
              {member.matchesPlayed} {t('members.matches')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="percent" size={20} color="#666666" />
            <Text style={[styles.detailText, themedStyles.text]}>
              {member.winRate}% {t('members.successRate')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="circle" size={20} color="#666666" />
            <Text style={[styles.detailText, themedStyles.text]}>
              {member.surface} {t('members.surface')}
            </Text>
          </View>
        </View>

        {member.email && (
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email" size={18} color="#666666" />
              <Text style={[styles.contactText, themedStyles.text]}>{member.email}</Text>
            </View>
            {member.phone && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone" size={18} color="#666666" />
                <Text style={[styles.contactText, themedStyles.text]}>{member.phone}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.achievementsContainer}>
          {member.achievements.length > 0 && (
            <>
              <Text style={[styles.achievementsTitle, themedStyles.text]}>{t('members.achievements')}</Text>
              <View style={styles.achievementsList}>
                {member.achievements.map((achievement: string, index: number) => (
                  <Chip key={index} mode="outlined" style={styles.achievementChip}>
                    {achievement}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.memberFooter}>
          <View style={styles.footerLeft}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#9E9E9E" />
            <Text style={[styles.lastActive, themedStyles.subtitle]}>
              {t('members.lastActive')} {member.lastActive}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <IconButton
              icon="account"
              size={20}
              iconColor="#666666"
              onPress={() => {}}
            />
            <IconButton
              icon="message"
              size={20}
              iconColor="#666666"
              onPress={() => {}}
            />
            <IconButton
              icon="calendar"
              size={20}
              iconColor="#666666"
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
        <View style={styles.gridAvatarContainer}>
          <LinearGradient
            colors={[getLevelColor(member.level), getLevelColor(member.level) + 'DD']}
            style={styles.gridAvatarGradient}
          >
            <Avatar.Text 
              size={70} 
              label={getInitials(member.name)}
              style={styles.memberGridAvatar}
            />
          </LinearGradient>
        </View>
        <Title style={[styles.memberGridName, themedStyles.title]}>{member.name}</Title>
        <View style={styles.gridBadgesContainer}>
          <View style={styles.gridLevelBadgeContainer}>
            <MaterialCommunityIcons name="trophy" size={14} color={getLevelColor(member.level)} />
            <View style={[styles.gridBadge, { backgroundColor: getLevelColor(member.level) }]}>
              <Text style={styles.gridBadgeText}>
                {member.level}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.gridStats}>
          <View style={styles.gridStatItem}>
            <MaterialCommunityIcons name="tennis" size={16} color="#666666" />
            <Text style={[styles.gridStatText, themedStyles.text]}>{member.matchesPlayed}</Text>
          </View>
          <View style={styles.gridStatItem}>
            <MaterialCommunityIcons name="percent" size={16} color="#666666" />
            <Text style={[styles.gridStatText, themedStyles.text]}>{member.winRate}%</Text>
          </View>
        </View>
        <View style={styles.memberGridActions}>
          <IconButton
            icon="account"
            size={20}
            iconColor="#666666"
            onPress={() => {}}
          />
          <IconButton
            icon="message"
            size={20}
            iconColor="#666666"
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
          backgroundColor: '#BA68C8',
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
            iconColor="#2E7D32"
            inputStyle={styles.searchInput}
          />
          <View style={styles.viewToggle}>
            <IconButton
              icon="view-list"
              size={24}
              iconColor={viewMode === 'list' ? '#2E7D32' : '#666666'}
              onPress={() => setViewMode('list')}
            />
            <IconButton
              icon="view-grid"
              size={24}
              iconColor={viewMode === 'grid' ? '#2E7D32' : '#666666'}
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
    backgroundColor: '#F8F9FA',
  },
  mainScrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#BA68C8',
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
    color: '#F3E5F5',
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
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    backgroundColor: '#BA68C8',
    borderColor: '#BA68C8',
  },
  filterText: {
    color: '#666666',
  },
  selectedFilterText: {
    color: '#1B1B1B',
    fontWeight: '600',
  },
  membersContainer: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarGradient: {
    borderRadius: 40,
    padding: 3,
  },
  memberAvatar: {
    backgroundColor: 'transparent',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 12,
    minWidth: 40,
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
  statusChip: {
    backgroundColor: '#FFFFFF',
  },
  memberDetails: {
    marginBottom: 15,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  contactInfo: {
    marginBottom: 15,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 10,
    flex: 1,
  },
  achievementsContainer: {
    marginBottom: 15,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastActive: {
    fontSize: 12,
    color: '#9E9E9E',
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
  memberGridContent: {
    alignItems: 'center',
    padding: 15,
  },
  gridAvatarContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gridAvatarGradient: {
    borderRadius: 35,
    padding: 2,
  },
  memberGridAvatar: {
    backgroundColor: 'transparent',
  },
  memberGridName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
    textAlign: 'center',
  },
  gridBadgesContainer: {
    marginBottom: 12,
  },
  gridLevelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridBadge: {
    borderRadius: 10,
    minWidth: 40,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  gridBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gridStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  memberGridActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default MembersScreen;

