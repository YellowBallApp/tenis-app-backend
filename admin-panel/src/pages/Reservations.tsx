import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { IoTennisball } from 'react-icons/io5';
import { HiClock, HiPencil, HiTrash, HiPause, HiPlay, HiBan, HiCalendar, HiUser, HiUsers } from 'react-icons/hi';
import { MdNoteAlt } from 'react-icons/md';
import Layout from '../components/Layout';
import api from '../utils/api';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

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
  const navigate = useNavigate();
  
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

  useEffect(() => {
    if (activeTab === 'user-reservations') {
      fetchUserReservations();
    }
  }, [activeTab, selectedDate]);

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
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-soft-white mb-2">
                {activeTab === 'blocked' 
                  ? 'Rezervasyon Saatleri Yönetimi'
                  : 'Kullanıcı Rezervasyonları'
                }
              </h1>
              <p className="text-soft-white/70">
                {activeTab === 'blocked' 
                  ? `Toplam ${blockedSlots.length} bloke edilmiş saat`
                  : `${selectedDate.toLocaleDateString('tr-TR')} tarihinde ${userReservations.length} rezervasyon`
                }
              </p>
            </div>
            {activeTab === 'blocked' && (
              <div className="flex space-x-3">
                {/* View Toggle */}
                <div className="glass rounded-xl p-1 flex space-x-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-slate-700 text-soft-white font-bold shadow-lg'
                        : 'text-soft-white/70 hover:text-soft-white'
                    }`}
                    title="Kare Görünüm"
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-slate-600 text-soft-white font-bold shadow-lg'
                        : 'text-soft-white/70 hover:text-soft-white'
                    }`}
                    title="Liste Görünüm"
                  >
                    <List size={20} />
                  </button>
                </div>
                <button
                  onClick={handleCreate}
                  className="px-6 py-3 bg-soft-green hover:bg-soft-green-light text-soft-navy font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-soft-green/50"
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
              <table className="w-full">
                <thead className="glass-strong border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kort
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Başlangıç
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Bitiş
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Neden
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blockedSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-xl">
                            🎾
                          </div>
                          <div className="text-sm font-bold text-soft-white">{slot.court.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-soft-white/80">
                          {new Date(slot.startTime).toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-soft-white/80">
                          {new Date(slot.endTime).toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-soft-white/80 truncate">{slot.reason || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          slot.isActive 
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-600 text-white'
                        }`}>
                          {slot.isActive ? '🚫 Aktif' : '⏸️ Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(slot)}
                        className={`mr-3 transition-colors ${
                          slot.isActive ? 'text-slate-300 hover:text-slate-300-light' : 'text-slate-300 hover:text-slate-300-light'
                        }`}
                        >
                          {slot.isActive ? '⏸️' : '▶️'}
                        </button>
                      <button
                        onClick={() => handleEdit(slot)}
                        className="text-slate-300 hover:text-slate-300-light mr-3 transition-colors"
                      >
                        ✏️
                      </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-soft-white/70 hover:text-soft-white transition-colors"
                        >
                          🗑️
                        </button>
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
            <div className="glass-strong rounded-2xl p-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-soft-white/90">
                  Tarih Seç:
                </label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => date && setSelectedDate(date)}
                  placeholder="Tarih seçin"
                />
              </div>
            </div>

            {/* Reservations List */}
            {userReservationsLoading ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soft-green mx-auto mb-4"></div>
                <p className="text-soft-white/80">Yükleniyor...</p>
              </div>
            ) : userReservations.length === 0 ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <p className="text-soft-white/60 text-lg">
                  {format(selectedDate, 'dd.MM.yyyy')} tarihinde rezervasyon bulunmuyor
                </p>
              </div>
            ) : (
              <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="glass-strong border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Kort
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Başlangıç
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Bitiş
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Katılımcılar
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Notlar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {userReservations.map((reservation) => {
                        const startTime = new Date(reservation.startTime);
                        const endTime = new Date(reservation.endTime);
                        const isActive = endTime > new Date();
                        
                        return (
                          <tr key={reservation.id} className="hover:bg-white/5 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-xl">
                                  🎾
                                </div>
                                <div className="text-sm font-bold text-soft-white">{reservation.court.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <HiUser className="text-soft-green text-lg" />
                                <div>
                                  <div className="text-sm font-medium text-soft-white">{reservation.user.name}</div>
                                  <div className="text-xs text-soft-white/60">{reservation.user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-soft-white/80">
                                {startTime.toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-soft-white/80">
                                {endTime.toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {reservation.participants && reservation.participants.length > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <HiUsers className="text-soft-purple text-lg" />
                                  <div className="text-sm text-soft-white/80">
                                    {reservation.participants.map(p => p.name).join(', ')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-soft-white/60">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                isActive 
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {isActive ? '✓ Aktif' : '✗ Tamamlandı'}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <div className="text-sm text-soft-white/80 truncate" title={reservation.notes || ''}>
                                {reservation.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
