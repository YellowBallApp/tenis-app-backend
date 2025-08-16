import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

const repository = AppDataSource.getRepository(User);

const userRepository = {
  findByEmail: async (email: string,relations?: string[]): Promise<User> => {
    const user = await repository.findOne({
      where: { email },
      relations
    });
    if (!user) throw new AppError("USER_NOT_FOUND");
    return user;
  },

  findById: async (id: string): Promise<User> => {
    const user = await repository.findOne({
        where: { id }
    });
    if (!user) throw new AppError("USER_NOT_FOUND");
    return user;
  },

};

export default userRepository;