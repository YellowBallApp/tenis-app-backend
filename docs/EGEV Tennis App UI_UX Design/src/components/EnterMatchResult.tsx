import { useState } from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';

interface EnterMatchResultProps {
  match: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function EnterMatchResult({ match, onNavigate, onBack }: EnterMatchResultProps) {
  const [sets, setSets] = useState([
    { player1: '', player2: '' },
    { player1: '', player2: '' },
    { player1: '', player2: '' },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const handleSetChange = (setIndex: number, player: 'player1' | 'player2', value: string) => {
    const newSets = [...sets];
    newSets[setIndex][player] = value;
    setSets(newSets);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('league');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#FAFCFB' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#54CE8F' }}>
          <CheckCircle size={56} color="white" />
        </div>
        <h2 className="text-2xl text-gray-900 mb-3">Result Submitted!</h2>
        <p className="text-gray-600 text-center mb-2">Match result has been recorded successfully</p>
        <p className="text-sm text-gray-500">Redirecting to league...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <h1 className="text-2xl text-gray-900">Enter Match Result</h1>
      </div>

      {/* Match Info */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900">{match.player1}</p>
              <p className="text-sm text-gray-500">vs</p>
              <p className="text-gray-900">{match.player2}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{match.date}</p>
              <p className="text-sm text-gray-500">{match.court}</p>
            </div>
          </div>
        </div>

        {/* Score Entry */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Enter Score</h3>

          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-100">
              <div className="col-span-2 text-sm text-gray-600">Player</div>
              <div className="text-center text-sm text-gray-600">Set 1</div>
              <div className="text-center text-sm text-gray-600">Set 2</div>
              <div className="text-center text-sm text-gray-600">Set 3</div>
            </div>

            {/* Player 1 Row */}
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white" 
                    style={{ backgroundColor: '#54CE8F' }}>
                    EK
                  </div>
                  <span className="text-sm text-gray-900 truncate">E. Kaya</span>
                </div>
              </div>
              {[0, 1, 2].map((setIndex) => (
                <input
                  key={setIndex}
                  type="number"
                  min="0"
                  max="7"
                  value={sets[setIndex].player1}
                  onChange={(e) => handleSetChange(setIndex, 'player1', e.target.value)}
                  className="w-full h-12 text-center rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-500 transition-all"
                  placeholder="-"
                />
              ))}
            </div>

            {/* Player 2 Row */}
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white" 
                    style={{ backgroundColor: '#B4AEBD' }}>
                    AY
                  </div>
                  <span className="text-sm text-gray-900 truncate">A. Yıldız</span>
                </div>
              </div>
              {[0, 1, 2].map((setIndex) => (
                <input
                  key={setIndex}
                  type="number"
                  min="0"
                  max="7"
                  value={sets[setIndex].player2}
                  onChange={(e) => handleSetChange(setIndex, 'player2', e.target.value)}
                  className="w-full h-12 text-center rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-500 transition-all"
                  placeholder="-"
                />
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
            <p className="text-sm text-gray-700">
              <span className="font-medium" style={{ color: '#54CE8F' }}>Note:</span> Enter the number of games won in each set. Third set is optional if match ended in 2 sets.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Additional Notes (Optional)</h3>
          <textarea
            placeholder="Add any notes about the match..."
            className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 resize-none transition-all"
            style={{ focusRingColor: '#54CE8F' }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: '#54CE8F' }}
        >
          Submit Result
        </button>
      </div>
    </div>
  );
}
