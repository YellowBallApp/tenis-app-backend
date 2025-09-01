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
  Switch,
  Divider,
  Portal,
  Modal,
  TextInput,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const user = {
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@email.com',
    level: 'İleri',
    rank: 'Altın',
    points: 1250,
    matchesPlayed: 45,
    matchesWon: 32,
    winRate: 71,
    joinDate: 'Mart 2023',
    membershipType: 'Premium',
    nextRenewal: '15 Nisan 2024',
  };

  const achievements = [
    { id: 1, title: 'İlk Maç', description: 'İlk maçınızı oynadınız', icon: 'trophy', color: '#FFD700' },
    { id: 2, title: 'Seri Kazanan', description: '5 maç üst üste kazandınız', icon: 'fire', color: '#FF6B35' },
    { id: 3, title: 'Century Club', description: '100 maç oynadınız', icon: 'star', color: '#4CAF50' },
  ];

  const preferences = [
    { id: 1, title: 'Bildirimler', icon: 'bell', enabled: notificationsEnabled, onToggle: setNotificationsEnabled },
    { id: 2, title: 'Karanlık Mod', icon: 'theme-light-dark', enabled: darkModeEnabled, onToggle: setDarkModeEnabled },
    { id: 3, title: 'Konum Paylaşımı', icon: 'map-marker', enabled: true, onToggle: () => {} },
  ];

  const openEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setShowEditProfileModal(true);
  };

  const quickActions = [
    { title: 'Profil Düzenle', icon: 'account-edit', action: openEditProfile },
    { title: 'Şifre Değiştir', icon: 'lock-reset', action: () => setShowChangePasswordModal(true) },
    { title: 'Hesap Ayarları', icon: 'cog', action: () => setShowAccountSettingsModal(true) },
    { title: 'Yardım', icon: 'help-circle', action: () => setShowHelpModal(true) },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Başlangıç': return '#4CAF50';
      case 'Orta': return '#FF9800';
      case 'İleri': return '#F44336';
      case 'Uzman': return '#9C27B0';
      default: return '#6C757D';
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Bronz': return '#CD7F32';
      case 'Gümüş': return '#C0C0C0';
      case 'Altın': return '#FFD700';
      case 'Platin': return '#E5E4E2';
      default: return '#6C757D';
    }
  };

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Avatar.Text size={80} label={user.name.charAt(0)} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Title style={styles.userName}>{user.name}</Title>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.levelRankContainer}>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getLevelColor(user.level), marginRight: 10 }}
              >
                {user.level}
              </Chip>
              <Chip 
                mode="outlined" 
                style={{ borderColor: getRankColor(user.rank) }}
              >
                {user.rank}
              </Chip>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>İstatistikler</Title>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="trophy" size={32} color="#2E7D32" />
              <Text style={styles.statNumber}>{user.points}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="tennis" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>{user.matchesPlayed}</Text>
              <Text style={styles.statLabel}>Maç</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#81C784" />
              <Text style={styles.statNumber}>{user.matchesWon}</Text>
              <Text style={styles.statLabel}>Galibiyet</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <MaterialCommunityIcons name="percent" size={32} color="#28A745" />
              <Text style={styles.statNumber}>{user.winRate}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Başarılar</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievements.map((achievement) => (
            <Card key={achievement.id} style={styles.achievementCard}>
              <Card.Content style={styles.achievementContent}>
                <MaterialCommunityIcons 
                  name={achievement.icon as any} 
                  size={40} 
                  color={achievement.color} 
                />
                <Title style={styles.achievementTitle}>{achievement.title}</Title>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Membership Info */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Üyelik Bilgileri</Title>
        <Card style={styles.membershipCard}>
          <Card.Content>
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="calendar" size={24} color="#2E7D32" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Katılım Tarihi</Text>
                <Text style={styles.membershipValue}>{user.joinDate}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Üyelik Türü</Text>
                <Text style={styles.membershipValue}>{user.membershipType}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.membershipRow}>
              <MaterialCommunityIcons name="refresh" size={24} color="#4CAF50" />
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipLabel}>Sonraki Yenileme</Text>
                <Text style={styles.membershipValue}>{user.nextRenewal}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Tercihler</Title>
        <Card style={styles.preferencesCard}>
          <Card.Content>
            {preferences.map((preference) => (
              <View key={preference.id} style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name={preference.icon as any} size={24} color="#2E7D32" />
                  <Text style={styles.preferenceTitle}>{preference.title}</Text>
                </View>
                <Switch
                  value={preference.enabled}
                  onValueChange={preference.onToggle}
                  color="#2E7D32"
                />
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Hızlı İşlemler</Title>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={action.action}
              style={styles.actionButton}
              textColor="#2E7D32"
              icon={action.icon}
            >
              {action.title}
            </Button>
          ))}
        </View>
      </View>
    </ScrollView>

    {/* Profil Düzenle Modal */}
    <Portal>
      <Modal
        visible={showEditProfileModal}
        onDismiss={() => setShowEditProfileModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-edit" size={32} color="#2E7D32" />
                <Title style={styles.modalTitle}>Profil Düzenle</Title>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>Profil bilgilerinizi güncelleyin</Text>
              
              <TextInput
                mode="outlined"
                label="Ad Soyad"
                value={editName}
                onChangeText={setEditName}
                style={styles.textInput}
                left={<TextInput.Icon icon="account" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
              
              <TextInput
                mode="outlined"
                label="E-posta"
                value={editEmail}
                onChangeText={setEditEmail}
                style={styles.textInput}
                left={<TextInput.Icon icon="email" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
                keyboardType="email-address"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEditProfileModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('Profil güncellendi:', { name: editName, email: editEmail });
                    setShowEditProfileModal(false);
                  }}
                  style={[styles.modalButton, styles.saveButton]}
                  buttonColor="#2E7D32"
                  contentStyle={{ paddingVertical: 12 }}
                >
                  Kaydet
                </Button>
              </View>
            </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Şifre Değiştir Modal */}
    <Portal>
      <Modal
        visible={showChangePasswordModal}
        onDismiss={() => setShowChangePasswordModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="lock-reset" size={32} color="#FF9800" />
                <Title style={styles.modalTitle}>Şifre Değiştir</Title>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>Güvenliğiniz için şifrenizi güncelleyin</Text>
              
              <TextInput
                mode="outlined"
                label="Mevcut Şifre"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.textInput}
                left={<TextInput.Icon icon="lock" />}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF9800"
              />
              
              <TextInput
                mode="outlined"
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.textInput}
                left={<TextInput.Icon icon="lock-plus" />}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF9800"
              />
              
              <TextInput
                mode="outlined"
                label="Yeni Şifre Tekrar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.textInput}
                left={<TextInput.Icon icon="lock-check" />}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF9800"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowChangePasswordModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  contentStyle={{ paddingVertical: 12 }}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('Şifre değiştirildi');
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={[styles.modalButton, styles.saveButton]}
                  buttonColor="#FF9800"
                  contentStyle={{ paddingVertical: 12 }}
                >
                  Değiştir
                </Button>
              </View>
            </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Hesap Ayarları Modal */}
    <Portal>
      <Modal
        visible={showAccountSettingsModal}
        onDismiss={() => setShowAccountSettingsModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="cog" size={32} color="#4CAF50" />
              <Title style={styles.modalTitle}>Hesap Ayarları</Title>
              <TouchableOpacity onPress={() => setShowAccountSettingsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Hesap tercihlerinizi yönetin</Text>
            
            <List.Section>
              <List.Item
                title="Gizlilik Ayarları"
                description="Profil görünürlüğü ve gizlilik"
                left={props => <List.Icon {...props} icon="shield-account" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Bildirim Tercihleri"
                description="E-posta ve push bildirimleri"
                left={props => <List.Icon {...props} icon="bell-cog" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Dil ve Bölge"
                description="Uygulama dili ve saat dilimi"
                left={props => <List.Icon {...props} icon="earth" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Veri İndirme"
                description="Hesap verilerinizi indirin"
                left={props => <List.Icon {...props} icon="download" color="#2196F3" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Hesap Silme"
                description="Hesabınızı kalıcı olarak silin"
                left={props => <List.Icon {...props} icon="delete-forever" color="#F44336" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
            </List.Section>

            <Button
              mode="contained"
              onPress={() => setShowAccountSettingsModal(false)}
              style={[styles.modalButton, { marginTop: 32 }]}
              buttonColor="#4CAF50"
              contentStyle={{ paddingVertical: 12 }}
            >
              Tamam
            </Button>
          </Card.Content>
          </ScrollView>
        </Card>
      </Modal>
    </Portal>

    {/* Yardım Modal */}
    <Portal>
      <Modal
        visible={showHelpModal}
        onDismiss={() => setShowHelpModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="help-circle" size={32} color="#2196F3" />
              <Title style={styles.modalTitle}>Yardım & Destek</Title>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Size nasıl yardımcı olabiliriz?</Text>
            
            <List.Section>
              <List.Item
                title="Sık Sorulan Sorular"
                description="En çok merak edilen konular"
                left={props => <List.Icon {...props} icon="frequently-asked-questions" color="#2196F3" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Canlı Destek"
                description="7/24 müşteri hizmetleri"
                left={props => <List.Icon {...props} icon="chat" color="#4CAF50" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="E-posta Desteği"
                description="destek@teniskulubu.com"
                left={props => <List.Icon {...props} icon="email" color="#FF9800" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Telefon Desteği"
                description="+90 212 555 0123"
                left={props => <List.Icon {...props} icon="phone" color="#9C27B0" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <List.Item
                title="Kullanım Kılavuzu"
                description="Uygulama nasıl kullanılır?"
                left={props => <List.Icon {...props} icon="book-open" color="#607D8B" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
            </List.Section>

            <Button
              mode="contained"
              onPress={() => setShowHelpModal(false)}
              style={[styles.modalButton, { marginTop: 32 }]}
              buttonColor="#2196F3"
              contentStyle={{ paddingVertical: 12 }}
            >
              Tamam
            </Button>
          </Card.Content>
          </ScrollView>
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
  profileHeader: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FFFFFF',
    marginRight: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 15,
  },
  levelRankContainer: {
    flexDirection: 'row',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
  statCardContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 20,
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
  achievementCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
  achievementContent: {
    alignItems: 'center',
    padding: 15,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 16,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  membershipInfo: {
    marginLeft: 15,
    flex: 1,
  },
  membershipLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  membershipValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B1B',
  },
  divider: {
    backgroundColor: '#E9ECEF',
    marginVertical: 5,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceTitle: {
    fontSize: 16,
    color: '#1B1B1B',
    marginLeft: 15,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderColor: '#2E7D32',
    borderRadius: 12,
  },
  modalContainer: {
    margin: 10,
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    maxHeight: '85%',
    minHeight: '60%',
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
  modalScrollView: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    flex: 1,
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
    lineHeight: 20,
  },
  textInput: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: '#757575',
  },
  saveButton: {
    // Flex gap ile spacing sağlandı
  },
  listItem: {
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
});

export default ProfileScreen;
