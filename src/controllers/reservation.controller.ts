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
      // Admin ise userId'yi body'den al, değilse currentUser'dan al
      let userId: string;
      if (req.currentUser.userType === 'admin' && req.body.userId) {
        // Admin başkası adına rezervasyon oluşturabilir
        userId = req.body.userId;
      } else {
        // Normal kullanıcı kendi adına rezervasyon oluşturur
        userId = req.currentUser.id;
      }
      
      const { courtId, startTime, endTime, participantIds, notes } = req.body;

      const isAdmin = req.currentUser.userType === 'admin';
      const reservation = await this.reservationService.createReservation(userId, {
        courtId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        participantIds,
        notes,
      }, isAdmin);

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
      const hasActive = await this.reservationService.hasActiveReservation(userId);
      
      return res.status(200).json({
        success: true,
        data: { hasActive },
      });
    } catch (error: any) {
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

  // Rezervasyon güncelle
  updateReservation = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id;
      const isAdmin = req.currentUser.userType === 'admin';
      const reservationId = parseInt(req.params.id);
      const { userId: newUserId, courtId, startTime, endTime, participantIds, notes } = req.body;

      // Admin ise userId değişikliğine izin ver
      let targetUserId = userId;
      if (isAdmin && newUserId) {
        targetUserId = newUserId;
      }

      const updateData: any = {};
      if (courtId !== undefined) updateData.courtId = courtId;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (participantIds !== undefined) updateData.participantIds = participantIds;
      if (notes !== undefined) updateData.notes = notes;
      if (isAdmin && newUserId) {
        updateData.userId = newUserId;
        targetUserId = newUserId; // Service'e gönderilecek userId'yi güncelle
      }

      const reservation = await this.reservationService.updateReservation(
        reservationId,
        targetUserId,
        updateData,
        isAdmin
      );

      return res.status(200).json({
        success: true,
        message: 'Rezervasyon başarıyla güncellendi',
        data: reservation,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Rezervasyon güncellenirken bir hata oluştu',
      });
    }
  };

  // Rezervasyon iptal et
  cancelReservation = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser.id;
      const isAdmin = req.currentUser.userType === 'admin';
      const reservationId = parseInt(req.params.id);

      const result = await this.reservationService.cancelReservation(reservationId, userId, isAdmin);
      
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

  // Belirli bir kort ve tarih için bloke edilmiş saatleri getir (public endpoint)
  getBlockedTimeSlots = async (req: Request, res: Response) => {
    try {
      const { courtId, date } = req.query;
      
      if (!courtId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Kort ID ve tarih parametreleri gereklidir',
        });
      }

      const blockedHours = await this.reservationService.getBlockedTimeSlots(
        parseInt(courtId as string),
        date as string
      );
      
      return res.status(200).json({
        success: true,
        data: blockedHours,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Bloke edilmiş saatler alınırken bir hata oluştu',
      });
    }
  };
}

