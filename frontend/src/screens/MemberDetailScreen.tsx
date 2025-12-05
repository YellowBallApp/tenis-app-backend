import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { userService, matchHistoryService } from '../services/api';

const MemberDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { memberId } = route.params as { memberId: string };
  
  const [member, setMember] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      const [memberData, matchesData, statsData] = await Promise.all([
        userService.getUserById(memberId),
        matchHistoryService.getUserMatchHistory(memberId),
        matchHistoryService.getUserMatchStats(memberId).catch(() => null)
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
      // If for some reason we can't go back, navigate to the Home screen
      navigation.navigate('Home' as never);
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
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

  if (loading || !member) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#9E9E9E' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={120}
            label={getInitials(member.name)}
            style={styles.profileAvatar}
            labelStyle={{ color: '#FFFFFF', fontSize: 48, fontWeight: '700' }}
          />
          <Text style={styles.profileName}>{member.name}</Text>
          <View style={styles.profileTags}>
            {member.currentRank > 0 && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>Rank #{member.currentRank}</Text>
              </View>
            )}
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
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar" size={24} color="#666666" />
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
                <MaterialCommunityIcons name="email-outline" size={20} color="#666666" />
                <Text style={styles.contactText}>{member.email}</Text>
              </View>
            )}
            {member.phone && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#666666" />
                <Text style={styles.contactText}>{member.phone}</Text>
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
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileHeader: {
    backgroundColor: '#C4C4D3',
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileAvatar: {
    backgroundColor: '#B8B8CC',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  profileTags: {
    flexDirection: 'row',
    gap: 12,
  },
  rankBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rankBadgeText: {
    color: '#1B1B1B',
    fontSize: 15,
    fontWeight: '600',
  },
  levelBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  levelBadgeText: {
    color: '#1B1B1B',
    fontSize: 15,
    fontWeight: '600',
  },
  statisticsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 12,
    backgroundColor: '#C4C4D3',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 0,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: '#F8F9FA',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconGreen: {
    backgroundColor: '#4CAF50',
  },
  actionIconGrey: {
    backgroundColor: '#9E9E9E',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#1B1B1B',
    flex: 1,
  },
  matchesList: {
    marginTop: 8,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 14,
    color: '#666666',
  },
  matchResultContainer: {
    alignItems: 'flex-end',
  },
  resultBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  resultBadgeWon: {
    backgroundColor: '#C8E6C9',
  },
  resultBadgeLost: {
    backgroundColor: '#FFCDD2',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  matchDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  emptyMatches: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyMatchesText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});

export default MemberDetailScreen;

