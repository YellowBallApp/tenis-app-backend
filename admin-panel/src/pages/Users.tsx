import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  surname?: string;
  phone?: string;
  userType: string;
  title?: string;
  createdAt: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    surname: '',
    phone: '',
    userType: 'standard',
    title: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      surname: '',
      phone: '',
      userType: 'standard',
      title: '',
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      surname: user.surname || '',
      phone: user.phone || '',
      userType: user.userType,
      title: user.title || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
      } else {
        if (!formData.password) {
          alert('Yeni kullanıcı için şifre gereklidir');
          return;
        }
        await api.post('/admin/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const types: Record<string, { label: string; gradient: string; glow: string }> = {
      admin: { label: 'Admin', gradient: 'from-soft-purple to-soft-lavender', glow: 'glow-purple' },
      standard: { label: 'Standart', gradient: 'from-soft-purple to-soft-lavender', glow: 'glow-green' },
      restricted: { label: 'Kısıtlı', gradient: 'from-soft-sage to-soft-mint', glow: '' },
    };
    return types[userType] || types.standard;
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
            <h1 className="text-3xl font-bold text-soft-white mb-2">Kullanıcı Yönetimi</h1>
            <p className="text-soft-white/70">Toplam {users.length} kullanıcı</p>
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
              className="px-6 py-3 bg-gradient-to-r from-soft-purple to-soft-lavender text-soft-navy font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg glow-mint"
            >
              + Yeni Kullanıcı
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const badge = getUserTypeBadge(user.userType);
              return (
                <div
                  key={user.id}
                  className="glass-strong rounded-2xl p-6 hover:scale-105 transition-all duration-300 group"
                >
                  {/* User Avatar & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.gradient} ${badge.glow} flex items-center justify-center text-2xl`}>
                        👤
                      </div>
                      <div>
                        <h3 className="text-soft-white font-bold text-lg">
                          {user.name} {user.surname}
                        </h3>
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${badge.gradient} text-white mt-1`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-soft-white/80">
                      <span className="text-sm">📧</span>
                      <span className="text-sm truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2 text-soft-white/80">
                        <span className="text-sm">📱</span>
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    {user.title && (
                      <div className="flex items-center space-x-2 text-soft-white/80">
                        <span className="text-sm">💼</span>
                        <span className="text-sm">{user.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 px-4 py-2 glass hover:glass-strong text-soft-purple font-medium rounded-lg transition-all duration-300"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="flex-1 px-4 py-2 glass hover:glass-strong text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all duration-300"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              );
            })}
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
                      Kullanıcı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Unvan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-soft-purple uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-soft-purple uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => {
                    const badge = getUserTypeBadge(user.userType);
                    return (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-xl`}>
                              👤
                            </div>
                            <div>
                              <div className="text-sm font-bold text-soft-white">
                                {user.name} {user.surname}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-soft-white/80">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-soft-white/80">{user.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-soft-white/80">{user.title || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${badge.gradient} text-white`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-soft-purple hover:text-soft-mint mr-4 transition-colors"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-soft-white/70 hover:text-soft-white transition-colors"
                          >
                            🗑️ Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {users.length === 0 && (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-soft-white/60 text-lg">Henüz kullanıcı bulunmuyor</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingUser ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    İsim *
                  </label>
                  <input
                    type="text"
                    required
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Soyisim
                  </label>
                  <input
                    type="text"
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-soft-white/90 mb-2">
                      Şifre *
                    </label>
                    <input
                      type="password"
                      required
                      className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Kullanıcı Tipi
                  </label>
                  <select
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.userType}
                    onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                  >
                    <option value="standard">Standart</option>
                    <option value="restricted">Kısıtlı</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Unvan
                  </label>
                  <input
                    type="text"
                    className="glass w-full px-4 py-3 text-soft-white placeholder-soft-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-soft-purple to-soft-lavender text-soft-navy font-bold rounded-lg hover:scale-105 transition-all shadow-lg"
                  >
                    {editingUser ? 'Güncelle' : 'Oluştur'}
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

export default Users;
