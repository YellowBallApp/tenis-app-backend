import { AppDataSource } from '../config/data-source';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enum/notificationType.enum';
import { Repository } from 'typeorm';

export class NotificationRepository {
  private repository: Repository<Notification>;

  constructor() {
    this.repository = AppDataSource.getRepository(Notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.repository.find({
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Notification | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['recipient'],
    });
  }

  async findByRecipientId(
    recipientId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await this.repository.findAndCount({
      where: { recipient: { id: recipientId } },
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { notifications, total };
  }

  async findByRecipientIdAndType(
    recipientId: string,
    type: NotificationType,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await this.repository.findAndCount({
      where: { 
        recipient: { id: recipientId },
        type: type,
      },
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { notifications, total };
  }

  async countUnreadByRecipientId(recipientId: string): Promise<number> {
    return this.repository.count({
      where: { 
        recipient: { id: recipientId },
        isRead: false,
      },
    });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(data);
    return this.repository.save(notification);
  }

  async update(id: number, data: Partial<Notification>): Promise<Notification> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Notification not found');
    }
    return updated;
  }

  async markAsRead(id: number): Promise<Notification> {
    return this.update(id, { isRead: true });
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.repository.update(
      { recipient: { id: recipientId }, isRead: false },
      { isRead: true }
    );
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByRecipientId(recipientId: string): Promise<void> {
    await this.repository.delete({ recipient: { id: recipientId } });
  }

  async deleteByRelatedEntity(relatedEntityId: number, relatedEntityType: string): Promise<void> {
    await this.repository.delete({
      relatedEntityId,
      relatedEntityType,
    });
  }

  // Bu metod artık kullanılmıyor - challenge sistemi ayrıldı
  // async findPendingChallengeNotifications(
  //   recipientId: string, 
  //   challengerId: string, 
  //   leagueId: number
  // ): Promise<Notification[]> {
  //   // Challenge sistemi artık ayrı bir entity olarak yönetiliyor
  //   return [];
  // }
}

export default new NotificationRepository();

