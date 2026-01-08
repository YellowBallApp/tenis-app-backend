import { useEffect, useState } from 'react';
import { HiPencil, HiTrash, HiPlus, HiNewspaper } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';

interface Announcement {
  id?: number;
  title: string;
  content: string;
  isPinned?: boolean;
  author?: {
    id: string;
    name: string;
    surname?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', isPinned: true });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/announcements');
      // Güncelden geçmişe göre sıralı (createdAt DESC)
      const sorted = (response.data.data || []).sort((a: Announcement, b: Announcement) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(sorted);
    } catch (error) {
      console.error('Announcements fetch error:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    try {
      if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
        alert('Başlık ve içerik alanları zorunludur');
        return;
      }

      if (editingAnnouncement?.id) {
        // Düzenleme
        await api.put(`/announcements/${editingAnnouncement.id}`, {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          isPinned: newAnnouncement.isPinned,
        });
        alert('Duyuru başarıyla güncellendi');
      } else {
        // Yeni ekleme - isPinned otomatik true olacak (backend'de)
        await api.post('/announcements', {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          isPinned: newAnnouncement.isPinned,
        });
        alert('Duyuru başarıyla oluşturuldu ve tüm kullanıcılara bildirim gönderildi');
      }

      setShowAddModal(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({ title: '', content: '', isPinned: true });
      await fetchAnnouncements();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({ 
      title: announcement.title, 
      content: announcement.content,
      isPinned: announcement.isPinned || false,
    });
    setShowAddModal(true);
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/announcements/${id}`);
      alert('Duyuru başarıyla silindi');
      await fetchAnnouncements();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme başarısız');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-soft-white mb-2">
                Duyurular
              </h1>
              <p className="text-soft-white/70">
                Yeni duyuru oluşturun ve tüm kullanıcılara bildirim gönderin
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setNewAnnouncement({ title: '', content: '', isPinned: true });
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-soft-green hover:bg-soft-green/80 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <HiPlus className="text-lg" />
              <span>Yeni Duyuru</span>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-xl font-bold text-soft-white mb-4">
            Gönderilen Duyurular
          </h2>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-soft-white/60">
                Henüz duyuru gönderilmemiş
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <HiNewspaper className="text-soft-green text-lg" />
                        <h3 className="text-lg font-bold text-soft-white">
                          {announcement.title}
                        </h3>
                        {announcement.isPinned && (
                          <span className="px-2 py-1 text-xs font-bold bg-soft-green text-white rounded-full">
                            📌 Sabitlenmiş
                          </span>
                        )}
                      </div>
                      <p className="text-soft-white/80 mb-3 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-soft-white/60">
                        <span>
                          👤 {announcement.author?.name}{announcement.author?.surname ? ` ${announcement.author.surname}` : ''}
                        </span>
                        <span>•</span>
                        <span>
                          📅 {formatDate(announcement.updatedAt || announcement.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="p-2 text-soft-green hover:bg-soft-green/20 rounded transition-colors"
                        title="Düzenle"
                      >
                        <HiPencil className="text-sm" />
                      </button>
                      {announcement.id && (
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id!)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                          title="Sil"
                        >
                          <HiTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold text-soft-white mb-6">
                {editingAnnouncement ? '✏️ Duyuru Düzenle' : '➕ Yeni Duyuru'}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddAnnouncement();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    required
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                    }
                    placeholder="Duyuru başlığı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white/90 mb-2">
                    İçerik *
                  </label>
                  <textarea
                    required
                    rows={8}
                    className="glass w-full px-4 py-3 text-soft-white rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-purple transition-all resize-none"
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                    }
                    placeholder="Duyuru içeriği"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={newAnnouncement.isPinned}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })
                    }
                    className="w-4 h-4 text-soft-green rounded focus:ring-soft-green"
                  />
                  <label htmlFor="isPinned" className="text-sm text-soft-white/90">
                    Ana sayfada göster (Sabitle)
                  </label>
                </div>
                {!editingAnnouncement && (
                  <div className="bg-soft-green/20 border border-soft-green/50 rounded-lg p-3 text-sm text-soft-white/90">
                    💡 Bu duyuru oluşturulduğunda tüm kullanıcılara otomatik olarak bildirim gönderilecektir. Yeni duyuru varsayılan olarak ana sayfada gösterilir.
                  </div>
                )}
                {editingAnnouncement && (
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-sm text-soft-white/90">
                    💡 Bu duyuruyu sabitlerseniz, diğer sabitlenmiş duyurular otomatik olarak sabitlenmemiş hale gelir.
                  </div>
                )}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingAnnouncement(null);
                      setNewAnnouncement({ title: '', content: '', isPinned: true });
                    }}
                    className="flex-1 px-4 py-3 glass hover:bg-white/10 text-soft-white/80 hover:text-soft-white font-medium rounded-lg transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-soft-green hover:bg-soft-green/80 text-white font-medium rounded-lg transition-all"
                  >
                    {editingAnnouncement ? 'Güncelle' : 'Oluştur ve Gönder'}
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

export default Announcements;
