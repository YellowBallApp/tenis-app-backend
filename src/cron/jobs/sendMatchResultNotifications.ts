import { AppDataSource } from "../../config/data-source";
import { Reservation } from "../../entities/reservation.entity";
import notificationService from "../../services/notification.service";
import { NotificationType } from "../../enum/notificationType.enum";

/**
 * Randevu bitiş saatinden 1 saat sonra maç sonucu girme bildirimi gönderir
 * Her saat başı çalışır (örn: 14:00, 15:00, 16:00...)
 * 
 * İşlevler:
 * 1. Bitiş saati 1 saat önce olan randevuları bul (örn: şu an 15:00 ise, endTime'ı 14:00 olan randevuları bul)
 * 2. Rezervasyona dahil olan tüm kullanıcılara bildirim gönder
 * 
 * @param testMode - Test modu: true ise son 24 saat içinde biten tüm randevuları kontrol eder
 */
export const sendMatchResultNotifications = async (testMode: boolean = false) => {
  try {
    console.log(`🔔 Maç sonucu girme bildirimleri kontrol ediliyor... ${testMode ? '(TEST MODU)' : ''}`);
    
    const reservationRepository = AppDataSource.getRepository(Reservation);
    
    const now = new Date();
    
    let oneHourBefore: Date;
    let oneHourAfter: Date;
    
    if (testMode) {
      // Test modu: Son 24 saat içinde biten tüm randevuları kontrol et
      oneHourBefore = new Date(now);
      oneHourBefore.setHours(oneHourBefore.getHours() - 24);
      oneHourBefore.setMinutes(0);
      oneHourBefore.setSeconds(0);
      oneHourBefore.setMilliseconds(0);
      
      oneHourAfter = new Date(now);
      oneHourAfter.setMinutes(0);
      oneHourAfter.setSeconds(0);
      oneHourAfter.setMilliseconds(0);
      
      console.log(`🧪 TEST MODU: Son 24 saat içinde biten randevular kontrol ediliyor...`);
    } else {
      // Normal mod: 1 saat önce biten randevuları kontrol et
      const oneHourAgo = new Date(now);
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      oneHourBefore = new Date(oneHourAgo);
      oneHourBefore.setMinutes(0);
      oneHourBefore.setSeconds(0);
      oneHourBefore.setMilliseconds(0);
      
      oneHourAfter = new Date(oneHourBefore);
      oneHourAfter.setHours(oneHourAfter.getHours() + 1);
    }
    
    const reservations = await reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.participants', 'participants')
      .leftJoinAndSelect('reservation.court', 'court')
      .where('reservation.endTime >= :start', { start: oneHourBefore })
      .andWhere('reservation.endTime < :end', { end: oneHourAfter })
      .getMany();
    
    console.log(`📊 ${reservations.length} adet ilgili randevu bulundu.`);
    
    let notificationsSent = 0;
    
    for (const reservation of reservations) {
      try {
        // Rezervasyona dahil olan tüm kullanıcıları topla (user + participants)
        const userIds = new Set<string>();
        if (reservation.user) {
          userIds.add(reservation.user.id);
        }
        if (reservation.participants && reservation.participants.length > 0) {
          reservation.participants.forEach(participant => {
            userIds.add(participant.id);
          });
        }
        
        // Eğer rezervasyonda hiç kullanıcı yoksa atla
        if (userIds.size === 0) {
          console.log(`⚠️ Rezervasyon ${reservation.id} için kullanıcı bulunamadı.`);
          continue;
        }
        
        // Rezervasyon detaylarını hazırla
        const courtName = reservation.court?.name || 'Bilinmeyen Kort';
        const startTime = new Date(reservation.startTime);
        const endTime = new Date(reservation.endTime);
        
        // Tarih ve saat formatı
        const dateStr = startTime.toLocaleDateString('tr-TR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        const timeStr = `${startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        
        // Oyuncu listesi (rezervasyon sahibi + participants)
        const allPlayers: string[] = [];
        if (reservation.user) {
          allPlayers.push(reservation.user.name);
        }
        if (reservation.participants && reservation.participants.length > 0) {
          reservation.participants.forEach(participant => {
            if (!allPlayers.find(p => p === participant.name)) {
              allPlayers.push(participant.name);
            }
          });
        }
        const playersStr = allPlayers.length > 0 ? allPlayers.join(', ') : 'Bilinmeyen';
        
        // Bildirim mesajını oluştur
        const message = `🎾 ${courtName} - ${dateStr} ${timeStr}\n👥 ${playersStr}\n\nMaç sonucunu girmek için tıklayın.`;
        
        // Her kullanıcıya bildirim gönder (rezervasyon ID'si ile)
        for (const userId of userIds) {
          await notificationService.createNotification({
            recipientId: userId,
            type: NotificationType.MATCH_COMPLETED,
            message: message,
            relatedEntityId: reservation.id,
            relatedEntityType: 'reservation'
          });
          notificationsSent++;
        }
        
        console.log(`✅ Rezervasyon ${reservation.id} için ${userIds.size} kullanıcıya bildirim gönderildi.`);
      } catch (error) {
        console.error(`❌ Rezervasyon ${reservation.id} işlenirken hata:`, error);
      }
    }
    
    console.log(`✅ Toplam ${notificationsSent} adet bildirim gönderildi.`);
    
  } catch (error) {
    console.error("❌ Maç sonucu bildirimi gönderme hatası:", error);
  }
};
