import { useState } from 'react';
import { ChevronLeft, MapPin, Sun, Clock, Info, User, Users, X } from 'lucide-react';

interface CourtDetailProps {
  court: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function CourtDetail({ court, onNavigate, onBack }: CourtDetailProps) {
  const [selectedDate, setSelectedDate] = useState('2024-12-05');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'singles' | 'doubles'>('singles');
  const [selectedOpponents, setSelectedOpponents] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'opponent' | 'partner'>('opponent');

  const timeSlots = [
    { time: '08:00', available: true },
    { time: '09:30', available: true },
    { time: '11:00', available: false },
    { time: '12:30', available: true },
    { time: '14:00', available: true },
    { time: '15:30', available: true },
    { time: '17:00', available: false },
    { time: '18:30', available: true },
    { time: '20:00', available: true },
  ];

  const dates = [
    { date: '2024-12-05', day: 'Thu', dayNum: '5' },
    { date: '2024-12-06', day: 'Fri', dayNum: '6' },
    { date: '2024-12-07', day: 'Sat', dayNum: '7' },
    { date: '2024-12-08', day: 'Sun', dayNum: '8' },
    { date: '2024-12-09', day: 'Mon', dayNum: '9' },
  ];

  const availablePlayers = [
    { id: 1, name: 'Ali Yıldız', rank: 2, level: 'Advanced' },
    { id: 2, name: 'Burak Aydın', rank: 3, level: 'Advanced' },
    { id: 3, name: 'Can Özkan', rank: 1, level: 'Expert' },
    { id: 4, name: 'Deniz Kara', rank: 4, level: 'Intermediate' },
    { id: 5, name: 'Efe Şahin', rank: 5, level: 'Intermediate' },
    { id: 6, name: 'Furkan Demir', rank: 6, level: 'Intermediate' },
  ];

  const handlePlayerSelect = (player: any) => {
    if (selectingFor === 'partner') {
      setSelectedPartner(player);
    } else {
      if (gameType === 'singles') {
        setSelectedOpponents([player]);
      } else {
        if (selectedOpponents.length < 2) {
          setSelectedOpponents([...selectedOpponents, player]);
        }
      }
    }
    setShowPlayerSelect(false);
  };

  const removeOpponent = (playerId: number) => {
    setSelectedOpponents(selectedOpponents.filter(p => p.id !== playerId));
  };

  const canContinue = selectedTime && 
    (gameType === 'singles' ? selectedOpponents.length === 1 : 
     (selectedOpponents.length === 2 && selectedPartner));

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <h1 className="text-2xl text-gray-900">Court Details</h1>
      </div>

      {/* Court Image */}
      <div className="h-56 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="px-3 py-1 rounded-full text-sm bg-white/90 text-gray-700">
            {court.surface}
          </div>
          <div className="px-3 py-1 rounded-full text-sm bg-white/90 text-gray-700 flex items-center gap-1">
            <Sun size={14} />
            {court.type}
          </div>
        </div>
        <div className="text-7xl">🎾</div>
      </div>

      {/* Court Info */}
      <div className="px-6 py-6 bg-white">
        <h2 className="text-xl text-gray-900 mb-3">{court.name}</h2>
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin size={18} />
          <span>{court.surface} • {court.type}</span>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <Info size={20} style={{ color: '#B4AEBD' }} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Standard session: 90 minutes. Bring your own rackets and balls or rent from the club desk.
          </p>
        </div>
      </div>

      {/* Game Type Selection */}
      <div className="px-6 py-6 bg-white border-t border-gray-100">
        <h3 className="text-lg text-gray-900 mb-4">Game Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setGameType('singles');
              setSelectedOpponents([]);
              setSelectedPartner(null);
            }}
            className="p-5 rounded-2xl border-2 transition-all"
            style={{
              borderColor: gameType === 'singles' ? '#54CE8F' : '#E5E7EB',
              backgroundColor: gameType === 'singles' ? '#F0FDF4' : 'white',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: gameType === 'singles' ? '#54CE8F' : '#F3F4F6' }}
              >
                <User size={28} color={gameType === 'singles' ? 'white' : '#9CA3AF'} />
              </div>
              <span className="text-sm" style={{ color: gameType === 'singles' ? '#54CE8F' : '#6B7280' }}>
                Tekler
              </span>
              <span className="text-xs text-gray-500">1 vs 1</span>
            </div>
          </button>

          <button
            onClick={() => {
              setGameType('doubles');
              setSelectedOpponents([]);
              setSelectedPartner(null);
            }}
            className="p-5 rounded-2xl border-2 transition-all"
            style={{
              borderColor: gameType === 'doubles' ? '#54CE8F' : '#E5E7EB',
              backgroundColor: gameType === 'doubles' ? '#F0FDF4' : 'white',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: gameType === 'doubles' ? '#54CE8F' : '#F3F4F6' }}
              >
                <Users size={28} color={gameType === 'doubles' ? 'white' : '#9CA3AF'} />
              </div>
              <span className="text-sm" style={{ color: gameType === 'doubles' ? '#54CE8F' : '#6B7280' }}>
                Çiftler
              </span>
              <span className="text-xs text-gray-500">2 vs 2</span>
            </div>
          </button>
        </div>
      </div>

      {/* Player Selection */}
      <div className="px-6 py-6 bg-white border-t border-gray-100">
        <h3 className="text-lg text-gray-900 mb-4">
          {gameType === 'singles' ? 'Rakip Seçin' : 'Oyuncular'}
        </h3>

        {/* Singles - Select Opponent */}
        {gameType === 'singles' && (
          <div>
            <button
              onClick={() => {
                setSelectingFor('opponent');
                setShowPlayerSelect(true);
              }}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 transition-all hover:border-green-500 hover:bg-green-50"
            >
              {selectedOpponents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <User size={32} />
                  <span className="text-sm">Rakip Oyuncu Seçin</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: '#B4AEBD' }}
                    >
                      {selectedOpponents[0].name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">{selectedOpponents[0].name}</p>
                      <p className="text-sm text-gray-500">Rank #{selectedOpponents[0].rank}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOpponent(selectedOpponents[0].id);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} color="#6B7280" />
                  </button>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Doubles - Select Partner and Opponents */}
        {gameType === 'doubles' && (
          <div className="space-y-4">
            {/* Partner */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Partneriniz</label>
              <button
                onClick={() => {
                  setSelectingFor('partner');
                  setShowPlayerSelect(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 transition-all hover:border-green-500 hover:bg-green-50"
              >
                {!selectedPartner ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <User size={28} />
                    <span className="text-sm">Partner Seçin</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: '#54CE8F' }}
                      >
                        {selectedPartner.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900">{selectedPartner.name}</p>
                        <p className="text-sm text-gray-500">Rank #{selectedPartner.rank}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartner(null);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <X size={16} color="#6B7280" />
                    </button>
                  </div>
                )}
              </button>
            </div>

            {/* Opponents */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Rakip Takım (2 oyuncu)</label>
              <div className="space-y-2">
                {[0, 1].map((index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!selectedOpponents[index]) {
                        setSelectingFor('opponent');
                        setShowPlayerSelect(true);
                      }
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 transition-all hover:border-green-500 hover:bg-green-50"
                  >
                    {!selectedOpponents[index] ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <User size={24} />
                        <span className="text-sm">Rakip {index + 1}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
                            style={{ backgroundColor: '#B4AEBD' }}
                          >
                            {selectedOpponents[index].name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="text-left">
                            <p className="text-gray-900 text-sm">{selectedOpponents[index].name}</p>
                            <p className="text-xs text-gray-500">Rank #{selectedOpponents[index].rank}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOpponent(selectedOpponents[index].id);
                          }}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <X size={16} color="#6B7280" />
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div className="px-6 py-6">
        <h3 className="text-lg text-gray-900 mb-4">Select Date</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {dates.map((dateItem) => (
            <button
              key={dateItem.date}
              onClick={() => setSelectedDate(dateItem.date)}
              className="flex-shrink-0 w-20 py-4 rounded-2xl border-2 transition-all"
              style={{
                borderColor: selectedDate === dateItem.date ? '#54CE8F' : '#E5E7EB',
                backgroundColor: selectedDate === dateItem.date ? '#54CE8F' : 'white',
              }}
            >
              <p className="text-sm mb-1" style={{ color: selectedDate === dateItem.date ? 'white' : '#6B7280' }}>
                {dateItem.day}
              </p>
              <p className="text-xl" style={{ color: selectedDate === dateItem.date ? 'white' : '#1F2937' }}>
                {dateItem.dayNum}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="px-6 pb-32">
        <h3 className="text-lg text-gray-900 mb-4">Available Time Slots</h3>
        <div className="grid grid-cols-3 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => slot.available && setSelectedTime(slot.time)}
              disabled={!slot.available}
              className="py-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: selectedTime === slot.time ? '#54CE8F' : (slot.available ? '#E5E7EB' : '#F3F4F6'),
                backgroundColor: selectedTime === slot.time ? '#54CE8F' : (slot.available ? 'white' : '#F9FAFB'),
                opacity: slot.available ? 1 : 0.5,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <Clock size={18} color={selectedTime === slot.time ? 'white' : (slot.available ? '#1F2937' : '#9CA3AF')} />
                <p className="text-sm" style={{ color: selectedTime === slot.time ? 'white' : (slot.available ? '#1F2937' : '#9CA3AF') }}>
                  {slot.time}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      {canContinue && (
        <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
          <button
            onClick={() => onNavigate('reservationConfirm', { court, date: selectedDate, time: selectedTime, gameType, opponents: selectedOpponents, partner: selectedPartner })}
            className="w-full py-4 rounded-2xl text-white shadow-lg"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Continue to Booking
          </button>
        </div>
      )}

      {/* Player Selection Modal */}
      {showPlayerSelect && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl" style={{ maxHeight: '80vh' }}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl text-gray-900">
                  {selectingFor === 'partner' ? 'Partner Seçin' : 'Rakip Seçin'}
                </h3>
                <button
                  onClick={() => setShowPlayerSelect(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={20} color="#6B7280" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {selectingFor === 'partner' ? 'Maç için bir partner seçin' : 'Karşı takımdan bir oyuncu seçin'}
              </p>
            </div>
            
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(80vh - 120px)' }}>
              <div className="space-y-2">
                {availablePlayers
                  .filter(p => {
                    // Partner seçerken rakipleri gösterme
                    if (selectingFor === 'partner') {
                      return !selectedOpponents.find(opp => opp.id === p.id);
                    }
                    // Rakip seçerken partner'ı gösterme
                    return selectedPartner?.id !== p.id && !selectedOpponents.find(opp => opp.id === p.id);
                  })
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className="w-full p-4 rounded-2xl border border-gray-200 transition-all hover:border-green-500 hover:bg-green-50 active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: '#B4AEBD' }}
                        >
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-gray-900">{player.name}</p>
                          <p className="text-sm text-gray-500">Rank #{player.rank} • {player.level}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}