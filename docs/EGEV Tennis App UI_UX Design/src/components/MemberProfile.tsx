import { ChevronLeft, Trophy, TrendingUp, Calendar, Star, MessageCircle, Swords, Phone, Mail } from 'lucide-react';

interface MemberProfileProps {
  member: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function MemberProfile({ member, onNavigate, onBack }: MemberProfileProps) {
  const reviews = [
    { id: 1, author: 'Emre Kaya', rating: 5, comment: 'Great player! Very skilled and friendly. Enjoyed our match.', date: '2 days ago' },
    { id: 2, author: 'Can Özkan', rating: 4, comment: 'Good match. Strong backhand and good sportsmanship.', date: '1 week ago' },
    { id: 3, author: 'Deniz Kara', rating: 5, comment: 'Excellent technique and very professional approach.', date: '2 weeks ago' },
  ];

  const recentMatches = [
    { opponent: 'Emre Kaya', result: 'Won', score: '6-4, 6-3', date: 'Dec 2' },
    { opponent: 'Can Özkan', result: 'Lost', score: '4-6, 6-7', date: 'Nov 28' },
    { opponent: 'Burak Aydın', result: 'Won', score: '7-5, 6-4', date: 'Nov 25' },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{ backgroundColor: '#B4AEBD' }}>
        <button onClick={onBack} className="mb-6">
          <ChevronLeft size={24} color="white" />
        </button>
        
        {/* Profile Info */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl text-white mx-auto mb-4" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            {member.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <h1 className="text-2xl text-white mb-2">{member.name}</h1>
          {member.isCoach ? (
            <div>
              <p className="text-white/80 mb-2">{member.specialty}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                  {member.experience}
                </span>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white">
                  <Star size={14} fill="white" />
                  <span className="text-sm">{member.rating}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                Rank #{member.rank}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                {member.level}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        {!member.isCoach && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Trophy size={20} color="white" className="mx-auto mb-2" />
              <p className="text-white text-lg">{member.matches}</p>
              <p className="text-white/70 text-xs">Matches</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <TrendingUp size={20} color="white" className="mx-auto mb-2" />
              <p className="text-white text-lg">{member.winRate}%</p>
              <p className="text-white/70 text-xs">Win Rate</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Calendar size={20} color="white" className="mx-auto mb-2" />
              <p className="text-white text-lg">2024</p>
              <p className="text-white/70 text-xs">Member Since</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => onNavigate('createChallenge')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
              <Swords size={20} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">Challenge</span>
          </button>

          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
              <MessageCircle size={20} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">Message</span>
          </button>

          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
              <Phone size={20} color="white" />
            </div>
            <span className="text-xs text-gray-700 text-center">Call</span>
          </button>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={18} />
              <span className="text-sm">{member.name.toLowerCase().replace(' ', '.')}@email.com</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone size={18} />
              <span className="text-sm">+90 532 123 4567</span>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        {!member.isCoach && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg text-gray-900 mb-4">Recent Matches</h3>
            <div className="space-y-3">
              {recentMatches.map((match, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-gray-900 mb-1">vs {match.opponent}</p>
                    <p className="text-sm text-gray-500">{match.score}</p>
                  </div>
                  <div className="text-right">
                    <span 
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: match.result === 'Won' ? '#DCFCE7' : '#FEE2E2',
                        color: match.result === 'Won' ? '#16A34A' : '#DC2626',
                      }}
                    >
                      {match.result}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{match.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900">Reviews</h3>
            <button 
              onClick={() => onNavigate('writeReview', member)}
              className="text-sm" 
              style={{ color: '#54CE8F' }}
            >
              Write Review
            </button>
          </div>

          {/* Overall Rating */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="text-center">
              <p className="text-3xl mb-1" style={{ color: '#54CE8F' }}>4.6</p>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} fill="#FBBF24" color="#FBBF24" />
                ))}
              </div>
              <p className="text-xs text-gray-500">Based on {reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{rating}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        backgroundColor: '#54CE8F',
                        width: rating === 5 ? '70%' : rating === 4 ? '20%' : '10%'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-900 mb-1">{review.author}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={12} 
                          fill={star <= review.rating ? '#FBBF24' : 'none'} 
                          color="#FBBF24" 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
