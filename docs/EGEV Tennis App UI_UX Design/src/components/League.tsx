import { Trophy, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

interface LeagueProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function League({ onNavigate }: LeagueProps) {
  const standings = [
    { rank: 1, name: 'Can Özkan', matches: 15, wins: 12, losses: 3, points: 36 },
    { rank: 2, name: 'Ali Yıldız', matches: 14, wins: 11, losses: 3, points: 33 },
    { rank: 3, name: 'Burak Aydın', matches: 16, wins: 10, losses: 6, points: 30 },
    { rank: 4, name: 'Deniz Kara', matches: 13, wins: 9, losses: 4, points: 27 },
    { rank: 5, name: 'Efe Şahin', matches: 15, wins: 9, losses: 6, points: 27 },
    { rank: 6, name: 'Furkan Demir', matches: 14, wins: 8, losses: 6, points: 24 },
    { rank: 7, name: 'Gökhan Yurt', matches: 13, wins: 7, losses: 6, points: 21 },
    { rank: 8, name: 'Emre Kaya', matches: 12, wins: 7, losses: 5, points: 21, isUser: true },
  ];

  const upcomingMatches = [
    { id: 1, player1: 'Emre Kaya', player2: 'Ali Yıldız', date: 'Dec 6', time: '16:00', court: 'Court 2' },
    { id: 2, player1: 'Can Özkan', player2: 'Burak Aydın', date: 'Dec 7', time: '14:00', court: 'Court 1' },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{ backgroundColor: '#B4AEBD' }}>
        <h1 className="text-2xl text-white mb-6">League Overview</h1>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/30">
              <Trophy size={24} color="white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Winter League 2024</p>
              <p className="text-white text-lg">Division A</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs mb-1">Your Rank</p>
              <p className="text-white text-xl">#8</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1">Matches</p>
              <p className="text-white text-xl">12</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1">Win Rate</p>
              <p className="text-white text-xl">58%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex px-6">
          <button className="flex-1 py-4 border-b-2 text-sm" style={{ borderColor: '#54CE8F', color: '#54CE8F' }}>
            Standings
          </button>
          <button className="flex-1 py-4 border-b-2 border-transparent text-sm text-gray-500">
            Matches
          </button>
          <button className="flex-1 py-4 border-b-2 border-transparent text-sm text-gray-500">
            Statistics
          </button>
        </div>
      </div>

      {/* Upcoming Matches */}
      <div className="px-6 py-6">
        <h2 className="text-lg text-gray-900 mb-4">Upcoming Matches</h2>
        <div className="space-y-3">
          {upcomingMatches.map((match) => (
            <button
              key={match.id}
              onClick={() => onNavigate('matchDetail', match)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">{match.player1}</p>
                  <p className="text-sm text-gray-500">vs</p>
                  <p className="text-gray-900 mt-1">{match.player2}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{match.date}</p>
                  <p className="text-sm text-gray-500">{match.time}</p>
                  <p className="text-xs text-gray-400 mt-1">{match.court}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm" style={{ color: '#B4AEBD' }}>League Match</p>
                <ChevronRight size={18} color="#9CA3AF" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="px-6 pb-24">
        <h2 className="text-lg text-gray-900 mb-4">League Standings</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs text-gray-600">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">W/L</div>
            <div className="col-span-2 text-center">Played</div>
            <div className="col-span-2 text-center">Pts</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {standings.map((player) => (
              <div
                key={player.rank}
                className="grid grid-cols-12 gap-2 px-4 py-4 text-sm transition-colors hover:bg-gray-50"
                style={{
                  backgroundColor: player.isUser ? '#F0FDF4' : 'transparent',
                }}
              >
                <div className="col-span-1 flex items-center">
                  {player.rank <= 3 ? (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ 
                        backgroundColor: player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : '#CD7F32' 
                      }}
                    >
                      {player.rank}
                    </div>
                  ) : (
                    <span className="text-gray-600">{player.rank}</span>
                  )}
                </div>
                <div className="col-span-5 flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white mr-3" 
                    style={{ backgroundColor: player.isUser ? '#54CE8F' : '#B4AEBD' }}>
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-gray-900 truncate">{player.name}</span>
                  {player.isUser && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#54CE8F' }}>
                      You
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-center flex items-center justify-center text-gray-600">
                  {player.wins}/{player.losses}
                </div>
                <div className="col-span-2 text-center flex items-center justify-center text-gray-600">
                  {player.matches}
                </div>
                <div className="col-span-2 text-center flex items-center justify-center" style={{ color: '#54CE8F' }}>
                  {player.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
