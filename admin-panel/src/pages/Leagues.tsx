import { useEffect, useState } from 'react';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';
// @ts-ignore - @mdi/js types may not be available in some environments  
import * as mdiIcons from '@mdi/js';

interface League {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Tüm MaterialCommunityIcons iconları (popüler ve kullanışlı olanlar)
const ALL_MATERIAL_ICONS = [
  // Ödüller ve Başarı
  { name: 'trophy', category: 'trophy' },
  { name: 'trophy-outline', category: 'trophy' },
  { name: 'trophy-variant', category: 'trophy' },
  { name: 'trophy-variant-outline', category: 'trophy' },
  { name: 'trophy-award', category: 'trophy' },
  { name: 'medal', category: 'trophy' },
  { name: 'medal-outline', category: 'trophy' },
  { name: 'crown', category: 'trophy' },
  { name: 'crown-outline', category: 'trophy' },
  { name: 'star', category: 'trophy' },
  { name: 'star-outline', category: 'trophy' },
  { name: 'star-circle', category: 'trophy' },
  { name: 'star-circle-outline', category: 'trophy' },
  { name: 'star-four-points', category: 'trophy' },
  { name: 'star-four-points-outline', category: 'trophy' },
  { name: 'trophy-broken', category: 'trophy' },
  { name: 'trophy-account', category: 'trophy' },
  
  // Spor ve Tenis
  { name: 'tennis', category: 'sport' },
  { name: 'tennis-ball', category: 'sport' },
  { name: 'soccer', category: 'sport' },
  { name: 'basketball', category: 'sport' },
  { name: 'basketball-hoop', category: 'sport' },
  { name: 'football', category: 'sport' },
  { name: 'football-helmet', category: 'sport' },
  { name: 'baseball', category: 'sport' },
  { name: 'baseball-bat', category: 'sport' },
  { name: 'golf', category: 'sport' },
  { name: 'golf-tee', category: 'sport' },
  { name: 'hockey-puck', category: 'sport' },
  { name: 'hockey-sticks', category: 'sport' },
  { name: 'volleyball', category: 'sport' },
  { name: 'table-tennis', category: 'sport' },
  { name: 'badminton', category: 'sport' },
  { name: 'swim', category: 'sport' },
  { name: 'run', category: 'sport' },
  { name: 'bike', category: 'sport' },
  { name: 'ski', category: 'sport' },
  { name: 'skate', category: 'sport' },
  { name: 'weight-lifter', category: 'sport' },
  { name: 'dumbbell', category: 'sport' },
  { name: 'karate', category: 'sport' },
  { name: 'martial-arts', category: 'sport' },
  { name: 'yoga', category: 'sport' },
  { name: 'racing-helmet', category: 'sport' },
  { name: 'racing-flag', category: 'sport' },
  
  // Sosyal ve Grup
  { name: 'account-group', category: 'social' },
  { name: 'account-group-outline', category: 'social' },
  { name: 'account-multiple', category: 'social' },
  { name: 'account-multiple-outline', category: 'social' },
  { name: 'account-supervisor', category: 'social' },
  { name: 'account-supervisor-outline', category: 'social' },
  { name: 'account-tie', category: 'social' },
  { name: 'account-tie-outline', category: 'social' },
  { name: 'account', category: 'social' },
  { name: 'account-outline', category: 'social' },
  { name: 'account-circle', category: 'social' },
  { name: 'account-circle-outline', category: 'social' },
  { name: 'account-box', category: 'social' },
  { name: 'account-box-outline', category: 'social' },
  { name: 'account-heart', category: 'social' },
  { name: 'account-heart-outline', category: 'social' },
  { name: 'handshake', category: 'social' },
  { name: 'handshake-outline', category: 'social' },
  { name: 'account-network', category: 'social' },
  { name: 'account-network-outline', category: 'social' },
  
  // Semboller ve İşaretler
  { name: 'flag', category: 'symbol' },
  { name: 'flag-outline', category: 'symbol' },
  { name: 'flag-variant', category: 'symbol' },
  { name: 'flag-variant-outline', category: 'symbol' },
  { name: 'flag-triangle', category: 'symbol' },
  { name: 'shield', category: 'symbol' },
  { name: 'shield-outline', category: 'symbol' },
  { name: 'shield-check', category: 'symbol' },
  { name: 'shield-check-outline', category: 'symbol' },
  { name: 'shield-star', category: 'symbol' },
  { name: 'shield-star-outline', category: 'symbol' },
  { name: 'target', category: 'symbol' },
  { name: 'target-variant', category: 'symbol' },
  { name: 'bullseye', category: 'symbol' },
  { name: 'bullseye-arrow', category: 'symbol' },
  { name: 'diamond-stone', category: 'symbol' },
  { name: 'diamond-outline', category: 'symbol' },
  { name: 'diamond', category: 'symbol' },
  { name: 'hexagon', category: 'symbol' },
  { name: 'hexagon-outline', category: 'symbol' },
  { name: 'octagon', category: 'symbol' },
  { name: 'octagon-outline', category: 'symbol' },
  { name: 'circle', category: 'symbol' },
  { name: 'circle-outline', category: 'symbol' },
  { name: 'square', category: 'symbol' },
  { name: 'square-outline', category: 'symbol' },
  { name: 'triangle', category: 'symbol' },
  { name: 'triangle-outline', category: 'symbol' },
  
  // Genel ve Popüler
  { name: 'fire', category: 'general' },
  { name: 'fire-outline', category: 'general' },
  { name: 'lightning-bolt', category: 'general' },
  { name: 'lightning-bolt-outline', category: 'general' },
  { name: 'rocket', category: 'general' },
  { name: 'rocket-outline', category: 'general' },
  { name: 'rocket-launch', category: 'general' },
  { name: 'rocket-launch-outline', category: 'general' },
  { name: 'flash', category: 'general' },
  { name: 'flash-outline', category: 'general' },
  { name: 'flash-auto', category: 'general' },
  { name: 'flame', category: 'general' },
  { name: 'flame-outline', category: 'general' },
  { name: 'heart', category: 'general' },
  { name: 'heart-outline', category: 'general' },
  { name: 'heart-pulse', category: 'general' },
  { name: 'heart-multiple', category: 'general' },
  { name: 'heart-multiple-outline', category: 'general' },
  { name: 'thumb-up', category: 'general' },
  { name: 'thumb-up-outline', category: 'general' },
  { name: 'thumb-down', category: 'general' },
  { name: 'thumb-down-outline', category: 'general' },
  { name: 'check-circle', category: 'general' },
  { name: 'check-circle-outline', category: 'general' },
  { name: 'check', category: 'general' },
  { name: 'check-all', category: 'general' },
  { name: 'close-circle', category: 'general' },
  { name: 'close-circle-outline', category: 'general' },
  { name: 'close', category: 'general' },
  { name: 'plus-circle', category: 'general' },
  { name: 'plus-circle-outline', category: 'general' },
  { name: 'minus-circle', category: 'general' },
  { name: 'minus-circle-outline', category: 'general' },
  { name: 'plus', category: 'general' },
  { name: 'minus', category: 'general' },
  { name: 'bell', category: 'general' },
  { name: 'bell-outline', category: 'general' },
  { name: 'bell-ring', category: 'general' },
  { name: 'bell-ring-outline', category: 'general' },
  { name: 'cog', category: 'general' },
  { name: 'cog-outline', category: 'general' },
  { name: 'settings', category: 'general' },
  { name: 'settings-outline', category: 'general' },
  { name: 'wrench', category: 'general' },
  { name: 'wrench-outline', category: 'general' },
  { name: 'toolbox', category: 'general' },
  { name: 'toolbox-outline', category: 'general' },
  { name: 'hammer', category: 'general' },
  { name: 'hammer-wrench', category: 'general' },
  { name: 'calendar', category: 'general' },
  { name: 'calendar-outline', category: 'general' },
  { name: 'calendar-clock', category: 'general' },
  { name: 'calendar-clock-outline', category: 'general' },
  { name: 'clock', category: 'general' },
  { name: 'clock-outline', category: 'general' },
  { name: 'clock-time-four', category: 'general' },
  { name: 'clock-time-four-outline', category: 'general' },
  { name: 'timer', category: 'general' },
  { name: 'timer-outline', category: 'general' },
  { name: 'timer-sand', category: 'general' },
  { name: 'timer-sand-empty', category: 'general' },
  { name: 'chart-line', category: 'general' },
  { name: 'chart-line-variant', category: 'general' },
  { name: 'chart-bar', category: 'general' },
  { name: 'chart-bar-stacked', category: 'general' },
  { name: 'chart-pie', category: 'general' },
  { name: 'chart-donut', category: 'general' },
  { name: 'chart-donut-variant', category: 'general' },
  { name: 'trending-up', category: 'general' },
  { name: 'trending-down', category: 'general' },
  { name: 'arrow-up', category: 'general' },
  { name: 'arrow-down', category: 'general' },
  { name: 'arrow-left', category: 'general' },
  { name: 'arrow-right', category: 'general' },
  { name: 'arrow-up-circle', category: 'general' },
  { name: 'arrow-down-circle', category: 'general' },
  { name: 'arrow-left-circle', category: 'general' },
  { name: 'arrow-right-circle', category: 'general' },
  { name: 'chevron-up', category: 'general' },
  { name: 'chevron-down', category: 'general' },
  { name: 'chevron-left', category: 'general' },
  { name: 'chevron-right', category: 'general' },
  { name: 'play-circle', category: 'general' },
  { name: 'play-circle-outline', category: 'general' },
  { name: 'pause-circle', category: 'general' },
  { name: 'pause-circle-outline', category: 'general' },
  { name: 'stop-circle', category: 'general' },
  { name: 'stop-circle-outline', category: 'general' },
  { name: 'skip-next', category: 'general' },
  { name: 'skip-previous', category: 'general' },
  { name: 'fast-forward', category: 'general' },
  { name: 'rewind', category: 'general' },
  { name: 'home', category: 'general' },
  { name: 'home-outline', category: 'general' },
  { name: 'home-variant', category: 'general' },
  { name: 'home-variant-outline', category: 'general' },
  { name: 'map', category: 'general' },
  { name: 'map-outline', category: 'general' },
  { name: 'map-marker', category: 'general' },
  { name: 'map-marker-outline', category: 'general' },
  { name: 'map-marker-radius', category: 'general' },
  { name: 'map-marker-radius-outline', category: 'general' },
  { name: 'compass', category: 'general' },
  { name: 'compass-outline', category: 'general' },
  { name: 'navigation', category: 'general' },
  { name: 'navigation-outline', category: 'general' },
  { name: 'information', category: 'general' },
  { name: 'information-outline', category: 'general' },
  { name: 'alert', category: 'general' },
  { name: 'alert-outline', category: 'general' },
  { name: 'alert-circle', category: 'general' },
  { name: 'alert-circle-outline', category: 'general' },
  { name: 'help-circle', category: 'general' },
  { name: 'help-circle-outline', category: 'general' },
  { name: 'question-mark', category: 'general' },
  { name: 'question-mark-circle', category: 'general' },
  { name: 'question-mark-circle-outline', category: 'general' },
  { name: 'magnify', category: 'general' },
  { name: 'magnify-plus', category: 'general' },
  { name: 'magnify-minus', category: 'general' },
  { name: 'filter', category: 'general' },
  { name: 'filter-outline', category: 'general' },
  { name: 'sort', category: 'general' },
  { name: 'sort-alphabetical', category: 'general' },
  { name: 'sort-numeric', category: 'general' },
  { name: 'sort-variant', category: 'general' },
  { name: 'eye', category: 'general' },
  { name: 'eye-outline', category: 'general' },
  { name: 'eye-off', category: 'general' },
  { name: 'eye-off-outline', category: 'general' },
  { name: 'lock', category: 'general' },
  { name: 'lock-outline', category: 'general' },
  { name: 'lock-open', category: 'general' },
  { name: 'lock-open-outline', category: 'general' },
  { name: 'key', category: 'general' },
  { name: 'key-outline', category: 'general' },
  { name: 'key-variant', category: 'general' },
  { name: 'bookmark', category: 'general' },
  { name: 'bookmark-outline', category: 'general' },
  { name: 'bookmark-plus', category: 'general' },
  { name: 'bookmark-plus-outline', category: 'general' },
  { name: 'tag', category: 'general' },
  { name: 'tag-outline', category: 'general' },
  { name: 'tag-multiple', category: 'general' },
  { name: 'tag-multiple-outline', category: 'general' },
  { name: 'label', category: 'general' },
  { name: 'label-outline', category: 'general' },
];

// MaterialCommunityIcons isimlerini MDI path formatına çeviren helper fonksiyon
// MaterialCommunityIcons isim formatı: 'trophy', 'trophy-outline' gibi
// MDI formatı: 'mdiTrophy', 'mdiTrophyOutline' gibi
const getIconPath = (iconName: string): string | null => {
  try {
    // Icon ismini MDI formatına çevir
    // 'trophy' -> 'mdiTrophy', 'trophy-outline' -> 'mdiTrophyOutline'
    const parts = iconName.split('-');
    const mdiName = 'mdi' + parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    
    // @mdi/js'den icon path'ini al
    const iconPath = (mdiIcons as any)[mdiName];
    
    // Eğer bulunamazsa, alternatif isimleri dene
    if (!iconPath) {
      // Bazı iconlar farklı isimlerle olabilir
      const alternativeNames = [
        mdiName.replace(/Outline$/, ''),
        mdiName.replace(/Variant$/, ''),
        mdiName.replace(/OutlineVariant$/, 'VariantOutline'),
      ];
      
      for (const altName of alternativeNames) {
        const altPath = (mdiIcons as any)[altName];
        if (altPath) {
          return altPath;
        }
      }
      
      // Debug: İlk 10 icon için log
      if (iconName === 'trophy' || iconName === 'crown' || iconName === 'tennis') {
        console.warn(`Icon not found: ${iconName} -> ${mdiName}`, {
          available: Object.keys(mdiIcons).filter(k => k.toLowerCase().includes(iconName.toLowerCase())).slice(0, 5)
        });
      }
    }
    
    return iconPath || null;
  } catch (error) {
    console.error(`Error getting icon path for ${iconName}:`, error);
    return null;
  }
};

const Leagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'trophy',
    leagueDescription: '',
    rewards: '',
    // Yaş Aralıkları
    minAge: '',
    maxAge: '',
    // Katılım Bilgileri
    registrationFee: '',
    minMatchCountForElimination: '',
    // Yıldız Rating Aralıkları
    minStarRating: '',
    maxStarRating: '',
    // Lig Dönemleri
    leagueStartDate: '',
    leagueEndDate: '',
    // Maç Formatı
    gamesPerSet: '',
    setsCount: '',
    gameTiebreakPoints: '',
    matchTiebreakPoints: '',
    // Teklif Kuralları
    offerResponseDays: '',
    matchCompletionDays: '',
    postMatchCooldownHoursLoser: '',
    postMatchCooldownHoursWinner: '',
    consecutiveWOLimit: '',
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await api.get('/league/all');
      setLeagues(response.data.data || []);
    } catch (error) {
      console.error('Leagues fetch error:', error);
      alert('Ligler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLeague(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        icon: 'trophy',
        leagueDescription: '',
        rewards: '',
        minAge: '',
        maxAge: '',
        registrationFee: '',
        minMatchCountForElimination: '',
        minStarRating: '',
        maxStarRating: '',
        leagueStartDate: '',
        leagueEndDate: '',
        gamesPerSet: '',
        setsCount: '',
        gameTiebreakPoints: '',
        matchTiebreakPoints: '',
        offerResponseDays: '',
        matchCompletionDays: '',
        postMatchCooldownHoursLoser: '',
        postMatchCooldownHoursWinner: '',
        consecutiveWOLimit: '',
      });
    setShowModal(true);
  };

  const handleEdit = async (league: League) => {
    setEditingLeague(league);
    try {
      // Lig ayarlarını getir - query parameter ile
      const settingsResponse = await api.get(`/league/settings?leagueId=${league.id}`);
      const settings = settingsResponse.data.data;
      
      console.log('Settings response:', settings); // Debug için
      
      const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      
      setFormData({
        name: league.name,
        code: league.code,
        description: league.description || '',
        icon: league.icon || 'trophy',
        leagueDescription: settings?.leagueDescription || '',
        rewards: settings?.rewards || '',
        minAge: settings?.minAge != null ? String(settings.minAge) : '',
        maxAge: settings?.maxAge != null ? String(settings.maxAge) : '',
        registrationFee: settings?.registrationFee != null ? String(settings.registrationFee) : '',
        minMatchCountForElimination: settings?.minMatchCountForElimination != null ? String(settings.minMatchCountForElimination) : '',
        minStarRating: settings?.minStarRating != null ? String(settings.minStarRating) : '',
        maxStarRating: settings?.maxStarRating != null ? String(settings.maxStarRating) : '',
        leagueStartDate: formatDate(settings?.leagueStartDate),
        leagueEndDate: formatDate(settings?.leagueEndDate),
        gamesPerSet: settings?.gamesPerSet != null ? String(settings.gamesPerSet) : '',
        setsCount: settings?.setsCount != null ? String(settings.setsCount) : '',
        gameTiebreakPoints: settings?.gameTiebreakPoints != null ? String(settings.gameTiebreakPoints) : '',
        matchTiebreakPoints: settings?.matchTiebreakPoints != null ? String(settings.matchTiebreakPoints) : '',
        offerResponseDays: settings?.offerResponseDays != null ? String(settings.offerResponseDays) : '',
        matchCompletionDays: settings?.matchCompletionDays != null ? String(settings.matchCompletionDays) : '',
        postMatchCooldownHoursLoser: settings?.postMatchCooldownHoursLoser != null ? String(settings.postMatchCooldownHoursLoser) : '',
        postMatchCooldownHoursWinner: settings?.postMatchCooldownHoursWinner != null ? String(settings.postMatchCooldownHoursWinner) : '',
        consecutiveWOLimit: settings?.consecutiveWOLimit != null ? String(settings.consecutiveWOLimit) : '',
      });
    } catch (error: any) {
      console.error('Settings fetch error:', error);
      console.error('Error response:', error.response?.data);
      // Hata durumunda sadece lig bilgilerini yükle, settings boş kalsın
      setFormData({
        name: league.name,
        code: league.code,
        description: league.description || '',
        icon: league.icon || 'trophy',
        leagueDescription: '',
        rewards: '',
        minAge: '',
        maxAge: '',
        registrationFee: '',
        minMatchCountForElimination: '',
        minStarRating: '',
        maxStarRating: '',
        leagueStartDate: '',
        leagueEndDate: '',
        gamesPerSet: '',
        setsCount: '',
        gameTiebreakPoints: '',
        matchTiebreakPoints: '',
        offerResponseDays: '',
        matchCompletionDays: '',
        postMatchCooldownHoursLoser: '',
        postMatchCooldownHoursWinner: '',
        consecutiveWOLimit: '',
      });
      alert('Lig ayarları yüklenirken bir hata oluştu. Ayarlar boş görünebilir.');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeague) {
        await api.put(`/league/entity/${editingLeague.id}`, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          icon: formData.icon,
        });
        // Settings'i güncelle
        await api.put(`/league/settings/${editingLeague.id}`, {
          leagueDescription: formData.leagueDescription || null,
          rewards: formData.rewards || null,
          minAge: formData.minAge ? parseInt(formData.minAge) : null,
          maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
          minMatchCountForElimination: formData.minMatchCountForElimination ? parseInt(formData.minMatchCountForElimination) : undefined,
          minStarRating: formData.minStarRating ? parseFloat(formData.minStarRating) : null,
          maxStarRating: formData.maxStarRating ? parseFloat(formData.maxStarRating) : null,
          leagueStartDate: formData.leagueStartDate || undefined,
          leagueEndDate: formData.leagueEndDate || undefined,
          gamesPerSet: formData.gamesPerSet ? parseInt(formData.gamesPerSet) : undefined,
          setsCount: formData.setsCount ? parseInt(formData.setsCount) : undefined,
          gameTiebreakPoints: formData.gameTiebreakPoints ? parseInt(formData.gameTiebreakPoints) : undefined,
          matchTiebreakPoints: formData.matchTiebreakPoints ? parseInt(formData.matchTiebreakPoints) : undefined,
          offerResponseDays: formData.offerResponseDays ? parseInt(formData.offerResponseDays) : undefined,
          matchCompletionDays: formData.matchCompletionDays ? parseInt(formData.matchCompletionDays) : undefined,
          postMatchCooldownHoursLoser: formData.postMatchCooldownHoursLoser ? parseInt(formData.postMatchCooldownHoursLoser) : undefined,
          postMatchCooldownHoursWinner: formData.postMatchCooldownHoursWinner ? parseInt(formData.postMatchCooldownHoursWinner) : undefined,
          consecutiveWOLimit: formData.consecutiveWOLimit ? parseInt(formData.consecutiveWOLimit) : undefined,
        });
      } else {
        const leagueResponse = await api.post('/league/create', {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          icon: formData.icon,
        });
        const leagueId = leagueResponse.data.data.id;
        // Settings'i güncelle
        await api.put(`/league/settings/${leagueId}`, {
          leagueDescription: formData.leagueDescription || null,
          rewards: formData.rewards || null,
          minAge: formData.minAge ? parseInt(formData.minAge) : null,
          maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
          minMatchCountForElimination: formData.minMatchCountForElimination ? parseInt(formData.minMatchCountForElimination) : undefined,
          minStarRating: formData.minStarRating ? parseFloat(formData.minStarRating) : null,
          maxStarRating: formData.maxStarRating ? parseFloat(formData.maxStarRating) : null,
          leagueStartDate: formData.leagueStartDate || undefined,
          leagueEndDate: formData.leagueEndDate || undefined,
          gamesPerSet: formData.gamesPerSet ? parseInt(formData.gamesPerSet) : undefined,
          setsCount: formData.setsCount ? parseInt(formData.setsCount) : undefined,
          gameTiebreakPoints: formData.gameTiebreakPoints ? parseInt(formData.gameTiebreakPoints) : undefined,
          matchTiebreakPoints: formData.matchTiebreakPoints ? parseInt(formData.matchTiebreakPoints) : undefined,
          offerResponseDays: formData.offerResponseDays ? parseInt(formData.offerResponseDays) : undefined,
          matchCompletionDays: formData.matchCompletionDays ? parseInt(formData.matchCompletionDays) : undefined,
          postMatchCooldownHoursLoser: formData.postMatchCooldownHoursLoser ? parseInt(formData.postMatchCooldownHoursLoser) : undefined,
          postMatchCooldownHoursWinner: formData.postMatchCooldownHoursWinner ? parseInt(formData.postMatchCooldownHoursWinner) : undefined,
          consecutiveWOLimit: formData.consecutiveWOLimit ? parseInt(formData.consecutiveWOLimit) : undefined,
        });
      }
      setShowModal(false);
      fetchLeagues();
      alert(editingLeague ? 'Lig başarıyla güncellendi!' : 'Lig başarıyla oluşturuldu!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'İşlem başarısız oldu';
      alert(editingLeague ? `Lig güncellenirken hata oluştu: ${errorMessage}` : `Lig oluşturulurken hata oluştu: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ligi silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/league/entity/${id}`);
      fetchLeagues();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-soft-white">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-soft-white">Lig Yönetimi</h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-soft-green text-soft-navy rounded-xl font-semibold hover:bg-soft-green/90 transition-all"
          >
            <HiPlus className="text-xl" />
            Yeni Lig
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">Lig Adı</th>
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">Kod</th>
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">Açıklama</th>
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {leagues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-soft-white/60">
                      Henüz lig bulunmamaktadır
                    </td>
                  </tr>
                ) : (
                  leagues.map((league) => (
                    <tr key={league.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-soft-white/80">{league.id}</td>
                      <td className="py-3 px-4 text-soft-white font-medium">{league.name}</td>
                      <td className="py-3 px-4 text-soft-white/80">{league.code}</td>
                      <td className="py-3 px-4 text-soft-white/60 text-sm">
                        {league.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(league)}
                            className="p-2 text-soft-green hover:bg-soft-green/20 rounded-lg transition-all"
                            title="Düzenle"
                          >
                            <HiPencil />
                          </button>
                          <button
                            onClick={() => handleDelete(league.id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-all"
                            title="Sil"
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-soft-white mb-4">
              {editingLeague ? 'Lig Düzenle' : 'Yeni Lig Oluştur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-soft-white mb-2">Lig Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                  required
                />
              </div>
              <div>
                <label className="block text-soft-white mb-2">Kod</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                  required
                />
              </div>
              <div>
                <label className="block text-soft-white mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                  rows={3}
                />
              </div>

              {/* Icon Seçici */}
              <div>
                <label className="block text-soft-white mb-2">Lig İkonu</label>
                
                {/* Arama ve Kategori Filtreleri */}
                <div className="mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Icon ara... (örn: trophy, tennis, star)"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Tümü' },
                      { value: 'trophy', label: 'Ödüller' },
                      { value: 'sport', label: 'Spor' },
                      { value: 'social', label: 'Sosyal' },
                      { value: 'symbol', label: 'Semboller' },
                      { value: 'general', label: 'Genel' },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedIconCategory(cat.value)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          selectedIconCategory === cat.value
                            ? 'bg-soft-green text-soft-navy font-semibold'
                            : 'bg-white/10 text-soft-white hover:bg-white/20'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Listesi */}
                <div className="grid grid-cols-6 gap-2 p-4 bg-white/5 rounded-xl border border-white/10 max-h-96 overflow-y-auto">
                  {(() => {
                    // Filtreleme
                    let filteredIcons = ALL_MATERIAL_ICONS;
                    
                    // Kategori filtresi
                    if (selectedIconCategory !== 'all') {
                      filteredIcons = filteredIcons.filter(icon => icon.category === selectedIconCategory);
                    }
                    
                    // Arama filtresi
                    if (iconSearch.trim()) {
                      const searchLower = iconSearch.toLowerCase();
                      filteredIcons = filteredIcons.filter(icon => 
                        icon.name.toLowerCase().includes(searchLower)
                      );
                    }

                    return filteredIcons.map((icon) => {
                      const iconPath = getIconPath(icon.name);
                      return (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: icon.name })}
                          className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                            formData.icon === icon.name
                              ? 'border-soft-green bg-soft-green/20 scale-105'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                          title={icon.name}
                        >
                          {iconPath ? (
                            <svg 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24"
                              style={{ display: 'block' }}
                            >
                              <path 
                                d={iconPath} 
                                fill="#FFFFFF"
                                stroke="none"
                              />
                            </svg>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center text-xs text-soft-white/50 border border-white/20 rounded">
                              ?
                            </div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-soft-white/60 mt-2">
                  Seçilen icon: <span className="font-semibold text-soft-green">{formData.icon}</span>
                  <span className="ml-2">({(() => {
                    const filtered = ALL_MATERIAL_ICONS.filter(i => i.name === formData.icon);
                    return filtered.length > 0 ? filtered[0].category : 'genel';
                  })()} kategorisi - Mobil uygulamada MaterialCommunityIcons ile gösterilecek)</span>
                </p>
              </div>
              
              {/* Lig Açıklaması (Frontend'de gösterilecek) */}
              <div>
                <label className="block text-soft-white mb-2">Lig Açıklaması (Opsiyonel)</label>
                <textarea
                  value={formData.leagueDescription}
                  onChange={(e) => setFormData({ ...formData, leagueDescription: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                  rows={3}
                  placeholder="Bu açıklama frontend'de lig modal'ında gösterilecektir"
                />
              </div>

              {/* Ödüller */}
              <div>
                <label className="block text-soft-white mb-2">Ödüller (Opsiyonel)</label>
                <textarea
                  value={formData.rewards}
                  onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                  rows={4}
                  placeholder="Her satıra bir ödül yazın. Örn:&#10;Lig rozetleri&#10;Puan bonusları&#10;Özel ödüller"
                />
                <p className="text-xs text-soft-white/60 mt-1">Her satıra bir ödül yazın. Boş bırakılırsa ödüller alanı gösterilmez.</p>
              </div>

              {/* Yaş Aralıkları */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Yaş Aralıkları</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Minimum Yaş (Opsiyonel)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 18"
                    />
                    <p className="text-xs text-soft-white/60 mt-1">Sadece min yaş girilirse: 18+ (18 yaş üstü)</p>
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maksimum Yaş (Opsiyonel)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 24"
                    />
                    <p className="text-xs text-soft-white/60 mt-1">Her ikisi girilirse: 18-24 (sadece bu aralık)</p>
                  </div>
                </div>
              </div>

              {/* Katılım Bilgileri */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Katılım Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Kayıt Ücreti (₺)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 150"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Minimum Maç Sayısı (Eliminasyon için)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minMatchCountForElimination}
                      onChange={(e) => setFormData({ ...formData, minMatchCountForElimination: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 15"
                    />
                  </div>
                </div>
              </div>

              {/* Yıldız Rating Aralıkları */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Yıldız Rating Aralıkları (Opsiyonel)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Minimum Yıldız Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={formData.minStarRating}
                      onChange={(e) => setFormData({ ...formData, minStarRating: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maksimum Yıldız Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={formData.maxStarRating}
                      onChange={(e) => setFormData({ ...formData, maxStarRating: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 3.5"
                    />
                  </div>
                </div>
              </div>

              {/* Lig Dönemleri */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Lig Dönemleri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Lig Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={formData.leagueStartDate}
                      onChange={(e) => setFormData({ ...formData, leagueStartDate: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Lig Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={formData.leagueEndDate}
                      onChange={(e) => setFormData({ ...formData, leagueEndDate: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                    />
                  </div>
                </div>
              </div>

              {/* Maç Formatı */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Maç Formatı</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Set Başına Oyun Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.gamesPerSet}
                      onChange={(e) => setFormData({ ...formData, gamesPerSet: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 4"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Set Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.setsCount}
                      onChange={(e) => setFormData({ ...formData, setsCount: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 2"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Oyun Tiebreak Puanı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.gameTiebreakPoints}
                      onChange={(e) => setFormData({ ...formData, gameTiebreakPoints: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 7"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maç Tiebreak Puanı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.matchTiebreakPoints}
                      onChange={(e) => setFormData({ ...formData, matchTiebreakPoints: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 10"
                    />
                  </div>
                </div>
              </div>

              {/* Teklif Kuralları */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-soft-white mb-3">Teklif Kuralları</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-white mb-2">Teklif Yanıt Süresi (Gün)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.offerResponseDays}
                      onChange={(e) => setFormData({ ...formData, offerResponseDays: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 3"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maç Tamamlama Süresi (Gün)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.matchCompletionDays}
                      onChange={(e) => setFormData({ ...formData, matchCompletionDays: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 7"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maç Sonrası Bekleme Süresi Saati (Kaybeden)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.postMatchCooldownHoursLoser}
                      onChange={(e) => setFormData({ ...formData, postMatchCooldownHoursLoser: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 24"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Maç Sonrası Bekleme Süresi Saati (Kazanan)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.postMatchCooldownHoursWinner}
                      onChange={(e) => setFormData({ ...formData, postMatchCooldownHoursWinner: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 12"
                    />
                  </div>
                  <div>
                    <label className="block text-soft-white mb-2">Arka Arkaya Red Limiti</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.consecutiveWOLimit}
                      onChange={(e) => setFormData({ ...formData, consecutiveWOLimit: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
                      placeholder="Örn: 3"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-soft-white rounded-xl hover:bg-white/20 transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-soft-green text-soft-navy rounded-xl font-semibold hover:bg-soft-green/90 transition-all"
                >
                  {editingLeague ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Leagues;

