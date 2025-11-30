import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiLogout } from 'react-icons/hi';
import { IoTennisball } from 'react-icons/io5';
import { MdDashboard, MdPeople, MdEvent } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { path: '/users', label: 'Kullanıcılar', icon: MdPeople },
    { path: '/reservations', label: 'Rezervasyonlar', icon: MdEvent },
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
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-soft-purple text-soft-white shadow-lg'
                      : 'text-soft-white/80 hover:bg-white/10 hover:text-soft-white'
                  }`}
                >
                  <IconComponent 
                    style={{ fontSize: '24px', minWidth: '24px' }}
                    className={`mr-3 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-white'
                    }`} 
                  />
                  <span>{item.label}</span>
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

