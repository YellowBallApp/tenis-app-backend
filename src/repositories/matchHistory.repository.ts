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
      relations: ['winners', 'losers', 'leagueStanding', 'leagueStanding.league'],
      order: { matchDate: 'DESC' },
    });
  }

  async findById(id: number): Promise<MatchHistory | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['winners', 'losers', 'leagueStanding', 'leagueStanding.league'],
    });
  }

  async findByUserId(userId: string): Promise<MatchHistory[]> {
    // İlk önce kullanıcının olduğu match ID'lerini bul
    const matchIds = await this.repository
      .createQueryBuilder('matchHistory')
      .leftJoin('matchHistory.winners', 'winners')
      .leftJoin('matchHistory.losers', 'losers')
      .where('winners.id = :userId OR losers.id = :userId', { userId })
      .select('matchHistory.id')
      .getMany();

    if (matchIds.length === 0) {
      return [];
    }

    // Sonra bu match'lerin tüm detaylarını getir (tüm winners ve losers ile)
    return this.repository
      .createQueryBuilder('matchHistory')
      .leftJoinAndSelect('matchHistory.winners', 'winners')
      .leftJoinAndSelect('matchHistory.losers', 'losers')
      .leftJoinAndSelect('matchHistory.leagueStanding', 'leagueStanding')
      .leftJoinAndSelect('leagueStanding.league', 'league')
      .whereInIds(matchIds.map(m => m.id))
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

