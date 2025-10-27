import { Request, Response } from 'express';
import { EloService } from '../services/elo.service';
import { EloRepository } from '../repositories/elo.repository';
import userService from '../services/user.service';
import { AppError } from '../utils/error/app.error';

const eloService = new EloService();
const eloRepository = new EloRepository();

export const eloController = {
  // En yüksek ELO'ya sahip oyuncuları getir
  getTopPlayers: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const minMatches = parseInt(req.query.minMatches as string) || 5;

      const players = await eloRepository.getTopPlayers(limit, minMatches);

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Belirli yıldız seviyesindeki oyuncuları getir
  getPlayersByStarRating: async (req: Request, res: Response) => {
    try {
      const { starRating } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const players = await eloRepository.getPlayersByStarRating(
        parseFloat(starRating),
        limit
      );

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcının ELO geçmişini getir
  getUserEloHistory: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await eloRepository.getHistory(userId, limit);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcının ELO istatistiklerini getir
  getUserEloStats: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const stats = await userService.getEloStats(userId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // ELO dağılımını getir (her yıldız seviyesinde kaç oyuncu var)
  getEloDistribution: async (req: Request, res: Response) => {
    try {
      const distribution = await eloRepository.getEloDistribution();

      return res.status(200).json({
        success: true,
        data: distribution,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Son N gündeki en çok ELO kazanan oyuncuları getir
  getTopGainers: async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 10;

      const topGainers = await eloRepository.getTopGainers(days, limit);

      return res.status(200).json({
        success: true,
        data: topGainers,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Belirli tarih aralığındaki ELO değişimlerini getir
  getUserEloHistoryByDateRange: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('VALIDATION_ERROR');
      }

      const history = await eloRepository.getHistoryByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcının toplam ELO değişimini getir
  getUserTotalEloChange: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const totalChange = await eloRepository.getTotalEloChange(userId);

      return res.status(200).json({
        success: true,
        data: {
          userId,
          totalChange,
        },
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // ELO decay uygula (admin endpoint)
  applyDecay: async (req: Request, res: Response) => {
    try {
      const result = await userService.applyEloDecay();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // İnaktif oyuncuları getir
  getInactivePlayers: async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 6;

      const inactivePlayers = await eloRepository.getInactivePlayers(months);

      return res.status(200).json({
        success: true,
        data: inactivePlayers,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },
};

