import { ChevronLeft, Swords, Calendar, Trophy, Bell, MessageCircle, Users } from 'lucide-react';

interface NotificationsProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function Notifications({ onNavigate, onBack }: NotificationsProps) {
  const notifications = [
    {
      id: 1,
      type: 'challenge',
      title: 'New Challenge Received',
      message: 'Ahmet Yılmaz challenged you to a match',
      time: '5 minutes ago',
      unread: true,
      icon: Swords,
      color: '#B4AEBD',
    },
    {
      id: 2,
      type: 'reservation',
      title: 'Reservation Confirmed',
      message: 'Court 2 - Tomorrow at 16:00',
      time: '1 hour ago',
      unread: true,
      icon: Calendar,
      color: '#54CE8F',
    },
    {
      id: 3,
      type: 'match',
      title: 'Match Reminder',
      message: 'Your match with Ali Yıldız starts in 2 hours',
      time: '2 hours ago',
      unread: false,
      icon: Trophy,
      color: '#B4AEBD',
    },
    {
      id: 4,
      type: 'message',
      title: 'New Message',
      message: 'Can Özkan sent you a message',
      time: '3 hours ago',
      unread: false,
      icon: MessageCircle,
      color: '#54CE8F',
    },
    {
      id: 5,
      type: 'league',
      title: 'League Update',
      message: 'You moved up to rank #8 in the league!',
      time: '1 day ago',
      unread: false,
      icon: Trophy,
      color: '#54CE8F',
    },
    {
      id: 6,
      type: 'challenge',
      title: 'Challenge Accepted',
      message: 'Burak Aydın accepted your challenge',
      time: '1 day ago',
      unread: false,
      icon: Swords,
      color: '#B4AEBD',
    },
    {
      id: 7,
      type: 'member',
      title: 'New Member Review',
      message: 'Emre Demir left you a 5-star review',
      time: '2 days ago',
      unread: false,
      icon: Users,
      color: '#B4AEBD',
    },
    {
      id: 8,
      type: 'reservation',
      title: 'Reservation Cancelled',
      message: 'Court 3 reservation for Dec 3 was cancelled',
      time: '3 days ago',
      unread: false,
      icon: Calendar,
      color: '#9CA3AF',
    },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-gray-900">Notifications</h1>
          <button className="text-sm" style={{ color: '#54CE8F' }}>
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 rounded-full text-sm text-white whitespace-nowrap" style={{ backgroundColor: '#54CE8F' }}>
            All
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            Challenges
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            Matches
          </button>
          <button className="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 whitespace-nowrap">
            Reservations
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 py-4 space-y-3 pb-24">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <button
              key={notification.id}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md text-left relative"
              style={{
                backgroundColor: notification.unread ? '#F0FDF4' : 'white',
              }}
            >
              {notification.unread && (
                <div className="absolute top-5 right-5 w-2 h-2 rounded-full" style={{ backgroundColor: '#54CE8F' }} />
              )}
              
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${notification.color}20` }}
                >
                  <Icon size={22} style={{ color: notification.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State (hidden when there are notifications) */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 px-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#F3F4F6' }}>
            <Bell size={40} color="#9CA3AF" />
          </div>
          <h3 className="text-xl text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-600 text-center">You're all caught up! Check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
