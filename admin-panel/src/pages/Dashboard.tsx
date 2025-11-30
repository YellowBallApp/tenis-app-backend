import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    activeReservations: 0,
    blockedSlots: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, reservationsRes, blockedRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/reservations?date=' + new Date().toISOString().split('T')[0]),
        api.get('/admin/blocked-time-slots?isActive=true'),
      ]);

      const users = usersRes.data.data || [];
      const reservations = reservationsRes.data.data || [];
      const blockedSlots = blockedRes.data.data || [];

      setStats({
        totalUsers: users.length,
        totalReservations: reservations.length,
        activeReservations: reservations.filter((r: any) => {
          const endTime = new Date(r.endTime);
          return endTime > new Date();
        }).length,
        blockedSlots: blockedSlots.length,
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-slate-700',
    },
    {
      title: 'Toplam Rezervasyon',
      value: stats.totalReservations,
      icon: '📅',
      color: 'bg-slate-600',
    },
    {
      title: 'Aktif Rezervasyon',
      value: stats.activeReservations,
      icon: '⏰',
      color: 'bg-slate-600-light',
    },
    {
      title: 'Bloke Edilmiş Saat',
      value: stats.blockedSlots,
      icon: '🚫',
      color: 'bg-slate-600-dark',
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-strong rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-soft-white mb-2">Dashboard</h1>
          <p className="text-soft-white/70">Sistem genel durumu ve istatistikler</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass-strong rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} transition-all duration-300 group-hover:scale-110`}>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-soft-white/70 mb-2">{stat.title}</p>
              <p className="text-4xl font-bold text-soft-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-xl font-bold text-soft-white mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/users"
              className="glass p-4 rounded-xl hover:glass-strong transition-all duration-300 flex items-center space-x-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">👤</span>
              <div>
                <p className="text-soft-white font-medium">Kullanıcı Yönetimi</p>
                <p className="text-soft-white/60 text-sm">Kullanıcıları görüntüle ve düzenle</p>
              </div>
            </a>

            <a
              href="/reservations"
              className="glass p-4 rounded-xl hover:glass-strong transition-all duration-300 flex items-center space-x-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🎾</span>
              <div>
                <p className="text-soft-white font-medium">Rezervasyon Yönetimi</p>
                <p className="text-soft-white/60 text-sm">Saatleri blokla ve yönet</p>
              </div>
            </a>

            <button
              onClick={fetchStats}
              className="glass p-4 rounded-xl hover:glass-strong transition-all duration-300 flex items-center space-x-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🔄</span>
              <div className="text-left">
                <p className="text-soft-white font-medium">Yenile</p>
                <p className="text-soft-white/60 text-sm">İstatistikleri güncelle</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

