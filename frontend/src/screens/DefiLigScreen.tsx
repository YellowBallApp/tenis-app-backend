import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  Avatar,
  Chip,
  Portal,
  Modal,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DefiLigScreen = ({ navigation }: any) => {
  const [showLigModal, setShowLigModal] = useState(false);
  const [selectedLig, setSelectedLig] = useState<any>(null);

  const currentUser = {
    name: 'Ahmet Emin Kahraman',
    level: 'İleri',
    rank: 'Altın',
    points: 1250,
    position: 12,
    winRate: 78,
    matchesPlayed: 45,
  };

  const defiLig = {
    id: 1,
    name: 'Defi Lig',
    playerCount: 156,
    color: '#2E7D32',
    icon: 'trophy',
    description: 'Rekabetçi oyuncularla karşılaşın ve lig sıralamasında yükselin',
    rewards: ['Lig rozetleri', 'Puan bonusları', 'Özel ödüller'],
    rules: [
      '1v1 maç formatı',
      'Sadece 3 sıra üstüne meydan okuma',
      'Puan bazlı sıralama',
      'Haftalık lig güncellemeleri'
    ],
  };

  const openLigModal = () => {
    setSelectedLig(defiLig);
    setShowLigModal(true);
  };

  const startLig = () => {
    setShowLigModal(false);
    // Navigate to Lig Sıralama screen
    navigation.navigate('LigSiralama', { lig: defiLig });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Title style={styles.headerTitle}>🏆 Defi Lig</Title>
          <Text style={styles.headerSubtitle}>
            Rekabetçi oyuncularla karşılaşın ve lig sıralamasında yükselin
          </Text>
        </View>

        {/* Current User Card - Belirgin Gösterim */}
        <View style={styles.currentUserSection}>
          <Title style={styles.sectionTitle}>Sen</Title>
          <Card style={styles.currentUserHighlightCard}>
            <Card.Content>
              <View style={styles.currentUserHighlightHeader}>
                <View style={styles.currentUserPositionContainer}>
                  <MaterialCommunityIcons 
                    name="trophy" 
                    size={28} 
                    color="#FFD700" 
                  />
                  <Text style={styles.currentUserPositionText}>
                    #{currentUser.position}
                  </Text>
                </View>
                
                <Avatar.Text 
                  size={70} 
                  label={currentUser.name.charAt(0)} 
                  style={styles.currentUserHighlightAvatar}
                />
                
                <View style={styles.currentUserHighlightInfo}>
                  <Title style={styles.currentUserHighlightName}>{currentUser.name}</Title>
                  <Text style={styles.currentUserHighlightLevel}>{currentUser.level} • {currentUser.rank}</Text>
                  <Text style={styles.currentUserHighlightPoints}>{currentUser.points} puan</Text>
                </View>
                
                <View style={styles.currentUserStatusContainer}>
                  <View style={styles.currentUserStatusDot} />
                  <Text style={styles.currentUserStatusText}>Çevrimiçi</Text>
                </View>
              </View>
              
              <View style={styles.currentUserHighlightStats}>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.currentUserHighlightStatNumber}>#{currentUser.position}</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Sıralama</Text>
                </View>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="percent" size={20} color="#4CAF50" />
                  <Text style={styles.currentUserHighlightStatNumber}>{currentUser.winRate}%</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Galibiyet</Text>
                </View>
                <View style={styles.currentUserHighlightStatItem}>
                  <MaterialCommunityIcons name="tennis" size={20} color="#2E7D32" />
                  <Text style={styles.currentUserHighlightStatNumber}>{currentUser.matchesPlayed}</Text>
                  <Text style={styles.currentUserHighlightStatLabel}>Maç</Text>
                </View>
              </View>
              
              <View style={styles.currentUserAchievements}>
                <Text style={styles.currentUserAchievementTitle}>Başarıların:</Text>
                <View style={styles.currentUserAchievementList}>
                  <Chip mode="outlined" style={styles.currentUserAchievementChip}>
                    ⭐ Yeni Yetenek
                  </Chip>
                  <Chip mode="outlined" style={styles.currentUserAchievementChip}>
                    🎯 İstikrarlı Oyuncu
                  </Chip>
                  <Chip mode="outlined" style={styles.currentUserAchievementChip}>
                    🏆 Lig Oyuncusu
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Defi Lig Card */}
        <View style={styles.ligSection}>
          <Title style={styles.sectionTitle}>Defi Lig</Title>
          <Card style={styles.ligCard}>
            <Card.Content>
              <TouchableOpacity onPress={openLigModal}>
                <View style={styles.ligHeader}>
                  <View style={[styles.ligIcon, { backgroundColor: defiLig.color }]}>
                    <MaterialCommunityIcons 
                      name={defiLig.icon as any} 
                      size={32} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.ligInfo}>
                    <Title style={styles.ligName}>{defiLig.name}</Title>
                    <Text style={styles.ligDescription}>{defiLig.description}</Text>
                    <Text style={styles.ligPlayers}>{defiLig.playerCount} oyuncu</Text>
                  </View>
                </View>

                <View style={styles.ligRules}>
                  <Text style={styles.rulesTitle}>Kurallar:</Text>
                  <View style={styles.rulesList}>
                    {defiLig.rules.map((rule, index) => (
                      <View key={index} style={styles.ruleItem}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#2E7D32" />
                        <Text style={styles.ruleText}>{rule}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.ligRewards}>
                  <Text style={styles.rewardsTitle}>Ödüller:</Text>
                  <View style={styles.rewardsList}>
                    {defiLig.rewards.map((reward, index) => (
                      <Chip key={index} mode="outlined" style={styles.rewardChip}>
                        {reward}
                      </Chip>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Title style={styles.sectionTitle}>İstatistikler</Title>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Lig Kazandı</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="tennis" size={32} color="#4CAF50" />
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>Maç Oynadı</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="percent" size={32} color="#81C784" />
                <Text style={styles.statNumber}>78%</Text>
                <Text style={styles.statLabel}>Galibiyet</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="medal" size={32} color="#FF9800" />
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Rozet</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Lig Detay Modal */}
      <Portal>
        <Modal
          visible={showLigModal}
          onDismiss={() => setShowLigModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              {selectedLig && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIcon, { backgroundColor: selectedLig.color }]}>
                      <MaterialCommunityIcons 
                        name={selectedLig.icon as any} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.modalInfo}>
                      <Title style={styles.modalTitle}>{selectedLig.name}</Title>
                      <Text style={styles.modalDescription}>{selectedLig.description}</Text>
                    </View>
                  </View>

                  <Divider style={styles.modalDivider} />

                  <View style={styles.modalDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account-group" size={20} color="#2E7D32" />
                      <Text style={styles.detailLabel}>Oyuncu Sayısı:</Text>
                      <Text style={styles.detailValue}>{selectedLig.playerCount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                      <Text style={styles.detailLabel}>Puan Aralığı:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLig.minPoints} - {selectedLig.maxPoints === 999999 ? '∞' : selectedLig.maxPoints}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalRewards}>
                    <Text style={styles.modalRewardsTitle}>Ödüller:</Text>
                    {selectedLig.rewards.map((reward: string, index: number) => (
                      <View key={index} style={styles.modalRewardItem}>
                        <MaterialCommunityIcons name="gift" size={16} color="#2E7D32" />
                        <Text style={styles.modalRewardText}>{reward}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowLigModal(false)}
                      style={styles.modalCancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={startLig}
                      style={styles.modalStartButton}
                      buttonColor="#2E7D32"
                    >
                      Lige Katıl
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </>
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
  currentUserSection: {
    padding: 20,
    paddingBottom: 10,
  },
  currentUserHighlightCard: {
    backgroundColor: '#F8FFF8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  currentUserHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentUserPositionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    minWidth: 50,
  },
  currentUserPositionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 5,
  },
  currentUserHighlightAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 15,
  },
  currentUserHighlightInfo: {
    flex: 1,
  },
  currentUserHighlightName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  currentUserHighlightLevel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  currentUserHighlightPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  currentUserStatusContainer: {
    alignItems: 'center',
  },
  currentUserStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginBottom: 5,
  },
  currentUserStatusText: {
    fontSize: 12,
    color: '#6C757D',
  },
  currentUserHighlightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  currentUserHighlightStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  currentUserHighlightStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 5,
    marginBottom: 3,
  },
  currentUserHighlightStatLabel: {
    fontSize: 11,
    color: '#6C757D',
    textAlign: 'center',
  },
  currentUserAchievements: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  currentUserAchievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  currentUserAchievementList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  currentUserAchievementChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: '#2E7D32',
    backgroundColor: '#F8FFF8',
  },
  ligSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  ligCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 15,
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
  ligHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ligIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  ligInfo: {
    flex: 1,
  },
  ligTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ligName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  ligDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  ligPlayers: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  ligRules: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  rulesList: {
    marginBottom: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
    flex: 1,
  },
  ligRewards: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  rewardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rewardChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: '#2E7D32',
  },
  statsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  modalContainer: {
    margin: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  modalDivider: {
    backgroundColor: '#E9ECEF',
    marginVertical: 15,
  },
  modalDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  modalRewards: {
    marginBottom: 20,
  },
  modalRewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  modalRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalRewardText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 12,
  },
  modalStartButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
  },
});

export default DefiLigScreen;
