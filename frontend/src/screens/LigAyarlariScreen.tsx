import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Button,
  Text,
  TextInput,
  Divider,
  IconButton,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { leagueService } from '../services/api';
import { useThemedStyles } from '../hooks/useThemedStyles';

const LigAyarlariScreen = ({ navigation }: any) => {
  const { themedStyles, theme } = useThemedStyles();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState('');
  
  // Lig Genel Bilgileri
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [leagueEndDate, setLeagueEndDate] = useState('');
  const [eliminationStartDate, setEliminationStartDate] = useState('');
  const [eliminationEndDate, setEliminationEndDate] = useState('');
  const [finalDate, setFinalDate] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [minMatchCount, setMinMatchCount] = useState('');
  
  // Maç Kuralları
  const [warmupTime, setWarmupTime] = useState('');
  const [gamesPerSet, setGamesPerSet] = useState('');
  const [setsCount, setSetsCount] = useState('');
  const [gameTiebreak, setGameTiebreak] = useState('');
  const [matchTiebreak, setMatchTiebreak] = useState('');
  
  // Teklif Kuralları
  const [offerResponseDays, setOfferResponseDays] = useState('');
  const [matchCompletionDays, setMatchCompletionDays] = useState('');
  const [postMatchCooldown, setPostMatchCooldown] = useState('');
  const [reofferCooldown, setReofferCooldown] = useState('');
  const [consecutiveWOLimit, setConsecutiveWOLimit] = useState('');
  const [lateArrivalMinutes, setLateArrivalMinutes] = useState('');
  
  // Sıra Bazlı Teklif Limitleri
  const [offerLimits, setOfferLimits] = useState<{ range: string; limit: string }[]>([]);

  // Collapsible header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 130],
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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await leagueService.getLeagueSettings();
      
      if (settings) {
        setSettingsId(settings.id);
        
        // Tarihleri formatla
        setLeagueStartDate(formatDate(settings.leagueStartDate));
        setLeagueEndDate(formatDate(settings.leagueEndDate));
        setEliminationStartDate(formatDate(settings.eliminationStartDate));
        setEliminationEndDate(formatDate(settings.eliminationEndDate));
        setFinalDate(formatDate(settings.finalDate));
        
        // Katılım bilgileri
        setRegistrationFee(String(settings.registrationFee));
        setMinMatchCount(String(settings.minMatchCountForElimination));
        
        // Maç formatı
        setWarmupTime(String(settings.warmupTimeMinutes));
        setGamesPerSet(String(settings.gamesPerSet));
        setSetsCount(String(settings.setsCount));
        setGameTiebreak(String(settings.gameTiebreakPoints));
        setMatchTiebreak(String(settings.matchTiebreakPoints));
        
        // Teklif kuralları
        setOfferResponseDays(String(settings.offerResponseDays));
        setMatchCompletionDays(String(settings.matchCompletionDays));
        setPostMatchCooldown(String(settings.postMatchCooldownHours));
        setReofferCooldown(String(settings.reofferCooldownDays));
        setConsecutiveWOLimit(String(settings.consecutiveWOLimit));
        setLateArrivalMinutes(String(settings.lateArrivalMinutes));
        
        // Sıra bazlı limitler
        if (settings.offerLimitsByRank) {
          setOfferLimits(
            settings.offerLimitsByRank.map((limit: any) => ({
              range: limit.range,
              limit: String(limit.limit),
            }))
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Hata', 'Ayarlar yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        registrationFee: parseFloat(registrationFee),
        minMatchCountForElimination: parseInt(minMatchCount),
        warmupTimeMinutes: parseInt(warmupTime),
        gamesPerSet: parseInt(gamesPerSet),
        setsCount: parseInt(setsCount),
        gameTiebreakPoints: parseInt(gameTiebreak),
        matchTiebreakPoints: parseInt(matchTiebreak),
        offerResponseDays: parseInt(offerResponseDays),
        matchCompletionDays: parseInt(matchCompletionDays),
        postMatchCooldownHours: parseInt(postMatchCooldown),
        reofferCooldownDays: parseInt(reofferCooldown),
        consecutiveWOLimit: parseInt(consecutiveWOLimit),
        lateArrivalMinutes: parseInt(lateArrivalMinutes),
        offerLimitsByRank: offerLimits.map(limit => ({
          range: limit.range,
          limit: parseInt(limit.limit),
        })),
      };
      
      await leagueService.updateLeagueSettings(updatedSettings);
      
      Alert.alert(
        'Başarılı',
        'Lig ayarları başarıyla güncellendi.',
        [{ text: 'Tamam' }]
      );
    } catch (error: any) {
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Varsayılana Dön',
      'Tüm ayarları varsayılan değerlere döndürmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet', 
          onPress: () => loadSettings()
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <Animated.View style={[styles.headerSection, { backgroundColor: theme.colors.primary, height: headerHeight, overflow: 'hidden', paddingTop: Platform.OS === 'android' ? insets.top + 10 : 50 }]}>
        <Animated.View style={[styles.headerTop, { opacity: headerOpacity }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerInfo}>
            <Title style={styles.headerTitle}>Lig Ayarları</Title>
            <Text style={styles.headerSubtitle}>
              Defi Ligi kuralları ve yapılandırması
            </Text>
          </View>
          <IconButton
            icon="refresh"
            size={24}
            iconColor="#FFFFFF"
            onPress={resetToDefaults}
          />
        </Animated.View>
        
        {/* Compact Header */}
        <Animated.View style={[styles.compactHeader, { opacity: compactOpacity, paddingTop: Platform.OS === 'android' ? insets.top + 10 : 50 }]}>
          <IconButton
            icon="arrow-left"
            size={20}
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
            style={styles.compactBackButton}
          />
          <Text style={styles.compactTitle}>⚙️ Lig Ayarları</Text>
          <IconButton
            icon="refresh"
            size={20}
            iconColor="#FFFFFF"
            onPress={resetToDefaults}
            style={styles.compactRefreshButton}
          />
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

      {/* Lig Dönemleri */}
      <View style={styles.section}>
        <Title style={[styles.sectionTitle, themedStyles.sectionTitle]}>📅 Lig Dönemleri</Title>
        <Card style={[styles.card, themedStyles.card]}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-start" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoLabel, themedStyles.text]}>Lig Başlangıç</Text>
              <Text style={[styles.infoValue, themedStyles.text]}>{leagueStartDate || 'Yükleniyor...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-end" size={20} color={theme.colors.primary} />
              <Text style={styles.infoLabel}>Lig Bitiş</Text>
              <Text style={styles.infoValue}>{leagueEndDate || 'Yükleniyor...'}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="trophy-variant" size={20} color="#FF9800" />
              <Text style={styles.infoLabel}>Eleme Başlangıç</Text>
              <Text style={styles.infoValue}>{eliminationStartDate || 'Yükleniyor...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="trophy-variant" size={20} color="#FF9800" />
              <Text style={styles.infoLabel}>Eleme Bitiş</Text>
              <Text style={styles.infoValue}>{eliminationEndDate || 'Yükleniyor...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.infoLabel}>Final Maçı</Text>
              <Text style={styles.infoValue}>{finalDate || 'Yükleniyor...'}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.noteBox}>
              <MaterialCommunityIcons name="information" size={16} color="#2E7D32" />
              <Text style={styles.noteText}>
                Katılımcı sayısına göre ilk 16 veya 32 eleme yapılacaktır
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Katılım Bilgileri */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>💰 Katılım Bilgileri</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Katılım Ücreti (TL)</Text>
              <TextInput
                mode="outlined"
                value={registrationFee}
                onChangeText={setRegistrationFee}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
                right={<TextInput.Affix text="TL" />}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Minimum Maç Sayısı (Elemeye Katılım)</Text>
              <TextInput
                mode="outlined"
                value={minMatchCount}
                onChangeText={setMinMatchCount}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
                right={<TextInput.Affix text="maç" />}
              />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.noteBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.noteText}>
                Yeni sezon sıralaması 2024 ligi esaslı olacaktır. Sonradan katılanlar listenin sonundan başlar.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Maç Formatı */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>🎾 Maç Formatı</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Isınma Süresi (dakika)</Text>
              <TextInput
                mode="outlined"
                value={warmupTime}
                onChangeText={setWarmupTime}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Set Başına Oyun Sayısı</Text>
              <TextInput
                mode="outlined"
                value={gamesPerSet}
                onChangeText={setGamesPerSet}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Set Sayısı</Text>
              <TextInput
                mode="outlined"
                value={setsCount}
                onChangeText={setSetsCount}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Oyun Tie-Break Puanı</Text>
              <TextInput
                mode="outlined"
                value={gameTiebreak}
                onChangeText={setGameTiebreak}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Maç Tie-Break Puanı</Text>
              <TextInput
                mode="outlined"
                value={matchTiebreak}
                onChangeText={setMatchTiebreak}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.noteBox}>
              <MaterialCommunityIcons name="information" size={16} color="#2E7D32" />
              <Text style={styles.noteText}>
                3-3'te 5'e, 4-4'te Tie-Break. Karar puanlı oynanacak. Antrenman topu kullanılmayacak.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Teklif ve Zaman Kuralları */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>⏱️ Teklif ve Zaman Kuralları</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Teklif Yanıt Süresi (gün)</Text>
              <TextInput
                mode="outlined"
                value={offerResponseDays}
                onChangeText={setOfferResponseDays}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Maç Tamamlama Süresi (gün)</Text>
              <TextInput
                mode="outlined"
                value={matchCompletionDays}
                onChangeText={setMatchCompletionDays}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Maç Sonrası Koruma (saat)</Text>
              <TextInput
                mode="outlined"
                value={postMatchCooldown}
                onChangeText={setPostMatchCooldown}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tekrar Teklif Süresi (gün)</Text>
              <TextInput
                mode="outlined"
                value={reofferCooldown}
                onChangeText={setReofferCooldown}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Geç Kalma Toleransı (dakika)</Text>
              <TextInput
                mode="outlined"
                value={lateArrivalMinutes}
                onChangeText={setLateArrivalMinutes}
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Sıra Bazlı Teklif Limitleri */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>📊 Sıra Bazlı Teklif Limitleri</Title>
        <Card style={styles.card}>
          <Card.Content>
            {offerLimits.map((limit, index) => (
              <View key={index} style={styles.limitRow}>
                <Chip icon="trophy" style={styles.limitChip}>
                  {limit.range}. sıra
                </Chip>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#6C757D" />
                <Chip icon="arrow-up" style={styles.limitValueChip}>
                  {limit.limit} yukarı
                </Chip>
              </View>
            ))}
            <Divider style={styles.divider} />
            <View style={styles.noteBox}>
              <MaterialCommunityIcons name="information" size={16} color="#2E7D32" />
              <Text style={styles.noteText}>
                Oyuncular sıralamalarına göre belirli sayıda yukarıdaki oyunculara meydan okuyabilir
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Ceza Kuralları */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>⚠️ Ceza ve İhlal Kuralları</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="alert-octagon" size={20} color="#D32F2F" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>WO (Walk Over) Cezası</Text>
                <Text style={styles.ruleText}>
                  Üst üste 3 kez WO yapan oyuncu sıralamanın en altına düşer
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="clock-alert" size={20} color="#FF9800" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Geç Kalma</Text>
                <Text style={styles.ruleText}>
                  10 dakika geç kalma W/O sayılır
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="cancel" size={20} color="#FF5722" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Maç Oynanamama</Text>
                <Text style={styles.ruleText}>
                  7 gün içinde maç oynanamaz ise sorumlu taraf hükmen mağlup. İki taraf sorumlu ise ikisi de 1 sıra düşer
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="account-remove" size={20} color="#9C27B0" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Spor Komitesi Yetkisi</Text>
                <Text style={styles.ruleText}>
                  Spor Komitesi ligden oyuncu çıkarma hakkına sahiptir
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Özel Durumlar */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>🌤️ Özel Durumlar</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="weather-lightning-rainy" size={20} color="#2196F3" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Hava Muhalefeti</Text>
                <Text style={styles.ruleText}>
                  Hava koşulları nedeniyle yarım kalan maçlar, yeniden ayarlandığında skordan devam eder
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="hospital-box" size={20} color="#E91E63" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Sakatlık</Text>
                <Text style={styles.ruleText}>
                  Maç esnasında sakatlanan veya maçı bırakan oyuncunun rakibi lehine kazanır
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.ruleItem}>
              <MaterialCommunityIcons name="gavel" size={20} color="#795548" />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Anlaşmazlık</Text>
                <Text style={styles.ruleText}>
                  Maç sırasında anlaşmazlık durumunda kulüp idaresinden hakem talep edilebilir
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Kaydet Butonu */}
      <View style={styles.section}>
        <Button
          mode="contained"
          onPress={saveSettings}
          style={styles.saveButton}
          buttonColor="#2E7D32"
          icon="content-save"
          loading={saving}
          disabled={Boolean(saving)}
        >
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
        <Button
          mode="outlined"
          onPress={resetToDefaults}
          style={styles.resetButton}
          textColor="#D32F2F"
          icon="restore"
          disabled={Boolean(saving)}
        >
          Yeniden Yükle
        </Button>
      </View>

      <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  headerSection: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
  inputRow: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  divider: {
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FFF8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 8,
    lineHeight: 18,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  limitChip: {
    backgroundColor: '#E8F5E9',
  },
  limitValueChip: {
    backgroundColor: '#FFF3E0',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleContent: {
    flex: 1,
    marginLeft: 12,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  resetButton: {
    borderRadius: 12,
    paddingVertical: 8,
    borderColor: '#D32F2F',
  },
  bottomPadding: {
    height: 40,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  compactBackButton: {
    margin: 0,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  compactRefreshButton: {
    margin: 0,
  },
});

export default LigAyarlariScreen;

