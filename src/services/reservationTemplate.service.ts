import reservationTemplateRepository from '../repositories/reservationTemplate.repository';
import { ReservationTemplate } from '../entities/reservationTemplate.entity';

export class ReservationTemplateService {
  async getAllTemplates() {
    return await reservationTemplateRepository.findAll();
  }

  async getTemplatesByDay(dayOfWeek: number) {
    return await reservationTemplateRepository.findByDay(dayOfWeek);
  }

  async getActiveTemplatesByDay(dayOfWeek: number) {
    return await reservationTemplateRepository.findActiveByDay(dayOfWeek);
  }

  async getTemplateById(id: number) {
    const template = await reservationTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Şablon bulunamadı');
    }
    return template;
  }

  async createTemplate(data: { dayOfWeek: number; time: string; order?: number; isActive?: boolean }) {
    // Aynı gün ve saat zaten var mı kontrol et
    const existing = await reservationTemplateRepository.findByDayAndTime(data.dayOfWeek, data.time);
    if (existing) {
      throw new Error('Bu gün ve saat için şablon zaten mevcut');
    }

    return await reservationTemplateRepository.create(data);
  }

  async updateTemplate(id: number, data: { dayOfWeek?: number; time?: string; order?: number; isActive?: boolean }) {
    const template = await reservationTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Şablon bulunamadı');
    }

    // Eğer gün veya saat değiştiriliyorsa, yeni kombinasyonun başka bir şablonda olup olmadığını kontrol et
    if ((data.dayOfWeek !== undefined && data.dayOfWeek !== template.dayOfWeek) ||
        (data.time !== undefined && data.time !== template.time)) {
      const newDay = data.dayOfWeek !== undefined ? data.dayOfWeek : template.dayOfWeek;
      const newTime = data.time !== undefined ? data.time : template.time;
      const existing = await reservationTemplateRepository.findByDayAndTime(newDay, newTime);
      if (existing && existing.id !== id) {
        throw new Error('Bu gün ve saat için şablon zaten mevcut');
      }
    }

    return await reservationTemplateRepository.update(id, data);
  }

  async deleteTemplate(id: number) {
    const template = await reservationTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Şablon bulunamadı');
    }

    await reservationTemplateRepository.delete(id);
    return { message: 'Şablon başarıyla silindi' };
  }

  async bulkUpdateTemplates(templates: Array<{ id?: number; dayOfWeek: number; time: string; order: number; isActive: boolean }>) {
    return await reservationTemplateRepository.bulkUpdate(templates);
  }

  // Belirli bir gün için aktif saat dilimlerini string array olarak döndür
  async getActiveTimeSlotsForDay(dayOfWeek: number): Promise<string[]> {
    const templates = await reservationTemplateRepository.findActiveByDay(dayOfWeek);
    return templates.map((t: ReservationTemplate) => t.time);
  }

  // Varsayılan şablonları oluştur (her gün 08:00-23:00 arası 1'er saat aralıkla)
  async initializeDefaultTemplates(): Promise<void> {
    const defaultHours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
      '20:00', '21:00', '22:00', '23:00'
    ];

    // Her gün için (0 = Pazartesi, 1 = Salı, ..., 6 = Pazar)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      // Her gün için order'ı 1'den başlat
      for (let i = 0; i < defaultHours.length; i++) {
        const time = defaultHours[i];
        const existing = await reservationTemplateRepository.findByDayAndTime(dayOfWeek, time);
        if (!existing) {
          await reservationTemplateRepository.create({
            dayOfWeek,
            time,
            order: i + 1, // Her gün için 1'den başlar
            isActive: true,
          });
        } else {
          // Mevcut şablon varsa order'ını güncelle (her gün için 1'den başlamalı)
          await reservationTemplateRepository.update(existing.id, {
            order: i + 1,
          });
        }
      }
    }
  }

  // Tüm şablonların order'larını her gün için 1'den başlatacak şekilde güncelle
  async updateAllTemplateOrders(): Promise<void> {
    // Her gün için (0 = Pazartesi, 1 = Salı, ..., 6 = Pazar)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      // O günün tüm şablonlarını al ve sırala
      const dayTemplates = await reservationTemplateRepository.findByDay(dayOfWeek);
      
      // Saate göre sırala (order'a göre değil, çünkü order'lar yanlış olabilir)
      dayTemplates.sort((a: ReservationTemplate, b: ReservationTemplate) => a.time.localeCompare(b.time));
      
      // Her şablon için order'ı 1'den başlat
      for (let i = 0; i < dayTemplates.length; i++) {
        await reservationTemplateRepository.update(dayTemplates[i].id, {
          order: i + 1, // Her gün için 1'den başlar
        });
      }
    }
  }
}
