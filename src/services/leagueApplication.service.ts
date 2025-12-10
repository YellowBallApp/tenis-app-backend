import leagueApplicationRepository from '../repositories/leagueApplication.repository';
import { LeagueApplication, LeagueApplicationStatus } from '../entities/leagueApplication.entity';
import { AppError } from '../utils/error/app.error';
import leagueStandingsService from './leagueStandings.service';
import { AppDataSource } from '../config/data-source';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import notificationService from './notification.service';
import { NotificationType } from '../enum/notificationType.enum';
import { League } from '../entities/league.entity';
import { User } from '../entities/user.entity';

export class LeagueApplicationService {
  async createApplication(userId: string, leagueId: number, notes?: string): Promise<LeagueApplication> {
    // Kullanıcı zaten ligde mi kontrol et (önce bunu kontrol et)
    const standings = await leagueStandingsService.findByUserId(userId);
    const alreadyInLeague = standings.some(standing => standing.league.id === leagueId);
    
    if (alreadyInLeague) {
      throw new AppError("USER_ALREADY_IN_LEAGUE");
    }

    // Kullanıcının bu lig için zaten başvurusu var mı kontrol et
    const existingApplications = await leagueApplicationRepository.findByUserId(userId, leagueId);
    
    // PENDING başvuru varsa engelle
    const pendingApplication = existingApplications.find(
      app => app.status === LeagueApplicationStatus.PENDING
    );
    
    if (pendingApplication) {
      throw new AppError("LEAGUE_APPLICATION_ALREADY_PENDING");
    }

    // APPROVED başvuru varsa ama kullanıcı ligde değilse (ligden çıkarılmışsa), yeni başvuru yapabilir
    // Bu durumda eski APPROVED başvuruyu görmezden geliyoruz

    // Yaş aralığı kontrolü
    const leagueRepository = AppDataSource.getRepository(League);
    const league = await leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['settings']
    });
    
    if (league && league.settings) {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId }
      });
      
      if (user && user.birthDate) {
        const today = new Date();
        const birth = new Date(user.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        const { minAge, maxAge } = league.settings;
        
        // Yaş aralığı kontrolü
        if (minAge !== null || maxAge !== null) {
          // İki sayı girilmişse: aralık kontrolü
          if (minAge !== null && maxAge !== null) {
            if (age < minAge || age > maxAge) {
              throw new AppError("USER_AGE_NOT_IN_RANGE");
            }
          }
          // Sadece minAge girilmişse: o yaş ve üzeri
          else if (minAge !== null && maxAge === null) {
            if (age < minAge) {
              throw new AppError("USER_AGE_NOT_IN_RANGE");
            }
          }
          // Sadece maxAge girilmişse: o yaş ve altı
          else if (maxAge !== null && minAge === null) {
            if (age > maxAge) {
              throw new AppError("USER_AGE_NOT_IN_RANGE");
            }
          }
        }
      }
    }

    return await leagueApplicationRepository.create({
      user: { id: userId } as any,
      league: { id: leagueId } as any,
      status: LeagueApplicationStatus.PENDING,
      notes
    });
  }

  async approveApplication(applicationId: number, notes?: string): Promise<LeagueApplication> {
    const application = await leagueApplicationRepository.findById(applicationId);
    
    if (application.status !== LeagueApplicationStatus.PENDING) {
      throw new AppError("LEAGUE_APPLICATION_NOT_PENDING");
    }

    // Kullanıcı zaten ligde mi kontrol et
    const standings = await leagueStandingsService.findByUserId(application.user.id);
    const alreadyInLeague = standings.some(standing => standing.league.id === application.league.id);
    
    if (alreadyInLeague) {
      throw new AppError("USER_ALREADY_IN_LEAGUE");
    }

    // Lige ekle - en son sıraya ekle
    const leagueStandings = await leagueStandingsService.findByLeagueId(application.league.id);
    const lastRanking = leagueStandings.length > 0 
      ? Math.max(...leagueStandings.map(s => s.leagueRanking)) 
      : 0;
    
    await leagueStandingsService.create({
      user: application.user,
      league: application.league,
      leagueRanking: lastRanking + 1
    });

    // Başvuruyu onayla
    application.status = LeagueApplicationStatus.APPROVED;
    const updatedApplication = await leagueApplicationRepository.update(applicationId, { 
      status: LeagueApplicationStatus.APPROVED,
      notes: notes || application.notes
    });

    // Kullanıcıya bildirim gönder
    const approvalMessage = notes 
      ? `${application.league.name} için başvurunuz onaylanmıştır. Not: ${notes}`
      : `${application.league.name} için başvurunuz onaylanmıştır.`;
    
    await notificationService.createNotification({
      recipientId: application.user.id,
      type: NotificationType.SYSTEM_NOTIFICATION,
      message: approvalMessage,
      relatedEntityId: application.league.id,
      relatedEntityType: 'league'
    });

    return updatedApplication;
  }

  async rejectApplication(applicationId: number, notes?: string): Promise<LeagueApplication> {
    const application = await leagueApplicationRepository.findById(applicationId);
    
    if (application.status !== LeagueApplicationStatus.PENDING) {
      throw new AppError("LEAGUE_APPLICATION_NOT_PENDING");
    }

    const updatedApplication = await leagueApplicationRepository.update(applicationId, {
      status: LeagueApplicationStatus.REJECTED,
      notes: notes || application.notes
    });

    // Kullanıcıya bildirim gönder
    const rejectionMessage = notes 
      ? `${application.league.name} için başvurunuz reddedilmiştir. Sebep: ${notes}`
      : `${application.league.name} için başvurunuz reddedilmiştir.`;

    await notificationService.createNotification({
      recipientId: application.user.id,
      type: NotificationType.SYSTEM_NOTIFICATION,
      message: rejectionMessage,
      relatedEntityId: application.league.id,
      relatedEntityType: 'league'
    });

    return updatedApplication;
  }

  async findAll(): Promise<LeagueApplication[]> {
    return await leagueApplicationRepository.findAll();
  }

  async findById(id: number): Promise<LeagueApplication> {
    return await leagueApplicationRepository.findById(id);
  }

  async findByLeagueId(leagueId: number, status?: LeagueApplicationStatus): Promise<LeagueApplication[]> {
    return await leagueApplicationRepository.findByLeagueId(leagueId, status);
  }

  async findByUserId(userId: string): Promise<LeagueApplication[]> {
    return await leagueApplicationRepository.findByUserId(userId);
  }

  async getPendingCount(): Promise<number> {
    const pending = await leagueApplicationRepository.findByStatus(LeagueApplicationStatus.PENDING);
    return pending.length;
  }

  async updateApplication(applicationId: number, data: { status?: LeagueApplicationStatus; notes?: string }): Promise<LeagueApplication> {
    const application = await leagueApplicationRepository.findById(applicationId);
    
    // Eğer status değiştiriliyorsa ve approved'a çevriliyorsa, kullanıcıyı lige ekle
    if (data.status === LeagueApplicationStatus.APPROVED && application.status !== LeagueApplicationStatus.APPROVED) {
      // Kullanıcı zaten ligde mi kontrol et
      const standings = await leagueStandingsService.findByUserId(application.user.id);
      const alreadyInLeague = standings.some(standing => standing.league.id === application.league.id);
      
      if (!alreadyInLeague) {
        // Lige ekle - en son sıraya ekle
        const leagueStandings = await leagueStandingsService.findByLeagueId(application.league.id);
        const lastRanking = leagueStandings.length > 0 
          ? Math.max(...leagueStandings.map(s => s.leagueRanking)) 
          : 0;
        
        await leagueStandingsService.create({
          user: application.user,
          league: application.league,
          leagueRanking: lastRanking + 1
        });

        // Kullanıcıya bildirim gönder
        await notificationService.createNotification({
          recipientId: application.user.id,
          type: NotificationType.SYSTEM_NOTIFICATION,
          message: `${application.league.name} için başvurunuz onaylanmıştır.`,
          relatedEntityId: application.league.id,
          relatedEntityType: 'league'
        });
      }
    }

    const updatedApplication = await leagueApplicationRepository.update(applicationId, data);
    return updatedApplication;
  }

  async deleteApplication(applicationId: number): Promise<void> {
    const application = await leagueApplicationRepository.findById(applicationId);
    
    // Eğer başvuru onaylanmışsa ve kullanıcı ligdeyse, kullanıcıyı ligden çıkar
    if (application.status === LeagueApplicationStatus.APPROVED) {
      const standings = await leagueStandingsService.findByUserId(application.user.id);
      const leagueStanding = standings.find(standing => standing.league.id === application.league.id);
      
      if (leagueStanding) {
        await leagueStandingsService.delete(leagueStanding.id);
      }
    }

    await leagueApplicationRepository.delete(applicationId);
  }
}

export default new LeagueApplicationService();

