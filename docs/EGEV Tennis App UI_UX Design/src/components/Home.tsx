import { Calendar, Swords, Trophy, Bell, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface HomeProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const upcomingChallenges = [
    {
      id: 1,
      challenger: 'Ahmet Yılmaz',
      court: 'Court 3 - Indoor',
      time: 'Today, 18:00',
      status: 'pending',
    },
    {
      id: 2,
      challenger: 'Mehmet Demir',
      court: 'Court 1 - Clay',
      time: 'Tomorrow, 15:00',
      status: 'pending',
    },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{ backgroundColor: '#B4AEBD' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/80 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl text-white">Emre Kaya</h1>
          </div>
          <button 
            onClick={() => onNavigate('notifications')}
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative"
          >
            <Bell size={22} color="white" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: '#54CE8F' }} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <Trophy size={24} color="white" className="mx-auto mb-2" />
            <p className="text-white text-xl">12</p>
            <p className="text-white/70 text-xs">Wins</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <TrendingUp size={24} color="white" className="mx-auto mb-2" />
            <p className="text-white text-xl">#8</p>
            <p className="text-white/70 text-xs">Ranking</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <Calendar size={24} color="white" className="mx-auto mb-2" />
            <p className="text-white text-xl">3</p>
            <p className="text-white/70 text-xs">Upcoming</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-6">
        <h2 className="text-lg text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => onNavigate('courts')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
              <Calendar size={24} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">Reserve Court</span>
          </button>

          <button 
            onClick={() => onNavigate('createChallenge')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
              <Swords size={24} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">Create Challenge</span>
          </button>

          <button 
            onClick={() => onNavigate('league')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
              <Trophy size={24} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">League Overview</span>
          </button>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="px-6 py-4">
        <h2 className="text-lg text-gray-900 mb-4">Upcoming Reservations</h2>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-gray-900 mb-1">Court 2 - Outdoor Clay</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Tomorrow, 16:00 - 17:30</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#54CE8F' }}>
              Confirmed
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <button className="text-sm" style={{ color: '#B4AEBD' }}>View Details →</button>
          </div>
        </div>
      </div>

      {/* Challenges Received */}
      <div className="px-6 py-4 pb-8">
        <h2 className="text-lg text-gray-900 mb-4">Challenges Received</h2>
        <div className="space-y-3">
          {upcomingChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#B4AEBD' }}>
                    {challenge.challenger.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-gray-900 mb-1">{challenge.challenger}</p>
                    <p className="text-sm text-gray-600">{challenge.court}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Clock size={14} />
                      <span>{challenge.time}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onNavigate('challengeDetail', challenge)}
                  className="flex-1 py-3 rounded-xl text-white transition-all" 
                  style={{ backgroundColor: '#54CE8F' }}
                >
                  <CheckCircle size={18} className="inline mr-1" />
                  Accept
                </button>
                <button className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 transition-all">
                  <XCircle size={18} className="inline mr-1" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
