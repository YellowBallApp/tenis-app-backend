import leagueStandingsRepository from '../repositories/leagueStandings.repository';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { AppError } from '../utils/error/app.error';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';
import { Court } from '../entities/court.entity';
import matchHistoryService from './matchHistory.service';
import { ChallengeStatus } from '../enum/challengeStatus.enum';
import notificationService from './notification.service';

export class LeagueStandingsService {
  private userRepository;
  private matchHistoryRepository;
  private courtRepository;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.matchHistoryRepository = AppDataSource.getRepository(MatchHistory);
    this.courtRepository = AppDataSource.getRepository(Court);
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

  // Kullanıcıyı lige ekle (en son sıraya)
  async joinLeague(userId: string, leagueId: number): Promise<LeagueStandings> {
    try {
      // Kullanıcının zaten bu ligde olup olmadığını kontrol et
      const existingStanding = await leagueStandingsRepository.findByUserAndLeague(userId, leagueId);
      if (existingStanding) {
        throw new AppError('USER_ALREADY_IN_LEAGUE');
      }

      // Kullanıcıyı kontrol et
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new AppError('USER_NOT_FOUND');
      }

      // Mevcut standings'leri al ve son sırayı bul
      const currentStandings = await leagueStandingsRepository.findByLeagueId(leagueId);
      const lastRank = currentStandings.length > 0 
        ? Math.max(...currentStandings.map(s => s.leagueRanking))
        : 0;

      // Yeni standing oluştur
      const newStanding = await leagueStandingsRepository.create({
        user: user,
        league: { id: leagueId } as any,
        leagueRanking: lastRank + 1,
      });

      return newStanding;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async updateRanking(leagueId: number, challengerId: string, challengedId: string, score: string, courtId?: number): Promise<void> {
    try {
      // Score zorunlu kontrol
      if (!score) {
        throw new AppError('VALIDATION_ERROR');
      }

      // Kort bilgisini al
      let indoorCourt = false;
      let courtGround = undefined;
      
      if (courtId) {
        const court = await this.courtRepository.findOne({ where: { id: courtId } });
        if (court) {
          indoorCourt = court.indoors;
          courtGround = court.groundType;
        }
      }

      // Challenger'ın leagueStanding'ini bul (match history için)
      const challengerStanding = await leagueStandingsRepository.findByUserAndLeague(challengerId, leagueId);
      const challengerStandingId = challengerStanding?.id;

      // Match history oluştur
      await matchHistoryService.create({
        winnerIds: [challengerId],
        loserIds: [challengedId],
        score,
        matchDate: new Date(),
        leagueStandingId: challengerStandingId,
        indoorCourt,
        courtGround,
      });

      // Standings'leri güncelle
      await leagueStandingsRepository.updateRanking(leagueId, challengerId, challengedId);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('UNKNOWN_ERROR');
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
        challengeStatus: standing.challengeStatus,
        challengePendingDate: standing.challengePendingDate,
        challengeAcceptedDate: standing.challengeAcceptedDate,
        user: {
          id: standing.user.id,
          name: standing.user.name,
          email: standing.user.email,
        },
        challengedUser: standing.challengedUser ? {
          id: standing.challengedUser.id,
          name: standing.challengedUser.name,
          email: standing.challengedUser.email,
        } : null,
        league: standing.league ? {
          id: standing.league.id,
          description: standing.league.description,
        } : null,
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
  async sendMatchChallenge(challengerId: string, opponentId: string, message: string, leagueId: number) {
    try {
      // Belirli ligde standings'leri bul
      const challengerStanding = await leagueStandingsRepository.findByUserAndLeague(challengerId, leagueId);
      const opponentStanding = await leagueStandingsRepository.findByUserAndLeague(opponentId, leagueId);

      if (!challengerStanding || !opponentStanding) {
        throw new Error('Oyuncular bu lige kayıtlı değil');
      }

      // Rakip zaten bekleyen bir challenge'a sahipse hata fırlat
      if (opponentStanding.challengeStatus === ChallengeStatus.PENDING) {
        throw new Error('Bu oyuncu zaten bekleyen bir meydan okuma isteğine sahip');
      }

      // Challenger zaten bekleyen bir challenge'a sahipse hata fırlat
      if (challengerStanding.challengeStatus === ChallengeStatus.PENDING) {
        throw new Error('Zaten bekleyen bir meydan okuma isteğiniz var');
      }

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

      // Her iki kullanıcıyı da bul
      const challenger = await this.userRepository.findOne({ where: { id: challengerId } });
      const opponent = await this.userRepository.findOne({ where: { id: opponentId } });
      
      if (!challenger || !opponent) {
        throw new Error('Kullanıcılar bulunamadı');
      }

      const currentDate = new Date();

      // Her iki kullanıcının da standing'ini güncelle
      await leagueStandingsRepository.update(challengerStanding.id, {
        challengeStatus: ChallengeStatus.PENDING,
        challengePendingDate: currentDate,
        challengedUser: opponent,
      });

      await leagueStandingsRepository.update(opponentStanding.id, {
        challengeStatus: ChallengeStatus.PENDING,
        challengePendingDate: currentDate,
        challengedUser: challenger,
      });

      // Rakibe notification gönder
      try {
        await notificationService.createMatchChallengeNotification(
          opponentId,
          challengerId,
          leagueId
        );
      } catch (notificationError) {
        console.error('Notification oluşturulamadı:', notificationError);
        // Notification hatası ana işlemi etkilemesin
      }

      return {
        challengerId,
        opponentId,
        message,
        status: 'pending',
        createdAt: currentDate,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Meydan okuma gönderilirken bir hata oluştu');
    }
  }

  // Maç kabul etme
  async matchAccepted(userId: string, challengerId: string, leagueId: number) {
    try {
      // Belirli ligde standings'leri bul
      const userStanding = await leagueStandingsRepository.findByUserAndLeague(userId, leagueId);
      const challengerStanding = await leagueStandingsRepository.findByUserAndLeague(challengerId, leagueId);

      if (!userStanding || !challengerStanding) {
        throw new Error('Oyuncular bu lige kayıtlı değil');
      }

      // Her iki kullanıcının da challengeStatus'ünü PENDING olup olmadığını kontrol et
      if (userStanding.challengeStatus !== ChallengeStatus.PENDING || 
          challengerStanding.challengeStatus !== ChallengeStatus.PENDING) {
        throw new Error('Bekleyen bir meydan okuma bulunamadı');
      }

      const currentDate = new Date();

      // Her iki kullanıcının da standing'ini ACCEPTED olarak güncelle
      await leagueStandingsRepository.update(userStanding.id, {
        challengeStatus: ChallengeStatus.ACCEPTED,
        challengeAcceptedDate: currentDate,
      });

      await leagueStandingsRepository.update(challengerStanding.id, {
        challengeStatus: ChallengeStatus.ACCEPTED,
        challengeAcceptedDate: currentDate,
      });

      // İlgili notification'ları sil
      try {
        const notificationRepository = (await import('../repositories/notification.repository')).default;
        
        // Her iki kullanıcının da bu challenge ile ilgili notification'larını bul ve sil
        const userNotifications = await notificationRepository.findPendingChallengeNotifications(userId, challengerId, leagueId);
        const challengerNotifications = await notificationRepository.findPendingChallengeNotifications(challengerId, userId, leagueId);
        
        for (const notification of [...userNotifications, ...challengerNotifications]) {
          await notificationRepository.delete(notification.id);
        }
      } catch (notificationError) {
        // Notification silme hatası ana işlemi etkilemesin
      }

      return {
        success: true,
        message: 'Maç kabul edildi',
        acceptedAt: currentDate,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Maç kabul edilirken bir hata oluştu');
    }
  }

  // Maç reddetme
  async matchRejected(userId: string, challengerId: string, leagueId: number) {
    try {
      // Belirli ligde standings'leri bul
      const userStanding = await leagueStandingsRepository.findByUserAndLeague(userId, leagueId);
      const challengerStanding = await leagueStandingsRepository.findByUserAndLeague(challengerId, leagueId);

      if (!userStanding || !challengerStanding) {
        throw new Error('Oyuncular bu lige kayıtlı değil');
      }

      // Her iki kullanıcının da challengeStatus'ünü PENDING olup olmadığını kontrol et
      if (userStanding.challengeStatus !== ChallengeStatus.PENDING || 
          challengerStanding.challengeStatus !== ChallengeStatus.PENDING) {
        throw new Error('Bekleyen bir meydan okuma bulunamadı');
      }

      // Her iki kullanıcının da challenge bilgilerini temizle
      await leagueStandingsRepository.update(userStanding.id, {
        challengeStatus: null,
        challengePendingDate: null,
        challengeAcceptedDate: null,
        challengedUser: null,
      });

      await leagueStandingsRepository.update(challengerStanding.id, {
        challengeStatus: null,
        challengePendingDate: null,
        challengeAcceptedDate: null,
        challengedUser: null,
      });

      // İlgili notification'ları sil
      try {
        const notificationRepository = (await import('../repositories/notification.repository')).default;
        
        // Her iki kullanıcının da bu challenge ile ilgili notification'larını bul ve sil
        const userNotifications = await notificationRepository.findPendingChallengeNotifications(userId, challengerId, leagueId);
        const challengerNotifications = await notificationRepository.findPendingChallengeNotifications(challengerId, userId, leagueId);
        
        for (const notification of [...userNotifications, ...challengerNotifications]) {
          await notificationRepository.delete(notification.id);
        }
      } catch (notificationError) {
        // Notification silme hatası ana işlemi etkilemesin
      }

      return {
        success: true,
        message: 'Maç reddedildi',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Maç reddedilirken bir hata oluştu');
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
          challengeStatus: standing.challengeStatus,
          challengePendingDate: standing.challengePendingDate,
          challengeAcceptedDate: standing.challengeAcceptedDate,
          canChallenge: standing.challengeStatus !== ChallengeStatus.PENDING, // PENDING ise challenge yapılamaz
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

