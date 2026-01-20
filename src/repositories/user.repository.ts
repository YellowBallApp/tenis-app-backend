import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { UserType } from "../enum/userType.enum";

const repository = AppDataSource.getRepository(User);

const userRepository = {
  create: async (userData: { 
    name: string; 
    userName: string;
    email?: string | null; 
    password: string;
    surname?: string;
    phone?: string;
    gender?: string;
    birthDate: Date;
  }): Promise<User> => {
    const user = repository.create(userData);
    return await repository.save(user);
  },

  findByEmail: async (email: string,relations?: string[]): Promise<User> => {
    const user = await repository.findOne({
      where: { email },
      relations
    });
    if (!user) throw new AppError("USER_NOT_FOUND");
    return user;
  },

  findByUserName: async (userName: string,relations?: string[]): Promise<User> => {
    const user = await repository.findOne({
      where: { userName },
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

  findAll: async (): Promise<User[]> => {
    return await repository.find({
      order: {
        createdAt: 'DESC'
      }
    });
  },

  findByUserType: async (userType: UserType): Promise<User[]> => {
    return await repository.find({
      where: { userType },
      order: {
        createdAt: 'DESC'
      }
    });
  },

};

export default userRepository;