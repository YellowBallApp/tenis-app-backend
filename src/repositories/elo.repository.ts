import { AppDataSource } from '../config/data-source';
import { EloRatingHistory } from '../entities/eloRatingHistory.entity';
import { User } from '../entities/user.entity';

export class EloRepository {
  private eloHistoryRepository = AppDataSource.getRepository(EloRatingHistory);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Kullanıcının ELO geçmişini getirir
   */
  async getHistory(userId: string, limit: number = 50): Promise<EloRatingHistory[]> {
    return await this.eloHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['match', 'user']
    });
  }

  /**
   * Kullanıcının toplam ELO değişimini getirir
   */
  async getTotalEloChange(userId: string): Promise<number> {
    const histories = await this.eloHistoryRepository.find({
      where: { userId },
      select: ['ratingChange']
    });

    return histories.reduce((total, h) => total + h.ratingChange, 0);
  }

  /**
   * Belirli bir tarih aralığındaki ELO değişimlerini getirir
   */
  async getHistoryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EloRatingHistory[]> {
    return await this.eloHistoryRepository
      .createQueryBuilder('history')
      .where('history.userId = :userId', { userId })
      .andWhere('history.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .orderBy('history.createdAt', 'ASC')
      .getMany();
  }

  /**
   * En yüksek rating'e sahip oyuncuları getirir
   */
  async getTopPlayers(limit: number = 100, minMatches: number = 5): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.rankedMatchesPlayed >= :minMatches', { minMatches })
      .orderBy('user.eloRating', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Belirli yıldız seviyesindeki oyuncuları getirir
   */
  async getPlayersByStarRating(starRating: number, limit?: number): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.starRating = :starRating', { starRating })
      .orderBy('user.eloRating', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return await query.getMany();
  }

  /**
   * Yıldız seviyesi aralığındaki oyuncuları getirir (lig filtreleme için)
   */
  async getPlayersByStarRange(
    minStarRating: number | null,
    maxStarRating: number | null
  ): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (minStarRating !== null) {
      query.andWhere('user.starRating >= :minStarRating', { minStarRating });
    }

    if (maxStarRating !== null) {
      query.andWhere('user.starRating <= :maxStarRating', { maxStarRating });
    }

    return await query.orderBy('user.eloRating', 'DESC').getMany();
  }

  /**
   * Kullanıcının percentile'ını hesaplar
   */
  async getUserPercentile(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.rankedMatchesPlayed === 0) return 0;

    const totalUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.rankedMatchesPlayed > 0')
      .getCount();

    if (totalUsers === 0) return 0;

    const higherRatedCount = await this.userRepository
      .createQueryBuilder('user')
      .where('user.eloRating > :rating', { rating: user.eloRating })
      .andWhere('user.rankedMatchesPlayed > 0')
      .getCount();

    return Math.round(((totalUsers - higherRatedCount) / totalUsers) * 100);
  }

  /**
   * ELO dağılımını getirir (her yıldız seviyesinde kaç oyuncu var)
   */
  async getEloDistribution(): Promise<{
    starRating: number;
    count: number;
    avgElo: number;
  }[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .select('user.starRating', 'starRating')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(user.eloRating)', 'avgElo')
      .where('user.rankedMatchesPlayed > 0')
      .groupBy('user.starRating')
      .orderBy('user.starRating', 'ASC')
      .getRawMany();
  }

  /**
   * Son N gündeki en çok rating kazanan oyuncuları getirir
   */
  async getTopGainers(days: number = 30, limit: number = 10): Promise<{
    user: User;
    totalGain: number;
    matchCount: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.eloHistoryRepository
      .createQueryBuilder('history')
      .select('history.userId', 'userId')
      .addSelect('SUM(history.ratingChange)', 'totalGain')
      .addSelect('COUNT(*)', 'matchCount')
      .where('history.createdAt >= :startDate', { startDate })
      .andWhere('history.changeReason IN (:...reasons)', {
        reasons: ['match_win', 'match_loss']
      })
      .groupBy('history.userId')
      .orderBy('totalGain', 'DESC')
      .take(limit)
      .getRawMany();

    // User bilgilerini ekle
    const enrichedResults = await Promise.all(
      results.map(async (r) => {
        const user = await this.userRepository.findOne({
          where: { id: r.userId }
        });
        return {
          user: user!,
          totalGain: parseInt(r.totalGain),
          matchCount: parseInt(r.matchCount)
        };
      })
    );

    return enrichedResults.filter(r => r.user !== null);
  }

  /**
   * İnaktif oyuncuları getirir (decay uygulanacak)
   */
  async getInactivePlayers(monthsInactive: number = 6): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsInactive);

    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastMatchDate < :cutoffDate', { cutoffDate })
      .andWhere('user.rankedMatchesPlayed > 0')
      .getMany();
  }
}

