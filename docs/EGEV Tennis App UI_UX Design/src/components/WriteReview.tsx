import { useState } from 'react';
import { ChevronLeft, Star, CheckCircle } from 'lucide-react';

interface WriteReviewProps {
  member: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function WriteReview({ member, onNavigate, onBack }: WriteReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#FAFCFB' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#54CE8F' }}>
          <CheckCircle size={56} color="white" />
        </div>
        <h2 className="text-2xl text-gray-900 mb-3">Review Submitted!</h2>
        <p className="text-gray-600 text-center mb-2">Thank you for your feedback</p>
        <p className="text-sm text-gray-500">Redirecting back...</p>
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
        <h1 className="text-2xl text-gray-900">Write a Review</h1>
      </div>

      <div className="px-6 py-6">
        {/* Member Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl text-white" 
              style={{ backgroundColor: '#B4AEBD' }}>
              {member.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg text-gray-900 mb-1">{member.name}</h3>
              {member.isCoach ? (
                <p className="text-sm text-gray-500">{member.specialty}</p>
              ) : (
                <p className="text-sm text-gray-500">Rank #{member.rank} • {member.level}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Your Rating</h3>
          <div className="flex items-center justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={48}
                  fill={star <= (hoveredRating || rating) ? '#FBBF24' : 'none'}
                  color="#FBBF24"
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-gray-600">
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Review Categories (Optional) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Rate Specific Aspects</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Skill Level</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Sportsmanship</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Communication</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Written Review */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Your Review</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience playing with this member..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 resize-none"
            style={{ focusRingColor: '#54CE8F' }}
          />
          <p className="text-sm text-gray-500 mt-2">{comment.length} / 500 characters</p>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 rounded-2xl p-5 mb-6">
          <h4 className="text-sm mb-2" style={{ color: '#B4AEBD' }}>Review Guidelines</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• Be respectful and constructive</li>
            <li>• Focus on the playing experience</li>
            <li>• Avoid personal attacks or inappropriate language</li>
            <li>• Reviews are visible to all members</li>
          </ul>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || comment.length < 10}
          className="w-full py-4 rounded-2xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#54CE8F' }}
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}
