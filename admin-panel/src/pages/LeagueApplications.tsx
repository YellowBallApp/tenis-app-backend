import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle, HiArrowUp, HiArrowDown } from 'react-icons/hi';
import Layout from '../components/Layout';
import api from '../utils/api';

interface LeagueApplication {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType?: 'restricted' | 'standard' | 'admin' | 'coach';
    birthDate?: string;
    age?: number;
  };
  league: {
    id: number;
    name: string;
    code: string;
  };
}

type SortField = 'user' | 'userType' | 'age' | 'league' | 'status' | 'date' | null;
type SortDirection = 'asc' | 'desc';

const LeagueApplications = () => {
  const [applications, setApplications] = useState<LeagueApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchLeagues();
    fetchApplications();
  }, [filter, selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const response = await api.get('/league/all');
      setLeagues(response.data.data || []);
    } catch (error) {
      console.error('Leagues fetch error:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let response;
      if (selectedLeague) {
        const statusParam = filter !== 'all' ? `?status=${filter}` : '';
        response = await api.get(`/league-applications/league/${selectedLeague}${statusParam}`);
      } else {
        response = await api.get('/league-applications');
      }
      
      let data = response.data.data || [];
      
      // Filter by status if not 'all'
      if (filter !== 'all' && !selectedLeague) {
        data = data.filter((app: LeagueApplication) => app.status === filter);
      }
      
      // Sort data
      if (sortField) {
        data = [...data].sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          switch (sortField) {
            case 'user':
              aValue = a.user.name.toLowerCase();
              bValue = b.user.name.toLowerCase();
              break;
            case 'userType':
              aValue = a.user.userType || '';
              bValue = b.user.userType || '';
              break;
            case 'age':
              aValue = a.user.age || 0;
              bValue = b.user.age || 0;
              break;
            case 'league':
              aValue = a.league.name.toLowerCase();
              bValue = b.league.name.toLowerCase();
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            case 'date':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            default:
              return 0;
          }
          
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      setApplications(data);
    } catch (error) {
      console.error('Applications fetch error:', error);
      alert('Başvurular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Bu başvuruyu onaylamak istediğinize emin misiniz?')) return;
    
    try {
      await api.post(`/league-applications/${id}/approve`);
      alert('Başvuru onaylandı');
      fetchApplications();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Onaylama işlemi başarısız');
    }
  };

  const handleReject = async (id: number) => {
    const notes = prompt('Red nedeni (opsiyonel):');
    if (notes === null) return; // User cancelled
    
    try {
      await api.post(`/league-applications/${id}/reject`, { notes });
      alert('Başvuru reddedildi');
      fetchApplications();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Red işlemi başarısız');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Aynı alana tekrar tıklandığında yönü değiştir
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Yeni alana tıklandığında artan sıralama yap
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <HiArrowUp className="inline ml-1" />
    ) : (
      <HiArrowDown className="inline ml-1" />
    );
  };

  const getUserTypeLabel = (userType?: string) => {
    const labels: Record<string, string> = {
      restricted: 'Kısıtlı',
      standard: 'Standart',
      admin: 'Admin',
      coach: 'Antrenör',
    };
    return labels[userType || 'standard'] || 'Standart';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-soft-white">Lig Başvuruları</h1>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-soft-white mb-2 text-sm">Lig Filtresi</label>
            <select
              value={selectedLeague || ''}
              onChange={(e) => setSelectedLeague(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
            >
              <option value="">Tüm Ligler</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-soft-white mb-2 text-sm">Durum Filtresi</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
            >
              <option value="all">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('user')}
                  >
                    Kullanıcı {getSortIcon('user')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('userType')}
                  >
                    Üye Tipi {getSortIcon('userType')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('age')}
                  >
                    Yaş {getSortIcon('age')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('league')}
                  >
                    Lig {getSortIcon('league')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('status')}
                  >
                    Durum {getSortIcon('status')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-soft-white font-semibold cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => handleSort('date')}
                  >
                    Tarih {getSortIcon('date')}
                  </th>
                  <th className="text-left py-3 px-4 text-soft-white font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-soft-white/60">
                      Başvuru bulunmamaktadır
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => {
                    const calculateAge = (birthDate?: string): number | null => {
                      if (!birthDate) return null;
                      const today = new Date();
                      const birth = new Date(birthDate);
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                        age--;
                      }
                      return age;
                    };
                    const userAge = application.user.age ?? calculateAge(application.user.birthDate);
                    
                    return (
                    <tr key={application.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-soft-white font-medium">{application.user.name}</div>
                          <div className="text-soft-white/60 text-sm">{application.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
                          {getUserTypeLabel(application.user.userType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-soft-white/80">
                        {userAge !== null ? `${userAge} yaş` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-soft-white font-medium">{application.league.name}</div>
                          <div className="text-soft-white/60 text-sm">{application.league.code}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="py-3 px-4 text-soft-white/80 text-sm">
                        {new Date(application.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4">
                        {application.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(application.id)}
                              className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg transition-all"
                              title="Onayla"
                            >
                              <HiCheckCircle className="text-xl" />
                            </button>
                            <button
                              onClick={() => handleReject(application.id)}
                              className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-all"
                              title="Reddet"
                            >
                              <HiXCircle className="text-xl" />
                            </button>
                          </div>
                        )}
                        {application.notes && (
                          <div className="text-xs text-soft-white/60 mt-1">
                            Not: {application.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeagueApplications;

