import { Request, Response } from 'express';
import matchHistoryService from '../services/matchHistory.service';
import { AppError } from '../utils/error/app.error';

export const matchHistoryController = {
  // Tüm maç geçmişlerini getir
  getAll: async (req: Request, res: Response) => {
    try {
      const matchHistories = await matchHistoryService.findAll();
      return res.status(200).json({
        success: true,
        data: matchHistories,
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

  // ID'ye göre maç geçmişi getir
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const matchHistory = await matchHistoryService.findById(Number(id));
      return res.status(200).json({
        success: true,
        data: matchHistory,
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

  // Kullanıcıya göre maç geçmişi getir
  getByUserId: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const matchHistories = await matchHistoryService.findByUserId(userId);
      return res.status(200).json({
        success: true,
        data: matchHistories,
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

  // Lige göre maç geçmişi getir
  getByLeagueId: async (req: Request, res: Response) => {
    try {
      const { leagueId } = req.params;
      const matchHistories = await matchHistoryService.findByLeagueId(Number(leagueId));
      return res.status(200).json({
        success: true,
        data: matchHistories,
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

  // Kullanıcının maç istatistiklerini getir
  getUserStats: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const stats = await matchHistoryService.getUserMatchStats(userId);
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

  // Yeni maç geçmişi oluştur
  create: async (req: Request, res: Response) => {
    try {
      const { winnerIds, loserIds, score, matchDate, leagueStandingId } = req.body;

      if (!winnerIds || !loserIds || !score) {
        throw new AppError('VALIDATION_ERROR');
      }

      const matchHistory = await matchHistoryService.create({
        winnerIds,
        loserIds,
        score,
        matchDate,
        leagueStandingId,
      });

      return res.status(201).json({
        success: true,
        data: matchHistory,
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

  // Maç geçmişini güncelle
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const matchHistory = await matchHistoryService.update(Number(id), req.body);
      return res.status(200).json({
        success: true,
        data: matchHistory,
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

  // Maç geçmişini sil
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await matchHistoryService.delete(Number(id));
      return res.status(200).json({
        success: true,
        message: 'Match history deleted successfully',
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

