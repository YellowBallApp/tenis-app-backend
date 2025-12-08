import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { LeagueApplication, LeagueApplicationStatus } from "../entities/leagueApplication.entity";

const repository = AppDataSource.getRepository(LeagueApplication);

const leagueApplicationRepository = {
  create: async (applicationData: Partial<LeagueApplication>): Promise<LeagueApplication> => {
    const application = repository.create(applicationData);
    return await repository.save(application);
  },

  findById: async (id: number): Promise<LeagueApplication> => {
    const application = await repository.findOne({
      where: { id },
      relations: ['user', 'league'],
    });
    if (!application) throw new AppError("LEAGUE_APPLICATION_NOT_FOUND");
    return application;
  },

  findByUserId: async (userId: string, leagueId?: number): Promise<LeagueApplication[]> => {
    const where: any = { user: { id: userId } };
    if (leagueId) {
      where.league = { id: leagueId };
    }
    return await repository.find({
      where,
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' }
    });
  },

  findByLeagueId: async (leagueId: number, status?: LeagueApplicationStatus): Promise<LeagueApplication[]> => {
    const where: any = { league: { id: leagueId } };
    if (status) {
      where.status = status;
    }
    return await repository.find({
      where,
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' }
    });
  },

  findByStatus: async (status: LeagueApplicationStatus): Promise<LeagueApplication[]> => {
    return await repository.find({
      where: { status },
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' }
    });
  },

  findAll: async (): Promise<LeagueApplication[]> => {
    return await repository.find({
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' }
    });
  },

  update: async (id: number, applicationData: Partial<LeagueApplication>): Promise<LeagueApplication> => {
    const application = await repository.findOne({ where: { id } });
    if (!application) throw new AppError("LEAGUE_APPLICATION_NOT_FOUND");
    
    Object.assign(application, applicationData);
    return await repository.save(application);
  },

  delete: async (id: number): Promise<void> => {
    const result = await repository.delete(id);
    if (result.affected === 0) throw new AppError("LEAGUE_APPLICATION_NOT_FOUND");
  },
};

export default leagueApplicationRepository;

