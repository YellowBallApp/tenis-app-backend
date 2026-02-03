import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Reservation } from '../entities/reservation.entity';
import { ReservationParticipantResponse } from '../entities/reservationParticipantResponse.entity';
import { User } from '../entities/user.entity';
import { Court } from '../entities/court.entity';
import { UserType } from '../enum/userType.enum';
import { ReservationStatus } from '../enum/reservationStatus.enum';
import { ParticipantRole, AcceptanceStatus } from '../enum/participantResponse.enum';
import notificationRepository from '../repositories/notification.repository';
import notificationService from './notification.service';
import blockedTimeSlotRepository from '../repositories/blockedTimeSlot.repository';
import { NotificationType } from '../enum/notificationType.enum';

export class ReservationService {
  private reservationRepository;
  private responseRepository;
  private userRepository;
  private courtRepository;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.responseRepository = AppDataSource.getRepository(ReservationParticipantResponse);
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
        .where('(user.id = :userId OR participants.id = :userId)', { userId })
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
  }, isAdmin: boolean = false) {
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

      // Aktif rezervasyon kontrolü - Admin için geçerli değil
      // (Hem owner hem participant olarak) - Gelecekteki rezervasyonlar da aktif sayılır
      if (!isAdmin) {
        const hasActive = await this.hasActiveReservation(userId);
        if (hasActive) {
          throw new Error('Şu anda aktif bir rezervasyonunuz var. Yeni rezervasyon oluşturmadan önce mevcut rezervasyonunuzun bitmesini bekleyin.');
        }
      }

      // Bekleyen maç sonucu kontrolü - Admin için geçerli değil
      if (!isAdmin) {
        const pendingMatchResultNotifications = await notificationRepository.findByRecipientIdAndType(
          userId,
          NotificationType.MATCH_COMPLETED,
          1,
          1
        );

        if (pendingMatchResultNotifications.notifications.length > 0) {
          throw new Error('Bekleyen maç sonucu girmeniz gereken bir maç var. Yeni rezervasyon oluşturmadan önce maç sonucunu girin.');
        }
      }

      // Kullanıcı tipi kontrolü - RESTRICTED kullanıcılar için zaman kısıtlaması (Admin için geçerli değil)
      if (!isAdmin && user.userType === UserType.RESTRICTED) {
        const startTime = new Date(data.startTime);
        // Europe/Istanbul timezone'una göre saat ve gün bilgisini al
        // Frontend'den gelen UTC string'i Europe/Istanbul timezone'una göre parse etmeliyiz
        const hourFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Istanbul',
          hour: '2-digit',
          hour12: false
        });
        
        const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Istanbul',
          weekday: 'short' // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
        });
        
        const hourParts = hourFormatter.formatToParts(startTime);
        const weekdayParts = weekdayFormatter.formatToParts(startTime);
        
        const hour = parseInt(hourParts.find(part => part.type === 'hour')?.value || '0', 10);
        const weekday = weekdayParts.find(part => part.type === 'weekday')?.value || '';
        
        // Hafta sonu kontrolü (Cumartesi ve Pazar)
        // weekday: 'Sat' veya 'Sun' formatında gelir
        const isWeekend = weekday === 'Sat' || weekday === 'Sun';
        
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

      const hasParticipants = participants.length > 0;
      const status = hasParticipants ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED;

      const reservation = this.reservationRepository.create({
        user,
        court,
        startTime: data.startTime,
        endTime: data.endTime,
        participants,
        notes: data.notes,
        status,
      });

      const savedReservation = await this.reservationRepository.save(reservation);

      if (hasParticipants) {
        const now = new Date();
        await this.responseRepository.save(
          this.responseRepository.create({
            reservation: savedReservation,
            user,
            role: ParticipantRole.CREATOR,
            acceptanceStatus: AcceptanceStatus.ACCEPTED,
            respondedAt: now,
          })
        );
        for (const p of participants) {
          await this.responseRepository.save(
            this.responseRepository.create({
              reservation: savedReservation,
              user: p,
              role: ParticipantRole.PARTICIPANT,
              acceptanceStatus: AcceptanceStatus.PENDING,
              respondedAt: null,
            })
          );
        }
      }

      // Participantlara rezervasyon isteği bildirimi gönder (oluşturana değil; oluşturan popup ile bilgilendirilir)
      try {
        const summary = this.formatReservationSummary(court.name, data.startTime, data.endTime);
        const creatorName = this.formatUserDisplayName(user);
        const playersStr = this.formatPlayersList(user, participants);
        const requestMessage = `Rezervasyon isteği: ${summary}. Oluşturan: ${creatorName}. Oyuncular: ${playersStr}. Kabul veya reddetmek için Rezervasyonlarım sayfasına gidin.`;
        if (hasParticipants) {
          await Promise.all(
            participants.map((recipient) =>
              notificationService.createNotification({
                recipientId: recipient.id,
                type: NotificationType.RESERVATION_REQUEST,
                message: requestMessage,
                relatedEntityId: savedReservation.id,
                relatedEntityType: 'reservation',
              }).catch((err) => {
                console.error(`Rezervasyon isteği bildirimi gönderilemedi (${recipient.id}):`, err);
                return null;
              })
            )
          );
        }
      } catch (notificationError) {
        console.error('Rezervasyon isteği bildirimi hatası:', notificationError);
      }

      return savedReservation;
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon oluşturulurken bir hata oluştu');
    }
  }

  private formatReservationSummary(courtName: string, startTime: Date, endTime: Date): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dateStr = start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = `${start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}-${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    return `${courtName}, ${dateStr} ${timeStr}`;
  }

  private formatUserDisplayName(user: User): string {
    const parts = [user.name, user.surname].filter(Boolean);
    return parts.length ? parts.join(' ').trim() : 'Bilinmiyor';
  }

  /** Oluşturan + katılımcılar = tüm oyuncular listesi (virgülle ayrılmış) */
  private formatPlayersList(owner: User, participants: User[]): string {
    const allPlayers = [owner, ...(participants || [])];
    if (!allPlayers.length) return 'Yok';
    return allPlayers.map((p) => this.formatUserDisplayName(p)).join(', ');
  }

  /** Rezervasyon iptal bildirimi: tüm oyunculara (oluşturan + participants) aynı mesajı gönderir */
  private async sendReservationCancelledNotification(
    reservationId: number,
    reservation: { court: { name: string }; startTime: Date; endTime: Date; user: User; participants: User[] },
    cancellerUserId: string
  ): Promise<void> {
    const summary = this.formatReservationSummary(
      reservation.court.name,
      reservation.startTime,
      reservation.endTime
    );
    let canceller: User | undefined =
      reservation.user.id === cancellerUserId
        ? reservation.user
        : (reservation.participants || []).find((p) => p.id === cancellerUserId);
    if (!canceller) {
      canceller = await this.userRepository.findOne({ where: { id: cancellerUserId } }) ?? undefined;
    }
    const cancellerName = canceller ? this.formatUserDisplayName(canceller) : 'Bilinmiyor';
    const playersStr = this.formatPlayersList(reservation.user, reservation.participants || []);
    const message = `Rezervasyon iptal edildi: ${summary}. İptal eden: ${cancellerName}. Oyuncular: ${playersStr}.`;
    const recipients: User[] = [reservation.user, ...(reservation.participants || [])];
    await Promise.all(
      recipients.map((recipient) =>
        notificationService.createNotification({
          recipientId: recipient.id,
          type: NotificationType.RESERVATION_CANCELLED,
          message,
          relatedEntityId: reservationId,
          relatedEntityType: 'reservation',
        }).catch((err) => {
          console.error(`Rezervasyon iptal bildirimi gönderilemedi (${recipient.id}):`, err);
          return null;
        })
      )
    );
  }

  // Kullanıcının rezervasyonlarını getir (oluşturduğu + katılımcı olduğu); PENDING için participantResponses dahil
  async getUserReservations(userId: string) {
    try {
      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.court', 'court')
        .leftJoinAndSelect('reservation.participants', 'participants')
        .where('user.id = :userId OR participants.id = :userId', { userId })
        .orderBy('reservation.startTime', 'DESC')
        .getMany();

      if (reservations.length === 0) return reservations;

      const ids = reservations.map((r) => r.id);
      const responses = await this.responseRepository.find({
        where: { reservation: { id: In(ids) } },
        relations: ['user', 'reservation'],
      });
      const byResId = new Map<number, typeof responses>();
      for (const r of responses) {
        const resId = r.reservation?.id ?? (r as any).reservationId;
        if (resId == null) continue;
        if (!byResId.has(resId)) byResId.set(resId, []);
        byResId.get(resId)!.push(r);
      }
      for (const r of reservations) {
        (r as any).participantResponses = (byResId.get(r.id) || []).map((resp) => ({
          id: resp.id,
          userId: resp.user.id,
          user: resp.user,
          role: resp.role,
          acceptanceStatus: resp.acceptanceStatus,
          respondedAt: resp.respondedAt,
          createdAt: resp.createdAt,
        }));
      }
      return reservations;
    } catch (error) {
      throw new Error('Kullanıcı rezervasyonları alınırken bir hata oluştu');
    }
  }

  // ID'ye göre rezervasyon getir (participantResponses dahil)
  async getReservationById(reservationId: number) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['user', 'court', 'participants'],
      });

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      const responses = await this.responseRepository.find({
        where: { reservation: { id: reservationId } },
        relations: ['user'],
      });
      (reservation as any).participantResponses = responses.map((r) => ({
        id: r.id,
        userId: r.user.id,
        user: r.user,
        role: r.role,
        acceptanceStatus: r.acceptanceStatus,
        respondedAt: r.respondedAt,
        createdAt: r.createdAt,
      }));

      return reservation;
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon alınırken bir hata oluştu');
    }
  }

  // Rezervasyon güncelle
  async updateReservation(reservationId: number, userId: string, data: {
    userId?: string;
    courtId?: number;
    startTime?: Date;
    endTime?: Date;
    participantIds?: string[];
    notes?: string;
  }, isAdmin: boolean = false) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['user', 'court', 'participants'],
      });

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      // Admin değilse, sadece kendi rezervasyonunu güncelleyebilir
      if (!isAdmin && reservation.user.id !== userId) {
        throw new Error('Bu rezervasyonu güncelleme yetkiniz yok');
      }

      // Kullanıcı değişikliği (sadece admin)
      if (isAdmin && data.userId && data.userId !== reservation.user.id) {
        const newUser = await this.userRepository.findOne({ where: { id: data.userId } });
        if (!newUser) {
          throw new Error('Kullanıcı bulunamadı');
        }
        reservation.user = newUser;
      }

      // Kort değişikliği varsa kontrol et
      if (data.courtId && data.courtId !== reservation.court.id) {
        const courtRepo = AppDataSource.getRepository(Court);
        const newCourt = await courtRepo.findOne({ where: { id: data.courtId } });
        if (!newCourt) {
          throw new Error('Kort bulunamadı');
        }
        reservation.court = newCourt;
      }

      // Tarih/saat güncellemeleri
      if (data.startTime) {
        reservation.startTime = new Date(data.startTime);
      }
      if (data.endTime) {
        reservation.endTime = new Date(data.endTime);
      }

      // Bitiş zamanı başlangıç zamanından sonra olmalı
      if (reservation.endTime <= reservation.startTime) {
        throw new Error('Bitiş zamanı başlangıç zamanından sonra olmalıdır');
      }

      // Çakışma kontrolü (aynı kort ve zaman diliminde başka rezervasyon var mı?)
      const conflictingReservation = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.court.id = :courtId', { courtId: reservation.court.id })
        .andWhere('reservation.id != :reservationId', { reservationId })
        .andWhere(
          '(reservation.startTime < :endTime AND reservation.endTime > :startTime)',
          {
            startTime: reservation.startTime,
            endTime: reservation.endTime,
          }
        )
        .getOne();

      if (conflictingReservation) {
        throw new Error('Bu zaman diliminde başka bir rezervasyon bulunmaktadır');
      }

      // Bloke edilmiş saat kontrolü
      const blockedSlots = await blockedTimeSlotRepository.findAll({
        courtId: reservation.court.id,
        isActive: true,
        startDate: reservation.startTime,
        endDate: reservation.endTime,
      });

      if (blockedSlots.length > 0) {
        throw new Error('Seçilen zaman dilimi bloke edilmiştir');
      }

      // Katılımcı güncellemeleri
      if (data.participantIds !== undefined) {
        let participants: User[] = [];
        if (data.participantIds.length > 0) {
          participants = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...ids)', { ids: data.participantIds })
            .getMany();
        }
        reservation.participants = participants;
      }

      // Notlar güncellemesi
      if (data.notes !== undefined) {
        reservation.notes = data.notes;
      }

      return await this.reservationRepository.save(reservation);
    } catch (error: any) {
      throw new Error(error.message || 'Rezervasyon güncellenirken bir hata oluştu');
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

  // PENDING rezervasyonda participant kabul eder; hepsi kabul edince status CONFIRMED olur
  async acceptReservation(reservationId: number, userId: string) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, status: ReservationStatus.PENDING },
        relations: ['user', 'court', 'participants'],
      });
      if (!reservation) throw new Error('Rezervasyon bulunamadı veya zaten onaylanmış');

      const response = await this.responseRepository.findOne({
        where: { reservation: { id: reservationId }, user: { id: userId } },
        relations: ['reservation'],
      });
      if (!response) throw new Error('Bu rezervasyon için davet bulunamadı');
      if (response.role === ParticipantRole.CREATOR) throw new Error('Oluşturan zaten kabul etmiş sayılır');
      if (response.acceptanceStatus === AcceptanceStatus.ACCEPTED) throw new Error('Zaten kabul ettiniz');

      response.acceptanceStatus = AcceptanceStatus.ACCEPTED;
      response.respondedAt = new Date();
      await this.responseRepository.save(response);

      const allResponses = await this.responseRepository.find({
        where: { reservation: { id: reservationId } },
      });
      const allAccepted = allResponses.every((r) => r.acceptanceStatus === AcceptanceStatus.ACCEPTED);
      if (allAccepted) {
        reservation.status = ReservationStatus.CONFIRMED;
        await this.reservationRepository.save(reservation);

        // Rezervasyon onaylandı bildirimi: oluşturan + tüm katılımcılara
        try {
          const summary = this.formatReservationSummary(
            reservation.court.name,
            reservation.startTime,
            reservation.endTime
          );
          const playersStr = this.formatPlayersList(reservation.user, reservation.participants || []);
          const message = `Rezervasyon onaylandı: ${summary}. Oyuncular: ${playersStr}.`;
          const recipients: User[] = [reservation.user, ...(reservation.participants || [])];
          await Promise.all(
            recipients.map((recipient) =>
              notificationService.createNotification({
                recipientId: recipient.id,
                type: NotificationType.RESERVATION_CONFIRMED,
                message,
                relatedEntityId: reservationId,
                relatedEntityType: 'reservation',
              }).catch((err) => {
                console.error(`Rezervasyon onaylandı bildirimi gönderilemedi (${recipient.id}):`, err);
                return null;
              })
            )
          );
        } catch (notificationError) {
          console.error('Rezervasyon onaylandı bildirimi hatası:', notificationError);
        }
      }

      return { message: 'Rezervasyon kabul edildi', reservation: await this.getReservationById(reservationId) };
    } catch (error: any) {
      throw new Error(error.message || 'Kabul işlemi sırasında bir hata oluştu');
    }
  }

  // PENDING rezervasyonda participant reddeder; rezervasyon silinir, iptal bildirimi gider
  async rejectReservation(reservationId: number, userId: string) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, status: ReservationStatus.PENDING },
        relations: ['user', 'participants', 'court'],
      });
      if (!reservation) throw new Error('Rezervasyon bulunamadı veya zaten iptal/onaylanmış');

      const response = await this.responseRepository.findOne({
        where: { reservation: { id: reservationId }, user: { id: userId } },
      });
      if (!response) throw new Error('Bu rezervasyon için davet bulunamadı');
      if (response.role === ParticipantRole.CREATOR) throw new Error('Oluşturan reddedemez; iptal etmek için rezervasyonu iptal edin');
      if (response.acceptanceStatus !== AcceptanceStatus.PENDING) throw new Error('Zaten yanıt verdiniz');

      await this.reservationRepository.remove(reservation);

      try {
        await this.sendReservationCancelledNotification(reservationId, reservation, userId);
      } catch (notificationError) {
        console.error('Rezervasyon red bildirimi hatası:', notificationError);
      }

      return { message: 'Rezervasyon reddedildi ve iptal edildi' };
    } catch (error: any) {
      throw new Error(error.message || 'Red işlemi sırasında bir hata oluştu');
    }
  }

  // Rezervasyon iptal et (oluşturan veya katılımcılardan biri iptal edebilir)
  async cancelReservation(reservationId: number, userId: string, isAdmin: boolean = false) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId },
        relations: ['user', 'participants', 'court'],
      });

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      // Admin değilse: sadece oluşturan veya katılımcılardan biri iptal edebilir
      const isOwner = reservation.user.id === userId;
      const isParticipant = reservation.participants?.some((p) => p.id === userId) ?? false;
      if (!isAdmin && !isOwner && !isParticipant) {
        throw new Error('Bu rezervasyonu iptal etme yetkiniz yok');
      }

      await this.reservationRepository.remove(reservation);

      try {
        await this.sendReservationCancelledNotification(reservationId, reservation, userId);
      } catch (notificationError) {
        console.error('Rezervasyon iptal bildirimi hatası:', notificationError);
      }

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

