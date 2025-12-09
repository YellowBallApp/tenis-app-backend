import { ChevronRight, User, Bell, Globe, Shield, HelpCircle, LogOut, Edit, Trophy, Calendar, TrendingUp, Settings } from 'lucide-react';

interface ProfileProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const stats = [
    { label: 'Matches Played', value: '12', icon: Trophy },
    { label: 'Win Rate', value: '58%', icon: TrendingUp },
    { label: 'Current Rank', value: '#8', icon: Trophy },
    { label: 'Member Since', value: '2024', icon: Calendar },
  ];

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', action: 'editProfile' },
        { icon: Shield, label: 'Privacy & Security', action: 'privacy' },
        { icon: Bell, label: 'Notifications', action: 'notificationSettings' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Globe, label: 'Language', value: 'English', action: 'language' },
        { icon: Settings, label: 'App Settings', action: 'appSettings' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', action: 'help' },
        { icon: Shield, label: 'Terms & Policies', action: 'terms' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header with Profile */}
      <div className="px-6 pt-12 pb-6" style={{ backgroundColor: '#B4AEBD' }}>
        <h1 className="text-2xl text-white mb-6">Profile</h1>
        
        {/* Profile Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white relative" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
              EK
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: '#54CE8F' }}>
                <Edit size={14} color="white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl text-white mb-1">Emre Kaya</h2>
              <p className="text-white/80 text-sm mb-2">emre.kaya@email.com</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white">
                  Rank #8
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white">
                  Intermediate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-6">
        <h3 className="text-lg text-gray-900 mb-4">Your Statistics</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                    <Icon size={20} style={{ color: '#B4AEBD' }} />
                  </div>
                </div>
                <p className="text-2xl mb-1" style={{ color: '#54CE8F' }}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => onNavigate('courts')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 transition-all hover:bg-gray-100"
            >
              <Calendar size={24} style={{ color: '#54CE8F' }} />
              <span className="text-xs text-gray-700 text-center">My Bookings</span>
            </button>
            <button 
              onClick={() => onNavigate('league')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 transition-all hover:bg-gray-100"
            >
              <Trophy size={24} style={{ color: '#B4AEBD' }} />
              <span className="text-xs text-gray-700 text-center">My Matches</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 transition-all hover:bg-gray-100">
              <TrendingUp size={24} style={{ color: '#54CE8F' }} />
              <span className="text-xs text-gray-700 text-center">Statistics</span>
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="text-sm text-gray-500 px-2 mb-3">{section.title}</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                      <Icon size={20} style={{ color: '#B4AEBD' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900">{item.label}</p>
                      {item.value && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.value}</p>
                      )}
                    </div>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center gap-3 text-red-600 transition-all hover:bg-red-50 mb-24">
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        {/* App Version */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-500">EGEV Tenis Kulübü</p>
          <p className="text-xs text-gray-400 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
