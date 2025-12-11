import { Request, Response } from 'express';
import shieldService from '../services/shield.service';
import { AppError } from '../utils/error/app.error';

export class ShieldController {
  /**
   * Shield'i aktif eder
   */
  activateShield = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const { leagueId, days } = req.body;

      if (!leagueId || !days) {
        throw new AppError('MISSING_REQUIRED_FIELDS');
      }

      if (typeof days !== 'number' || days <= 0) {
        throw new AppError('INVALID_RATING');
      }

      const user = await shieldService.activateShield(userId, leagueId, days);

      // Lig bazlı shield bilgisini al
      const leagueShield = user.leagueShields?.[leagueId] || {
        shieldActive: false,
        shieldExpiresAt: null,
        shieldDaysRemaining: 0
      };

      return res.status(200).json({
        success: true,
        message: `Shield ${days} gün için aktif edildi. Kalan shield günü: ${leagueShield.shieldDaysRemaining}`,
        data: {
          shieldActive: leagueShield.shieldActive,
          shieldExpiresAt: leagueShield.shieldExpiresAt,
          shieldDaysRemaining: leagueShield.shieldDaysRemaining
        }
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError('UNKNOWN_ERROR');
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  /**
   * Shield durumunu getirir
   */
  getShieldStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const leagueId = parseInt(req.params.leagueId);
      if (!leagueId) {
        throw new AppError('MISSING_REQUIRED_FIELDS');
      }

      const status = await shieldService.getShieldStatus(userId, leagueId);

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError('UNKNOWN_ERROR');
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };
}

export default new ShieldController();

