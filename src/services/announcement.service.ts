import { AppDataSource } from '../config/data-source';
import { Announcement } from '../entities/announcement.entity';
import { User } from '../entities/user.entity';
import notificationService from './notification.service';
import { NotificationType } from '../enum/notificationType.enum';

export class AnnouncementService {
  private announcementRepository;
  private userRepository;

  constructor() {
    this.announcementRepository = AppDataSource.getRepository(Announcement);
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Tüm duyuruları getir
  async getAllAnnouncements() {
    try {
      // Önce tüm duyuruları çek
      const announcements = await this.announcementRepository.find({
        relations: ['author'],
      });

      // Sıralama mantığı:
      // 1. Sabitlenmiş duyurular en üstte (isPinned: true)
      // 2. Sabitlenmiş duyurular kendi aralarında updatedAt'e göre DESC sıralanır
      // 3. Sabitlenmemiş duyurular updatedAt'e göre DESC sıralanır
      announcements.sort((a, b) => {
        // Önce pinned durumuna göre sırala (pinned olanlar üstte)
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        
        // Aynı pinned durumundaysa, updatedAt'e göre sırala (yeni olanlar üstte)
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return announcements;
    } catch (error) {
      throw new Error('Duyurular alınırken bir hata oluştu');
    }
  }

  // Yeni duyuru oluştur (Admin)
  async createAnnouncement(authorId: string, data: {
    title: string;
    content: string;
    targetGroup?: string;
    isPinned?: boolean;
  }) {
    try {
      const author = await this.userRepository.findOne({ where: { id: authorId } });
      
      if (!author) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Yeni duyuru otomatik olarak isPinned=true olsun (eğer açıkça false belirtilmediyse)
      const willBePinned = data.isPinned !== false;

      // Eğer yeni duyuru pinned olacaksa, eski pinned duyuruları false yap
      if (willBePinned) {
        await this.announcementRepository.update(
          { isPinned: true },
          { isPinned: false }
        );
      }

      const announcement = this.announcementRepository.create({
        title: data.title,
        content: data.content,
        author,
        targetGroup: data.targetGroup || 'all',
        isPinned: willBePinned,
      });

      const savedAnnouncement = await this.announcementRepository.save(announcement);

      // Tüm kullanıcılara bildirim gönder
      try {
        const allUsers = await this.userRepository.find();
        const notificationMessage = `📢 Yeni Duyuru: ${data.title}`;
        
        // Her kullanıcıya bildirim gönder
        const notificationPromises = allUsers.map(user => 
          notificationService.createNotification({
            recipientId: user.id,
            type: NotificationType.SYSTEM_NOTIFICATION,
            message: notificationMessage,
            relatedEntityId: savedAnnouncement.id,
            relatedEntityType: 'announcement',
          }).catch(err => {
            console.error(`Kullanıcı ${user.id} için bildirim gönderilemedi:`, err);
            return null;
          })
        );

        await Promise.all(notificationPromises);
        console.log(`${allUsers.length} kullanıcıya duyuru bildirimi gönderildi`);
      } catch (notificationError) {
        console.error('Bildirim gönderme hatası:', notificationError);
        // Bildirim hatası duyuru oluşturmayı engellemez
      }

      return savedAnnouncement;
    } catch (error: any) {
      throw new Error(error.message || 'Duyuru oluşturulurken bir hata oluştu');
    }
  }

  // Duyuru güncelle
  async updateAnnouncement(announcementId: number, data: Partial<Announcement>) {
    try {
      const announcement = await this.announcementRepository.findOne({
        where: { id: announcementId },
      });

      if (!announcement) {
        throw new Error('Duyuru bulunamadı');
      }

      // Eğer isPinned true yapılıyorsa, diğer pinned duyuruları false yap
      if (data.isPinned === true && !announcement.isPinned) {
        await this.announcementRepository.update(
          { isPinned: true },
          { isPinned: false }
        );
      }

      Object.assign(announcement, data);
      
      return await this.announcementRepository.save(announcement);
    } catch (error: any) {
      throw new Error(error.message || 'Duyuru güncellenirken bir hata oluştu');
    }
  }

  // Duyuru sil
  async deleteAnnouncement(announcementId: number) {
    try {
      const announcement = await this.announcementRepository.findOne({
        where: { id: announcementId },
      });

      if (!announcement) {
        throw new Error('Duyuru bulunamadı');
      }

      await this.announcementRepository.remove(announcement);
      
      return { message: 'Duyuru silindi' };
    } catch (error: any) {
      throw new Error(error.message || 'Duyuru silinirken bir hata oluştu');
    }
  }
}

