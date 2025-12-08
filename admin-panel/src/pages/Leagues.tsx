import { useEffect, useState } from 'react';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';

interface League {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const Leagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
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
    });
    setShowModal(true);
  };

  const handleEdit = (league: League) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      code: league.code,
      description: league.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeague) {
        await api.put(`/league/entity/${editingLeague.id}`, formData);
      } else {
        await api.post('/league/create', formData);
      }
      setShowModal(false);
      fetchLeagues();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-soft-white mb-4">
              {editingLeague ? 'Lig Düzenle' : 'Yeni Lig Oluştur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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

