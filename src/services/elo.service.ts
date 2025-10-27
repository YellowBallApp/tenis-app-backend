import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { EloRatingHistory } from '../entities/eloRatingHistory.entity';
import { MatchHistory } from '../entities/matchHistory.entity';
import { getStarRatingFromElo } from '../enum/starRating.enum';

export interface EloCalculationResult {
  userId: string;
  previousRating: number;
  newRating: number;
  change: number;
  previousStarRating: number;
  newStarRating: number;
  confidenceInterval: number;
}

export interface EloUpdateOptions {
  matchId?: number;
  isTournament?: boolean;
  setDifference?: number;
  affectsRating?: boolean;
}

export class EloService {
  private userRepository = AppDataSource.getRepository(User);
  private eloHistoryRepository = AppDataSource.getRepository(EloRatingHistory);

  /**
   * Beklenen skoru hesaplar (0-1 arası)
   */
  private calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * K-faktörünü hesaplar (oyuncunun tecrübesine göre)
   */
  private getKFactor(matchesPlayed: number, isTournament: boolean = false): number {
    let k: number;
    
    if (matchesPlayed < 10) {
      k = 40; // Yeni oyuncular için yüksek K
    } else if (matchesPlayed < 30) {
      k = 32; // Orta seviye
    } else {
      k = 24; // Deneyimli oyuncular
    }

    // Turnuva maçları için bonus
    if (isTournament) {
      k *= 1.5;
    }

    return k;
  }

  /**
   * Set farkına göre çarpan hesaplar
   */
  private getSetMultiplier(setDifference: number): number {
    const absDiff = Math.abs(setDifference);
    
    if (absDiff >= 2) {
      return 1.2; // 2-0 veya 3-0 gibi net sonuçlar
    }
    
    return 1.0; // Normal sonuçlar
  }

  /**
   * Güven aralığını hesaplar (az maç yapanlara daha yüksek)
   */
  private calculateConfidenceInterval(matchesPlayed: number): number {
    if (matchesPlayed < 5) return 150;
    if (matchesPlayed < 10) return 120;
    if (matchesPlayed < 20) return 90;
    if (matchesPlayed < 30) return 60;
    if (matchesPlayed < 50) return 40;
    return 25; // Çok deneyimli oyuncular
  }

  /**
   * 1v1 maç için ELO hesaplar
   */
  async calculate1v1Match(
    winnerId: string,
    loserId: string,
    options: EloUpdateOptions = {}
  ): Promise<EloCalculationResult[]> {
    const {
      isTournament = false,
      setDifference = 0,
      affectsRating = true
    } = options;

    // Eğer ELO'yu etkilemeyecekse, boş dönüyoruz
    if (!affectsRating) {
      return [];
    }

    // Oyuncuları getir
    const winner = await this.userRepository.findOne({ where: { id: winnerId } });
    const loser = await this.userRepository.findOne({ where: { id: loserId } });

    if (!winner || !loser) {
      throw new Error('Oyuncular bulunamadı');
    }

    // Beklenen skorları hesapla
    const expectedWinner = this.calculateExpectedScore(winner.eloRating, loser.eloRating);
    const expectedLoser = 1 - expectedWinner;

    // K-faktörlerini hesapla (kazanan için kullanıyoruz, ama her ikisi de benzer)
    const kFactorWinner = this.getKFactor(winner.rankedMatchesPlayed, isTournament);
    const kFactorLoser = this.getKFactor(loser.rankedMatchesPlayed, isTournament);

    // Set farkı çarpanı
    const setMultiplier = this.getSetMultiplier(setDifference);

    // ELO değişimlerini hesapla
    const winnerChange = Math.round(kFactorWinner * setMultiplier * (1 - expectedWinner));
    const loserChange = Math.round(kFactorLoser * setMultiplier * (0 - expectedLoser));

    // Yeni rating'leri hesapla
    const winnerNewRating = winner.eloRating + winnerChange;
    const loserNewRating = Math.max(1000, loser.eloRating + loserChange); // Minimum 1000

    // Yıldız rating'leri hesapla
    const winnerPrevStar = getStarRatingFromElo(winner.eloRating);
    const winnerNewStar = getStarRatingFromElo(winnerNewRating);
    const loserPrevStar = getStarRatingFromElo(loser.eloRating);
    const loserNewStar = getStarRatingFromElo(loserNewRating);

    // Güven aralıklarını hesapla
    const winnerCI = this.calculateConfidenceInterval(winner.rankedMatchesPlayed + 1);
    const loserCI = this.calculateConfidenceInterval(loser.rankedMatchesPlayed + 1);

    return [
      {
        userId: winnerId,
        previousRating: winner.eloRating,
        newRating: winnerNewRating,
        change: winnerChange,
        previousStarRating: winnerPrevStar,
        newStarRating: winnerNewStar,
        confidenceInterval: winnerCI
      },
      {
        userId: loserId,
        previousRating: loser.eloRating,
        newRating: loserNewRating,
        change: loserChange,
        previousStarRating: loserPrevStar,
        newStarRating: loserNewStar,
        confidenceInterval: loserCI
      }
    ];
  }

