import { Request, Response } from 'express';
import { CourtService } from '../services/court.service';

export class CourtController {
  private courtService: CourtService;

  constructor() {
    this.courtService = new CourtService();
  }

  // Tüm kortları getir
  getAllCourts = async (req: Request, res: Response) => {
    try {
      const courts = await this.courtService.getAllCourts();
      
      return res.status(200).json({
        success: true,
        data: courts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Kortlar alınırken bir hata oluştu',
      });
    }
  };

  // Aktif kortları getir
  getActiveCourts = async (req: Request, res: Response) => {
    try {
      const courts = await this.courtService.getActiveCourts();
      
      return res.status(200).json({
        success: true,
        data: courts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Aktif kortlar alınırken bir hata oluştu',
      });
    }
  };

  // ID'ye göre kort getir
  getCourtById = async (req: Request, res: Response) => {
    try {
      const courtId = parseInt(req.params.id);
      const court = await this.courtService.getCourtById(courtId);
      
      return res.status(200).json({
        success: true,
        data: court,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || 'Kort bulunamadı',
      });
    }
  };

  // Yeni kort oluştur
  createCourt = async (req: Request, res: Response) => {
    try {
      const { name, indoors, groundType, closed } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Kort adı gereklidir',
        });
      }

      const court = await this.courtService.createCourt({
        name,
        indoors,
        groundType,
        closed,
      });

      return res.status(201).json({
        success: true,
        message: 'Kort başarıyla oluşturuldu',
        data: court,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Kort oluşturulurken bir hata oluştu',
      });
    }
  };

  // Kort güncelle
  updateCourt = async (req: Request, res: Response) => {
    try {
      const courtId = parseInt(req.params.id);
      const { name, indoors, groundType, closed } = req.body;

      const court = await this.courtService.updateCourt(courtId, {
        name,
        indoors,
        groundType,
        closed,
      });

      return res.status(200).json({
        success: true,
        message: 'Kort başarıyla güncellendi',
        data: court,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Kort güncellenirken bir hata oluştu',
      });
    }
  };

  // Kort sil
  deleteCourt = async (req: Request, res: Response) => {
    try {
      const courtId = parseInt(req.params.id);
      const result = await this.courtService.deleteCourt(courtId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Kort silinirken bir hata oluştu',
      });
    }
  };
}

