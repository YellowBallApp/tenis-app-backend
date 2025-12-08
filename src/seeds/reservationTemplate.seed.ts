import { AppDataSource } from "../config/data-source";
import { ReservationTemplate } from "../entities/reservationTemplate.entity";
import { ReservationTemplateService } from "../services/reservationTemplate.service";

export const seedReservationTemplates = async () => {
  const templateService = new ReservationTemplateService();
  const templateRepository = AppDataSource.getRepository(ReservationTemplate);
  
  const templateCount = await templateRepository.count();
  if (templateCount > 0) {
    console.log(`✅ ${templateCount} rezervasyon şablonu zaten mevcut, seed atlanıyor.`);
    return;
  }
  
  console.log("📅 Rezervasyon şablonları oluşturuluyor...");
  
  try {
    await templateService.initializeDefaultTemplates();
    console.log(`✅ Rezervasyon şablonları başarıyla oluşturuldu (her gün için 08:00-23:00)`);
  } catch (error) {
    console.error("❌ Rezervasyon şablonu oluşturma hatası:", error);
    throw error;
  }
};

