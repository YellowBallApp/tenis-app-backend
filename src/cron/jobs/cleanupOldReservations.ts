import { AppDataSource } from "../../config/data-source";
import { Reservation } from "../../entities/reservation.entity";

/**
 * Eski rezervasyonları temizleme job'u
 * 90 gün öncesine ait tamamlanmış rezervasyonları temizler
 */
export const cleanupOldReservations = async () => {
  try {
    console.log("🧹 Eski rezervasyonlar temizleniyor...");
    
    // 90 gün öncesine ait tarih
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const reservationRepository = AppDataSource.getRepository(Reservation);
    
    // Eski rezervasyonları sil (startTime'a göre)
    const result = await reservationRepository
      .createQueryBuilder()
      .delete()
      .where("startTime < :date", { date: ninetyDaysAgo })
      .execute();
    
    console.log(`✅ ${result.affected || 0} adet eski rezervasyon temizlendi.`);
    
  } catch (error) {
    console.error("❌ Rezervasyon temizleme hatası:", error);
  }
};

