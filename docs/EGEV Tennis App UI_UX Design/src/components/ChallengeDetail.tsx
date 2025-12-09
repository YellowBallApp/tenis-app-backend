import { ChevronLeft, Calendar, Clock, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ChallengeDetailProps {
  challenge: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function ChallengeDetail({ challenge, onNavigate, onBack }: ChallengeDetailProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      onNavigate('home');
    }, 2000);
  };

  if (accepted) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#FAFCFB' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#54CE8F' }}>
          <CheckCircle size={56} color="white" />
        </div>
        <h2 className="text-2xl text-gray-900 mb-3">Challenge Accepted!</h2>
        <p className="text-gray-600 text-center mb-2">The match has been added to your schedule</p>
        <p className="text-sm text-gray-500">Redirecting to home...</p>
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
        <h1 className="text-2xl text-gray-900">Challenge Details</h1>
      </div>

      <div className="px-6 py-6">
        {/* Challenge Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl text-white mx-auto mb-4" 
              style={{ backgroundColor: '#B4AEBD' }}>
              {challenge.challenger ? challenge.challenger.split(' ').map((n: string) => n[0]).join('') : 'AY'}
            </div>
            <h2 className="text-xl text-gray-900 mb-1">
              {challenge.challenger || 'Ahmet Yılmaz'}
            </h2>
            <p className="text-sm text-gray-500">has challenged you to a match!</p>
          </div>

          {/* Match Details */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Calendar size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-gray-900">{challenge.time || 'Today, 18:00'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <MapPin size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Court</p>
                <p className="text-gray-900">{challenge.court || 'Court 3 - Indoor'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Clock size={20} style={{ color: '#B4AEBD' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-gray-900">90 minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle size={20} style={{ color: '#B4AEBD' }} />
            <h3 className="text-lg text-gray-900">Message</h3>
          </div>
          <p className="text-gray-600">
            "Hey! I'd like to challenge you to a friendly match. Looking forward to playing with you!"
          </p>
        </div>

        {/* Player Stats Comparison */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Player Comparison</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Rank</span>
                <span className="text-gray-600">Rank</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg" style={{ color: '#54CE8F' }}>#8</span>
                <span className="text-gray-400">vs</span>
                <span className="text-lg" style={{ color: '#B4AEBD' }}>#5</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Win Rate</span>
                <span className="text-gray-600">Win Rate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg" style={{ color: '#54CE8F' }}>58%</span>
                <span className="text-gray-400">vs</span>
                <span className="text-lg" style={{ color: '#B4AEBD' }}>62%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Matches Played</span>
                <span className="text-gray-600">Matches Played</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg" style={{ color: '#54CE8F' }}>12</span>
                <span className="text-gray-400">vs</span>
                <span className="text-lg" style={{ color: '#B4AEBD' }}>15</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 py-4 rounded-2xl text-white shadow-lg"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Accept Challenge
          </button>
          <button 
            onClick={onBack}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
