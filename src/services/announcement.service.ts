import { AppDataSource } from '../config/data-source';
import { Announcement } from '../entities/announcement.entity';
import { User } from '../entities/user.entity';

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
      const announcements = await this.announcementRepository.find({
        relations: ['author'],
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC',
        },
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

      const announcement = this.announcementRepository.create({
        title: data.title,
        content: data.content,
        author,
        targetGroup: data.targetGroup || 'all',
        isPinned: data.isPinned || false,
      });

      return await this.announcementRepository.save(announcement);
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

