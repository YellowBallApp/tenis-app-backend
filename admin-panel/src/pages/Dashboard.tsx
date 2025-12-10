import { useEffect, useState } from 'react';
import { HiUsers, HiCalendar, HiClock, HiBan, HiClipboardList, HiChatAlt } from 'react-icons/hi';
import { MdSportsTennis, MdEmojiEvents } from 'react-icons/md';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    activeReservations: 0,
    blockedSlots: 0,
    activeCourts: 0,
    totalLeagues: 0,
    pendingApplications: 0,
    totalMatches: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [
        usersRes,
        reservationsRes,
        blockedRes,
        courtsRes,
        leaguesRes,
        applicationsRes,
        matchesRes,
        reviewsRes
      ] = await Promise.all([
        api.get('/admin/users'),
        api.get('/reservations?date=' + new Date().toISOString().split('T')[0]),
        api.get('/admin/blocked-time-slots?isActive=true'),
        api.get('/courts/active'),
        api.get('/league/all'),
        api.get('/league-applications/pending/count').catch(() => ({ data: { data: { count: 0 } } })),
        api.get('/match-history').catch(() => ({ data: { data: [] } })),
        api.get('/coach-reviews/pending/count').catch(() => ({ data: { data: { count: 0 } } })),
      ]);

      const users = usersRes.data.data || [];
      const reservations = reservationsRes.data.data || [];
      const blockedSlots = blockedRes.data.data || [];
      const activeCourts = courtsRes.data.data || [];
      const leagues = leaguesRes.data.data || [];
      const pendingApplications = applicationsRes.data.data?.count || 0;
      const matches = matchesRes.data.data || [];
      const pendingReviews = reviewsRes.data.data?.count || 0;

      setStats({
        totalUsers: users.length,
        totalReservations: reservations.length,
        activeReservations: reservations.filter((r: any) => {
          const endTime = new Date(r.endTime);
          return endTime > new Date();
        }).length,
        blockedSlots: blockedSlots.length,
        activeCourts: activeCourts.length,
        totalLeagues: leagues.length,
        pendingApplications,
        totalMatches: matches.length,
        pendingReviews,
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
      icon: HiUsers,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      onClick: () => navigate('/users'),
    },
    {
      title: 'Aktif Kort',
      value: stats.activeCourts,
      icon: MdSportsTennis,
      color: 'bg-soft-green',
      hoverColor: 'hover:bg-soft-green/90',
      onClick: () => navigate('/courts'),
    },
    {
      title: 'Toplam Lig',
      value: stats.totalLeagues,
      icon: MdEmojiEvents,
      color: 'bg-yellow-600',
      hoverColor: 'hover:bg-yellow-700',
      onClick: () => navigate('/leagues'),
    },
    {
      title: 'Toplam Maç',
      value: stats.totalMatches,
      icon: MdSportsTennis,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      title: 'Toplam Rezervasyon',
      value: stats.totalReservations,
      icon: HiCalendar,
      color: 'bg-slate-600',
      hoverColor: 'hover:bg-slate-700',
      onClick: () => navigate('/reservations'),
    },
    {
      title: 'Aktif Rezervasyon',
      value: stats.activeReservations,
      icon: HiClock,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      onClick: () => navigate('/reservations'),
    },
    {
      title: 'Bekleyen Başvuru',
      value: stats.pendingApplications,
      icon: HiClipboardList,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      onClick: () => navigate('/leagues/applications'),
    },
    {
      title: 'Bekleyen Yorum',
      value: stats.pendingReviews,
      icon: HiChatAlt,
      color: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
      onClick: () => navigate('/reviews'),
      badge: stats.pendingReviews > 0,
    },
    {
      title: 'Bloke Edilmiş Saat',
      value: stats.blockedSlots,
      icon: HiBan,
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-soft-white mb-2">Dashboard</h1>
              <p className="text-soft-white/70">Sistem genel durumu ve istatistikler</p>
            </div>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-soft-green/20 hover:bg-soft-green/30 text-soft-green rounded-xl transition-all duration-300 font-semibold"
            >
              Yenile
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              className={`glass-strong rounded-2xl p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl ${
                stat.onClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} ${stat.hoverColor} transition-all duration-300 shadow-lg`}>
                  <stat.icon className="text-3xl text-white" />
                </div>
                {stat.badge && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    Yeni
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-soft-white/70 mb-2">{stat.title}</p>
              <p className="text-4xl font-bold text-soft-white">{stat.value.toLocaleString('tr-TR')}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

