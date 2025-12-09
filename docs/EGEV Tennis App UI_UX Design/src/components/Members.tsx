import { Search, Filter, Users, Award } from 'lucide-react';
import { useState } from 'react';

interface MembersProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function Members({ onNavigate }: MembersProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'coaches'>('members');

  const members = [
    { id: 1, name: 'Ali Yıldız', rank: 2, level: 'Advanced', matches: 14, winRate: 78 },
    { id: 2, name: 'Burak Aydın', rank: 3, level: 'Advanced', matches: 16, winRate: 62 },
    { id: 3, name: 'Can Özkan', rank: 1, level: 'Expert', matches: 15, winRate: 80 },
    { id: 4, name: 'Deniz Kara', rank: 4, level: 'Intermediate', matches: 13, winRate: 69 },
    { id: 5, name: 'Efe Şahin', rank: 5, level: 'Intermediate', matches: 15, winRate: 60 },
    { id: 6, name: 'Furkan Demir', rank: 6, level: 'Intermediate', matches: 14, winRate: 57 },
  ];

  const coaches = [
    { id: 1, name: 'Serkan Akar', specialty: 'Performance Coach', experience: '15 years', rating: 4.9 },
    { id: 2, name: 'Ayşe Yılmaz', specialty: 'Technique Coach', experience: '10 years', rating: 4.8 },
    { id: 3, name: 'Mehmet Öz', specialty: 'Junior Coach', experience: '8 years', rating: 4.7 },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl text-gray-900 mb-4">Directory</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={20} color="#9CA3AF" />
          </div>
          <input
            type="text"
            placeholder="Search members or coaches..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('members')}
            className="flex-1 py-3 rounded-xl transition-all"
            style={{
              backgroundColor: activeTab === 'members' ? '#54CE8F' : '#F3F4F6',
              color: activeTab === 'members' ? 'white' : '#6B7280',
            }}
          >
            <Users size={18} className="inline mr-2" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('coaches')}
            className="flex-1 py-3 rounded-xl transition-all"
            style={{
              backgroundColor: activeTab === 'coaches' ? '#54CE8F' : '#F3F4F6',
              color: activeTab === 'coaches' ? 'white' : '#6B7280',
            }}
          >
            <Award size={18} className="inline mr-2" />
            Coaches
          </button>
        </div>
      </div>

      {/* Members List */}
      {activeTab === 'members' && (
        <div className="px-6 py-6 space-y-4 pb-24">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => onNavigate('memberProfile', member)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg text-white flex-shrink-0" 
                  style={{ backgroundColor: '#B4AEBD' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{member.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#54CE8F' }}>
                          Rank #{member.rank}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {member.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Matches</p>
                      <p className="text-gray-900">{member.matches}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Win Rate</p>
                      <p style={{ color: '#54CE8F' }}>{member.winRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Coaches List */}
      {activeTab === 'coaches' && (
        <div className="px-6 py-6 space-y-4 pb-24">
          {coaches.map((coach) => (
            <button
              key={coach.id}
              onClick={() => onNavigate('memberProfile', { ...coach, isCoach: true })}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg text-white flex-shrink-0" 
                  style={{ backgroundColor: '#B4AEBD' }}>
                  {coach.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{coach.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{coach.specialty}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#54CE8F' }}>
                          Coach
                        </span>
                        <span className="text-sm text-gray-500">{coach.experience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-900">{coach.rating}</span>
                      <span className="text-sm text-gray-500">(45 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
