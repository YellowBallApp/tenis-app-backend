import userRepository from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { AppError } from "../utils/error/app.error";
import { UserType } from "../enum/userType.enum";

const coachService = {
  findAll: async (): Promise<User[]> => {
    // User tablosundan userType='coach' olanları getir
    return await userRepository.findByUserType(UserType.COACH);
  },

  findById: async (id: string): Promise<User> => {
    const coach = await userRepository.findById(id);
    if (!coach) {
      throw new AppError('COACH_NOT_FOUND');
    }
    // Coach olup olmadığını kontrol et
    if (coach.userType !== UserType.COACH) {
      throw new AppError('COACH_NOT_FOUND');
    }
    return coach;
  },
};

export default coachService;

