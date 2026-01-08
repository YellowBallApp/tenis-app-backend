import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { IoTennisball } from 'react-icons/io5';
import { HiClock, HiPencil, HiTrash, HiPause, HiBan, HiCalendar, HiUser } from 'react-icons/hi';
import { MdNoteAlt } from 'react-icons/md';
import Layout from '../components/Layout';
import api from '../utils/api';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

interface BlockedSlot {
  id: number;
  court: { id: number; name: string };
  startTime: string;
  endTime: string;
  reason?: string;
  isActive: boolean;
}

interface Court {
  id: number;
  name: string;
}

interface UserReservation {
  id: number;
  court: { id: number; name: string };
  user: { id: string; name: string; email: string };
  startTime: string;
  endTime: string;
  notes?: string;
  participants?: Array<{ id: string; name: string }>;
}

const Reservations = () => {
  const location = useLocation();
  const { user: currentAdminUser } = useAuth();
  
  // Route'a göre aktif tab'i belirle
  const getActiveTabFromRoute = (): 'blocked' | 'user-reservations' => {
    if (location.pathname === '/reservations/user-reservations') {
      return 'user-reservations';
    }
    return 'blocked';
  };
  
  const [activeTab, setActiveTab] = useState<'blocked' | 'user-reservations'>(getActiveTabFromRoute());
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<BlockedSlot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // User Reservations States
  const [userReservations, setUserReservations] = useState<UserReservation[]>([]);
  const [userReservationsLoading, setUserReservationsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<UserReservation | null>(null);
  const [reservationDate, setReservationDate] = useState<Date>(new Date());
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [blockedHours, setBlockedHours] = useState<{[courtId: number]: Array<{hour: number, reason: string | null}>}>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ]);
  const [reservationFormData, setReservationFormData] = useState({
    userId: '',
    courtId: '',
    startTime: '',
    participantIds: [] as string[],
    notes: '',
  });
  
  // Route değiştiğinde aktif tab'i güncelle
  useEffect(() => {
    const newActiveTab = getActiveTabFromRoute();
    setActiveTab(newActiveTab);
  }, [location.pathname]);
  const [formData, setFormData] = useState({
    courtId: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    startTime: '',
    endTime: '',
    selectedHours: [] as number[],
    selectedDays: [] as number[], // Haftanın günleri (0=Pazar, 1=Pazartesi, ..., 6=Cumartesi)
    reason: '',
  });

  // Müsait saatler (9:00 - 23:00)
  const availableHours = Array.from({ length: 15 }, (_, i) => i + 9);

  // Haftanın günleri
  const weekDays = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
  ];

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort((a, b) => a - b)
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Zaman dilimlerini yükle
  const loadTimeSlots = async () => {
    try {
      if (!selectedDate) {
        // Varsayılan saat dilimlerini kullan
        try {
          const response = await api.get('/reservation-time-slots/active');
          const defaultSlots = response.data.data.map((slot: any) => slot.time);
          setTimeSlots(defaultSlots.length > 0 ? defaultSlots : [
            '09:00', '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00',
            '19:00', '20:00', '21:00', '22:00', '23:00'
          ]);
        } catch (error) {
          console.error('Saat dilimleri yüklenirken hata:', error);
          setTimeSlots([
            '09:00', '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00',
            '19:00', '20:00', '21:00', '22:00', '23:00'
          ]);
        }
        return;
      }

      // Seçilen tarihin haftanın gününü hesapla
      // JavaScript: 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
      // Backend: 0 = Pazartesi, 1 = Salı, ..., 6 = Pazar
      const jsDayOfWeek = selectedDate.getDay();
      // Mapping: JS 0 (Pazar) -> Backend 6, JS 1 (Pazartesi) -> Backend 0, etc.
      const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;

      // Önce şablondan saat dilimlerini al
      try {
        const response = await api.get(`/reservation-templates/day/${dayOfWeek}/active`);
        const templateSlots = response.data.data;
        if (templateSlots && templateSlots.length > 0) {
          setTimeSlots(templateSlots);
          return;
        }
      } catch (error) {
        console.log('Şablon saat dilimleri alınamadı, varsayılan kullanılıyor:', error);
      }

      // Şablon yoksa, genel aktif saat dilimlerini kullan
      try {
        const response = await api.get('/reservation-time-slots/active');
        const defaultSlots = response.data.data.map((slot: any) => slot.time);
        setTimeSlots(defaultSlots.length > 0 ? defaultSlots : [
          '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00', '18:00',
          '19:00', '20:00', '21:00', '22:00', '23:00'
        ]);
      } catch (error) {
        console.error('Saat dilimleri yüklenirken hata:', error);
        setTimeSlots([
          '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00', '18:00',
          '19:00', '20:00', '21:00', '22:00', '23:00'
        ]);
      }
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
      setTimeSlots([
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00', '23:00'
      ]);
    }
  };

  useEffect(() => {
    if (activeTab === 'user-reservations') {
      loadTimeSlots();
      fetchUserReservations();
      fetchUsers();
      fetchBlockedHours();
    }
  }, [activeTab, selectedDate]);
  
  const fetchBlockedHours = async () => {
    if (!selectedDate || courts.length === 0) {
      return;
    }
    
    try {
      const blockedHoursMap: {[courtId: number]: Array<{hour: number, reason: string | null}>} = {};
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const promises = courts.map(async (court) => {
        try {
          const response = await api.get(`/reservations/blocked-hours?courtId=${court.id}&date=${dateStr}`);
          blockedHoursMap[court.id] = response.data.data || [];
        } catch (error) {
          console.error(`Kort ${court.id} için bloke saatler yüklenirken hata:`, error);
          blockedHoursMap[court.id] = [];
        }
      });
      
      await Promise.all(promises);
      setBlockedHours(blockedHoursMap);
    } catch (error) {
      console.error('Bloke edilmiş saatler yüklenirken hata:', error);
    }
  };
  
  const getReservationForSlot = (courtId: number, timeSlot: string) => {
    return userReservations.find(reservation => {
      const reservationTime = new Date(reservation.startTime);
      const hours = reservationTime.getHours();
      const minutes = reservationTime.getMinutes();
      const reservationTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return reservation.court.id === courtId && reservationTimeStr === timeSlot;
    });
  };
  
  const isTimeSlotBlocked = (courtId: number, timeSlot: string): boolean => {
    const blocked = blockedHours[courtId] || [];
    const hour = parseInt(timeSlot.split(':')[0]);
    return blocked.some(bh => bh.hour === hour);
  };
  
  const getBlockedReason = (courtId: number, timeSlot: string): string | null => {
    const blocked = blockedHours[courtId] || [];
    const hour = parseInt(timeSlot.split(':')[0]);
    const blockedHour = blocked.find(bh => bh.hour === hour);
    return blockedHour ? blockedHour.reason : null;
  };
  
  const handleCreateReservationFromGrid = (courtId: number, timeSlot: string) => {
    setEditingReservation(null);
    setReservationDate(selectedDate);
    setParticipantSearchQuery('');
    setReservationFormData({
      userId: '',
      courtId: courtId.toString(),
      startTime: timeSlot,
      participantIds: [],
      notes: '',
    });
    setShowReservationModal(true);
  };

  const renderCell = (courtId: number, timeSlot: string) => {
    const reservation = getReservationForSlot(courtId, timeSlot);
    const isBlocked = isTimeSlotBlocked(courtId, timeSlot);
    const blockedReason = getBlockedReason(courtId, timeSlot);
    
    if (reservation) {
      return (
        <div className="w-full bg-soft-green/20 rounded-lg p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-soft-green/30 transition-colors group relative"
             onClick={() => handleEditReservation(reservation)}>
          <HiUser className="text-soft-green text-sm" />
          <span className="text-xs font-semibold text-soft-green text-center">{reservation.user.name}</span>
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditReservation(reservation);
              }}
              className="p-1 bg-soft-green/80 hover:bg-soft-green rounded text-white text-xs"
              title="Düzenle"
            >
              <HiPencil className="text-xs" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteReservation(reservation.id);
              }}
              className="p-1 bg-red-500/80 hover:bg-red-500 rounded text-white text-xs"
              title="Sil"
            >
              <HiTrash className="text-xs" />
            </button>
          </div>
        </div>
      );
    }
    
    if (isBlocked) {
      return (
        <div className="w-full bg-red-500/20 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
          <HiBan className="text-red-400 text-sm" />
          <span className="text-xs font-semibold text-red-400 text-center">{blockedReason || 'Bloke'}</span>
        </div>
      );
    }
    
    return (
      <div 
        className="w-full bg-slate-700/50 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:bg-slate-600/50 transition-colors"
        onClick={() => handleCreateReservationFromGrid(courtId, timeSlot)}
        title="Yeni rezervasyon oluşturmak için tıklayın"
      >
        <span className="text-xs text-slate-400 italic">Boş</span>
      </div>
    );
  };

  const fetchData = async () => {
    try {
      const [blockedRes, courtsRes] = await Promise.all([
        api.get('/admin/blocked-time-slots'),
        api.get('/courts'),
      ]);
      setBlockedSlots(blockedRes.data.data || []);
      setCourts(courtsRes.data.data || []);
    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReservations = async () => {
    try {
      setUserReservationsLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await api.get(`/reservations?date=${dateStr}`);
      setUserReservations(response.data.data || []);
    } catch (error) {
      console.error('User reservations fetch error:', error);
      setUserReservations([]);
    } finally {
      setUserReservationsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      // Kullanıcıları alfabetik olarak sırala (isim bazında)
      const sortedUsers = (response.data.data || []).sort((a: any, b: any) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'tr');
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };
  
  // Filtrelenmiş katılımcılar listesi
  const filteredParticipants = users.filter(u => {
    if (u.id === reservationFormData.userId) return false;
    if (!participantSearchQuery) return true;
    const query = participantSearchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(query) || 
           (u.email || '').toLowerCase().includes(query);
  });

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/reservations/${id}`);
      fetchUserReservations();
      alert('Rezervasyon başarıyla silindi');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };


  const handleEditReservation = (reservation: UserReservation) => {
    const startTime = new Date(reservation.startTime);
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const reservationTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Grid'deki saat dilimlerinden birine eşleştir
    // Eğer tam eşleşme yoksa, en yakın saati bul
    let selectedTime = timeSlots.find(slot => slot === reservationTimeStr);
    if (!selectedTime) {
      // En yakın saati bul (sadece saat bazında, dakika yok sayılır)
      const reservationHour = hours;
      selectedTime = timeSlots.find(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour === reservationHour;
      });
      // Eğer hala bulunamazsa, ilk saati kullan
      if (!selectedTime) {
        selectedTime = timeSlots[0];
      }
    }
    
    setEditingReservation(reservation);
    setReservationDate(new Date(reservation.startTime));
    setParticipantSearchQuery('');
    setReservationFormData({
      userId: reservation.user.id,
      courtId: reservation.court.id.toString(),
      startTime: selectedTime,
      participantIds: reservation.participants?.map(p => p.id) || [],
      notes: reservation.notes || '',
    });
    setShowReservationModal(true);
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!reservationFormData.userId || !reservationFormData.courtId || !reservationFormData.startTime) {
        alert('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      // Düzenleme modunda seçilen tarih, yeni oluşturmada selectedDate
      const selectedReservationDate = editingReservation 
        ? format(reservationDate, 'yyyy-MM-dd')
        : format(selectedDate, 'yyyy-MM-dd');

      const startDateTime = new Date(`${selectedReservationDate}T${reservationFormData.startTime}`);
      // Bitiş zamanını başlangıç + 1 saat olarak hesapla (varsayılan)
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      if (endDateTime <= startDateTime) {
        alert('Bitiş saati başlangıç saatinden sonra olmalıdır');
        return;
      }

      if (editingReservation) {
        // Güncelleme
        const payload: any = {
          courtId: parseInt(reservationFormData.courtId),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          participantIds: reservationFormData.participantIds,
          notes: reservationFormData.notes,
        };
        
        // Admin için kullanıcı değişikliği
        if (reservationFormData.userId && reservationFormData.userId !== editingReservation.user.id) {
          payload.userId = reservationFormData.userId;
        }

        await api.put(`/reservations/${editingReservation.id}`, payload);
        alert('Rezervasyon başarıyla güncellendi');
      } else {
        // Oluşturma
        // Eğer katılımcı seçilmemişse, admin kullanıcısını varsayılan katılımcı olarak ekle
        let participantIds = reservationFormData.participantIds;
        if (participantIds.length === 0 && currentAdminUser && currentAdminUser.id !== reservationFormData.userId) {
          participantIds = [currentAdminUser.id];
        }
        
        const payload = {
          userId: reservationFormData.userId, // Admin için özel alan - backend'de kontrol ediliyor
          courtId: parseInt(reservationFormData.courtId),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          participantIds: participantIds,
          notes: reservationFormData.notes,
        };

        await api.post('/reservations', payload);
        alert('Rezervasyon başarıyla oluşturuldu');
      }
      
      setShowReservationModal(false);
      setParticipantSearchQuery('');
      fetchUserReservations();
    } catch (error: any) {
      alert(error.response?.data?.message || (editingReservation ? 'Rezervasyon güncellenirken bir hata oluştu' : 'Rezervasyon oluşturulurken bir hata oluştu'));
    }
  };

  const handleCreate = () => {
    setEditingSlot(null);
    setFormData({
      courtId: '',
      startDate: undefined,
      endDate: undefined,
      startTime: '',
      endTime: '',
      selectedHours: [],
      selectedDays: [],
      reason: '',
    });
    setShowModal(true);
  };

  const handleEdit = (slot: BlockedSlot) => {
    setEditingSlot(slot);
    const startDateTime = new Date(slot.startTime);
    const endDateTime = new Date(slot.endTime);
    
    setFormData({
      courtId: slot.court.id.toString(),
      startDate: startDateTime,
      endDate: endDateTime,
      startTime: startDateTime.toTimeString().slice(0, 5), // HH:mm format
      endTime: endDateTime.toTimeString().slice(0, 5),
      selectedHours: [],
      selectedDays: [],
      reason: slot.reason || '',
    });
    setShowModal(true);
  };

  const toggleHour = (hour: number) => {
    setFormData(prev => ({
      ...prev,
      selectedHours: prev.selectedHours.includes(hour)
        ? prev.selectedHours.filter(h => h !== hour)
        : [...prev.selectedHours, hour].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSlot) {
        // Validations
        if (!formData.startDate || !formData.endDate) {
          alert('Lütfen tarih ve saat seçin');
          return;
        }

        if (!formData.startTime || !formData.endTime) {
          alert('Lütfen saat seçin');
          return;
        }

        // Combine date and time
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);
        
        const startDateTime = new Date(formData.startDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(formData.endDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        // Bitiş zamanı başlangıçtan önce olamaz
        if (endDateTime <= startDateTime) {
          alert('Bitiş zamanı başlangıç zamanından sonra olmalıdır');
          return;
        }
        
        const payload = {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          reason: formData.reason,
        };
        await api.put(`/admin/blocked-time-slots/${editingSlot.id}`, payload);
      } else {
        if (formData.selectedHours.length === 0) {
          alert('Lütfen en az bir saat seçin');
          return;
        }

        if (!formData.startDate || !formData.endDate) {
          alert('Lütfen başlangıç ve bitiş tarihlerini seçin');
          return;
        }

        // Bitiş tarihi başlangıçtan önce olamaz
        if (formData.endDate < formData.startDate) {
          alert('Bitiş tarihi başlangıç tarihinden önce olamaz');
          return;
        }

        const payload = {
          courtId: parseInt(formData.courtId),
          startDate: format(formData.startDate, 'yyyy-MM-dd'),
          endDate: format(formData.endDate, 'yyyy-MM-dd'),
          hours: formData.selectedHours,
          reason: formData.reason,
          daysOfWeek: formData.selectedDays.length > 0 ? formData.selectedDays : undefined,
        };

        const response = await api.post('/admin/blocked-time-slots/bulk', payload);
        alert(`${response.data.data.created} adet zaman dilimi başarıyla bloke edildi`);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu bloklamayı kaldırmak istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/admin/blocked-time-slots/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleToggleActive = async (slot: BlockedSlot) => {
    try {
      await api.put(`/admin/blocked-time-slots/${slot.id}`, {
        isActive: !slot.isActive,
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="glass-strong rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soft-green mx-auto mb-4"></div>
            <p className="text-soft-white/80">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
            {/* Title Section */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-soft-white mb-1 md:mb-2">
                {activeTab === 'blocked' 
                  ? 'Rezervasyon Saatleri Yönetimi'
                  : 'Kullanıcı Rezervasyonları'
                }
              </h1>
              <p className="text-sm md:text-base text-soft-white/70">
                {activeTab === 'blocked' 
                  ? `Toplam ${blockedSlots.length} bloke edilmiş saat`
                  : `${selectedDate.toLocaleDateString('tr-TR')} tarihinde ${userReservations.length} rezervasyon`
                }
              </p>
            </div>

            {/* Actions Section */}
            {activeTab === 'blocked' && (
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {/* View Toggle */}
                <div className="glass rounded-xl p-1 flex space-x-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2 md:px-3 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-slate-700 text-soft-white font-bold shadow-lg'
                        : 'text-soft-white/70 hover:text-soft-white'
                    }`}
                    title="Kare Görünüm"
                    aria-label="Grid görünüm"
                  >
                    <LayoutGrid size={18} className="md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-2 md:px-3 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-slate-600 text-soft-white font-bold shadow-lg'
                        : 'text-soft-white/70 hover:text-soft-white'
                    }`}
                    title="Liste Görünüm"
                    aria-label="Liste görünüm"
                  >
                    <List size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Block Hour Button */}
                <button
                  onClick={handleCreate}
                  className="px-4 md:px-6 py-2 md:py-3 bg-soft-green hover:bg-soft-green-light text-soft-navy font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-soft-green/50 text-sm md:text-base whitespace-nowrap"
                >
                  + Saat Bloke Et
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Blocked Slots Tab Content */}
        {activeTab === 'blocked' && (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-strong rounded-2xl p-6 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center text-2xl">
                      <IoTennisball className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-soft-white font-bold text-lg">{slot.court.name}</h3>
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                        slot.isActive 
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-600 text-white'
                      } mt-1`}>
                        {slot.isActive ? <><HiBan className="inline mr-1" /> Aktif</> : <><HiPause className="inline mr-1" /> Pasif</>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div className="space-y-3 mb-4">
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                      <HiClock className="text-sm" />
                      <span className="text-xs text-soft-white/60">Başlangıç</span>
                    </div>
                    <span className="text-soft-white font-medium">
                      {new Date(slot.startTime).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                      <HiClock className="text-sm" />
                      <span className="text-xs text-soft-white/60">Bitiş</span>
                    </div>
                    <span className="text-soft-white font-medium">
                      {new Date(slot.endTime).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  {slot.reason && (
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                        <MdNoteAlt className="text-sm" />
                        <span className="text-xs text-soft-white/60">Neden</span>
                      </div>
                      <span className="text-soft-white/90 text-sm">{slot.reason}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleToggleActive(slot)}
                    className={`flex-1 px-3 py-2 glass hover:bg-soft-purple/20 hover:border-soft-purple text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all duration-300 text-sm hover:shadow-lg`}
                  >
                    {slot.isActive ? '⏸️ Pasifleştir' : '▶️ Aktifleştir'}
                  </button>
                  <button
                    onClick={() => handleEdit(slot)}
                    className="flex-1 px-3 py-2 glass hover:bg-soft-green/20 hover:border-soft-green text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all duration-300 text-sm hover:shadow-lg"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="flex-1 px-3 py-2 glass hover:bg-red-500/20 hover:border-red-400 text-soft-white/80 hover:text-red-200 font-medium rounded-lg transition-all duration-300 text-sm hover:shadow-lg"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="glass-strong border-b border-white/10">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kort
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Başlangıç
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Bitiş
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Neden
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blockedSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-600 flex items-center justify-center text-lg md:text-xl flex-shrink-0">
                            🎾
                          </div>
                          <div className="text-sm font-bold text-soft-white">{slot.court.name}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-soft-white/80">
                          {new Date(slot.startTime).toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-soft-white/80">
                          {new Date(slot.endTime).toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 max-w-[150px]">
                        <div className="text-xs md:text-sm text-soft-white/80 truncate">{slot.reason || '-'}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className={`px-2 md:px-3 py-1 text-xs font-bold rounded-full ${
                          slot.isActive 
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-600 text-white'
                        }`}>
                          {slot.isActive ? '🚫 Aktif' : '⏸️ Pasif'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(slot)}
                            className={`transition-colors text-lg ${
                              slot.isActive ? 'text-slate-300 hover:text-slate-300-light' : 'text-slate-300 hover:text-slate-300-light'
                            }`}
                            title={slot.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            {slot.isActive ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => handleEdit(slot)}
                            className="text-slate-300 hover:text-slate-300-light transition-colors text-lg"
                            title="Düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="text-soft-white/70 hover:text-soft-white transition-colors text-lg"
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {blockedSlots.length === 0 && (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-soft-white/60 text-lg">Bloke edilmiş zaman dilimi bulunmuyor</p>
          </div>
        )}
          </>
        )}

        {/* User Reservations Tab Content */}
        {activeTab === 'user-reservations' && (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="glass-strong rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-center">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <label className="text-sm font-medium text-soft-white/90 whitespace-nowrap">
                    Tarih Seç:
                  </label>
                  <div className="w-full sm:w-auto">
                    <DatePicker
                      date={selectedDate}
                      onDateChange={(date) => date && setSelectedDate(date)}
                      placeholder="Tarih seçin"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-soft-white/60">
                  💡 Yeni rezervasyon oluşturmak için grid'deki boş hücrelere tıklayın
                </p>
              </div>
            </div>

            {/* Reservations Grid */}
            {userReservationsLoading ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soft-green mx-auto mb-4"></div>
                <p className="text-soft-white/80">Yükleniyor...</p>
              </div>
            ) : (
              <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Table Header */}
                    <div className="flex bg-soft-green border-b border-white/20">
                      <div className="w-24 p-4 bg-slate-700/50 border-r border-white/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-soft-white">Saat</span>
                      </div>
                      {courts.map(court => (
                        <div key={court.id} className="flex-1 min-w-[120px] p-4 border-r border-white/10 last:border-r-0 flex flex-col items-center justify-center gap-2">
                          <IoTennisball className="text-white text-lg" />
                          <span className="text-sm font-bold text-white text-center">{court.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Table Body */}
                    <div className="max-h-[600px] overflow-y-auto">
                      {timeSlots.map(timeSlot => (
                        <div key={timeSlot} className="flex border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">
                          <div className="w-24 p-4 bg-slate-800/50 border-r border-white/10 flex items-center justify-center gap-2">
                            <HiClock className="text-soft-green text-sm" />
                            <span className="text-sm font-semibold text-soft-green">{timeSlot}</span>
                          </div>
                          {courts.map(court => (
                            <div key={`${court.id}-${timeSlot}`} className="flex-1 min-w-[120px] p-2 border-r border-white/10 last:border-r-0">
                              {renderCell(court.id, timeSlot)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Legend */}
            <div className="glass-strong rounded-2xl p-4">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-soft-green/20 border border-soft-green/50"></div>
                  <span className="text-sm text-soft-white">Rezerve</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-700/50 border border-slate-600"></div>
                  <span className="text-sm text-soft-white">Boş</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/20 border border-red-400/50"></div>
                  <span className="text-sm text-soft-white">Bloke</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Modal */}
        {showReservationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingReservation ? '✏️ Rezervasyon Düzenle' : '➕ Yeni Rezervasyon Oluştur'}
              </h3>
              <form onSubmit={handleSubmitReservation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kullanıcı *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={reservationFormData.userId}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, userId: e.target.value })}
                  >
                    <option value="">Kullanıcı seçiniz</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kort *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={reservationFormData.courtId}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, courtId: e.target.value })}
                  >
                    <option value="">Kort seçiniz</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Tarih *
                  </label>
                  <DatePicker
                    date={editingReservation ? reservationDate : selectedDate}
                    onDateChange={(date) => {
                      if (date) {
                        if (editingReservation) {
                          setReservationDate(date);
                        } else {
                          setSelectedDate(date);
                        }
                      }
                    }}
                    placeholder="Tarih seçin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Rezervasyon Saati *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={reservationFormData.startTime}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, startTime: e.target.value })}
                  >
                    <option value="">Saat seçiniz</option>
                    {timeSlots.map((timeSlot) => (
                      <option key={timeSlot} value={timeSlot}>
                        {timeSlot}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  // Yeni rezervasyon oluştururken veya düzenleme modunda katılımcı varsa göster
                  const shouldShowParticipants = !editingReservation || 
                    (editingReservation.participants && editingReservation.participants.length > 0);
                  
                  if (!shouldShowParticipants) return null;
                  
                  // Yeni rezervasyon için kullanıcı seçilmiş olmalı ve başka kullanıcılar olmalı
                  if (!editingReservation && (!reservationFormData.userId || users.filter(u => u.id !== reservationFormData.userId).length === 0)) {
                    return null;
                  }
                  
                  return (
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Katılımcılar {editingReservation ? '(Düzenlenebilir)' : '(Opsiyonel)'}
                      </label>
                      <input
                        type="text"
                        placeholder="Katılımcı ara..."
                        className="glass w-full px-4 py-2 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all mb-2"
                        value={participantSearchQuery}
                        onChange={(e) => setParticipantSearchQuery(e.target.value)}
                      />
                      <select
                        multiple
                        className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all min-h-[100px]"
                        value={reservationFormData.participantIds}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setReservationFormData({ ...reservationFormData, participantIds: selected });
                        }}
                      >
                        {filteredParticipants.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-soft-white/60 mt-2">
                        Birden fazla katılımcı seçmek için Ctrl (Windows) veya Cmd (Mac) tuşuna basılı tutun
                      </p>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Notlar (Opsiyonel)
                  </label>
                  <textarea
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    rows={3}
                    value={reservationFormData.notes}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, notes: e.target.value })}
                    placeholder="Rezervasyon notları..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReservationModal(false);
                      setParticipantSearchQuery('');
                    }}
                    className="flex-1 px-4 py-3 glass hover:bg-white/10 text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-soft-green hover:bg-soft-green/80 text-white font-medium rounded-lg transition-all"
                  >
                    {editingReservation ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingSlot ? '✏️ Bloklama Düzenle' : '➕ Yeni Saat Bloklama'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kort *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.courtId}
                    onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                    disabled={!!editingSlot}
                  >
                    <option value="">Seçiniz</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingSlot && (
                  <>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                        <HiCalendar className="text-soft-green" />
                        <span>Başlangıç Tarihi *</span>
                      </label>
                      <DatePicker
                        date={formData.startDate}
                        onDateChange={(date) => {
                          // Eğer bitiş tarihi başlangıçtan önceyse, bitiş tarihini başlangıca eşitle
                          const newEndDate = formData.endDate && date && formData.endDate < date
                            ? date
                            : formData.endDate;
                          setFormData({ ...formData, startDate: date, endDate: newEndDate });
                        }}
                        placeholder="Başlangıç tarihi seçin"
                        minDate={new Date()}
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                        <HiCalendar className="text-soft-purple" />
                        <span>Bitiş Tarihi *</span>
                      </label>
                      <DatePicker
                        date={formData.endDate}
                        onDateChange={(date) => setFormData({ ...formData, endDate: date })}
                        placeholder="Bitiş tarihi seçin"
                        minDate={formData.startDate || new Date()}
                        disabled={!formData.startDate}
                      />
                      <p className="text-xs text-soft-white/60 mt-2">
                        {formData.selectedDays.length > 0 
                          ? 'Not: Seçilen saatler, sadece seçilen günler için bloke edilecektir'
                          : 'Not: Seçilen saatler, bu tarih aralığındaki her gün için bloke edilecektir'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Haftanın Günleri (Opsiyonel)
                      </label>
                      <p className="text-xs text-soft-white/60 mb-3">
                        Eğer gün seçilmezse, tüm günler için bloklama yapılır. Gün seçilirse, sadece seçilen günler için bloklama yapılır.
                      </p>
                      <div className="glass rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {weekDays.map((day) => (
                            <label
                              key={day.value}
                              className={`flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg transition-all duration-300 ${
                                formData.selectedDays.includes(day.value)
                                  ? 'bg-gradient-to-r from-soft-purple to-soft-purple-light text-soft-navy font-bold shadow-lg'
                                  : 'glass-strong hover:glass text-soft-white/80'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.selectedDays.includes(day.value)}
                                onChange={() => toggleDay(day.value)}
                                className="hidden"
                              />
                              <span className="text-sm font-medium">
                                {day.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {formData.selectedDays.length > 0 && (
                        <p className="text-sm text-slate-300 mb-3">
                          ✓ {formData.selectedDays.length} gün seçildi: {formData.selectedDays.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Bloke Edilecek Saatler *
                      </label>
                      <p className="text-xs text-soft-white/60 mb-3">
                        {formData.selectedDays.length > 0
                          ? 'Seçilen saatler, belirtilen tarih aralığındaki seçili günler için bloke edilecektir'
                          : 'Seçilen saatler, belirtilen tarih aralığındaki her gün için bloke edilecektir'
                        }
                      </p>
                      <div className="glass rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {availableHours.map((hour) => (
                            <label
                              key={hour}
                              className={`flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg transition-all duration-300 ${
                                formData.selectedHours.includes(hour)
                                  ? 'bg-gradient-to-r from-soft-purple to-soft-purple-light text-soft-navy font-bold shadow-lg'
                                  : 'glass-strong hover:glass text-soft-white/80'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.selectedHours.includes(hour)}
                                onChange={() => toggleHour(hour)}
                                className="hidden"
                              />
                              <span className="text-sm font-medium">
                                {hour.toString().padStart(2, '0')}:00
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {formData.selectedHours.length > 0 && (
                        <p className="text-sm text-slate-300 mt-2">
                          ✓ {formData.selectedHours.length} saat seçildi: {formData.selectedHours.map(h => `${h}:00`).join(', ')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {editingSlot && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                          <HiCalendar className="text-soft-green" />
                          <span>Başlangıç Tarihi *</span>
                        </label>
                        <DatePicker
                          date={formData.startDate}
                          onDateChange={(date) => setFormData({ ...formData, startDate: date })}
                          placeholder="Tarih seçin"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                          <HiClock className="text-soft-green" />
                          <span>Başlangıç Saati *</span>
                        </label>
                        <input
                          type="time"
                          required
                          className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all hover:border-soft-purple/50"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                          <HiCalendar className="text-soft-purple" />
                          <span>Bitiş Tarihi *</span>
                        </label>
                        <DatePicker
                          date={formData.endDate}
                          onDateChange={(date) => setFormData({ ...formData, endDate: date })}
                          placeholder="Tarih seçin"
                          minDate={formData.startDate}
                          disabled={!formData.startDate}
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-soft-white/90 mb-2">
                          <HiClock className="text-soft-purple" />
                          <span>Bitiş Saati *</span>
                        </label>
                        <input
                          type="time"
                          required
                          className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all hover:border-soft-purple/50"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Neden
                  </label>
                  <textarea
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all resize-none"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Bloklama nedeni (opsiyonel)"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 glass hover:bg-red-500/20 hover:border-red-400 text-soft-white/80 hover:text-red-200 font-medium rounded-lg transition-all hover:shadow-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-soft-green hover:bg-soft-green-light text-soft-navy font-bold rounded-lg hover:scale-105 transition-all shadow-lg hover:shadow-soft-green/50"
                  >
                    {editingSlot ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reservations;
