import { AppDataSource } from '../config/data-source';
import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';

export class ReservationService {
  private reservationRepository;
  private userRepository;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.userRepository = AppDataSource.getRepository(User);
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
        .where('reservation.startTime >= :start', { start: startOfDay })
        .andWhere('reservation.startTime <= :end', { end: endOfDay })
        .orderBy('reservation.courtNumber', 'ASC')
        .addOrderBy('reservation.startTime', 'ASC')
        .getMany();

      return reservations;
    } catch (error) {
      throw new Error('Rezervasyonlar alınırken bir hata oluştu');
    }
  }

  // Yeni rezervasyon oluştur
  async createReservation(userId: string, data: {
    courtNumber: number;
    startTime: Date;
    endTime: Date;
    participants?: string[];
    notes?: string;
  }) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Çakışma kontrolü
      const conflictingReservation = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.courtNumber = :courtNumber', { courtNumber: data.courtNumber })
        .andWhere('reservation.startTime < :endTime', { endTime: data.endTime })
        .andWhere('reservation.endTime > :startTime', { startTime: data.startTime })
        .getOne();

      if (conflictingReservation) {
        throw new Error('Bu zaman diliminde kort zaten rezerve edilmiş');
      }

      const reservation = this.reservationRepository.create({
        user,
        courtNumber: data.courtNumber,
        startTime: data.startTime,
        endTime: data.endTime,
        participants: data.participants || [],
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
        relations: ['user'],
        order: { startTime: 'DESC' },
      });

      return reservations;
    } catch (error) {
      throw new Error('Kullanıcı rezervasyonları alınırken bir hata oluştu');
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
}

