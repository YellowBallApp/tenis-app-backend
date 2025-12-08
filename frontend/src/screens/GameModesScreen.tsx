import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { StatusBar } from 'expo-status-bar';

const GameModesScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const gameModes = [
    {
      id: 1,
      title: 'Defi Lig',
      subtitle: 'Çoklu Maç',
      description: 'Defi Lig formatında çoklu maç sistemi',
      icon: 'trophy',
      color: '#2E7D32',
      rules: ['Eleme sistemi', 'Final maçı', 'Ödül sistemi'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Fixed Header Section */}
      <View style={[
        styles.headerSection,
        { 
          paddingTop: Platform.OS === 'android' ? insets.top + 8 : insets.top + 4
        }
      ]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
          <Title style={styles.headerTitle}>Defi Lig</Title>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

      {/* Game Modes Grid */}
      <View style={styles.gameModesGrid}>
        {gameModes.map((mode) => (
          <Card key={mode.id} style={styles.gameModeCard}>
            <Card.Content>
              <View style={styles.modeHeader}>
                <View style={[styles.modeIcon, { backgroundColor: '#BA68C8' }]}>
                  <MaterialCommunityIcons name={mode.icon as any} size={32} color="#FFFFFF" />
                </View>
                <View style={styles.modeInfo}>
                  <Title style={styles.modeTitle}>{mode.title}</Title>
                  <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                </View>
              </View>
              
              <Text style={styles.modeDescription}>{mode.description}</Text>
              
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>Kurallar:</Text>
                {mode.rules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#2E7D32" />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>

              <Button
                mode="contained"
                style={styles.playButton}
                buttonColor="#2E7D32"
                onPress={() => navigation.navigate('DefiLig')}
              >
                Oyna
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Additional Info */}
      <View style={styles.additionalInfo}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>Defi Lig Hakkında</Title>
            <Text style={styles.infoText}>
              Defi Lig'de rekabetçi oyuncularla karşılaşarak yeteneklerinizi test edin. 
              Eleme sistemi ile ilerleyerek lig sıralamasında zirveyi hedefleyin.
            </Text>
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>İpuçları:</Text>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#BA68C8" />
                <Text style={styles.tipText}>Defi Lig rekabetçi oyuncular için tasarlanmıştır</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#BA68C8" />
                <Text style={styles.tipText}>Eleme sistemi ile ilerleyerek final maçına ulaşın</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#BA68C8" />
                <Text style={styles.tipText}>Her maçta puan kazanarak lig sıralamasında yükselin</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#BA68C8" />
                <Text style={styles.tipText}>Ödül sistemi ile başarılarınızı ödüllendirin</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      </ScrollView>
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
  headerSection: {
    backgroundColor: '#BA68C8',
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  gameModesGrid: {
    padding: 20,
  },
  gameModeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
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
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 5,
  },
  modeSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  modeDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 15,
  },
  rulesContainer: {
    marginBottom: 20,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
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
  playButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  additionalInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 15,
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    flex: 1,
    marginLeft: 4,
  },
});

export default GameModesScreen;
