import { AppDataSource } from "../config/data-source";
import { CoachReview } from "../entities/coachReview.entity";
import { AppError } from "../utils/error/app.error";

const repository = AppDataSource.getRepository(CoachReview);

const coachReviewRepository = {
  create: async (reviewData: Partial<CoachReview>): Promise<CoachReview> => {
    const review = repository.create(reviewData);
    return await repository.save(review);
  },

  findByCoachId: async (coachId: string): Promise<CoachReview[]> => {
    return await repository.find({
      where: { coachId },
      relations: ['user', 'coach'],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  findByUserId: async (userId: string): Promise<CoachReview[]> => {
    return await repository.find({
      where: { userId },
      relations: ['coach'],
      order: {
        createdAt: 'DESC'
      }
    });
  },

  findByCoachAndUser: async (coachId: string, userId: string): Promise<CoachReview | null> => {
    return await repository.findOne({
      where: { coachId, userId },
      relations: ['user', 'coach']
    });
  },

  findById: async (id: number): Promise<CoachReview> => {
    const review = await repository.findOne({
      where: { id },
      relations: ['user', 'coach']
    });
    if (!review) throw new AppError("REVIEW_NOT_FOUND");
    return review;
  },

  update: async (id: number, reviewData: Partial<CoachReview>): Promise<CoachReview> => {
    const review = await repository.findOne({ where: { id } });
    if (!review) throw new AppError("REVIEW_NOT_FOUND");
    
    Object.assign(review, reviewData);
    return await repository.save(review);
  },

  delete: async (id: number): Promise<void> => {
    const result = await repository.delete(id);
    if (result.affected === 0) throw new AppError("REVIEW_NOT_FOUND");
  },

  getAverageRating: async (coachId: string): Promise<number> => {
    const result = await repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.coachId = :coachId', { coachId })
      .getRawOne();
    
    return result?.avg ? parseFloat(result.avg) : 0;
  },

  getReviewCount: async (coachId: string): Promise<number> => {
    return await repository.count({
      where: { coachId }
    });
  },
};

export default coachReviewRepository;

