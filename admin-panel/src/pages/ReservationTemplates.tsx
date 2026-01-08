import { useEffect, useState } from 'react';
import { HiClock, HiPencil, HiTrash, HiPlus, HiCheck, HiX } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';

interface TimeSlot {
  id?: number;
  dayOfWeek: number;
  time: string;
  order: number;
  isActive: boolean;
}

const weekDays = [
  { value: 0, label: 'Pazartesi', short: 'Pzt' },
  { value: 1, label: 'Salı', short: 'Sal' },
  { value: 2, label: 'Çarşamba', short: 'Çar' },
  { value: 3, label: 'Perşembe', short: 'Per' },
  { value: 4, label: 'Cuma', short: 'Cum' },
  { value: 5, label: 'Cumartesi', short: 'Cmt' },
  { value: 6, label: 'Pazar', short: 'Paz' },
];

const ReservationTemplates = () => {
  const [templates, setTemplates] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0); // Pazartesi
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [newSlot, setNewSlot] = useState({ time: '', order: 1, isActive: true });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservation-templates');
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Templates fetch error:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const getTemplatesForDay = (dayOfWeek: number): TimeSlot[] => {
    return templates
      .filter(t => t.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.time.localeCompare(b.time)); // Sadece saate göre sırala (küçükten büyüğe)
  };

  const handleAddSlot = async () => {
    try {
      if (!newSlot.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newSlot.time)) {
        alert('Geçerli bir saat formatı giriniz (HH:mm)');
        return;
      }

      if (editingSlot?.id) {
        // Düzenleme: order'ı koru veya güncelle
        await api.put(`/reservation-templates/${editingSlot.id}`, {
          ...newSlot,
          dayOfWeek: selectedDay,
        });
        alert('Saat dilimi başarıyla güncellendi');
      } else {
        // Yeni ekleme: seçili günün mevcut saatlerinin en büyük order'ından +1
        const dayTemplates = getTemplatesForDay(selectedDay);
        const maxOrder = dayTemplates.length > 0 
          ? Math.max(...dayTemplates.map(t => t.order))
          : 0;
        
        await api.post('/reservation-templates', {
          ...newSlot,
          dayOfWeek: selectedDay,
          order: maxOrder + 1, // Her gün için ayrı order, 1'den başlar
        });
        alert('Saat dilimi başarıyla eklendi');
      }

      setShowAddModal(false);
      setEditingSlot(null);
      setNewSlot({ time: '', order: 1, isActive: true });
      await fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setNewSlot({ time: slot.time, order: slot.order, isActive: slot.isActive });
    setShowAddModal(true);
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('Bu saat dilimini silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/reservation-templates/${id}`);
      alert('Saat dilimi başarıyla silindi');
      await fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme başarısız');
    }
  };

  const handleToggleActive = (slot: TimeSlot) => {
    // Sadece local state'i güncelle, API çağrısı yapma
    setTemplates(prevTemplates => 
      prevTemplates.map(t => 
        t.id === slot.id 
          ? { ...t, isActive: !t.isActive }
          : t
      )
    );
  };

  const handleBulkSave = async () => {
    if (!confirm('Tüm değişiklikleri kaydetmek istediğinize emin misiniz?')) return;

    try {
      // Tüm günlerin şablonlarını al ve her gün için order'ı 1'den başlat
      const allTemplatesToSave: any[] = [];
      
      // Her gün için ayrı ayrı işle
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        const dayTemplates = templates
          .filter(t => t.dayOfWeek === dayOfWeek)
          .sort((a, b) => a.time.localeCompare(b.time)); // Sadece saate göre sırala (küçükten büyüğe)
        
        // Her gün için order'ı 1'den başlat
        dayTemplates.forEach((template, index) => {
          allTemplatesToSave.push({
            id: template.id,
            dayOfWeek: template.dayOfWeek,
            time: template.time,
            order: index + 1, // Her gün için 1'den başlar
            isActive: template.isActive,
          });
        });
      }

      await api.put('/reservation-templates/bulk/update', { templates: allTemplatesToSave });
      alert('Şablonlar başarıyla kaydedildi');
      await fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Kaydetme başarısız');
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
          <h1 className="text-2xl md:text-3xl font-bold text-soft-white mb-1 md:mb-2">
            Rezervasyon Şablonu Yönetimi
          </h1>
          <p className="text-sm md:text-base text-soft-white/70">
            Haftanın her günü için farklı saat dilimleri tanımlayabilirsiniz
          </p>
        </div>

        {/* Day Selector */}
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
            {weekDays.map((day) => {
              const dayTemplates = getTemplatesForDay(day.value);
              const activeCount = dayTemplates.filter(t => t.isActive).length;
              
              return (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`p-3 md:p-4 rounded-lg transition-all ${
                    selectedDay === day.value
                      ? 'bg-soft-green text-white shadow-lg scale-105'
                      : 'glass hover:bg-white/10 text-soft-white'
                  }`}
                >
                  <div className="font-bold text-base md:text-lg">{day.short}</div>
                  <div className="text-xs mt-1">
                    {activeCount} saat
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots for Selected Day */}
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold text-soft-white">
              {weekDays.find(d => d.value === selectedDay)?.label} Günü Saat Dilimleri
            </h2>
            <button
              onClick={() => {
                setEditingSlot(null);
                setNewSlot({ time: '', order: 1, isActive: true });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-soft-green hover:bg-soft-green/80 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap"
            >
              <HiPlus className="text-base md:text-lg" />
              <span>Saat Ekle</span>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getTemplatesForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8 text-soft-white/60">
                Bu gün için saat dilimi tanımlanmamış
              </div>
            ) : (
              getTemplatesForDay(selectedDay).map((slot, index) => (
                <div
                  key={slot.id || index}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleActive(slot)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        slot.isActive
                          ? 'bg-soft-green text-white'
                          : 'bg-slate-600 text-slate-400'
                      }`}
                      title={slot.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      {slot.isActive ? <HiCheck /> : <HiX />}
                    </button>
                    <HiClock className="text-soft-green text-lg" />
                    <span className="text-soft-white font-medium text-lg">{slot.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSlot(slot)}
                      className="p-2 text-soft-green hover:bg-soft-green/20 rounded transition-colors"
                      title="Düzenle"
                    >
                      <HiPencil className="text-sm" />
                    </button>
                    {slot.id && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id!)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                        title="Sil"
                      >
                        <HiTrash className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleBulkSave}
              className="w-full px-4 py-2 bg-soft-purple hover:bg-soft-purple/80 text-white rounded-lg font-medium transition-colors"
            >
              Tüm Değişiklikleri Kaydet
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingSlot ? '✏️ Saat Dilimi Düzenle' : '➕ Yeni Saat Dilimi'}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddSlot();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Gün
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    disabled={!!editingSlot}
                  >
                    {weekDays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Saat (24 saat formatı) *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={newSlot.time}
                    onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                  >
                    <option value="">Saat seçiniz</option>
                    {Array.from({ length: 24 }, (_, hour) => {
                      return Array.from({ length: 4 }, (_, minuteIndex) => {
                        const minute = minuteIndex * 15;
                        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        return (
                          <option key={timeString} value={timeString}>
                            {timeString}
                          </option>
                        );
                      });
                    }).flat()}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newSlot.isActive}
                    onChange={(e) => setNewSlot({ ...newSlot, isActive: e.target.checked })}
                    className="w-4 h-4 text-soft-green rounded focus:ring-soft-green"
                  />
                  <label htmlFor="isActive" className="text-sm text-soft-white/90">
                    Aktif
                  </label>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSlot(null);
                      setNewSlot({ time: '', order: 1, isActive: true });
                    }}
                    className="flex-1 px-4 py-3 glass hover:bg-white/10 text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-soft-green hover:bg-soft-green/80 text-white font-medium rounded-lg transition-all"
                  >
                    {editingSlot ? 'Güncelle' : 'Ekle'}
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

export default ReservationTemplates;
