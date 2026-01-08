import { useEffect, useState } from 'react';
import { HiStar, HiCheck, HiX, HiUser } from 'react-icons/hi';
import { MdComment } from 'react-icons/md';
import Layout from '../components/Layout';
import api from '../utils/api';

interface Review {
  id: number;
  coachId: string;
  userId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    surname?: string;
    email: string;
  };
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'pending') {
        response = await api.get('/coach-reviews/all?onlyApproved=false');
        const allReviews = response.data.data || [];
        setReviews(allReviews.filter((r: Review) => !r.isApproved));
      } else if (filter === 'approved') {
        response = await api.get('/coach-reviews/all?onlyApproved=true');
        setReviews(response.data.data || []);
      } else {
        // Tüm yorumları getir
        response = await api.get('/coach-reviews/all');
        setReviews(response.data.data || []);
      }
    } catch (error) {
      console.error('Reviews fetch error:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/coach-reviews/${id}/approve`);
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Onaylama başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/coach-reviews/${id}`);
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar
            key={star}
            className={`text-xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="glass-strong rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soft-green mx-auto mb-4"></div>
            <p className="text-soft-white/80">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Title Section */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-soft-white mb-1 md:mb-2">
                Yorum Yönetimi
              </h1>
              <p className="text-sm md:text-base text-soft-white/70">
                Toplam {reviews.length} yorum
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="glass rounded-xl p-1 flex space-x-1 flex-shrink-0">
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-xs md:text-sm ${
                  filter === 'pending'
                    ? 'bg-soft-purple text-soft-white font-bold shadow-lg'
                    : 'text-soft-white/70 hover:text-soft-white'
                }`}
              >
                Bekleyenler
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-xs md:text-sm ${
                  filter === 'approved'
                    ? 'bg-soft-green text-soft-navy font-bold shadow-lg'
                    : 'text-soft-white/70 hover:text-soft-white'
                }`}
              >
                Onaylananlar
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-xs md:text-sm ${
                  filter === 'all'
                    ? 'bg-slate-600 text-soft-white font-bold shadow-lg'
                    : 'text-soft-white/70 hover:text-soft-white'
                }`}
              >
                Tümü
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <MdComment className="text-6xl text-soft-white/30 mx-auto mb-4" />
            <p className="text-soft-white/60 text-lg">
              {filter === 'pending' ? 'Bekleyen yorum bulunmuyor' : 'Henüz yorum bulunmuyor'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="glass-strong rounded-2xl p-4 md:p-6 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-soft-green flex items-center justify-center flex-shrink-0">
                      <HiUser className="text-xl md:text-2xl text-soft-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-soft-white font-bold text-base md:text-lg truncate">
                        {review.user.name} {review.user.surname || ''}
                      </h3>
                      <p className="text-soft-white/60 text-xs md:text-sm truncate">{review.user.email}</p>
                      <div className="mt-2">{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2 flex-shrink-0">
                    {review.isApproved ? (
                      <span className="px-2 md:px-3 py-1 bg-soft-green text-soft-navy text-xs md:text-sm font-bold rounded-full whitespace-nowrap">
                        ✓ Onaylı
                      </span>
                    ) : (
                      <span className="px-2 md:px-3 py-1 bg-soft-purple text-soft-white text-xs md:text-sm font-bold rounded-full whitespace-nowrap">
                        ⏳ Bekliyor
                      </span>
                    )}
                    <span className="text-soft-white/50 text-xs md:text-sm whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="glass rounded-xl p-3 md:p-4 mb-4">
                  <p className="text-soft-white/90 leading-relaxed text-sm md:text-base">{review.comment}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 pt-4 border-t border-white/10">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex-1 px-4 py-2 bg-soft-green hover:bg-soft-green-light text-soft-navy font-bold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-soft-green/50 flex items-center justify-center space-x-2 text-sm md:text-base"
                    >
                      <HiCheck className="text-lg md:text-xl" />
                      <span>Onayla</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex-1 px-4 py-2 glass hover:bg-red-500/20 hover:border-red-400 text-soft-white/80 hover:text-red-200 font-medium rounded-lg transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    <HiX className="text-lg md:text-xl" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reviews;

