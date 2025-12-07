import reservationTimeSlotRepository from "../repositories/reservationTimeSlot.repository";
import { ReservationTimeSlot } from "../entities/reservationTimeSlot.entity";

export class ReservationTimeSlotService {
  async createTimeSlot(data: { time: string; order: number; isActive?: boolean }): Promise<ReservationTimeSlot> {
    const existing = await reservationTimeSlotRepository.findByTime(data.time);
    if (existing) {
      throw new Error('Bu saat dilimi zaten mevcut');
    }
    return await reservationTimeSlotRepository.create(data);
  }

  async getAllTimeSlots(filters?: { isActive?: boolean }): Promise<ReservationTimeSlot[]> {
    return await reservationTimeSlotRepository.findAll(filters);
  }

  async getTimeSlotById(id: number): Promise<ReservationTimeSlot | null> {
    return await reservationTimeSlotRepository.findById(id);
  }

  async updateTimeSlot(id: number, data: Partial<ReservationTimeSlot>): Promise<ReservationTimeSlot> {
    const existing = await reservationTimeSlotRepository.findByTime(data.time || '');
    if (existing && existing.id !== id) {
      throw new Error('Bu saat dilimi zaten başka bir kayıtla mevcut');
    }
    return await reservationTimeSlotRepository.update(id, data);
  }

  async deleteTimeSlot(id: number): Promise<void> {
    await reservationTimeSlotRepository.delete(id);
  }

  async bulkUpdateTimeSlots(updates: { id: number; time?: string; order?: number; isActive?: boolean }[]): Promise<ReservationTimeSlot[]> {
    return await reservationTimeSlotRepository.bulkUpdate(updates);
  }

  async initializeDefaultTimeSlots(): Promise<void> {
    const defaultSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    for (let i = 0; i < defaultSlots.length; i++) {
      const time = defaultSlots[i];
      const existing = await reservationTimeSlotRepository.findByTime(time);
      if (!existing) {
        await reservationTimeSlotRepository.create({ time, order: i + 1, isActive: true });
      }
    }
  }
}
