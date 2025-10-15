import leagueStandingsRepository from '../repositories/leagueStandings.repository';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { AppError } from '../utils/error/app.error';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';

export class LeagueStandingsService {
  private userRepository;
  private matchHistoryRepository;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.matchHistoryRepository = AppDataSource.getRepository(MatchHistory);
  }
  async findAll(): Promise<LeagueStandings[]> {
    try {
      return await leagueStandingsRepository.findAll();
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findById(id: number): Promise<LeagueStandings> {
    try {
      const standing = await leagueStandingsRepository.findById(id);
      if (!standing) {
        throw new AppError('LEAGUE_STANDING_NOT_FOUND');
      }
      return standing;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByLeagueId(leagueId: number): Promise<LeagueStandings[]> {
    try {
      return await leagueStandingsRepository.findByLeagueId(leagueId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<LeagueStandings[]> {
    try {
      return await leagueStandingsRepository.findByUserId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async create(data: Partial<LeagueStandings>): Promise<LeagueStandings> {
    try {
      return await leagueStandingsRepository.create(data);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async update(id: number, data: Partial<LeagueStandings>): Promise<LeagueStandings> {
    try {
      const standing = await leagueStandingsRepository.findById(id);
      if (!standing) {
        throw new AppError('LEAGUE_STANDING_NOT_FOUND');
      }
      return await leagueStandingsRepository.update(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const standing = await leagueStandingsRepository.findById(id);
      if (!standing) {
        throw new AppError('LEAGUE_STANDING_NOT_FOUND');
      }
      await leagueStandingsRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async updateRanking(leagueId: number, userId: string, newRanking: number): Promise<LeagueStandings> {
    try {
      return await leagueStandingsRepository.updateRanking(leagueId, userId, newRanking);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Lig sıralamasını getir (belirli bir lig için veya tüm ligler için)
  async getLeagueRankings(leagueId?: number) {
    try {
      const standings = leagueId 
        ? await leagueStandingsRepository.findByLeagueId(leagueId)
        : await leagueStandingsRepository.findAll();

      return standings.map((standing) => ({
        position: standing.leagueRanking,
        user: {
          id: standing.user.id,
          name: standing.user.name,
          email: standing.user.email,
        },
        league: standing.league ? {
          id: standing.league.id,
          description: standing.league.description,
        } : null,
        description: standing.description,
      }));
    } catch (error) {
      throw new Error('Lig sıralaması alınırken bir hata oluştu');
    }
  }

  // Kullanıcının lig bilgilerini getir
  async getUserLeagueInfo(userId: string, leagueId?: number) {
    try {
      const standings = await leagueStandingsRepository.findByUserId(userId);
      
      let standing;
      if (leagueId) {
        standing = standings.find(s => s.league && s.league.id === leagueId);
      } else {
        standing = standings[0]; // İlk ligi al
      }

      if (!standing) {
        throw new Error('Kullanıcı lige kayıtlı değil');
      }

      // Kullanıcının maç geçmişini al
      const matchHistory = await this.matchHistoryRepository.find({
        relations: ['winners', 'losers'],
        order: { matchDate: 'DESC' },
      });

      // Kullanıcının kazandığı ve kaybettiği maçları filtrele
      const wins = matchHistory.filter((match) => 
        match.winners.some(winner => winner.id === userId)
      ).length;
      const losses = matchHistory.filter((match) => 
        match.losers.some(loser => loser.id === userId)
      ).length;
      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      return {
        position: standing.leagueRanking,
        totalMatches,
        wins,
        losses,
        winRate,
        description: standing.description,
        league: standing.league ? {
          id: standing.league.id,
          description: standing.league.description,
        } : null,
      };
    } catch (error) {
      throw new Error('Kullanıcı lig bilgisi alınırken bir hata oluştu');
    }
  }

  // Sıra bazlı maksimum teklif aralığını hesapla
  private getMaxOfferRange(position: number): number {
    if (position <= 11) return 3;
    if (position <= 19) return 4;
    if (position <= 27) return 5;
    if (position <= 40) return 6;
    return 10;
  }

  // Maç teklifi gönderme kurallarını kontrol et
  async sendMatchChallenge(challengerId: string, opponentId: string, message: string) {
    try {
      const challengerStandings = await leagueStandingsRepository.findByUserId(challengerId);
      const opponentStandings = await leagueStandingsRepository.findByUserId(opponentId);

      if (!challengerStandings.length || !opponentStandings.length) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

      const challengerStanding = challengerStandings[0];
      const opponentStanding = opponentStandings[0];

      // Sıralama farkını kontrol et
      const rankDifference = challengerStanding.leagueRanking - opponentStanding.leagueRanking;
      
      // Sıra bazlı teklif limiti kontrolü
      const maxOfferRange = this.getMaxOfferRange(challengerStanding.leagueRanking);
      
      if (rankDifference > maxOfferRange) {
        throw new Error(`Sadece ${maxOfferRange} sıra yukarıdaki oyunculara meydan okuyabilirsiniz`);
      }

      if (rankDifference <= 0) {
        throw new Error('Sadece üst sıralardaki oyunculara meydan okuyabilirsiniz');
      }

      // Son maç tarihine göre koruma kontrolü (24 saat)
      // Bu kısım MatchHistory'den kontrol edilecek

      return {
        challengerId,
        opponentId,
        message,
        status: 'pending',
        createdAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Meydan okuma gönderilirken bir hata oluştu');
    }
  }

  // Maç sonucunu kaydet ve sıralamaları güncelle
  async recordMatchResult(
    matchId: number,
    winnerId: string,
    loserId: string,
    score: string
  ) {
    try {
      const winnerStandings = await leagueStandingsRepository.findByUserId(winnerId);
      const loserStandings = await leagueStandingsRepository.findByUserId(loserId);

      if (!winnerStandings.length || !loserStandings.length) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

      const winnerStanding = winnerStandings[0];
      const loserStanding = loserStandings[0];

      // Maç geçmişine kaydet
      const winner = await this.userRepository.findOne({ where: { id: winnerId } });
      const loser = await this.userRepository.findOne({ where: { id: loserId } });

      if (!winner || !loser) {
        throw new Error('Oyuncular bulunamadı');
      }

      const matchHistory = this.matchHistoryRepository.create({
        winners: [winner],
        losers: [loser],
        matchDate: new Date(),
        score,
      });

      await this.matchHistoryRepository.save(matchHistory);

      // Sıralamayı güncelle
      await this.updateRankingsAfterMatch(winnerStanding, loserStanding);

      return {
        matchId,
        winnerId,
        loserId,
        score,
        newWinnerRank: winnerStanding.leagueRanking,
        newLoserRank: loserStanding.leagueRanking,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Maç sonucu kaydedilirken bir hata oluştu');
    }
  }

  // Maç sonrası sıralama güncellemesi
  private async updateRankingsAfterMatch(winnerStanding: LeagueStandings, loserStanding: LeagueStandings) {
    const winnerOldRank = winnerStanding.leagueRanking;
    const loserOldRank = loserStanding.leagueRanking;

    // Kazanan, kaybeden oyuncunun sırasını alır
    if (winnerOldRank > loserOldRank) {
      // Aralarındaki oyuncuları bir sıra aşağı kaydır
      const allStandings = await leagueStandingsRepository.findAll();

      for (const standing of allStandings) {
        if (standing.leagueRanking >= loserOldRank && standing.leagueRanking < winnerOldRank) {
          standing.leagueRanking += 1;
          await leagueStandingsRepository.update(standing.id, { leagueRanking: standing.leagueRanking });
        }
      }

      winnerStanding.leagueRanking = loserOldRank;
      loserStanding.leagueRanking = winnerOldRank;
    } else {
      // Kazanan zaten üstte, kaybeden bir sıra düşer
      loserStanding.leagueRanking += 1;
    }

    await leagueStandingsRepository.update(winnerStanding.id, { leagueRanking: winnerStanding.leagueRanking });
    await leagueStandingsRepository.update(loserStanding.id, { leagueRanking: loserStanding.leagueRanking });
  }

  // Teklif yapılabilecek oyuncuları getir
  async getAvailableOpponents(userId: string, leagueId?: number) {
    try {
      const userStandings = await leagueStandingsRepository.findByUserId(userId);
      
      let userStanding;
      if (leagueId) {
        userStanding = userStandings.find(s => s.league && s.league.id === leagueId);
      } else {
        userStanding = userStandings[0];
      }

      if (!userStanding) {
        throw new Error('Kullanıcı lige kayıtlı değil');
      }

      const maxOfferRange = this.getMaxOfferRange(userStanding.leagueRanking);
      const minRank = Math.max(1, userStanding.leagueRanking - maxOfferRange);
      const maxRank = userStanding.leagueRanking - 1;

      // Aynı ligdeki rakipleri getir
      const opponents = userStanding.league 
        ? await leagueStandingsRepository.findByLeagueId(userStanding.league.id)
        : await leagueStandingsRepository.findAll();

      return opponents
        .filter((standing) => 
          standing.leagueRanking >= minRank && 
          standing.leagueRanking <= maxRank &&
          standing.user.id !== userId
        )
        .map((standing) => ({
          userId: standing.user.id,
          name: standing.user.name,
          position: standing.leagueRanking,
          canChallenge: true,
          league: standing.league ? {
            id: standing.league.id,
            description: standing.league.description,
          } : null,
        }));
    } catch (error: any) {
      throw new Error(error.message || 'Rakip listesi alınırken bir hata oluştu');
    }
  }
}

export default new LeagueStandingsService();

