import { MatchChallenge, ChallengeStatus } from '../entities/matchChallenge.entity';
import matchChallengeRepository from '../repositories/matchChallenge.repository';
import leagueRepository from '../repositories/league.repository';
import notificationService from './notification.service';
import { AppError } from '../utils/error/app.error';
import { NotificationType } from '../enum/notificationType.enum';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import matchHistoryRepository from '../repositories/matchHistory.repository';

export class MatchChallengeService {
  
  // Tüm challenge'ları getir (admin için)
  async getAllChallenges(): Promise<MatchChallenge[]> {
    try {
      return await matchChallengeRepository.findAll();
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // ID'ye göre challenge getir
  async getChallengeById(id: number): Promise<MatchChallenge> {
    try {
      const challenge = await matchChallengeRepository.findById(id);
      if (!challenge) {
        throw new AppError('CHALLENGE_NOT_FOUND');
      }
      return challenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Maç teklifi oluştur
  async createChallenge(data: {
    challengerId: string;
    challengedId: string;
    leagueId: number;
    message?: string;
    proposedDate?: Date;
    expiresInDays?: number;
  }): Promise<MatchChallenge> {
    try {
      // Kendine challenge gönderemez
      if (data.challengerId === data.challengedId) {
        throw new AppError('CANNOT_CHALLENGE_YOURSELF');
      }

      // Lig tarihleri kontrolü - lig aktif mi?
      const league = await leagueRepository.findById(data.leagueId);
      if (league?.settings) {
        const now = new Date();
        const startDate = new Date(league.settings.leagueStartDate);
        const endDate = new Date(league.settings.leagueEndDate);
        
        // Tarih karşılaştırması için sadece tarih kısmını al (saat bilgisini sıfırla)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const leagueStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const leagueEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        if (today < leagueStart || today > leagueEnd) {
          throw new AppError('LEAGUE_NOT_ACTIVE');
        }
      }

      // Challenger'ın bu ligde aktif bir challenge'ı var mı kontrol et
      const challengerHasActiveChallenge = await matchChallengeRepository.hasActiveChallengeInLeague(
        data.challengerId,
        data.leagueId
      );

      if (challengerHasActiveChallenge) {
        throw new AppError('CHALLENGER_HAS_ACTIVE_CHALLENGE');
      }

      // Challenged kullanıcının bu ligde aktif bir challenge'ı var mı kontrol et
      const challengedHasActiveChallenge = await matchChallengeRepository.hasActiveChallengeInLeague(
        data.challengedId,
        data.leagueId
      );

      if (challengedHasActiveChallenge) {
        throw new AppError('CHALLENGED_HAS_ACTIVE_CHALLENGE');
      }

      // Aynı challenge var mı kontrol et (ekstra güvenlik)
      const existingChallenge = await matchChallengeRepository.findPendingChallenge(
        data.challengerId,
        data.challengedId,
        data.leagueId
      );

      if (existingChallenge) {
        throw new AppError('CHALLENGE_ALREADY_EXISTS');
      }

      // Cooldown ve Shield kontrolleri
      await this.checkCooldownAndShield(
        data.challengerId,
        data.challengedId,
        data.leagueId,
        league
      );

      // Geçerlilik süresi belirleme (varsayılan 7 gün)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

      // proposedDate yoksa şu anki zamanı kullan
      const proposedDate = data.proposedDate || new Date();

      const challenge = await matchChallengeRepository.create({
        challengerId: data.challengerId,
        challengedId: data.challengedId,
        leagueId: data.leagueId,
        message: data.message,
        proposedDate: proposedDate,
        expiresAt,
        status: ChallengeStatus.PENDING
      });

      // Notification oluştur
    await notificationService.createNotification({
      recipientId: data.challengedId,
      type: NotificationType.MATCH_CHALLENGE,
      message: data.message || 'Yeni bir maç teklifi aldınız',
      relatedEntityId: challenge.id,
      relatedEntityType: 'challenge'
    });

      return challenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Challenge'ı kabul et
  async acceptChallenge(challengeId: number, userId: string): Promise<MatchChallenge> {
    try {
      const challenge = await matchChallengeRepository.findById(challengeId);
      
      if (!challenge) {
        throw new AppError('CHALLENGE_NOT_FOUND');
      }

      // Sadece teklif edilen kişi kabul edebilir
      if (challenge.challenged.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      // Sadece pending durumundaysa kabul edilebilir
      if (challenge.status !== ChallengeStatus.PENDING) {
        throw new AppError('CHALLENGE_NOT_PENDING');
      }

      // Geçerlilik kontrolü
      if (new Date() > challenge.expiresAt) {
        await matchChallengeRepository.expireChallenge(challengeId);
        throw new AppError('CHALLENGE_EXPIRED');
      }

      const updatedChallenge = await matchChallengeRepository.acceptChallenge(challengeId);

      // Kabul eden kullanıcının bu ligdeki reddedilmiş challenge'larını temizle
      await matchChallengeRepository.deleteRejectedChallengesByUserInLeague(
        userId,
        challenge.league.id
      );

      // Challenger'a bildirim gönder
      await notificationService.createNotification({
        recipientId: challenge.challenger.id,
        type: NotificationType.MATCH_ACCEPTED,
        message: `${challenge.challenged.name || 'Kullanıcı'} maç teklifinizi kabul etti`,
        relatedEntityId: challenge.id,
        relatedEntityType: 'challenge'
      });

      return updatedChallenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Challenge'ı reddet
  async rejectChallenge(challengeId: number, userId: string): Promise<MatchChallenge> {
    try {
      const challenge = await matchChallengeRepository.findById(challengeId);
      
      if (!challenge) {
        throw new AppError('CHALLENGE_NOT_FOUND');
      }

      // Sadece teklif edilen kişi reddedebilir
      if (challenge.challenged.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      // Sadece pending durumundaysa reddedilebilir
      if (challenge.status !== ChallengeStatus.PENDING) {
        throw new AppError('CHALLENGE_NOT_PENDING');
      }

      // Ligin ayarlarını getir
      const league = await leagueRepository.findById(challenge.league.id);
      
      if (league?.settings?.consecutiveWOLimit) {
        // Kullanıcının bu ligde kaç tane maç reddettiğini kontrol et
        const rejectedCount = await matchChallengeRepository.countRejectedChallengesByUserInLeague(
          userId,
          challenge.league.id
        );

        // Limit aşıldıysa hata fırlat
        if (rejectedCount >= league.settings.consecutiveWOLimit) {
          throw new AppError('CONSECUTIVE_WO_LIMIT_EXCEEDED');
        }
      }

      const updatedChallenge = await matchChallengeRepository.rejectChallenge(challengeId);

      // Challenger'a bildirim gönder
      await notificationService.createNotification({
        recipientId: challenge.challenger.id,
        type: NotificationType.MATCH_REJECTED,
        message: `${challenge.challenged.name || 'Kullanıcı'} maç teklifinizi reddetti`,
        relatedEntityId: challenge.id,
        relatedEntityType: 'challenge'
      });

      return updatedChallenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Challenge'ı iptal et (teklif eden iptal edebilir)
  async cancelChallenge(challengeId: number, userId: string): Promise<MatchChallenge> {
    try {
      const challenge = await matchChallengeRepository.findById(challengeId);
      
      if (!challenge) {
        throw new AppError('CHALLENGE_NOT_FOUND');
      }

      // Sadece teklif eden iptal edebilir
      if (challenge.challenger.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      // Sadece pending durumundaysa iptal edilebilir
      if (challenge.status !== ChallengeStatus.PENDING) {
        throw new AppError('CHALLENGE_NOT_PENDING');
      }

      const updatedChallenge = await matchChallengeRepository.cancelChallenge(challengeId);

      // Challenged kişiye bildirim gönder
      await notificationService.createNotification({
        recipientId: challenge.challenged.id,
        type: NotificationType.SYSTEM_NOTIFICATION,
        message: `${challenge.challenger.name || 'Kullanıcı'} maç teklifini iptal etti`,
        relatedEntityId: challenge.id,
        relatedEntityType: 'challenge'
      });

      return updatedChallenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının aldığı challengeları getir
  async getUserChallenges(userId: string): Promise<MatchChallenge[]> {
    try {
      return await matchChallengeRepository.findByUserId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının pending challengelarını getir
  async getPendingChallenges(userId: string): Promise<MatchChallenge[]> {
    try {
      return await matchChallengeRepository.findPendingByUserId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının gönderdiği challengeları getir
  async getSentChallenges(userId: string): Promise<MatchChallenge[]> {
    try {
      return await matchChallengeRepository.findSentChallenges(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Süresi dolmuş challengeları expire olarak işaretle
  async expireOldChallenges(): Promise<number> {
    try {
      const expiredChallenges = await matchChallengeRepository.findExpiredChallenges();
      
      for (const challenge of expiredChallenges) {
        await matchChallengeRepository.expireChallenge(challenge.id);
      }

      return expiredChallenges.length;
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Challenge sil
  async deleteChallenge(challengeId: number, userId: string): Promise<void> {
    try {
      const challenge = await matchChallengeRepository.findById(challengeId);
      
      if (!challenge) {
        throw new AppError('CHALLENGE_NOT_FOUND');
      }

      // Sadece ilgili kullanıcılar silebilir
      if (challenge.challenger.id !== userId && challenge.challenged.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      await matchChallengeRepository.delete(challengeId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  /**
   * Cooldown ve Shield kontrollerini yapar
   */
  private async checkCooldownAndShield(
    challengerId: string,
    challengedId: string,
    leagueId: number,
    league: any
  ): Promise<void> {
    if (!league?.settings) {
      return; // Ayarlar yoksa kontrol yapma
    }

    const settings = league.settings;
    const userRepository = AppDataSource.getRepository(User);
    const now = new Date();

    // Challenger (teklif eden) kontrolleri
    const challenger = await userRepository.findOne({ where: { id: challengerId } });
    if (!challenger) {
      throw new AppError('USER_NOT_FOUND');
    }

    // Challenger'ın bu ligdeki son maçını bul
    const challengerMatches = await matchHistoryRepository.findByUserId(challengerId);
    const challengerLeagueMatches = challengerMatches.filter(match => 
      match.leagueStanding?.league?.id === leagueId
    );
    const challengerLastMatch = challengerLeagueMatches.length > 0 
      ? challengerLeagueMatches[0] 
      : null;

    // Challenger kaybeden ise cooldown kontrolü
    if (challengerLastMatch) {
      const isLoser = challengerLastMatch.losers.some(loser => loser.id === challengerId);
      if (isLoser) {
        const matchDate = new Date(challengerLastMatch.matchDate);
        const hoursSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceMatch < settings.postMatchCooldownHoursLoser) {
          throw new AppError('COOLDOWN_ACTIVE');
        }
      }
    }

    // Challenged (teklif edilen) kontrolleri
    const challenged = await userRepository.findOne({ where: { id: challengedId } });
    if (!challenged) {
      throw new AppError('USER_NOT_FOUND');
    }

    // Shield kontrolü (eğer aktifse kimse teklif edemez) - Lig bazlı
    if (challenged.leagueShields && challenged.leagueShields[leagueId]) {
      const leagueShield = challenged.leagueShields[leagueId];
      if (leagueShield.shieldActive && leagueShield.shieldExpiresAt) {
        const shieldExpires = typeof leagueShield.shieldExpiresAt === 'string'
          ? new Date(leagueShield.shieldExpiresAt)
          : new Date(leagueShield.shieldExpiresAt);
        if (now < shieldExpires) {
          throw new AppError('SHIELD_ACTIVE');
        } else {
          // Shield süresi dolmuş, pasif yap
          leagueShield.shieldActive = false;
          challenged.leagueShields[leagueId] = leagueShield;
          await userRepository.save(challenged);
        }
      }
    }

    // Challenged'ın bu ligdeki son maçını bul
    const challengedMatches = await matchHistoryRepository.findByUserId(challengedId);
    const challengedLeagueMatches = challengedMatches.filter(match => 
      match.leagueStanding?.league?.id === leagueId
    );
    const challengedLastMatch = challengedLeagueMatches.length > 0 
      ? challengedLeagueMatches[0] 
      : null;

    // Challenged kazanan ise cooldown kontrolü (kimse ona teklif edemez)
    if (challengedLastMatch) {
      const isWinner = challengedLastMatch.winners.some(winner => winner.id === challengedId);
      if (isWinner) {
        const matchDate = new Date(challengedLastMatch.matchDate);
        const hoursSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceMatch < settings.postMatchCooldownHoursWinner) {
          throw new AppError('COOLDOWN_ACTIVE');
        }
      }
    }

  }
}

export default new MatchChallengeService();

