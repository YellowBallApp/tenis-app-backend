import { AppDataSource } from '../config/data-source';
import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { Court } from '../entities/court.entity';
import { UserType } from '../enum/userType.enum';
import notificationRepository from '../repositories/notification.repository';
import blockedTimeSlotRepository from '../repositories/blockedTimeSlot.repository';
import { NotificationType } from '../enum/notificationType.enum';

export class ReservationService {
  private reservationRepository;
  private userRepository;
  private courtRepository;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.userRepository = AppDataSource.getRepository(User);
    this.courtRepository = AppDataSource.getRepository(Court);
  }

  // Kullanıcının yakın zamandaki rezervasyonlarını getir (şu andan sonraki en yakın 2)
  async getUpcomingReservations(userId: string, limit: number = 2) {
    try {
      const now = new Date();

      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.court', 'court')
        .leftJoinAndSelect('reservation.participants', 'participants')
        .where('reservation.user.id = :userId', { userId })
        .andWhere('reservation.startTime >= :now', { now })
        .orderBy('reservation.startTime', 'ASC')
        .limit(limit)
        .getMany();

      return reservations;
    } catch (error) {
      throw new Error('Yakın rezervasyonlar alınırken bir hata oluştu');
    }
  }

  // Belirli bir tarihteki tüm rezervasyonları getir
  async getReservationsByDate(date: string) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.court', 'court')
        .leftJoinAndSelect('reservation.participants', 'participants')
        .where('reservation.startTime >= :start', { start: startOfDay })
        .andWhere('reservation.startTime <= :end', { end: endOfDay })
        .orderBy('court.id', 'ASC')
        .addOrderBy('reservation.startTime', 'ASC')
        .getMany();

      return reservations;
    } catch (error) {
      throw new Error('Rezervasyonlar alınırken bir hata oluştu');
    }
  }

  // Yeni rezervasyon oluştur
  async createReservation(userId: string, data: {
    courtId: number;
    startTime: Date;
    endTime: Date;
    participantIds?: string[];
    notes?: string;
  }) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Kort kontrolü
      const court = await this.courtRepository.findOne({ where: { id: data.courtId } });
      
      if (!court) {
        throw new Error('Kort bulunamadı');
      }

      if (court.closed) {
        throw new Error('Bu kort şu anda kapalı');
      }

      // Aktif rezervasyon kontrolü - Kullanıcının bitmemiş (endTime >= now) bir rezervasyonu var mı?
      // (Hem owner hem participant olarak) - Gelecekteki rezervasyonlar da aktif sayılır
      const hasActive = await this.hasActiveReservation(userId);
      if (hasActive) {
        throw new Error('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
      }

      // Bekleyen maç sonucu kontrolü - Kullanıcının girmesi gereken maç sonucu var mı?
      const pendingMatchResultNotifications = await notificationRepository.findByRecipientIdAndType(
        userId,
        NotificationType.MATCH_COMPLETED,
        1,
        1
      );

      if (pendingMatchResultNotifications.notifications.length > 0) {
        throw new Error('Bekleyen maç sonucu girmeniz gereken bir maç var. Yeni rezervasyon oluşturmadan önce maç sonucunu girin.');
      }

      // Kullanıcı tipi kontrolü - RESTRICTED kullanıcılar için zaman kısıtlaması
      if (user.userType === UserType.RESTRICTED) {
        const startTime = new Date(data.startTime);
        const dayOfWeek = startTime.getDay(); // 0 = Pazar, 6 = Cumartesi
        const hour = startTime.getHours();
        
        // Hafta sonu kontrolü (Cumartesi ve Pazar)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        if (isWeekend) {
          // Hafta sonu: Sadece 18:00-24:00 arası
          if (hour < 18 || hour >= 24) {
            throw new Error('Kullanıcı tipiniz hafta sonları sadece 18:00-24:00 arası rezervasyon yapabilir');
          }
        } else {
          // Hafta içi: Sadece 9:00-18:00 arası
          if (hour < 9 || hour >= 18) {
            throw new Error('Kullanıcı tipiniz hafta içi sadece 09:00-18:00 arası rezervasyon yapabilir');
          }
        }
      }

      // Bloke edilmiş zaman dilimi kontrolü
      const blockedSlots = await blockedTimeSlotRepository.findOverlapping(
        data.courtId,
        data.startTime,
        data.endTime
      );

      if (blockedSlots.length > 0) {
        throw new Error('Bu zaman dilimi admin tarafından bloke edilmiş');
      }

      // Çakışma kontrolü
      const conflictingReservation = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoin('reservation.court', 'court')
        .where('court.id = :courtId', { courtId: data.courtId })
        .andWhere('reservation.startTime < :endTime', { endTime: data.endTime })
        .andWhere('reservation.endTime > :startTime', { startTime: data.startTime })
        .getOne();

      if (conflictingReservation) {
        throw new Error('Bu zaman diliminde kort zaten rezerve edilmiş');
      }

      // Participant user'ları bul
      let participants: User[] = [];
      if (data.participantIds && data.participantIds.length > 0) {
        participants = await this.userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...ids)', { ids: data.participantIds })
          .getMany();
      }

      const reservation = this.reservationRepository.create({
        user,
        court,
        startTime: data.startTime,
        endTime: data.endTime,
        participants: participants,
        notes: data.notes,
      });

      return await this.reservationRepository.save(reservation);
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon oluşturulurken bir hata oluştu');
    }
  }

  // Kullanıcının rezervasyonlarını getir
  async getUserReservations(userId: string) {
    try {
      const reservations = await this.reservationRepository.find({
        where: { user: { id: userId } },
        relations: ['user', 'participants'],
        order: { startTime: 'DESC' },
      });

      return reservations;
    } catch (error) {
      throw new Error('Kullanıcı rezervasyonları alınırken bir hata oluştu');
    }
  }

  // ID'ye göre rezervasyon getir
  async getReservationById(reservationId: number) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['user', 'court', 'participants'],
      });

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      return reservation;
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon alınırken bir hata oluştu');
    }
  }

  // Kullanıcının aktif rezervasyonu var mı kontrol et (hem owner hem participant olarak)
  async hasActiveReservation(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      
      // Kullanıcının (owner veya participant olarak) dahil olduğu ve bitmemiş (endTime >= now) rezervasyonu var mı?
      // Gelecekteki rezervasyonlar da aktif sayılır, sadece geçmişte olanlar sayılmaz
      const activeReservation = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoin('reservation.user', 'user')
        .leftJoin('reservation.participants', 'participants')
        .where('(user.id = :userId OR participants.id = :userId)', { userId })
        .andWhere('reservation.endTime >= :now', { now })
        .getOne();

      return !!activeReservation;
    } catch (error) {
      throw new Error('Aktif rezervasyon kontrolü yapılırken bir hata oluştu');
    }
  }

  // Rezervasyon iptal et
  async cancelReservation(reservationId: number, userId: string) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['user'],
      });

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      if (reservation.user.id !== userId) {
        throw new Error('Bu rezervasyonu iptal etme yetkiniz yok');
      }

      await this.reservationRepository.remove(reservation);
      
      return { message: 'Rezervasyon iptal edildi' };
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon iptal edilirken bir hata oluştu');
    }
  }

  // Belirli bir kort ve tarih için bloke edilmiş saatleri getir
  async getBlockedTimeSlots(courtId: number, date: string) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const blockedSlots = await blockedTimeSlotRepository.findAll({
        courtId,
        isActive: true,
        startDate: startOfDay,
        endDate: endOfDay,
      });

      // Her bloke edilmiş saat için saat ve reason bilgisini döndür
      const blockedHoursMap = new Map<number, string | null>();
      blockedSlots.forEach(slot => {
        const startTime = new Date(slot.startTime);
        const hour = startTime.getHours();
        // Eğer aynı saat için birden fazla reason varsa, ilkini kullan
        // (genelde aynı saatte tek bir bloklama olur)
        if (!blockedHoursMap.has(hour) || !blockedHoursMap.get(hour)) {
          blockedHoursMap.set(hour, slot.reason || null);
        }
      });

      // Map'i array'e çevir ve sırala
      const result = Array.from(blockedHoursMap.entries())
        .map(([hour, reason]) => ({ hour, reason }))
        .sort((a, b) => a.hour - b.hour);

      return result;
    } catch (error) {
      throw new Error('Bloke edilmiş saatler alınırken bir hata oluştu');
    }
  }
}

