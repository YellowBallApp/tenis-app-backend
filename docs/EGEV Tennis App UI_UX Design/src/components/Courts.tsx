import { Search, Filter, MapPin, Sun, CloudRain } from 'lucide-react';

interface CourtsProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function Courts({ onNavigate }: CourtsProps) {
  const courts = [
    {
      id: 1,
      name: 'Court 1',
      surface: 'Clay',
      type: 'Outdoor',
      available: true,
      nextAvailable: '14:00',
      image: 'tennis court clay',
    },
    {
      id: 2,
      name: 'Court 2',
      surface: 'Hard Court',
      type: 'Outdoor',
      available: true,
      nextAvailable: '15:30',
      image: 'tennis court outdoor',
    },
    {
      id: 3,
      name: 'Court 3',
      surface: 'Hard Court',
      type: 'Indoor',
      available: false,
      nextAvailable: '18:00',
      image: 'tennis court indoor',
    },
    {
      id: 4,
      name: 'Court 4',
      surface: 'Grass',
      type: 'Outdoor',
      available: true,
      nextAvailable: '16:00',
      image: 'tennis court grass',
    },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl text-gray-900 mb-4">Court Reservation</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={20} color="#9CA3AF" />
          </div>
          <input
            type="text"
            placeholder="Search courts..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2"
            style={{ focusRingColor: '#54CE8F' }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 rounded-full text-sm text-white whitespace-nowrap" style={{ backgroundColor: '#54CE8F' }}>
            All Courts
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            Indoor
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            Outdoor
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            <Filter size={16} className="inline mr-1" />
            Filters
          </button>
        </div>
      </div>

      {/* Courts List */}
      <div className="px-6 py-6 space-y-4 pb-24">
        {courts.map((court) => (
          <button
            key={court.id}
            onClick={() => onNavigate('courtDetail', court)}
            className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md"
          >
            {/* Court Image */}
            <div className="h-40 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center relative">
              <div className="absolute top-3 right-3 flex gap-2">
                <div className="px-3 py-1 rounded-full text-xs bg-white/90 text-gray-700">
                  {court.surface}
                </div>
                <div className="px-3 py-1 rounded-full text-xs bg-white/90 text-gray-700 flex items-center gap-1">
                  {court.type === 'Indoor' ? <CloudRain size={12} /> : <Sun size={12} />}
                  {court.type}
                </div>
              </div>
              <div className="text-6xl text-gray-300">🎾</div>
            </div>

            {/* Court Info */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="text-left">
                  <h3 className="text-lg text-gray-900 mb-1">{court.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{court.surface} • {court.type}</span>
                  </div>
                </div>
                {court.available ? (
                  <div className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#54CE8F' }}>
                    Available
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                    Busy
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-600">Next available: {court.nextAvailable}</p>
                <button className="text-sm" style={{ color: '#54CE8F' }}>
                  Book Now →
                </button>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
