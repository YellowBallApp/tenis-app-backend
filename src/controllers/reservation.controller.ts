import { Request, Response } from 'express';
import { ReservationService } from '../services/reservation.service';

export class ReservationController {
  private reservationService: ReservationService;

  constructor() {
    this.reservationService = new ReservationService();
  }

  // Kullanıcının yakın zamandaki rezervasyonlarını getir
  getUpcomingReservations = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id; // authMiddleware'den geliyor
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 2;
      
      const reservations = await this.reservationService.getUpcomingReservations(userId, limit);
      
      return res.status(200).json({
        success: true,
        data: reservations,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Yakın rezervasyonlar alınırken bir hata oluştu',
      });
    }
  };

  // Tarihe göre rezervasyonları getir
  getReservationsByDate = async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Tarih parametresi gereklidir',
        });
      }

      const reservations = await this.reservationService.getReservationsByDate(date as string);
      
      return res.status(200).json({
        success: true,
        data: reservations,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Rezervasyonlar alınırken bir hata oluştu',
      });
    }
  };

  // Yeni rezervasyon oluştur
  createReservation = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id; // authMiddleware'den geliyor
      const { courtId, startTime, endTime, participantIds, notes } = req.body;

      const reservation = await this.reservationService.createReservation(userId, {
        courtId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        participantIds,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'Rezervasyon başarıyla oluşturuldu',
        data: reservation,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Rezervasyon oluşturulurken bir hata oluştu',
      });
    }
  };

  // Kullanıcının rezervasyonlarını getir
  getUserReservations = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id;
      
      const reservations = await this.reservationService.getUserReservations(userId);
      
      return res.status(200).json({
        success: true,
        data: reservations,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Rezervasyonlar alınırken bir hata oluştu',
      });
    }
  };

  // Kullanıcının aktif rezervasyonu var mı kontrol et
  hasActiveReservation = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id;
      console.log(`🔍 hasActiveReservation endpoint çağrıldı - userId: ${userId}`);
      const hasActive = await this.reservationService.hasActiveReservation(userId);
      console.log(`🔍 hasActiveReservation endpoint sonucu: ${hasActive}`);
      
      return res.status(200).json({
        success: true,
        data: { hasActive },
      });
    } catch (error: any) {
      console.error('❌ hasActiveReservation endpoint hatası:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Aktif rezervasyon kontrolü yapılırken bir hata oluştu',
      });
    }
  };

  // ID'ye göre rezervasyon getir
  getReservationById = async (req: Request, res: Response) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await this.reservationService.getReservationById(reservationId);
      
      return res.status(200).json({
        success: true,
        data: reservation,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || 'Rezervasyon bulunamadı',
      });
    }
  };

  // Rezervasyon iptal et
  cancelReservation = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id;
      const reservationId = parseInt(req.params.id);

      const result = await this.reservationService.cancelReservation(reservationId, userId);
      
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Rezervasyon iptal edilirken bir hata oluştu',
      });
    }
  };
}

