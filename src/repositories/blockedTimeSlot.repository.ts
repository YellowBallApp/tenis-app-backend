import { AppDataSource } from '../config/data-source';
import { BlockedTimeSlot } from '../entities/blockedTimeSlot.entity';
import {
  buildMaskFromDates,
  masksOverlap,
  parseMask,
  serializeMask,
} from '../utils/timeSlotMask.utils';

const repository = AppDataSource.getRepository(BlockedTimeSlot);

/**
 * startTime'dan sadece YYYY-MM-DD tarihini çıkarır (UTC kaymasından kaçınmak için local).
 */
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const blockedTimeSlotRepository = {
  /**
   * Belirli bir (courtId, date) çifti için satırı upsert eder.
   * Eğer satır zaten varsa yeni mask OR'lanır (üst üste biner).
   * Eğer yoksa yeni satır oluşturulur.
   */
  create: async (data: {
    courtId: number;
    startTime: Date;
    endTime: Date;
    reason?: string;
    blockedByUserId?: string;
    isActive?: boolean;
  }): Promise<BlockedTimeSlot> => {
    const dateStr = toDateOnly(data.startTime);
    const newMask = buildMaskFromDates(data.startTime, data.endTime);

    const existing = await repository.findOne({
      where: { courtId: data.courtId, date: new Date(dateStr) as any },
    });

    if (existing) {
      const merged = parseMask(existing.busyMask) | newMask;
      existing.busyMask = serializeMask(merged);
      if (data.reason !== undefined) existing.reason = data.reason ?? null;
      if (data.blockedByUserId !== undefined) existing.blockedByUserId = data.blockedByUserId;
      if (data.isActive !== undefined) existing.isActive = data.isActive;
      return await repository.save(existing);
    }

    const created = repository.create({
      courtId: data.courtId,
      date: new Date(dateStr) as any,
      busyMask: serializeMask(newMask),
      reason: data.reason ?? null,
      blockedByUserId: data.blockedByUserId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return await repository.save(created);
  },

  /**
   * Birden fazla saat bloğunu tek seferde aynı güne upsert eder.
   * Bulk işlemler için kullanılır — her gün için tek DB çağrısı.
   */
  upsertMask: async (data: {
    courtId: number;
    date: Date;
    mask: bigint;
    reason?: string;
    blockedByUserId?: string;
  }): Promise<BlockedTimeSlot> => {
    const dateStr = toDateOnly(data.date);

    const existing = await repository.findOne({
      where: { courtId: data.courtId, date: new Date(dateStr) as any },
    });

    if (existing) {
      const merged = parseMask(existing.busyMask) | data.mask;
      existing.busyMask = serializeMask(merged);
      if (data.reason !== undefined) existing.reason = data.reason ?? null;
      if (data.blockedByUserId !== undefined) existing.blockedByUserId = data.blockedByUserId;
      return await repository.save(existing);
    }

    const created = repository.create({
      courtId: data.courtId,
      date: new Date(dateStr) as any,
      busyMask: serializeMask(data.mask),
      reason: data.reason ?? null,
      blockedByUserId: data.blockedByUserId,
      isActive: true,
    });
    return await repository.save(created);
  },

  findAll: async (filters?: {
    courtId?: number;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BlockedTimeSlot[]> => {
    const query = repository
      .createQueryBuilder('bts')
      .leftJoinAndSelect('bts.court', 'court')
      .leftJoinAndSelect('bts.blockedBy', 'blockedBy');

    if (filters?.courtId) {
      query.andWhere('bts.courtId = :courtId', { courtId: filters.courtId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('bts.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.startDate) {
      query.andWhere('bts.date >= :startDate', {
        startDate: toDateOnly(filters.startDate),
      });
    }

    if (filters?.endDate) {
      query.andWhere('bts.date <= :endDate', {
        endDate: toDateOnly(filters.endDate),
      });
    }

    query.orderBy('bts.date', 'ASC');
    return await query.getMany();
  },

  findById: async (id: number): Promise<BlockedTimeSlot | null> => {
    return await repository.findOne({
      where: { id },
      relations: ['court', 'blockedBy'],
    });
  },

  findByDate: async (courtId: number, date: Date): Promise<BlockedTimeSlot | null> => {
    return await repository.findOne({
      where: { courtId, date: new Date(toDateOnly(date)) as any },
      relations: ['court', 'blockedBy'],
    });
  },

  /**
   * startTime–endTime aralığında bu kortun bloke mask'ıyla çakışan satırı döner.
   * Tek bir satır döner (courtId+date unique).
   */
  findOverlapping: async (
    courtId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number,
  ): Promise<BlockedTimeSlot[]> => {
    const startDateStr = toDateOnly(startTime);
    const endDateStr = toDateOnly(endTime);

    const query = repository
      .createQueryBuilder('bts')
      .where('bts.courtId = :courtId', { courtId })
      .andWhere('bts.isActive = :isActive', { isActive: true })
      .andWhere('bts.date >= :startDate', { startDate: startDateStr })
      .andWhere('bts.date <= :endDate', { endDate: endDateStr });

    if (excludeId) {
      query.andWhere('bts.id != :excludeId', { excludeId });
    }

    const rows = await query.getMany();
    const requestMask = buildMaskFromDates(startTime, endTime);

    return rows.filter(row => masksOverlap(parseMask(row.busyMask), requestMask));
  },

  update: async (
    id: number,
    data: Partial<Pick<BlockedTimeSlot, 'reason' | 'isActive' | 'blockedByUserId'>>,
  ): Promise<BlockedTimeSlot> => {
    await repository.update(id, data);
    const updated = await repository.findOne({
      where: { id },
      relations: ['court', 'blockedBy'],
    });
    if (!updated) throw new Error('Blocked time slot bulunamadı');
    return updated;
  },

  delete: async (id: number): Promise<void> => {
    await repository.delete(id);
  },

  /**
   * Bir satırdaki belirli zaman aralığının bitlerini temizler.
   * Tüm bitler sıfırlanırsa satır silinir.
   */
  clearTimeRange: async (
    courtId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<void> => {
    const row = await repository.findOne({
      where: { courtId, date: new Date(toDateOnly(startTime)) as any },
    });
    if (!row) return;

    const clearMask = buildMaskFromDates(startTime, endTime);
    const updated = parseMask(row.busyMask) & ~clearMask;

    if (updated === 0n) {
      await repository.delete(row.id);
    } else {
      row.busyMask = serializeMask(updated);
      await repository.save(row);
    }
  },
};

export default blockedTimeSlotRepository;
