import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { AppError } from '../utils/error/app.error';

export const notificationController = {
  // Kullanıcının tüm notification'larını getir (pagination ile)
  getUserNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await notificationService.getUserNotifications(userId, page, limit);
      
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

  // Okunmamış notification sayısını getir
  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const count = await notificationService.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
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

  // Belirli bir notification'ı getir
  getNotificationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const notification = await notificationService.getNotificationById(Number(id));
      
      // Sadece kendi notification'larını görebilir
      if (notification.recipient.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      return res.status(200).json({
        success: true,
        data: notification,
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

  // Notification'ı okundu olarak işaretle
  markAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      const notification = await notificationService.markAsRead(Number(id), userId);
      
      return res.status(200).json({
        success: true,
        data: notification,
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

  // Tüm notification'ları okundu olarak işaretle
  markAllAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      await notificationService.markAllAsRead(userId);
      
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
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

  // Notification'ı sil
  deleteNotification: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      await notificationService.deleteNotification(Number(id), userId);
      
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
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

  // Tüm notification'ları sil
  deleteAllNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('UNAUTHORIZED');
      }

      await notificationService.deleteAllNotifications(userId);
      
      return res.status(200).json({
        success: true,
        message: 'All notifications deleted successfully',
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

