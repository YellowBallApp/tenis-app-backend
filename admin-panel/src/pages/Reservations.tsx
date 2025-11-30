import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

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

const Reservations = () => {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<BlockedSlot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    courtId: '',
    startDate: '',
    endDate: '',
    selectedHours: [] as number[],
    reason: '',
  });

  // Müsait saatler (9:00 - 23:00)
  const availableHours = Array.from({ length: 15 }, (_, i) => i + 9);

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleCreate = () => {
    setEditingSlot(null);
    setFormData({
      courtId: '',
      startDate: '',
      endDate: '',
      selectedHours: [],
      reason: '',
    });
    setShowModal(true);
  };

  const handleEdit = (slot: BlockedSlot) => {
    setEditingSlot(slot);
    setFormData({
      courtId: slot.court.id.toString(),
      startDate: new Date(slot.startTime).toISOString().slice(0, 16),
      endDate: new Date(slot.endTime).toISOString().slice(0, 16),
      selectedHours: [],
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
        const payload = {
          startTime: new Date(formData.startDate).toISOString(),
          endTime: new Date(formData.endDate).toISOString(),
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

        const payload = {
          courtId: parseInt(formData.courtId),
          startDate: formData.startDate,
          endDate: formData.endDate,
          hours: formData.selectedHours,
          reason: formData.reason,
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
        <div className="glass-strong rounded-2xl p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-soft-white mb-2">Rezervasyon Saatleri Yönetimi</h1>
            <p className="text-soft-white/70">Toplam {blockedSlots.length} bloke edilmiş saat</p>
          </div>
          <div className="flex space-x-3">
            {/* View Toggle */}
            <div className="glass rounded-xl p-1 flex space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-soft-purple to-soft-lavender text-soft-navy font-bold shadow-lg'
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
                    ? 'bg-gradient-to-r from-soft-purple to-soft-lavender text-soft-navy font-bold shadow-lg'
                    : 'text-soft-white/70 hover:text-soft-white'
                }`}
                title="Liste Görünüm"
              >
                <List size={20} />
              </button>
            </div>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-soft-green to-soft-mint text-soft-navy font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg glow-mint"
            >
              + Saat Bloke Et
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-strong rounded-2xl p-6 hover:scale-105 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-soft-purple to-soft-lavender flex items-center justify-center text-2xl glow-mint">
                      🎾
                    </div>
                    <div>
                      <h3 className="text-soft-white font-bold text-lg">{slot.court.name}</h3>
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                        slot.isActive 
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white'
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                      } mt-1`}>
                        {slot.isActive ? '🚫 Aktif' : '⏸️ Pasif'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div className="space-y-3 mb-4">
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                      <span className="text-sm">🕐</span>
                      <span className="text-xs text-soft-white/60">Başlangıç</span>
                    </div>
                    <span className="text-soft-white font-medium">
                      {new Date(slot.startTime).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                      <span className="text-sm">🕐</span>
                      <span className="text-xs text-soft-white/60">Bitiş</span>
                    </div>
                    <span className="text-soft-white font-medium">
                      {new Date(slot.endTime).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  {slot.reason && (
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-soft-white/80 mb-1">
                        <span className="text-sm">📝</span>
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
                    className={`flex-1 px-3 py-2 glass hover:glass-strong font-medium rounded-lg transition-all duration-300 text-sm ${
                      slot.isActive ? 'text-soft-purple' : 'text-soft-green'
                    }`}
                  >
                    {slot.isActive ? '⏸️ Pasifleştir' : '▶️ Aktifleştir'}
                  </button>
                  <button
                    onClick={() => handleEdit(slot)}
                    className="flex-1 px-3 py-2 glass hover:glass-strong text-soft-green font-medium rounded-lg transition-all duration-300 text-sm"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="flex-1 px-3 py-2 glass hover:glass-strong text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all duration-300 text-sm"
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Kort
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Başlangıç
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Bitiş
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Neden
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-soft-purple uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blockedSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-soft-purple to-soft-lavender flex items-center justify-center text-xl">
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
                            ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white'
                            : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                        }`}>
                          {slot.isActive ? '🚫 Aktif' : '⏸️ Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(slot)}
                        className={`mr-3 transition-colors ${
                          slot.isActive ? 'text-soft-purple hover:text-soft-lavender' : 'text-soft-green hover:text-soft-mint'
                        }`}
                        >
                          {slot.isActive ? '⏸️' : '▶️'}
                        </button>
                      <button
                        onClick={() => handleEdit(slot)}
                        className="text-soft-green hover:text-soft-mint mr-3 transition-colors"
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
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Başlangıç Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Bitiş Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Bloke Edilecek Saatler *
                      </label>
                      <p className="text-xs text-soft-white/60 mb-3">
                        Seçilen saatler, belirtilen tarih aralığındaki her gün için bloke edilecektir
                      </p>
                      <div className="glass rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {availableHours.map((hour) => (
                            <label
                              key={hour}
                              className={`flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg transition-all duration-300 ${
                                formData.selectedHours.includes(hour)
                                  ? 'bg-gradient-to-r from-soft-purple to-soft-lavender text-soft-navy font-bold shadow-lg'
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
                        <p className="text-sm text-soft-green mt-2">
                          ✓ {formData.selectedHours.length} saat seçildi: {formData.selectedHours.map(h => `${h}:00`).join(', ')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {editingSlot && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Başlangıç Zamanı *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-soft-white/90 mb-2">
                        Bitiş Zamanı *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
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
                    className="flex-1 px-4 py-3 glass hover:glass-strong text-soft-white font-medium rounded-lg transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-soft-green to-soft-mint text-soft-navy font-bold rounded-lg hover:scale-105 transition-all shadow-lg"
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
