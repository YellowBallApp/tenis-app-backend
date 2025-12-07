import { AppDataSource } from "../config/data-source";
import { ReservationTemplate } from "../entities/reservationTemplate.entity";

const repository = AppDataSource.getRepository(ReservationTemplate);

const reservationTemplateRepository = {
  findAll: async (): Promise<ReservationTemplate[]> => {
    return await repository.find({
      order: { dayOfWeek: 'ASC', order: 'ASC', time: 'ASC' },
    });
  },

  findByDay: async (dayOfWeek: number): Promise<ReservationTemplate[]> => {
    return await repository.find({
      where: { dayOfWeek },
      order: { order: 'ASC', time: 'ASC' },
    });
  },

  findActiveByDay: async (dayOfWeek: number): Promise<ReservationTemplate[]> => {
    return await repository.find({
      where: { dayOfWeek, isActive: true },
      order: { order: 'ASC', time: 'ASC' },
    });
  },

  findById: async (id: number): Promise<ReservationTemplate | null> => {
    return await repository.findOne({ where: { id } });
  },

  findByDayAndTime: async (dayOfWeek: number, time: string): Promise<ReservationTemplate | null> => {
    return await repository.findOne({ where: { dayOfWeek, time } });
  },

  create: async (data: {
    dayOfWeek: number;
    time: string;
    order?: number;
    isActive?: boolean;
  }): Promise<ReservationTemplate> => {
    const template = repository.create({
      dayOfWeek: data.dayOfWeek,
      time: data.time,
      order: data.order ?? 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return await repository.save(template);
  },

  update: async (id: number, data: Partial<ReservationTemplate>): Promise<ReservationTemplate> => {
    await repository.update(id, data);
    const updated = await repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Şablon bulunamadı');
    }
    return updated;
  },

  delete: async (id: number): Promise<void> => {
    await repository.delete(id);
  },

  deleteByDay: async (dayOfWeek: number): Promise<void> => {
    await repository.delete({ dayOfWeek });
  },

  bulkUpdate: async (templates: Array<{ id?: number; dayOfWeek: number; time: string; order: number; isActive: boolean }>): Promise<ReservationTemplate[]> => {
    // Mevcut tüm şablonları al
    const existing = await repository.find();
    const existingMap = new Map(existing.map(t => [t.id, t]));
    const dayTimeMap = new Map(existing.map(t => [`${t.dayOfWeek}-${t.time}`, t]));

    const results: ReservationTemplate[] = [];

    for (const template of templates) {
      const key = `${template.dayOfWeek}-${template.time}`;
      if (template.id && existingMap.has(template.id)) {
        // Güncelle
        await repository.update(template.id, {
          dayOfWeek: template.dayOfWeek,
          time: template.time,
          order: template.order,
          isActive: template.isActive,
        });
        const updated = await repository.findOne({ where: { id: template.id } });
        if (updated) results.push(updated);
      } else if (!dayTimeMap.has(key)) {
        // Yeni oluştur
        const newTemplate = repository.create({
          dayOfWeek: template.dayOfWeek,
          time: template.time,
          order: template.order,
          isActive: template.isActive,
        });
        results.push(await repository.save(newTemplate));
      }
    }

    // Silinen şablonları bul ve sil
    const incomingIds = new Set(templates.filter(t => t.id).map(t => t.id!));
    const toDelete = existing.filter(t => !incomingIds.has(t.id));
    for (const template of toDelete) {
      await repository.delete(template.id);
    }

    return await repository.find({ order: { dayOfWeek: 'ASC', order: 'ASC', time: 'ASC' } });
  },
};

export default reservationTemplateRepository;
