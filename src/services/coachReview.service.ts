import coachReviewRepository from "../repositories/coachReview.repository";
import coachService from "./coach.service";
import { CoachReview } from "../entities/coachReview.entity";
import { AppError } from "../utils/error/app.error";
import userRepository from "../repositories/user.repository";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

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

    // Coach var mı kontrol et (User tablosundan userType='coach' olanları kontrol et)
    await coachService.findById(reviewData.coachId);

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

  getByCoachId: async (coachId: string, onlyApproved: boolean = true): Promise<CoachReview[]> => {
    return await coachReviewRepository.findByCoachId(coachId, onlyApproved);
  },

  getAll: async (onlyApproved?: boolean): Promise<CoachReview[]> => {
    return await coachReviewRepository.findAll(onlyApproved);
  },

  getPendingReviews: async (): Promise<CoachReview[]> => {
    return await coachReviewRepository.getPendingReviews();
  },

  getPendingCount: async (): Promise<number> => {
    return await coachReviewRepository.getPendingCount();
  },

  approveReview: async (id: number): Promise<CoachReview> => {
    return await coachReviewRepository.approve(id);
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
    // Coach'un ortalama rating'ini hesapla
    const averageRating = await coachReviewRepository.getAverageRating(coachId);
    
    // User entity'sindeki starRating'i güncelle
    const userRepo = AppDataSource.getRepository(User);
    const coach = await userRepository.findById(coachId);
    if (coach) {
      coach.starRating = averageRating;
      await userRepo.save(coach);
    }
  },
};

export default coachReviewService;

