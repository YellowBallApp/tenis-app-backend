import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'Kullanıcılar', icon: '👥' },
    { path: '/reservations', label: 'Rezervasyonlar', icon: '📅' },
  ];

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 glass-strong border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🎾</span>
              <h1 className="text-tennis-white text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-tennis-lime to-tennis-green text-tennis-navy shadow-lg glow-lime'
                    : 'text-tennis-white/80 hover:bg-white/10 hover:text-tennis-white'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="glass rounded-xl p-4 mb-3">
              <div className="text-sm text-tennis-white">
                <div className="font-bold mb-1">{user?.name}</div>
                <div className="text-xs text-tennis-white/60 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-sm font-bold text-tennis-white bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-300 border border-red-500/50 hover:border-red-500"
            >
              Çıkış Yap 🚪
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

