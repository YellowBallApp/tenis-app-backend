import { Home, Calendar, Trophy, Users, UserCircle } from 'lucide-react';

interface BottomNavProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ selectedTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'courts', label: 'Courts', icon: Calendar },
    { id: 'league', label: 'League', icon: Trophy },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
              style={{
                color: isSelected ? '#54CE8F' : '#9CA3AF',
              }}
            >
              <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
