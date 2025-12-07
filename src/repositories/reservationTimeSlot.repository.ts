import { AppDataSource } from "../config/data-source";
import { ReservationTimeSlot } from "../entities/reservationTimeSlot.entity";

const repository = AppDataSource.getRepository(ReservationTimeSlot);

const reservationTimeSlotRepository = {
  create: async (data: {
    time: string;
    order: number;
    isActive?: boolean;
  }): Promise<ReservationTimeSlot> => {
    const timeSlot = repository.create(data);
    return await repository.save(timeSlot);
  },

  findAll: async (filters?: { isActive?: boolean }): Promise<ReservationTimeSlot[]> => {
    const query = repository.createQueryBuilder('timeSlot');
    if (filters?.isActive !== undefined) {
      query.andWhere('timeSlot.isActive = :isActive', { isActive: filters.isActive });
    }
    query.orderBy('timeSlot.order', 'ASC');
    return await query.getMany();
  },

  findById: async (id: number): Promise<ReservationTimeSlot | null> => {
    return await repository.findOne({ where: { id } });
  },

  findByTime: async (time: string): Promise<ReservationTimeSlot | null> => {
    return await repository.findOne({ where: { time } });
  },

  update: async (id: number, data: Partial<ReservationTimeSlot>): Promise<ReservationTimeSlot> => {
    const timeSlot = await repository.findOne({ where: { id } });
    if (!timeSlot) {
      throw new Error('Saat dilimi bulunamadı');
    }
    Object.assign(timeSlot, data);
    return await repository.save(timeSlot);
  },

  delete: async (id: number): Promise<void> => {
    await repository.delete(id);
  },

  bulkUpdate: async (updates: { id: number; time?: string; order?: number; isActive?: boolean }[]): Promise<ReservationTimeSlot[]> => {
    const updatedSlots: ReservationTimeSlot[] = [];
    for (const update of updates) {
      const timeSlot = await repository.findOne({ where: { id: update.id } });
      if (timeSlot) {
        Object.assign(timeSlot, update);
        updatedSlots.push(await repository.save(timeSlot));
      }
    }
    return updatedSlots;
  }
};

export default reservationTimeSlotRepository;
