import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { Coach } from "../entities/coach.entity";


const repository = AppDataSource.getRepository(Coach);

const coachRepository = {
  create: async (coachData: Partial<Coach>): Promise<Coach> => {
    const coach = repository.create(coachData);
    return await repository.save(coach);
  },

  findById: async (id: string): Promise<Coach> => {
    const coach = await repository.findOne({
      where: { id }
    });
    if (!coach) throw new AppError("COACH_NOT_FOUND");
    return coach;
  },

  findAll: async (): Promise<Coach[]> => {
    return await repository.find({
      order: {
        rating: 'DESC'
      }
    });
  },

  update: async (id: string, coachData: Partial<Coach>): Promise<Coach> => {
    const coach = await repository.findOne({ where: { id } });
    if (!coach) throw new AppError("COACH_NOT_FOUND");
    
    Object.assign(coach, coachData);
    return await repository.save(coach);
  },

  delete: async (id: string): Promise<void> => {
    const result = await repository.softDelete(id);
    if (result.affected === 0) throw new AppError("COACH_NOT_FOUND");
  },
};

export default coachRepository;

