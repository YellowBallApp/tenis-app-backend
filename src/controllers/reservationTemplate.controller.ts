import { Request, Response } from 'express';
import { ReservationTemplateService } from '../services/reservationTemplate.service';

export class ReservationTemplateController {
  private templateService: ReservationTemplateService;

  constructor() {
    this.templateService = new ReservationTemplateService();
  }

  // Tüm şablonları getir
  getAllTemplates = async (req: Request, res: Response) => {
    try {
      const templates = await this.templateService.getAllTemplates();
      return res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Şablonlar alınırken bir hata oluştu',
      });
    }
  };

  // Belirli bir gün için şablonları getir
  getTemplatesByDay = async (req: Request, res: Response) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir gün numarası giriniz (0-6)',
        });
      }

      const templates = await this.templateService.getTemplatesByDay(dayOfWeek);
      return res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Şablonlar alınırken bir hata oluştu',
      });
    }
  };

  // Belirli bir gün için aktif saat dilimlerini getir (public endpoint)
  getActiveTimeSlotsForDay = async (req: Request, res: Response) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir gün numarası giriniz (0-6)',
        });
      }

      const timeSlots = await this.templateService.getActiveTimeSlotsForDay(dayOfWeek);
      return res.status(200).json({
        success: true,
        data: timeSlots,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Saat dilimleri alınırken bir hata oluştu',
      });
    }
  };

  // Yeni şablon oluştur
  createTemplate = async (req: Request, res: Response) => {
    try {
      const { dayOfWeek, time, order, isActive } = req.body;

      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir gün numarası giriniz (0-6)',
        });
      }

      if (!time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir saat formatı giriniz (HH:mm)',
        });
      }

      const template = await this.templateService.createTemplate({
        dayOfWeek,
        time,
        order: order ?? 1,
        isActive: isActive !== undefined ? isActive : true,
      });

      return res.status(201).json({
        success: true,
        message: 'Şablon başarıyla oluşturuldu',
        data: template,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Şablon oluşturulurken bir hata oluştu',
      });
    }
  };

  // Şablon güncelle
  updateTemplate = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { dayOfWeek, time, order, isActive } = req.body;

      if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir gün numarası giriniz (0-6)',
        });
      }

      if (time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir saat formatı giriniz (HH:mm)',
        });
      }

      const updateData: any = {};
      if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
      if (time !== undefined) updateData.time = time;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const template = await this.templateService.updateTemplate(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Şablon başarıyla güncellendi',
        data: template,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Şablon güncellenirken bir hata oluştu',
      });
    }
  };

  // Şablon sil
  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.templateService.deleteTemplate(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Şablon silinirken bir hata oluştu',
      });
    }
  };

  // Toplu güncelleme
  bulkUpdateTemplates = async (req: Request, res: Response) => {
    try {
      const { templates } = req.body;

      if (!Array.isArray(templates)) {
        return res.status(400).json({
          success: false,
          message: 'templates bir array olmalıdır',
        });
      }

      // Validasyon
      for (const template of templates) {
        if (template.dayOfWeek === undefined || template.dayOfWeek < 0 || template.dayOfWeek > 6) {
          return res.status(400).json({
            success: false,
            message: `Geçersiz gün numarası: ${template.dayOfWeek}. Gün numarası 0-6 arası olmalıdır.`,
          });
        }
        if (!template.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(template.time)) {
          return res.status(400).json({
            success: false,
            message: `Geçersiz saat formatı: ${template.time}. Format HH:mm olmalıdır.`,
          });
        }
        if (typeof template.order !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'order bir sayı olmalıdır',
          });
        }
        if (typeof template.isActive !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'isActive bir boolean olmalıdır',
          });
        }
      }

      const updated = await this.templateService.bulkUpdateTemplates(templates);

      return res.status(200).json({
        success: true,
        message: 'Şablonlar başarıyla güncellendi',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Şablonlar güncellenirken bir hata oluştu',
      });
    }
  };

  // Varsayılan şablonları oluştur
  initializeDefaultTemplates = async (req: Request, res: Response) => {
    try {
      await this.templateService.initializeDefaultTemplates();
      return res.status(200).json({
        success: true,
        message: 'Varsayılan şablonlar başarıyla oluşturuldu',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Şablonlar oluşturulurken bir hata oluştu',
      });
    }
  };

  // Tüm şablonların order'larını güncelle
  updateAllTemplateOrders = async (req: Request, res: Response) => {
    try {
      await this.templateService.updateAllTemplateOrders();
      return res.status(200).json({
        success: true,
        message: 'Tüm şablonların sıralamaları başarıyla güncellendi',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Sıralamalar güncellenirken bir hata oluştu',
      });
    }
  };
}
