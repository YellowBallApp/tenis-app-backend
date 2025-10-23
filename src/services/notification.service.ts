import notificationRepository from '../repositories/notification.repository';
import { Notification } from '../entities/notification.entity';
import { AppError } from '../utils/error/app.error';
import { NotificationType } from '../enum/notificationType.enum';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';

export class NotificationService {
  async getAllNotifications(): Promise<Notification[]> {
    try {
      return await notificationRepository.findAll();
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async getNotificationById(id: number): Promise<Notification> {
    try {
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        throw new AppError('NOTIFICATION_NOT_FOUND');
      }
      return notification;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number; page: number; totalPages: number }> {
    try {
      const { notifications, total } = await notificationRepository.findByRecipientId(
        userId,
        page,
        limit
      );
      
      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await notificationRepository.countUnreadByRecipientId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async createNotification(data: {
    recipientId: string;
    type: NotificationType;
    message?: string;
    challengerId?: string;
    leagueId?: number;
  }): Promise<Notification> {
    try {
      const recipient = new User();
      recipient.id = data.recipientId;

      const notificationData: Partial<Notification> = {
        recipient,
        type: data.type,
        message: data.message,
        isRead: false,
      };

      if (data.challengerId) {
        const challenger = new User();
        challenger.id = data.challengerId;
        notificationData.challenger = challenger;
      }

      if (data.leagueId) {
        const league = new League();
        league.id = data.leagueId;
        notificationData.league = league;
      }

      return await notificationRepository.create(notificationData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async createMatchChallengeNotification(
    recipientId: string,
    challengerId: string,
    leagueId: number
  ): Promise<Notification> {
    try {
      return await this.createNotification({
        recipientId,
        type: NotificationType.PENDING_MATCH_REQUEST,
        challengerId,
        leagueId,
        message: 'Yeni bir meydan okuma isteği aldınız',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async createSystemNotification(
    recipientId: string,
    message: string
  ): Promise<Notification> {
    try {
      return await this.createNotification({
        recipientId,
        type: NotificationType.SYSTEM_NOTIFICATION,
        message,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async markAsRead(id: number, userId: string): Promise<Notification> {
    try {
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        throw new AppError('NOTIFICATION_NOT_FOUND');
      }

      // Sadece notification'ın sahibi okuma işareti koyabilir
      if (notification.recipient.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      return await notificationRepository.markAsRead(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await notificationRepository.markAllAsRead(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    try {
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        throw new AppError('NOTIFICATION_NOT_FOUND');
      }

      // Sadece notification'ın sahibi silebilir
      if (notification.recipient.id !== userId) {
        throw new AppError('UNAUTHORIZED');
      }

      await notificationRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      await notificationRepository.deleteByRecipientId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }
}

export default new NotificationService();

