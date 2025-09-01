import React from 'react';
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
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GameModesScreen = () => {
  const gameModes = [
    {
      id: 1,
      title: 'Defi Lig',
      subtitle: 'Çoklu Maç',
      description: 'Defi Lig formatında çoklu maç sistemi',
      icon: 'trophy',
      color: '#28A745',
      rules: ['Eleme sistemi', 'Final maçı', 'Ödül sistemi'],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Title style={styles.headerTitle}>🏆 Defi Lig</Title>
        <Text style={styles.headerSubtitle}>
          Defi Lig formatında rekabetçi maçlara katılın ve lig sıralamasında yükselin
        </Text>
      </View>

      {/* Game Modes Grid */}
      <View style={styles.gameModesGrid}>
        {gameModes.map((mode) => (
          <Card key={mode.id} style={styles.gameModeCard}>
            <Card.Content>
              <View style={styles.modeHeader}>
                <View style={[styles.modeIcon, { backgroundColor: mode.color }]}>
                  <MaterialCommunityIcons name={mode.icon as any} size={32} color="#fff" />
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
                    <MaterialCommunityIcons name="check-circle" size={16} color={mode.color} />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>

              <Button
                mode="contained"
                style={[styles.playButton, { backgroundColor: mode.color }]}
                buttonColor={mode.color}
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
              <Text style={styles.tipText}>• Defi Lig rekabetçi oyuncular için tasarlanmıştır</Text>
              <Text style={styles.tipText}>• Eleme sistemi ile ilerleyerek final maçına ulaşın</Text>
              <Text style={styles.tipText}>• Her maçta puan kazanarak lig sıralamasında yükselin</Text>
              <Text style={styles.tipText}>• Ödül sistemi ile başarılarınızı ödüllendirin</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
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
  gameModesGrid: {
    padding: 20,
  },
  gameModeCard: {
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
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
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
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
    lineHeight: 18,
  },
});

export default GameModesScreen;
