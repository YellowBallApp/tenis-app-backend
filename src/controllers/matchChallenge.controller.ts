import { Request, Response } from 'express';
import matchChallengeService from '../services/matchChallenge.service';
import { AppError } from '../utils/error/app.error';

export const matchChallengeController = {
  // Maç teklifi oluştur
  createChallenge: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { challengedId, leagueId, message, proposedDate, expiresInDays } = req.body;

      if (!challengedId || !leagueId) {
        throw new AppError('MISSING_REQUIRED_FIELDS');
      }

      const challenge = await matchChallengeService.createChallenge({
        challengerId: userId,
        challengedId,
        leagueId: Number(leagueId),
        message,
        proposedDate: proposedDate ? new Date(proposedDate) : undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
      });

      return res.status(201).json({
        success: true,
        data: challenge,
        message: 'Maç teklifi başarıyla oluşturuldu'
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

  // Challenge'ı kabul et
  acceptChallenge: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { id } = req.params;

      const challenge = await matchChallengeService.acceptChallenge(Number(id), userId);

      return res.status(200).json({
        success: true,
        data: challenge,
        message: 'Maç teklifi kabul edildi'
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

  // Challenge'ı reddet
  rejectChallenge: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { id } = req.params;

      const challenge = await matchChallengeService.rejectChallenge(Number(id), userId);

      return res.status(200).json({
        success: true,
        data: challenge,
        message: 'Maç teklifi reddedildi'
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

  // Challenge'ı iptal et
  cancelChallenge: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { id } = req.params;

      const challenge = await matchChallengeService.cancelChallenge(Number(id), userId);

      return res.status(200).json({
        success: true,
        data: challenge,
        message: 'Maç teklifi iptal edildi'
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

  // Kullanıcının aldığı bekleyen teklifleri getir
  getPendingChallenges: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const challenges = await matchChallengeService.getPendingChallenges(userId);

      return res.status(200).json({
        success: true,
        data: challenges
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

  // Kullanıcının gönderdiği teklifleri getir
  getSentChallenges: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const challenges = await matchChallengeService.getSentChallenges(userId);

      return res.status(200).json({
        success: true,
        data: challenges
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

  // Kullanıcının tüm challengelarını getir
  getUserChallenges: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const challenges = await matchChallengeService.getUserChallenges(userId);

      return res.status(200).json({
        success: true,
        data: challenges
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

  // ID'ye göre challenge detayını getir
  getChallengeById: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { id } = req.params;

      const challenge = await matchChallengeService.getChallengeById(Number(id));

      // Sadece ilgili kullanıcılar görebilir
      if (challenge.challenger.id !== userId && challenge.challenged.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      return res.status(200).json({
        success: true,
        data: challenge
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

  // Challenge sil
  deleteChallenge: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { id } = req.params;

      await matchChallengeService.deleteChallenge(Number(id), userId);

      return res.status(200).json({
        success: true,
        message: 'Maç teklifi başarıyla silindi'
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

  // Tüm challengeları getir (admin)
  getAllChallenges: async (req: Request, res: Response) => {
    try {
      const challenges = await matchChallengeService.getAllChallenges();

      return res.status(200).json({
        success: true,
        data: challenges
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

