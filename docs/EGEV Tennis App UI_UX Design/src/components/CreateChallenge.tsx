import { useState } from 'react';
import { ChevronLeft, Search, Calendar, Clock, MapPin } from 'lucide-react';

interface CreateChallengeProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function CreateChallenge({ onNavigate, onBack }: CreateChallengeProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const members = [
    { id: 1, name: 'Ali Yıldız', rank: 2, level: 'Advanced' },
    { id: 2, name: 'Burak Aydın', rank: 3, level: 'Advanced' },
    { id: 3, name: 'Can Özkan', rank: 1, level: 'Expert' },
    { id: 4, name: 'Deniz Kara', rank: 4, level: 'Intermediate' },
  ];

  const courts = [
    { id: 1, name: 'Court 1', type: 'Clay - Outdoor' },
    { id: 2, name: 'Court 2', type: 'Hard Court - Outdoor' },
    { id: 3, name: 'Court 3', type: 'Hard Court - Indoor' },
  ];

  const handleCreateChallenge = () => {
    const challenge = {
      player: selectedPlayer,
      court: selectedCourt,
      date: selectedDate,
      time: selectedTime,
    };
    onNavigate('challengeDetail', challenge);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <h1 className="text-2xl text-gray-900">Create Challenge</h1>
      </div>

      <div className="px-6 py-6 pb-32">
        {/* Select Player */}
        <div className="mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Select Player</h3>
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search size={20} color="#9CA3AF" />
            </div>
            <input
              type="text"
              placeholder="Search members..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedPlayer(member)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 transition-all text-left"
                style={{
                  borderColor: selectedPlayer?.id === member.id ? '#54CE8F' : '#E5E7EB',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" 
                    style={{ backgroundColor: '#B4AEBD' }}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1">{member.name}</p>
                    <p className="text-sm text-gray-500">Rank #{member.rank} • {member.level}</p>
                  </div>
                  {selectedPlayer?.id === member.id && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Select Court */}
        <div className="mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Select Court</h3>
          <div className="space-y-3">
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => setSelectedCourt(court)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 transition-all text-left"
                style={{
                  borderColor: selectedCourt?.id === court.id ? '#54CE8F' : '#E5E7EB',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                    <MapPin size={24} style={{ color: '#B4AEBD' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1">{court.name}</p>
                    <p className="text-sm text-gray-500">{court.type}</p>
                  </div>
                  {selectedCourt?.id === court.id && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Select Date & Time */}
        <div className="mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Select Date & Time</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Date</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Calendar size={20} color="#9CA3AF" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Time</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Clock size={20} color="#9CA3AF" />
                </div>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message (Optional) */}
        <div className="mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Message (Optional)</h3>
          <textarea
            placeholder="Add a message to your challenge..."
            className="w-full h-24 p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 resize-none"
          />
        </div>
      </div>

      {/* Create Button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleCreateChallenge}
          disabled={!selectedPlayer || !selectedCourt || !selectedDate || !selectedTime}
          className="w-full py-4 rounded-2xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#54CE8F' }}
        >
          Send Challenge
        </button>
      </div>
    </div>
  );
}
