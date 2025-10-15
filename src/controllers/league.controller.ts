import { Request, Response } from 'express';
import { LeagueService } from '../services/league.service';
import leagueEntityService from '../services/leagueEntity.service';
import { AppError } from '../utils/error/app.error';

export class LeagueController {
  private leagueService: LeagueService;

  constructor() {
    this.leagueService = new LeagueService();
  }

  // ==================== League Entity CRUD ====================
  
  // Tüm ligleri getir
  getAllLeagues = async (req: Request, res: Response) => {
    try {
      const leagues = await leagueEntityService.findAll();
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
      const league = await leagueEntityService.findById(id);
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
      const league = await leagueEntityService.create(req.body);
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
      const league = await leagueEntityService.update(id, req.body);
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
      await leagueEntityService.delete(id);
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
      const settings = await this.leagueService.getLeagueSettings();
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
      const settings = req.body;
      const updatedSettings = await this.leagueService.updateLeagueSettings(settings);
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
      const rankings = await this.leagueService.getLeagueRankings(leagueId);
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
      const leagueInfo = await this.leagueService.getUserLeagueInfo(userId, leagueId);
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
      const { challengerId, opponentId, message } = req.body;
      const challenge = await this.leagueService.sendMatchChallenge(
        challengerId,
        opponentId,
        message
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

  // Maç sonucunu kaydet
  recordMatchResult = async (req: Request, res: Response) => {
    try {
      const { matchId, winnerId, loserId, score } = req.body;
      const result = await this.leagueService.recordMatchResult(
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
      const opponents = await this.leagueService.getAvailableOpponents(userId, leagueId);
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
}