  /**
   * ELO değişikliklerini veritabanına uygular
   */
  async applyEloChanges(
    changes: EloCalculationResult[],
    matchId?: number,
    reason: string = 'match_win'
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const change of changes) {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: change.userId }
        });

        if (!user) continue;

        // User'ı güncelle
        user.eloRating = change.newRating;
        user.peakEloRating = Math.max(user.peakEloRating, change.newRating);
        user.rankedMatchesPlayed += 1;
        user.lastMatchDate = new Date();
        user.confidenceInterval = change.confidenceInterval;
        user.starRating = change.newStarRating;

        await queryRunner.manager.save(user);

        // History'ye kaydet
        const history = new EloRatingHistory();
        history.userId = change.userId;
        history.user = user;
        history.matchId = matchId || null;
        history.previousRating = change.previousRating;
        history.newRating = change.newRating;
        history.ratingChange = change.change;
        history.previousStarRating = change.previousStarRating;
        history.newStarRating = change.newStarRating;
        history.matchesPlayedAtTime = user.rankedMatchesPlayed;
        history.confidenceInterval = change.confidenceInterval;
        history.changeReason = reason;

        await queryRunner.manager.save(history);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 6 ay maç yapmayan oyuncular için rating decay uygular
   */
  async applyRatingDecay(): Promise<void> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 6 aydan fazla maç yapmayan ve en az 1 maçı olan oyuncuları bul
    const inactiveUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastMatchDate < :sixMonthsAgo', { sixMonthsAgo })
      .andWhere('user.rankedMatchesPlayed > 0')
      .getMany();

    for (const user of inactiveUsers) {
      // Her ay için %2 düşüş (6 ayda yaklaşık %12)
      const monthsInactive = Math.floor(
        (Date.now() - user.lastMatchDate!.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      if (monthsInactive >= 6) {
        const decayPercentage = Math.min(0.12, (monthsInactive - 5) * 0.02); // Maksimum %12
        const ratingLoss = Math.round(user.eloRating * decayPercentage);
        const newRating = Math.max(1000, user.eloRating - ratingLoss);

        if (newRating !== user.eloRating) {
          const prevStarRating = getStarRatingFromElo(user.eloRating);
          const newStarRating = getStarRatingFromElo(newRating);

          // User'ı güncelle
          user.eloRating = newRating;
          user.starRating = newStarRating;
          await this.userRepository.save(user);

          // History'ye kaydet
          const history = new EloRatingHistory();
          history.userId = user.id;
          history.user = user;
          history.matchId = null;
          history.previousRating = user.eloRating + ratingLoss;
          history.newRating = newRating;
          history.ratingChange = -ratingLoss;
          history.previousStarRating = prevStarRating;
          history.newStarRating = newStarRating;
          history.matchesPlayedAtTime = user.rankedMatchesPlayed;
          history.confidenceInterval = user.confidenceInterval;
          history.changeReason = 'decay';
          history.notes = `${monthsInactive} ay aktivite olmadığı için decay uygulandı`;

          await this.eloHistoryRepository.save(history);
        }
      }
    }
  }

  /**
   * Kullanıcının ELO geçmişini getirir
   */
  async getUserEloHistory(userId: string, limit: number = 50): Promise<EloRatingHistory[]> {
    return await this.eloHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['match']
    });
  }

  /**
   * En yüksek rating'e sahip oyuncuları getirir
   */
  async getTopRatedPlayers(limit: number = 100): Promise<User[]> {
    return await this.userRepository.find({
      where: {},
      order: { eloRating: 'DESC' },
      take: limit
    });
  }

  /**
   * Belirli bir yıldız seviyesindeki oyuncuları getirir
   */
  async getPlayersByStarRating(starRating: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { starRating },
      order: { eloRating: 'DESC' }
    });
  }

  /**
   * Kullanıcının yüzdelik dilimini hesaplar
   */
  async getUserPercentile(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return 0;

    const totalUsers = await this.userRepository.count({
      where: {} // En az 1 maç yapmış olanlar
    });

    const higherRatedUsers = await this.userRepository.count({
      where: {} // eloRating > user.eloRating
    });

    // TypeORM'da dynamic where için:
    const higherCount = await this.userRepository
      .createQueryBuilder('user')
      .where('user.eloRating > :rating', { rating: user.eloRating })
      .getCount();

    return Math.round((1 - higherCount / totalUsers) * 100);
  }
}

