import { AppDataSource } from '../config/data-source';
import { MatchHistory } from '../entities/matchHistory.entity';
import { Repository } from 'typeorm';

export class MatchHistoryRepository {
  private repository: Repository<MatchHistory>;

  constructor() {
    this.repository = AppDataSource.getRepository(MatchHistory);
  }

  async findAll(): Promise<MatchHistory[]> {
    return this.repository.find({
      relations: ['winners', 'losers', 'leagueStanding'],
      order: { matchDate: 'DESC' },
    });
  }

  async findById(id: number): Promise<MatchHistory | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['winners', 'losers', 'leagueStanding'],
    });
  }

  async findByUserId(userId: string): Promise<MatchHistory[]> {
    return this.repository
      .createQueryBuilder('matchHistory')
      .leftJoinAndSelect('matchHistory.winners', 'winners')
      .leftJoinAndSelect('matchHistory.losers', 'losers')
      .leftJoinAndSelect('matchHistory.leagueStanding', 'leagueStanding')
      .where('winners.id = :userId OR losers.id = :userId', { userId })
      .orderBy('matchHistory.matchDate', 'DESC')
      .getMany();
  }

  async findByLeagueId(leagueId: number): Promise<MatchHistory[]> {
    return this.repository
      .createQueryBuilder('matchHistory')
      .leftJoinAndSelect('matchHistory.winners', 'winners')
      .leftJoinAndSelect('matchHistory.losers', 'losers')
      .leftJoinAndSelect('matchHistory.leagueStanding', 'leagueStanding')
      .leftJoinAndSelect('leagueStanding.league', 'league')
      .where('league.id = :leagueId', { leagueId })
      .orderBy('matchHistory.matchDate', 'DESC')
      .getMany();
  }

  async create(data: Partial<MatchHistory>): Promise<MatchHistory> {
    const matchHistory = this.repository.create(data);
    return this.repository.save(matchHistory);
  }

  async update(id: number, data: Partial<MatchHistory>): Promise<MatchHistory> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('MatchHistory not found');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}

export default new MatchHistoryRepository();

