import { Request, Response } from 'express';
import { LeagueService } from '../services/league.service';
import leagueStandingsService from '../services/leagueStandings.service';
import { AppError } from '../utils/error/app.error';

export class LeagueController {
  private leagueService: LeagueService;
  private leagueStandingsService: typeof leagueStandingsService;

  constructor() {
    this.leagueService = new LeagueService();
    this.leagueStandingsService = leagueStandingsService;
  }

  // ==================== League Entity CRUD ====================
  
  // Tüm ligleri getir
  getAllLeagues = async (req: Request, res: Response) => {
    try {
      const leagues = await this.leagueService.findAllLeagues();
      return res.status(200).json({
        success: true,
        data: leagues,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Belirli bir ligi getir
  getLeagueById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const league = await this.leagueService.findLeagueById(id);
      return res.status(200).json({
        success: true,
        data: league,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Code'a göre ligi getir
  getLeagueByCode = async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const league = await this.leagueService.findLeagueByCode(code);
      return res.status(200).json({
        success: true,
        data: league,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Yeni lig oluştur
  createLeague = async (req: Request, res: Response) => {
    try {
      const league = await this.leagueService.createLeague(req.body);
      return res.status(201).json({
        success: true,
        message: 'Lig başarıyla oluşturuldu',
        data: league,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Lig güncelle
  updateLeague = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const league = await this.leagueService.updateLeague(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Lig başarıyla güncellendi',
        data: league,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Lig sil
  deleteLeague = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.leagueService.deleteLeague(id);
      return res.status(200).json({
        success: true,
        message: 'Lig başarıyla silindi',
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // ==================== League Standings & Match Functions ====================

  // Lig ayarlarını getir
  getLeagueSettings = async (req: Request, res: Response) => {
    try {
      const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;
      const settings = await this.leagueService.getLeagueSettings(leagueId);
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lig ayarları alınırken bir hata oluştu',
      });
    }
  };

  // Lig ayarlarını güncelle
  updateLeagueSettings = async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const settingsData = req.body;
      const updatedSettings = await this.leagueService.updateLeagueSettings(leagueId, settingsData);
      return res.status(200).json({
        success: true,
        message: 'Lig ayarları başarıyla güncellendi',
        data: updatedSettings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lig ayarları güncellenirken bir hata oluştu',
      });
    }
  };

  // Lig sıralamasını getir
  getLeagueRankings = async (req: Request, res: Response) => {
    try {
      const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;
      const rankings = await this.leagueStandingsService.getLeagueRankings(leagueId);
      return res.status(200).json({
        success: true,
        data: rankings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Lig sıralaması alınırken bir hata oluştu',
      });
    }
  };

  // Kullanıcının lig bilgilerini getir
  getUserLeagueInfo = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;
      const leagueInfo = await this.leagueStandingsService.getUserLeagueInfo(userId, leagueId);
      return res.status(200).json({
        success: true,
        data: leagueInfo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Kullanıcı lig bilgisi alınırken bir hata oluştu',
      });
    }
  };

  // Maç teklifi gönder
  sendMatchChallenge = async (req: Request, res: Response) => {
    try {
      const { challengerId, opponentId, message, leagueId } = req.body;
      const challenge = await this.leagueStandingsService.sendMatchChallenge(
        challengerId,
        opponentId,
        message,
        leagueId
      );
      return res.status(201).json({
        success: true,
        message: 'Meydan okuma başarıyla gönderildi',
        data: challenge,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Meydan okuma gönderilirken bir hata oluştu',
      });
    }
  };

  // Maç kabul et
  matchAccepted = async (req: Request, res: Response) => {
    try {
      const { userId, challengerId, leagueId } = req.body;
      
      const result = await this.leagueStandingsService.matchAccepted(
        userId,
        challengerId,
        leagueId
      );
      return res.status(200).json({
        success: true,
        message: 'Maç kabul edildi',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Maç kabul edilirken bir hata oluştu',
      });
    }
  };

  // Maç reddet
  matchRejected = async (req: Request, res: Response) => {
    try {
      const { userId, challengerId, leagueId } = req.body;
      
      const result = await this.leagueStandingsService.matchRejected(
        userId,
        challengerId,
        leagueId
      );
      
      return res.status(200).json({
        success: true,
        message: 'Maç reddedildi',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Maç reddedilirken bir hata oluştu',
      });
    }
  };

  // Maç sonucunu kaydet
  recordMatchResult = async (req: Request, res: Response) => {
    try {
      const { matchId, winnerId, loserId, score } = req.body;
      const result = await this.leagueStandingsService.recordMatchResult(
        matchId,
        winnerId,
        loserId,
        score
      );
      return res.status(200).json({
        success: true,
        message: 'Maç sonucu başarıyla kaydedildi',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Maç sonucu kaydedilirken bir hata oluştu',
      });
    }
  };

  // Teklif yapılabilecek oyuncuları getir
  getAvailableOpponents = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;
      const opponents = await this.leagueStandingsService.getAvailableOpponents(userId, leagueId);
      return res.status(200).json({
        success: true,
        data: opponents,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Rakip listesi alınırken bir hata oluştu',
      });
    }
  };

  // ==================== League Standings CRUD ====================

  // Tüm standings'leri getir
  getAllStandings = async (req: Request, res: Response) => {
    try {
      const standings = await leagueStandingsService.findAll();
      return res.status(200).json({
        success: true,
        data: standings,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // ID'ye göre standing getir
  getStandingById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const standing = await leagueStandingsService.findById(id);
      return res.status(200).json({
        success: true,
        data: standing,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Belirli bir lige ait standings'leri getir
  getStandingsByLeagueId = async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const standings = await leagueStandingsService.findByLeagueId(leagueId);
      return res.status(200).json({
        success: true,
        data: standings,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Belirli bir kullanıcıya ait standings'leri getir
  getStandingsByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const standings = await leagueStandingsService.findByUserId(userId);
      return res.status(200).json({
        success: true,
        data: standings,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Yeni standing oluştur
  createStanding = async (req: Request, res: Response) => {
    try {
      const standing = await leagueStandingsService.create(req.body);
      return res.status(201).json({
        success: true,
        data: standing,
        message: 'Standing başarıyla oluşturuldu',
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Standing güncelle
  updateStanding = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const standing = await leagueStandingsService.update(id, req.body);
      return res.status(200).json({
        success: true,
        data: standing,
        message: 'Standing başarıyla güncellendi',
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Standing sil
  deleteStanding = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await leagueStandingsService.delete(id);
      return res.status(200).json({
        success: true,
        message: 'Standing başarıyla silindi',
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Kullanıcının lig sıralamasını güncelle (challenge kazandığında)
  updateUserRanking = async (req: Request, res: Response) => {
    try {
      const { leagueId, challengerId, challengedId, score, courtId } = req.body;
      
      // Zorunlu alan kontrolü
      if (!leagueId || !challengerId || !challengedId || !score) {
        throw new AppError("VALIDATION_ERROR");
      }

      await leagueStandingsService.updateRanking(leagueId, challengerId, challengedId, score, courtId);
      return res.status(200).json({
        success: true,
        message: 'Sıralama başarıyla güncellendi',
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: error.message || appError.message,
      });
    }
  };

  // Kullanıcıyı lige ekle
  joinLeague = async (req: Request, res: Response) => {
    try {
      const { userId, leagueId } = req.body;
      const standing = await leagueStandingsService.joinLeague(userId, leagueId);
      return res.status(201).json({
        success: true,
        message: 'Lige başarıyla katıldınız',
        data: standing,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };
}

