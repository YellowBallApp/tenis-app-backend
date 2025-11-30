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
        <div className="text-center">Yükleniyor...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Rezervasyon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Rezervasyon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bloke Edilmiş Saat</p>
                <p className="text-2xl font-bold text-gray-900">{stats.blockedSlots}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

