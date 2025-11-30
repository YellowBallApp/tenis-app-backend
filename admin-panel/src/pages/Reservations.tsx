import { useEffect, useState } from 'react';
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
  const [formData, setFormData] = useState({
    courtId: '',
    startDate: '',
    endDate: '',
    selectedHours: [] as number[],
    reason: '',
  });

  // Müsait saatler (9:00 - 23:00)
  const availableHours = Array.from({ length: 15 }, (_, i) => i + 9); // 9-23 arası saatler

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
        // Eski sistemle düzenleme (tek zaman dilimi)
        const payload = {
          startTime: new Date(formData.startDate).toISOString(),
          endTime: new Date(formData.endDate).toISOString(),
          reason: formData.reason,
        };
        await api.put(`/admin/blocked-time-slots/${editingSlot.id}`, payload);
      } else {
        // Yeni sistemle toplu bloklama
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
        <div className="text-center">Yükleniyor...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rezervasyon Saatleri Yönetimi</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Saat Bloke Et
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlangıç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bitiş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Neden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blockedSlots.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{slot.court.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(slot.startTime).toLocaleString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(slot.endTime).toLocaleString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{slot.reason || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      slot.isActive 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {slot.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(slot)}
                      className={`mr-4 ${
                        slot.isActive 
                          ? 'text-yellow-600 hover:text-yellow-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {slot.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button
                      onClick={() => handleEdit(slot)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {blockedSlots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Bloke edilmiş zaman dilimi bulunamadı
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white my-10">
              <h3 className="text-lg font-bold mb-4">
                {editingSlot ? 'Bloklama Düzenle' : 'Yeni Saat Bloklama'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kort *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bloke Edilecek Saatler * (Seçilen saatler belirtilen tarih aralığındaki her gün için bloke edilecektir)
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {availableHours.map((hour) => (
                          <label
                            key={hour}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedHours.includes(hour)}
                              onChange={() => toggleHour(hour)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                          </label>
                        ))}
                      </div>
                      {formData.selectedHours.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Seçilen saatler: {formData.selectedHours.map(h => `${h}:00`).join(', ')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {editingSlot && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Zamanı *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Zamanı *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neden
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Bloklama nedeni (opsiyonel)"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

