import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiLogout, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { IoTennisball } from 'react-icons/io5';
import { MdDashboard, MdPeople, MdEvent, MdRateReview, MdSportsTennis, MdEmojiEvents, MdNotifications } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../utils/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [reservationsExpanded, setReservationsExpanded] = useState(false);
  const [leaguesExpanded, setLeaguesExpanded] = useState(false);

  useEffect(() => {
    fetchPendingReviewsCount();
    fetchPendingApplicationsCount();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      fetchPendingReviewsCount();
      fetchPendingApplicationsCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingReviewsCount = async () => {
    try {
      const response = await api.get('/coach-reviews/pending/count');
      setPendingReviewsCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Pending reviews count fetch error:', error);
    }
  };

  const fetchPendingApplicationsCount = async () => {
    try {
      const response = await api.get('/league-applications/pending/count');
      setPendingApplicationsCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Pending applications count fetch error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Rezervasyonlar ve Ligler alt menüsü aktif mi kontrol et
  useEffect(() => {
    if (location.pathname.startsWith('/reservations')) {
      setReservationsExpanded(true);
    }
    if (location.pathname.startsWith('/leagues')) {
      setLeaguesExpanded(true);
    }
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { path: '/users', label: 'Kullanıcılar', icon: MdPeople },
    { path: '/courts', label: 'Kortlar', icon: MdSportsTennis },
    { 
      path: '/reservations', 
      label: 'Rezervasyonlar', 
      icon: MdEvent,
      children: [
        { path: '/reservations', label: 'Rezervasyon Saatleri Yönetimi' },
        { path: '/reservations/user-reservations', label: 'Kullanıcı Rezervasyonları' },
        { path: '/reservations/templates', label: 'Rezervasyon Şablonu' }
      ]
    },
    { 
      path: '/leagues', 
      label: 'Lig Yönetimi', 
      icon: MdEmojiEvents,
      badge: pendingApplicationsCount,
      children: [
        { path: '/leagues', label: 'Ligler' },
        { path: '/leagues/templates', label: 'Lig Şablonları' },
        { path: '/leagues/applications', label: 'Lig Başvuruları', badge: pendingApplicationsCount },
        { path: '/leagues/standings', label: 'Lig Sıralamaları' }
      ]
    },
    { path: '/reviews', label: 'Yorumlar', icon: MdRateReview, badge: pendingReviewsCount },
    { path: '/announcements', label: 'Duyurular', icon: MdNotifications },
  ];

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 glass-strong border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <IoTennisball className="text-4xl text-soft-green" />
              <h1 className="text-soft-white text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path));
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = hasChildren && (
                item.path === '/reservations' ? reservationsExpanded :
                item.path === '/leagues' ? leaguesExpanded :
                false
              );

              if (hasChildren) {
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => {
                        if (item.path === '/reservations') {
                          setReservationsExpanded(!reservationsExpanded);
                        } else if (item.path === '/leagues') {
                          setLeaguesExpanded(!leaguesExpanded);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-soft-purple text-soft-white shadow-lg'
                          : 'text-soft-white/80 hover:bg-white/10 hover:text-soft-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <IconComponent 
                          style={{ fontSize: '24px', minWidth: '24px' }}
                          className="mr-3 flex-shrink-0 text-white"
                        />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <HiChevronDown className="text-white" />
                      ) : (
                        <HiChevronRight className="text-white" />
                      )}
                    </button>
                    {isExpanded && item.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive = location.pathname === child.path;
                          const badge = 'badge' in child ? child.badge : undefined;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                isChildActive
                                  ? 'bg-soft-purple/50 text-soft-white shadow-md'
                                  : 'text-soft-white/70 hover:bg-white/5 hover:text-soft-white'
                              }`}
                            >
                              <span>{child.label}</span>
                              {badge !== undefined && badge > 0 && (
                                <span className="px-2 py-1 text-xs font-bold bg-soft-green text-soft-navy rounded-full min-w-[24px] text-center">
                                  {badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-soft-purple text-soft-white shadow-lg'
                      : 'text-soft-white/80 hover:bg-white/10 hover:text-soft-white'
                  }`}
                >
                  <div className="flex items-center">
                    <IconComponent 
                      style={{ fontSize: '24px', minWidth: '24px' }}
                      className={`mr-3 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-white'
                      }`} 
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-1 text-xs font-bold bg-soft-green text-soft-navy rounded-full min-w-[24px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="glass rounded-xl p-4 mb-3">
              <div className="text-sm text-soft-white">
                <div className="font-bold mb-1">{user?.name}</div>
                <div className="text-xs text-soft-white/60 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-sm font-bold text-soft-white bg-slate-600 hover:bg-slate-700 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              <HiLogout className="mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;

