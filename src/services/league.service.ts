import { AppDataSource } from '../config/data-source';
import { League } from '../entities/league.entity';
import { LeagueSettings } from '../entities/leagueSettings';
import { LeagueSettingsTemplate } from '../entities/leagueSettingsTemplate';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';

export class LeagueService {
  private leagueRepository;
  private leagueSettingsRepository;
  private leagueSettingsTemplateRepository;
  private userRepository;
  private matchHistoryRepository;

  constructor() {
    this.leagueRepository = AppDataSource.getRepository(League);
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

  // Lig sıralamasını getir
  async getLeagueRankings() {
    try {
      const rankings = await this.leagueRepository.find({
        relations: ['user'],
        order: {
          leagueRanking: 'ASC',
        },
      });

      return rankings.map((league) => ({
        position: league.leagueRanking,
        user: {
          id: league.user.id,
          name: league.user.name,
          email: league.user.email,
        },
        description: league.description,
      }));
    } catch (error) {
      throw new Error('Lig sıralaması alınırken bir hata oluştu');
    }
  }

  // Kullanıcının lig bilgilerini getir
  async getUserLeagueInfo(userId: number) {
    try {
      const league = await this.leagueRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!league) {
        throw new Error('Kullanıcı lige kayıtlı değil');
      }

      // Kullanıcının maç geçmişini al
      const matchHistory = await this.matchHistoryRepository.find({
        where: [
          { winner: { id: userId } },
          { loser: { id: userId } },
        ],
        relations: ['winner', 'loser'],
        order: { matchDate: 'DESC' },
      });

      const wins = matchHistory.filter((match) => match.winner.id === userId).length;
      const losses = matchHistory.filter((match) => match.loser.id === userId).length;
      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      return {
        position: league.leagueRanking,
        totalMatches,
        wins,
        losses,
        winRate,
        description: league.description,
      };
    } catch (error) {
      throw new Error('Kullanıcı lig bilgisi alınırken bir hata oluştu');
    }
  }

  // Maç teklifi gönderme kurallarını kontrol et
  async sendMatchChallenge(challengerId: number, opponentId: number, message: string) {
    try {
      const challengerLeague = await this.leagueRepository.findOne({
        where: { user: { id: challengerId } },
      });

      const opponentLeague = await this.leagueRepository.findOne({
        where: { user: { id: opponentId } },
      });

      if (!challengerLeague || !opponentLeague) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

      // Sıralama farkını kontrol et
      const rankDifference = challengerLeague.leagueRanking - opponentLeague.leagueRanking;
      
      // Ayarları al
      const settings = await this.getLeagueSettings();
      
      // Sıra bazlı teklif limiti kontrolü
      const maxOfferRange = this.getMaxOfferRange(challengerLeague.leagueRanking);
      
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
    winnerId: number,
    loserId: number,
    score: string
  ) {
    try {
      const winnerLeague = await this.leagueRepository.findOne({
        where: { user: { id: winnerId } },
        relations: ['user'],
      });

      const loserLeague = await this.leagueRepository.findOne({
        where: { user: { id: loserId } },
        relations: ['user'],
      });

      if (!winnerLeague || !loserLeague) {
        throw new Error('Oyuncular lige kayıtlı değil');
      }

      // Maç geçmişine kaydet
      const winner = await this.userRepository.findOne({ where: { id: winnerId } });
      const loser = await this.userRepository.findOne({ where: { id: loserId } });

      if (!winner || !loser) {
        throw new Error('Oyuncular bulunamadı');
      }

      const matchHistory = this.matchHistoryRepository.create({
        winner,
        loser,
        matchDate: new Date(),
        score,
      });

      await this.matchHistoryRepository.save(matchHistory);

      // Sıralamayı güncelle
      await this.updateRankingsAfterMatch(winnerLeague, loserLeague);

      return {
        matchId,
        winnerId,
        loserId,
        score,
        newWinnerRank: winnerLeague.leagueRanking,
        newLoserRank: loserLeague.leagueRanking,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Maç sonucu kaydedilirken bir hata oluştu');
    }
  }

  // Maç sonrası sıralama güncellemesi
  private async updateRankingsAfterMatch(winnerLeague: League, loserLeague: League) {
    const winnerOldRank = winnerLeague.leagueRanking;
    const loserOldRank = loserLeague.leagueRanking;

    // Kazanan, kaybeden oyuncunun sırasını alır
    if (winnerOldRank > loserOldRank) {
      // Aralarındaki oyuncuları bir sıra aşağı kaydır
      const playersInBetween = await this.leagueRepository.find({
        where: {},
      });

      for (const player of playersInBetween) {
        if (player.leagueRanking >= loserOldRank && player.leagueRanking < winnerOldRank) {
          player.leagueRanking += 1;
          await this.leagueRepository.save(player);
        }
      }

      winnerLeague.leagueRanking = loserOldRank;
      loserLeague.leagueRanking = winnerOldRank;
    } else {
      // Kazanan zaten üstte, kaybeden bir sıra düşer
      loserLeague.leagueRanking += 1;
    }

    await this.leagueRepository.save(winnerLeague);
    await this.leagueRepository.save(loserLeague);
  }

  // Teklif yapılabilecek oyuncuları getir
  async getAvailableOpponents(userId: number) {
    try {
      const userLeague = await this.leagueRepository.findOne({
        where: { user: { id: userId } },
      });

      if (!userLeague) {
        throw new Error('Kullanıcı lige kayıtlı değil');
      }

      const maxOfferRange = this.getMaxOfferRange(userLeague.leagueRanking);
      const minRank = Math.max(1, userLeague.leagueRanking - maxOfferRange);
      const maxRank = userLeague.leagueRanking - 1;

      const opponents = await this.leagueRepository.find({
        where: {},
        relations: ['user'],
      });

      return opponents
        .filter((league) => 
          league.leagueRanking >= minRank && 
          league.leagueRanking <= maxRank
        )
        .map((league) => ({
          userId: league.user.id,
          name: league.user.name,
          position: league.leagueRanking,
          canChallenge: true,
        }));
    } catch (error: any) {
      throw new Error(error.message || 'Rakip listesi alınırken bir hata oluştu');
    }
  }
}

