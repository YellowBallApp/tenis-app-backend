import { Request, Response } from 'express';
import { LeagueService } from '../services/league.service';

export class LeagueController {
  private leagueService: LeagueService;

  constructor() {
    this.leagueService = new LeagueService();
  }

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
      const rankings = await this.leagueService.getLeagueRankings();
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
      const userId = parseInt(req.params.userId);
      const leagueInfo = await this.leagueService.getUserLeagueInfo(userId);
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
      const userId = parseInt(req.params.userId);
      const opponents = await this.leagueService.getAvailableOpponents(userId);
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

