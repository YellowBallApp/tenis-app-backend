import { ChevronLeft, Calendar, Clock, MapPin, Trophy } from 'lucide-react';

interface MatchDetailProps {
  match: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function MatchDetail({ match, onNavigate, onBack }: MatchDetailProps) {
  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <h1 className="text-2xl text-gray-900">Match Details</h1>
      </div>

      {/* Match Info Card */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="px-4 py-2 rounded-full text-sm text-white" style={{ backgroundColor: '#B4AEBD' }}>
              League Match
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl text-white mx-auto mb-3" 
                style={{ backgroundColor: '#54CE8F' }}>
                EK
              </div>
              <p className="text-lg text-gray-900">Emre Kaya</p>
              <p className="text-sm text-gray-500">Rank #8</p>
            </div>

            <div className="px-6">
              <div className="text-2xl text-gray-400">VS</div>
            </div>

            <div className="flex-1 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl text-white mx-auto mb-3" 
                style={{ backgroundColor: '#B4AEBD' }}>
                AY
              </div>
              <p className="text-lg text-gray-900">Ali Yıldız</p>
              <p className="text-sm text-gray-500">Rank #2</p>
            </div>
          </div>

          {/* Match Details */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Calendar size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-gray-900">December 6, 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Clock size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-gray-900">16:00 - 17:30</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <MapPin size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Court</p>
                <p className="text-gray-900">{match.court} - Clay</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Trophy size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">League</p>
                <p className="text-gray-900">Winter League 2024 - Division A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Head to Head */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Head to Head</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ color: '#54CE8F' }}>2</p>
              <p className="text-sm text-gray-500">Your Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-1 text-gray-400">1</p>
              <p className="text-sm text-gray-500">Draws</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ color: '#B4AEBD' }}>3</p>
              <p className="text-sm text-gray-500">Opponent Wins</p>
            </div>
          </div>
        </div>

        {/* Match Rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-3">Match Format</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Best of 3 sets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Tiebreak at 6-6 in each set</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Standard scoring system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Winner gets 3 league points</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('enterMatchResult', match)}
            className="flex-1 py-4 rounded-2xl text-white shadow-lg"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Enter Result
          </button>
          <button className="px-6 py-4 rounded-2xl border-2 text-gray-700" style={{ borderColor: '#B4AEBD' }}>
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
