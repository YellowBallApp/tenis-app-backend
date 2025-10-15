import { AppDataSource } from '../config/data-source';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { LeagueSettings } from '../entities/leagueSettings';
import { LeagueSettingsTemplate } from '../entities/leagueSettingsTemplate';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';

export class LeagueService {
  private leagueStandingsRepository;
  private leagueSettingsRepository;
  private leagueSettingsTemplateRepository;
  private userRepository;
  private matchHistoryRepository;

  constructor() {
    this.leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);
    this.leagueSettingsRepository = AppDataSource.getRepository(LeagueSettings);
    this.leagueSettingsTemplateRepository = AppDataSource.getRepository(LeagueSettingsTemplate);
    this.userRepository = AppDataSource.getRepository(User);
    this.matchHistoryRepository = AppDataSource.getRepository(MatchHistory);
  }

  // Lig ayarlarını getir
  async getLeagueSettings() {
    try {
      const settings = await this.leagueSettingsRepository.find({
        relations: ['leagueSettingsTemplate'],
      });
      
      if (!settings || settings.length === 0) {
        // Varsayılan ayarları oluştur
        return this.createDefaultSettings();
      }
      
      return settings[0];
    } catch (error) {
      throw new Error('Lig ayarları alınırken bir hata oluştu');
    }
  }

  // Varsayılan ayarları oluştur
  private async createDefaultSettings() {
    const defaultSettings = this.leagueSettingsRepository.create({
      code: 'EGEV_DEFI_LEAGUE_2025',
      description: 'EGEV TK Defi Ligi 2025 Sezon Ayarları',
      creator: 'system',
      
      // Lig dönemleri
      leagueStartDate: new Date('2025-02-01'),
      leagueEndDate: new Date('2025-06-05'),
      eliminationStartDate: new Date('2025-06-05'),
      eliminationEndDate: new Date('2025-06-19'),
      finalDate: new Date('2025-06-19'),
      
      // Katılım bilgileri
      registrationFee: 150,
      minMatchCountForElimination: 15,
      
      // Maç formatı
      warmupTimeMinutes: 5,
      gamesPerSet: 4,
      setsCount: 2,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      
      // Teklif kuralları
      offerResponseDays: 3,
      matchCompletionDays: 7,
      postMatchCooldownHours: 24,
      reofferCooldownDays: 15,
      consecutiveWOLimit: 3,
      lateArrivalMinutes: 10,
      
      // Sıra bazlı teklif limitleri
      offerLimitsByRank: [
        { range: '1-11', limit: 3 },
        { range: '12-19', limit: 4 },
        { range: '20-27', limit: 5 },
        { range: '28-40', limit: 6 },
        { range: '40+', limit: 10 },
      ],
      
      // Eski alanlar (geriye dönük uyumluluk)
      offerValue: 3,
      offerEverywhere: false,
      shieldIntervalHour: 24,
      userShieldHour: 168,
      userShieldAmount: 3,
      responseTimeHour: 72,
    });

    return await this.leagueSettingsRepository.save(defaultSettings);
  }

  // Lig ayarlarını güncelle
  async updateLeagueSettings(settings: Partial<LeagueSettings>) {
    try {
      const existingSettings = await this.getLeagueSettings();
      
      Object.assign(existingSettings, settings);
      existingSettings.updater = 'admin'; // Bu kısmı authentication'dan alınacak
      
      return await this.leagueSettingsRepository.save(existingSettings);
    } catch (error) {
      throw new Error('Lig ayarları güncellenirken bir hata oluştu');
    }
  }

  // Lig sıralamasını getir (belirli bir lig için veya tüm ligler için)
  async getLeagueRankings(leagueId?: number) {
    try {
      const where = leagueId ? { league: { id: leagueId } } : {};
      
      const rankings = await this.leagueStandingsRepository.find({
        where,
        relations: ['user', 'league'],
        order: {
          leagueRanking: 'ASC',
        },
      });

      return rankings.map((standing) => ({
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
      const where: any = { user: { id: userId } };
      if (leagueId) {
        where.league = { id: leagueId };
      }
      
      const standing = await this.leagueStandingsRepository.findOne({
        where,
        relations: ['user', 'league'],
      });

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

  // Maç teklifi gönderme kurallarını kontrol et
  async sendMatchChallenge(challengerId: string, opponentId: string, message: string) {
    try {
      const challengerStanding = await this.leagueStandingsRepository.findOne({
        where: { user: { id: challengerId } },
      });

      const opponentStanding = await this.leagueStandingsRepository.findOne({
        where: { user: { id: opponentId } },
      });

      if (!challengerStanding || !opponentStanding) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

      // Sıralama farkını kontrol et
      const rankDifference = challengerStanding.leagueRanking - opponentStanding.leagueRanking;
      
      // Ayarları al
      const settings = await this.getLeagueSettings();
      
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

  // Sıra bazlı maksimum teklif aralığını hesapla
  private getMaxOfferRange(position: number): number {
    if (position <= 11) return 3;
    if (position <= 19) return 4;
    if (position <= 27) return 5;
    if (position <= 40) return 6;
    return 10;
  }

  // Maç sonucunu kaydet ve sıralamaları güncelle
  async recordMatchResult(
    matchId: number,
    winnerId: string,
    loserId: string,
    score: string
  ) {
    try {
      const winnerStanding = await this.leagueStandingsRepository.findOne({
        where: { user: { id: winnerId } },
        relations: ['user'],
      });

      const loserStanding = await this.leagueStandingsRepository.findOne({
        where: { user: { id: loserId } },
        relations: ['user'],
      });

      if (!winnerStanding || !loserStanding) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

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
      const standingsInBetween = await this.leagueStandingsRepository.find({
        where: {},
      });

      for (const standing of standingsInBetween) {
        if (standing.leagueRanking >= loserOldRank && standing.leagueRanking < winnerOldRank) {
          standing.leagueRanking += 1;
          await this.leagueStandingsRepository.save(standing);
        }
      }

      winnerStanding.leagueRanking = loserOldRank;
      loserStanding.leagueRanking = winnerOldRank;
    } else {
      // Kazanan zaten üstte, kaybeden bir sıra düşer
      loserStanding.leagueRanking += 1;
    }

    await this.leagueStandingsRepository.save(winnerStanding);
    await this.leagueStandingsRepository.save(loserStanding);
  }

  // Teklif yapılabilecek oyuncuları getir
  async getAvailableOpponents(userId: string, leagueId?: number) {
    try {
      const where: any = { user: { id: userId } };
      if (leagueId) {
        where.league = { id: leagueId };
      }
      
      const userStanding = await this.leagueStandingsRepository.findOne({
        where,
        relations: ['league'],
      });

      if (!userStanding) {
        throw new Error('Kullanıcı lige kayıtlı değil');
      }

      const maxOfferRange = this.getMaxOfferRange(userStanding.leagueRanking);
      const minRank = Math.max(1, userStanding.leagueRanking - maxOfferRange);
      const maxRank = userStanding.leagueRanking - 1;

      // Aynı ligdeki rakipleri getir
      const opponentWhere: any = {};
      if (userStanding.league) {
        opponentWhere.league = { id: userStanding.league.id };
      }

      const opponents = await this.leagueStandingsRepository.find({
        where: opponentWhere,
        relations: ['user', 'league'],
      });

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

