import userRepository from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { AppError } from "../utils/error/app.error";

const userService = {
  create: async (userData: { name: string; email: string; password: string }): Promise<User> => {
    return await userRepository.create(userData);
  },

  findById: async (id: string): Promise<User> => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }
    return user;
  },
  findByEmail: async (email: string, relations?: string[]): Promise<User> => {
    const user = await userRepository.findByEmail(email, relations);

    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }
    return user;
  },

  findAll: async (): Promise<User[]> => {
    return await userRepository.findAll();
  },
};

export default userService;