import { AppDataSource } from '../config/data-source';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { Repository } from 'typeorm';

export class LeagueStandingsRepository {
  private repository: Repository<LeagueStandings>;

  constructor() {
    this.repository = AppDataSource.getRepository(LeagueStandings);
  }

  async findAll(): Promise<LeagueStandings[]> {
    return this.repository.find({
      relations: ['user', 'league'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async findById(id: number): Promise<LeagueStandings | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'league'],
    });
  }

  async findByLeagueId(leagueId: number): Promise<LeagueStandings[]> {
    return this.repository.find({
      where: { league: { id: leagueId } },
      relations: ['user', 'league'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async findByUserId(userId: string): Promise<LeagueStandings[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user', 'league'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async create(data: Partial<LeagueStandings>): Promise<LeagueStandings> {
    const standing = this.repository.create(data);
    return this.repository.save(standing);
  }

  async update(id: number, data: Partial<LeagueStandings>): Promise<LeagueStandings> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('LeagueStanding not found');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async updateRanking(leagueId: number, userId: string, newRanking: number): Promise<LeagueStandings> {
    const standing = await this.repository.findOne({
      where: { 
        league: { id: leagueId },
        user: { id: userId }
      },
      relations: ['user', 'league'],
    });

    if (!standing) {
      throw new Error('Standing not found');
    }

    standing.leagueRanking = newRanking;
    return this.repository.save(standing);
  }
}

export default new LeagueStandingsRepository();

