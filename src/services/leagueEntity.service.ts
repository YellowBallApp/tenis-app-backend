import leagueEntityRepository from "../repositories/leagueEntity.repository";
import { League } from "../entities/league.entity";
import { AppError } from "../utils/error/app.error";

const leagueEntityService = {
  create: async (leagueData: Partial<League>): Promise<League> => {
    return await leagueEntityRepository.create(leagueData);
  },

  findById: async (id: number): Promise<League> => {
    const league = await leagueEntityRepository.findById(id);
    if (!league) {
      throw new AppError('LEAGUE_NOT_FOUND');
    }
    return league;
  },

  findAll: async (): Promise<League[]> => {
    return await leagueEntityRepository.findAll();
  },

  update: async (id: number, leagueData: Partial<League>): Promise<League> => {
    return await leagueEntityRepository.update(id, leagueData);
  },

  delete: async (id: number): Promise<void> => {
    await leagueEntityRepository.delete(id);
  },
};

export default leagueEntityService;

