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
      relations: ['user', 'league', 'challengedUser'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async findById(id: number): Promise<LeagueStandings | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'league', 'challengedUser'],
    });
  }

  async findByLeagueId(leagueId: number): Promise<LeagueStandings[]> {
    return this.repository.find({
      where: { league: { id: leagueId } },
      relations: ['user', 'league', 'challengedUser'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async findByUserId(userId: string): Promise<LeagueStandings[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user', 'league', 'challengedUser'],
      order: { leagueRanking: 'ASC' },
    });
  }

  async findByUserAndLeague(userId: string, leagueId: number): Promise<LeagueStandings | null> {
    return this.repository.findOne({
      where: { 
        user: { id: userId },
        league: { id: leagueId }
      },
      relations: ['user', 'league', 'challengedUser'],
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

  async updateRanking(leagueId: number, challengerId: string, challengedId: string): Promise<void> {
    // Challenger ve challenged'ın mevcut standinglerini bul
    const challengerStanding = await this.repository.findOne({
      where: { 
        league: { id: leagueId },
        user: { id: challengerId }
      },
      relations: ['user', 'league'],
    });

    const challengedStanding = await this.repository.findOne({
      where: { 
        league: { id: leagueId },
        user: { id: challengedId }
      },
      relations: ['user', 'league'],
    });

    if (!challengerStanding || !challengedStanding) {
      throw new Error('Challenger or challenged standing not found');
    }

    const winnerOldRank = challengerStanding.leagueRanking;
    const loserOldRank = challengedStanding.leagueRanking;

    // Transaction ile tüm güncellemeleri yap
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Eğer kazanan zaten üst sıradaysa (düşük ranking), sadece challenge durumunu temizle
      if (winnerOldRank <= loserOldRank) {
        // Her iki kullanıcının da challenge durumunu temizle
        await transactionalEntityManager
          .createQueryBuilder()
          .update(LeagueStandings)
          .set({ 
            challengePending: false,
            challengeDate: null,
            challengedUser: null,
          })
          .where('"leagueId" = :leagueId', { leagueId })
          .andWhere('"userId" IN (:...userIds)', { userIds: [challengerId, challengedId] })
          .execute();
      } else {
        // Kazanan alt sırada, sıralama güncellemesi yapılacak
        
        // Loser ranking ile winner'ın eski ranking'i arasındaki herkesi bir aşağı kaydır
        await transactionalEntityManager
          .createQueryBuilder()
          .update(LeagueStandings)
          .set({ leagueRanking: () => '"leagueRanking" + 1' })
          .where('"leagueId" = :leagueId', { leagueId })
          .andWhere('"leagueRanking" >= :minRank', { minRank: loserOldRank })
          .andWhere('"leagueRanking" < :maxRank', { maxRank: winnerOldRank })
          .execute();

        // Winner'ı loser'ın rankingine çıkar ve challenge durumunu temizle
        await transactionalEntityManager
          .createQueryBuilder()
          .update(LeagueStandings)
          .set({ 
            leagueRanking: loserOldRank,
            challengePending: false,
            challengeDate: null,
            challengedUser: null,
          })
          .where('id = :id', { id: challengerStanding.id })
          .execute();

        // Loser kullanıcının challenge durumunu da temizle
        await transactionalEntityManager
          .createQueryBuilder()
          .update(LeagueStandings)
          .set({ 
            challengePending: false,
            challengeDate: null,
            challengedUser: null,
          })
          .where('id = :id', { id: challengedStanding.id })
          .execute();
      }
    });
  }
}

export default new LeagueStandingsRepository();

