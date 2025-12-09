import { AppDataSource } from "../config/data-source";
import { MemberReview } from "../entities/memberReview.entity";
import { AppError } from "../utils/error/app.error";

const repository = AppDataSource.getRepository(MemberReview);

const memberReviewRepository = {
  create: async (reviewData: Partial<MemberReview>): Promise<MemberReview> => {
    const review = repository.create(reviewData);
    return await repository.save(review);
  },

  findByMemberId: async (memberId: string, onlyApproved: boolean = true): Promise<MemberReview[]> => {
    const where: any = { memberId };
    if (onlyApproved) {
      where.isApproved = true;
    }
    
    return await repository.find({
      where,
      relations: ['user'],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  findByUserId: async (userId: string): Promise<MemberReview[]> => {
    return await repository.find({
      where: { userId },
      relations: [],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  findByMemberAndUser: async (memberId: string, userId: string): Promise<MemberReview | null> => {
    return await repository.findOne({
      where: { memberId, userId },
      relations: ['user']
    });
  },

  findById: async (id: number): Promise<MemberReview> => {
    const review = await repository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!review) throw new AppError("REVIEW_NOT_FOUND");
    return review;
  },

  update: async (id: number, reviewData: Partial<MemberReview>): Promise<MemberReview> => {
    const review = await repository.findOne({ where: { id } });
    if (!review) throw new AppError("REVIEW_NOT_FOUND");
    
    Object.assign(review, reviewData);
    return await repository.save(review);
  },

  delete: async (id: number): Promise<void> => {
    const result = await repository.delete(id);
    if (result.affected === 0) throw new AppError("REVIEW_NOT_FOUND");
  },

  getAverageRating: async (memberId: string): Promise<number> => {
    const result = await repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.memberId = :memberId', { memberId })
      .getRawOne();
    
    return result?.avg ? parseFloat(result.avg) : 0;
  },

  getReviewCount: async (memberId: string): Promise<number> => {
    return await repository.count({
      where: { memberId, isApproved: true }
    });
  },

  findAll: async (onlyApproved?: boolean): Promise<MemberReview[]> => {
    const where: any = {};
    if (onlyApproved === true) {
      where.isApproved = true;
    } else if (onlyApproved === false) {
      where.isApproved = false;
    }
    // onlyApproved undefined ise tüm yorumları getir
    
    return await repository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['user'],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  getPendingReviews: async (): Promise<MemberReview[]> => {
    return await repository.find({
      where: { isApproved: false },
      relations: ['user'],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  getPendingCount: async (): Promise<number> => {
    return await repository.count({
      where: { isApproved: false }
    });
  },

  approve: async (id: number): Promise<MemberReview> => {
    const review = await repository.findOne({ where: { id } });
    if (!review) throw new AppError("REVIEW_NOT_FOUND");
    
    review.isApproved = true;
    return await repository.save(review);
  },
};

export default memberReviewRepository;

