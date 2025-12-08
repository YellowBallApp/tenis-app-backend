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

