import coachRepository from "../repositories/coach.repository";
import { Coach } from "../entities/coach.entity";
import { AppError } from "../utils/error/app.error";


const coachService = {
  create: async (coachData: Partial<Coach>): Promise<Coach> => {
    return await coachRepository.create(coachData);
  },

  findById: async (id: string): Promise<Coach> => {
    const coach = await coachRepository.findById(id);
    if (!coach) {
      throw new AppError('COACH_NOT_FOUND');
    }
    return coach;
  },

  findAll: async (): Promise<Coach[]> => {
    return await coachRepository.findAll();
  },

  update: async (id: string, coachData: Partial<Coach>): Promise<Coach> => {
    return await coachRepository.update(id, coachData);
  },

  delete: async (id: string): Promise<void> => {
    await coachRepository.delete(id);
  },
};

export default coachService;

