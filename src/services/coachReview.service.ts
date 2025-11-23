import coachReviewRepository from "../repositories/coachReview.repository";
import coachRepository from "../repositories/coach.repository";
import { CoachReview } from "../entities/coachReview.entity";
import { AppError } from "../utils/error/app.error";

const coachReviewService = {
  create: async (reviewData: {
    coachId: string;
    userId: string;
    rating: number;
    comment: string;
  }): Promise<CoachReview> => {
    // Rating validasyonu
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new AppError("INVALID_RATING");
    }

    // Comment validasyonu
    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new AppError("COMMENT_REQUIRED");
    }

    // Coach var mı kontrol et
    await coachRepository.findById(reviewData.coachId);

    // Kullanıcı daha önce bu antrenöre review yazmış mı kontrol et
    const existingReview = await coachReviewRepository.findByCoachAndUser(
      reviewData.coachId,
      reviewData.userId
    );

    if (existingReview) {
      // Mevcut review'ı güncelle
      return await coachReviewRepository.update(existingReview.id, {
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
    }

    // Yeni review oluştur
    const review = await coachReviewRepository.create({
      coachId: reviewData.coachId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim()
    });

    // Coach'un ortalama rating'ini güncelle
    await coachReviewService.updateCoachRating(reviewData.coachId);

    return review;
  },

  getByCoachId: async (coachId: string): Promise<CoachReview[]> => {
    return await coachReviewRepository.findByCoachId(coachId);
  },

  getByUserId: async (userId: string): Promise<CoachReview[]> => {
    return await coachReviewRepository.findByUserId(userId);
  },

  update: async (id: number, reviewData: {
    rating?: number;
    comment?: string;
  }): Promise<CoachReview> => {
    if (reviewData.rating !== undefined && (reviewData.rating < 1 || reviewData.rating > 5)) {
      throw new AppError("INVALID_RATING");
    }

    const review = await coachReviewRepository.findById(id);
    
    const updateData: Partial<CoachReview> = {};
    if (reviewData.rating !== undefined) updateData.rating = reviewData.rating;
    if (reviewData.comment !== undefined) updateData.comment = reviewData.comment.trim();

    const updatedReview = await coachReviewRepository.update(id, updateData);

    // Coach'un ortalama rating'ini güncelle
    if (reviewData.rating !== undefined) {
      await coachReviewService.updateCoachRating(review.coachId);
    }

    return updatedReview;
  },

  delete: async (id: number): Promise<void> => {
    const review = await coachReviewRepository.findById(id);
    const coachId = review.coachId;
    
    await coachReviewRepository.delete(id);

    // Coach'un ortalama rating'ini güncelle
    await coachReviewService.updateCoachRating(coachId);
  },

  updateCoachRating: async (coachId: string): Promise<void> => {
    const averageRating = await coachReviewRepository.getAverageRating(coachId);
    await coachRepository.update(coachId, { rating: averageRating });
  },
};

export default coachReviewService;

