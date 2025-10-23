import matchHistoryRepository from '../repositories/matchHistory.repository';
import { MatchHistory } from '../entities/matchHistory.entity';
import { AppError } from '../utils/error/app.error';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { GroundType } from '../enum/groundType.enum';

export class MatchHistoryService {
  private userRepository;
  private leagueStandingsRepository;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);
  }

  async findAll(): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findAll();
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findById(id: number): Promise<MatchHistory> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      return matchHistory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findByUserId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByLeagueId(leagueId: number): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findByLeagueId(leagueId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async create(data: {
    winnerIds: string[];
    loserIds: string[];
    score: string;
    matchDate?: Date;
    leagueStandingId?: number;
    indoorCourt?: boolean;
    courtGround?: GroundType;
  }): Promise<MatchHistory> {
    try {
      // Kullanıcıları bul
      const winners = await this.userRepository.findByIds(data.winnerIds);
      const losers = await this.userRepository.findByIds(data.loserIds);

      if (winners.length !== data.winnerIds.length) {
        throw new AppError('USER_NOT_FOUND');
      }
      if (losers.length !== data.loserIds.length) {
        throw new AppError('USER_NOT_FOUND');
      }

      // LeagueStanding bul (varsa)
      let leagueStanding = undefined;
      if (data.leagueStandingId) {
        const foundStanding = await this.leagueStandingsRepository.findOne({
          where: { id: data.leagueStandingId },
        });
        leagueStanding = foundStanding || undefined;
      }

      const matchHistory = await matchHistoryRepository.create({
        winners,
        losers,
        score: data.score,
        matchDate: data.matchDate || new Date(),
        leagueStanding,
        indoorCourt: data.indoorCourt !== undefined ? data.indoorCourt : false,
        courtGround: data.courtGround || GroundType.HARD,
      });

      return matchHistory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async update(id: number, data: Partial<MatchHistory>): Promise<MatchHistory> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      return await matchHistoryRepository.update(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      await matchHistoryRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının maç istatistiklerini getir
  async getUserMatchStats(userId: string) {
    try {
      const matches = await matchHistoryRepository.findByUserId(userId);

      const wins = matches.filter((match) =>
        match.winners.some((winner) => winner.id === userId)
      ).length;

      const losses = matches.filter((match) =>
        match.losers.some((loser) => loser.id === userId)
      ).length;

      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      return {
        totalMatches,
        wins,
        losses,
        winRate,
        recentMatches: matches.slice(0, 10), // Son 10 maç
      };
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }
}

export default new MatchHistoryService();

