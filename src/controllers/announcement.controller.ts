import { Request, Response } from 'express';
import { AnnouncementService } from '../services/announcement.service';

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  // Tüm duyuruları getir
  getAllAnnouncements = async (req: Request, res: Response) => {
    try {
      const announcements = await this.announcementService.getAllAnnouncements();
      
      return res.status(200).json({
        success: true,
        data: announcements,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Duyurular alınırken bir hata oluştu',
      });
    }
  };

  // Yeni duyuru oluştur (Admin)
  createAnnouncement = async (req: Request, res: Response) => {
    try {
      const authorId = (req as any).userId;
      const { title, content, targetGroup, isPinned } = req.body;

      const announcement = await this.announcementService.createAnnouncement(authorId, {
        title,
        content,
        targetGroup,
        isPinned,
      });

      return res.status(201).json({
        success: true,
        message: 'Duyuru başarıyla oluşturuldu',
        data: announcement,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Duyuru oluşturulurken bir hata oluştu',
      });
    }
  };

  // Duyuru güncelle
  updateAnnouncement = async (req: Request, res: Response) => {
    try {
      const announcementId = parseInt(req.params.id);
      const data = req.body;

      const announcement = await this.announcementService.updateAnnouncement(announcementId, data);
      
      return res.status(200).json({
        success: true,
        message: 'Duyuru güncellendi',
        data: announcement,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Duyuru güncellenirken bir hata oluştu',
      });
    }
  };

  // Duyuru sil
  deleteAnnouncement = async (req: Request, res: Response) => {
    try {
      const announcementId = parseInt(req.params.id);

      const result = await this.announcementService.deleteAnnouncement(announcementId);
      
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Duyuru silinirken bir hata oluştu',
      });
    }
  };
}

