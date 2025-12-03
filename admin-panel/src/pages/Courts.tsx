import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { IoTennisball } from 'react-icons/io5';
import { HiPencil, HiTrash, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';

interface Court {
  id: number;
  name: string;
  indoors: boolean;
  groundType: 'hard' | 'clay' | 'grass';
  closed: boolean;
  createdAt: string;
  updatedAt: string;
}

const Courts = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    indoors: false,
    groundType: 'hard' as 'hard' | 'clay' | 'grass',
    closed: false,
  });

  // GroundType Türkçe çevirileri
  const groundTypeLabels: Record<'hard' | 'clay' | 'grass', string> = {
    hard: 'Sert Kort',
    clay: 'Toprak Kort',
    grass: 'Çim Kort',
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      const response = await api.get('/courts');
      setCourts(response.data.data || []);
    } catch (error) {
      console.error('Courts fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCourt(null);
    setFormData({
      name: '',
      indoors: false,
      groundType: 'hard',
      closed: false,
    });
    setShowModal(true);
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      indoors: court.indoors,
      groundType: court.groundType,
      closed: court.closed,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourt) {
        await api.put(`/courts/${editingCourt.id}`, formData);
      } else {
        await api.post('/courts', formData);
      }
      setShowModal(false);
      fetchCourts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kortu silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/courts/${id}`);
      fetchCourts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
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
            <h1 className="text-3xl font-bold text-soft-white mb-2">Kort Yönetimi</h1>
            <p className="text-soft-white/70">Toplam {courts.length} kort</p>
          </div>
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
              + Yeni Kort
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="glass-strong rounded-2xl p-6 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center text-2xl">
                      <IoTennisball className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-soft-white font-bold text-lg">{court.name}</h3>
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                        court.closed 
                          ? 'bg-red-500/20 text-red-200 border border-red-400/30'
                          : 'bg-soft-green/20 text-soft-green border border-soft-green/30'
                      } mt-1`}>
                        {court.closed ? '🔒 Kapalı' : '✅ Açık'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Court Info */}
                <div className="space-y-2 mb-4">
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-soft-white/60 mb-1">Kort Tipi</div>
                    <div className="text-soft-white font-medium">
                      {groundTypeLabels[court.groundType]}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-soft-white/60 mb-1">Konum</div>
                    <div className="text-soft-white font-medium">
                      {court.indoors ? '🏠 Kapalı Alan' : '🌳 Açık Alan'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleEdit(court)}
                    className="flex-1 px-4 py-2 glass hover:bg-soft-green/20 hover:border-soft-green text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(court.id)}
                    className="flex-1 px-4 py-2 glass hover:bg-red-500/20 hover:border-red-400 text-soft-white/80 hover:text-red-200 font-medium rounded-lg transition-all duration-300 hover:shadow-lg"
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
                      Kort Adı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kort Tipi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Konum
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
                  {courts.map((court) => (
                    <tr key={court.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-xl">
                            🎾
                          </div>
                          <div className="text-sm font-bold text-soft-white">{court.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-soft-white/80">
                          {groundTypeLabels[court.groundType]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-soft-white/80">
                          {court.indoors ? '🏠 Kapalı Alan' : '🌳 Açık Alan'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          court.closed 
                            ? 'bg-red-500/20 text-red-200 border border-red-400/30'
                            : 'bg-soft-green/20 text-soft-green border border-soft-green/30'
                        }`}>
                          {court.closed ? '🔒 Kapalı' : '✅ Açık'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(court)}
                          className="px-3 py-1.5 glass hover:bg-soft-green/20 hover:border-soft-green text-soft-white/80 hover:text-soft-white mr-3 transition-all rounded-lg hover:shadow-lg"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(court.id)}
                          className="px-3 py-1.5 glass hover:bg-red-500/20 hover:border-red-400 text-soft-white/70 hover:text-red-200 transition-all rounded-lg hover:shadow-lg"
                        >
                          🗑️ Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {courts.length === 0 && (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-soft-white/60 text-lg">Henüz kort bulunmuyor</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingCourt ? '✏️ Kort Düzenle' : '➕ Yeni Kort'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kort Adı *
                  </label>
                  <input
                    type="text"
                    required
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Kort 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kort Tipi *
                  </label>
                  <select
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.groundType}
                    onChange={(e) => setFormData({ ...formData, groundType: e.target.value as 'hard' | 'clay' | 'grass' })}
                  >
                    <option value="hard">Sert Kort</option>
                    <option value="clay">Toprak Kort</option>
                    <option value="grass">Çim Kort</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded glass text-soft-green focus:ring-soft-purple"
                      checked={formData.indoors}
                      onChange={(e) => setFormData({ ...formData, indoors: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-soft-white/90">
                      Kapalı Alan
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded glass text-soft-green focus:ring-soft-purple"
                      checked={formData.closed}
                      onChange={(e) => setFormData({ ...formData, closed: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-soft-white/90">
                      Kapalı (Rezervasyon alınmaz)
                    </span>
                  </label>
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
                    {editingCourt ? 'Güncelle' : 'Oluştur'}
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

export default Courts;

