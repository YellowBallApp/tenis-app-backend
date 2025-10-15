import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { League } from "../entities/league.entity";

const repository = AppDataSource.getRepository(League);

const leagueRepository = {
  create: async (leagueData: Partial<League>): Promise<League> => {
    const league = repository.create(leagueData);
    return await repository.save(league);
  },

  findById: async (id: number): Promise<League> => {
    const league = await repository.findOne({
      where: { id },
      relations: ['leagueSettingsTemplates', 'standings'],
    });
    if (!league) throw new AppError("LEAGUE_NOT_FOUND");
    return league;
  },

  findAll: async (): Promise<League[]> => {
    return await repository.find({
      relations: ['leagueSettingsTemplates', 'standings'],
      order: {
        id: 'DESC'
      }
    });
  },

  update: async (id: number, leagueData: Partial<League>): Promise<League> => {
    const league = await repository.findOne({ where: { id } });
    if (!league) throw new AppError("LEAGUE_NOT_FOUND");
    
    Object.assign(league, leagueData);
    return await repository.save(league);
  },

  delete: async (id: number): Promise<void> => {
    const result = await repository.delete(id);
    if (result.affected === 0) throw new AppError("LEAGUE_NOT_FOUND");
  },
};

export default leagueRepository;

