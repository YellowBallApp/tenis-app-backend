import { AppDataSource } from "../config/data-source";
import { BlockedTimeSlot } from "../entities/blockedTimeSlot.entity";

const repository = AppDataSource.getRepository(BlockedTimeSlot);

const blockedTimeSlotRepository = {
  create: async (data: {
    courtId: number;
    startTime: Date;
    endTime: Date;
    reason?: string;
    blockedByUserId?: string;
    isActive?: boolean;
  }): Promise<BlockedTimeSlot> => {
    const blockedSlot = repository.create({
      courtId: data.courtId,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      blockedByUserId: data.blockedByUserId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return await repository.save(blockedSlot);
  },

  findAll: async (filters?: {
    courtId?: number;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BlockedTimeSlot[]> => {
    const query = repository
      .createQueryBuilder('blockedTimeSlot')
      .leftJoinAndSelect('blockedTimeSlot.court', 'court')
      .leftJoinAndSelect('blockedTimeSlot.blockedBy', 'blockedBy');

    if (filters?.courtId) {
      query.andWhere('court.id = :courtId', { courtId: filters.courtId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('blockedTimeSlot.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.startDate) {
      query.andWhere('blockedTimeSlot.endTime >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('blockedTimeSlot.startTime <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('blockedTimeSlot.startTime', 'ASC');

    return await query.getMany();
  },

  findById: async (id: number): Promise<BlockedTimeSlot | null> => {
    return await repository.findOne({
      where: { id },
      relations: ['court', 'blockedBy'],
    });
  },

  update: async (id: number, data: Partial<BlockedTimeSlot>): Promise<BlockedTimeSlot> => {
    await repository.update(id, data);
    const updated = await repository.findOne({
      where: { id },
      relations: ['court', 'blockedBy'],
    });
    if (!updated) throw new Error('Blocked time slot not found');
    return updated;
  },

  delete: async (id: number): Promise<void> => {
    await repository.delete(id);
  },

  // Belirli bir zaman aralığında çakışan bloklamaları bul
  findOverlapping: async (
    courtId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number
  ): Promise<BlockedTimeSlot[]> => {
    const query = repository
      .createQueryBuilder('blockedTimeSlot')
      .where('blockedTimeSlot.courtId = :courtId', { courtId })
      .andWhere('blockedTimeSlot.isActive = :isActive', { isActive: true })
      .andWhere('blockedTimeSlot.startTime < :endTime', { endTime })
      .andWhere('blockedTimeSlot.endTime > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('blockedTimeSlot.id != :excludeId', { excludeId });
    }

    return await query.getMany();
  },
};

export default blockedTimeSlotRepository;

