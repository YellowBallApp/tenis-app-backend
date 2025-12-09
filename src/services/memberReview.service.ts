import memberReviewRepository from "../repositories/memberReview.repository";
import userRepository from "../repositories/user.repository";
import { MemberReview } from "../entities/memberReview.entity";
import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

const memberReviewService = {
  create: async (reviewData: {
    memberId: string;
    userId: string;
    rating: number;
    comment: string;
  }): Promise<MemberReview> => {
    // Rating validasyonu
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new AppError("INVALID_RATING");
    }

    // Comment validasyonu
    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new AppError("COMMENT_REQUIRED");
    }

    // Member var mı kontrol et (User tablosundan)
    const member = await userRepository.findById(reviewData.memberId);
    if (!member) {
      throw new AppError("USER_NOT_FOUND");
    }

    // Kullanıcı daha önce bu üyeye review yazmış mı kontrol et
    const existingReview = await memberReviewRepository.findByMemberAndUser(
      reviewData.memberId,
      reviewData.userId
    );

    if (existingReview) {
      // Mevcut review'ı güncelle
      return await memberReviewRepository.update(existingReview.id, {
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
    }

    // Yeni review oluştur (otomatik onaylanmış olarak)
    const review = await memberReviewRepository.create({
      memberId: reviewData.memberId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim(),
      isApproved: true // Yorumlar otomatik onaylanıyor
    });

    // Member'ın ortalama rating'ini güncelle
    await memberReviewService.updateMemberRating(reviewData.memberId);

    return review;
  },

  getByMemberId: async (memberId: string, onlyApproved: boolean = true): Promise<MemberReview[]> => {
    return await memberReviewRepository.findByMemberId(memberId, onlyApproved);
  },

  getAll: async (onlyApproved?: boolean): Promise<MemberReview[]> => {
    return await memberReviewRepository.findAll(onlyApproved);
  },

  getPendingReviews: async (): Promise<MemberReview[]> => {
    return await memberReviewRepository.getPendingReviews();
  },

  getPendingCount: async (): Promise<number> => {
    return await memberReviewRepository.getPendingCount();
  },

  approveReview: async (id: number): Promise<MemberReview> => {
    return await memberReviewRepository.approve(id);
  },

  getByUserId: async (userId: string): Promise<MemberReview[]> => {
    return await memberReviewRepository.findByUserId(userId);
  },

  update: async (id: number, reviewData: {
    rating?: number;
    comment?: string;
  }): Promise<MemberReview> => {
    if (reviewData.rating !== undefined && (reviewData.rating < 1 || reviewData.rating > 5)) {
      throw new AppError("INVALID_RATING");
    }

    const review = await memberReviewRepository.findById(id);
    
    const updateData: Partial<MemberReview> = {};
    if (reviewData.rating !== undefined) updateData.rating = reviewData.rating;
    if (reviewData.comment !== undefined) updateData.comment = reviewData.comment.trim();

    const updatedReview = await memberReviewRepository.update(id, updateData);

    // Member'ın ortalama rating'ini güncelle
    if (reviewData.rating !== undefined) {
      await memberReviewService.updateMemberRating(review.memberId);
    }

    return updatedReview;
  },

  delete: async (id: number): Promise<void> => {
    const review = await memberReviewRepository.findById(id);
    const memberId = review.memberId;
    
    await memberReviewRepository.delete(id);

    // Member'ın ortalama rating'ini güncelle
    await memberReviewService.updateMemberRating(memberId);
  },

  updateMemberRating: async (memberId: string): Promise<void> => {
    // Member'ın ortalama rating'ini hesapla
    const averageRating = await memberReviewRepository.getAverageRating(memberId);
    
    // User entity'sindeki starRating'i güncelle
    const userRepo = AppDataSource.getRepository(User);
    const member = await userRepository.findById(memberId);
    if (member) {
      member.starRating = averageRating;
      await userRepo.save(member);
    }
  },
};

export default memberReviewService;

