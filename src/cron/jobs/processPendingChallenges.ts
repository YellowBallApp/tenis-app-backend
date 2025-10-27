import { AppDataSource } from "../../config/data-source";
import { MatchChallenge, ChallengeStatus } from "../../entities/matchChallenge.entity";
import { LeagueSettings } from "../../entities/leagueSettings.entity";
import { Court } from "../../entities/court.entity";
import matchChallengeRepository from "../../repositories/matchChallenge.repository";
import leagueStandingsService from "../../services/leagueStandings.service";
import notificationService from "../../services/notification.service";
import { NotificationType } from "../../enum/notificationType.enum";

/**
 * Bekleyen maç tekliflerini işler
 * Her gün 23:55'te çalışır
 * 
 * İşlevler:
 * 1. Süresi dolmak üzere olan challengelar için hatırlatma bildirimi gönder
 * 2. Süresi dolan challengelar için:
 *    - Legal reject edebiliyorsa: reject et
 *    - Legal reject edemiyorsa: default loss ver (challenger kazanır, 6-0 6-0)
 */
export const processPendingChallenges = async () => {
  try {
    console.log("🔔 Bekleyen maç teklifleri kontrol ediliyor...");
    
    const challengeRepository = AppDataSource.getRepository(MatchChallenge);
    const leagueSettingsRepository = AppDataSource.getRepository(LeagueSettings);
    const courtRepository = AppDataSource.getRepository(Court);
    
    // Pending olan tüm challenge'ları getir
    const pendingChallenges = await challengeRepository.find({
      where: { status: ChallengeStatus.PENDING },
      relations: ['challenger', 'challenged', 'league']
    });
    
    console.log(`📊 ${pendingChallenges.length} adet pending challenge bulundu.`);
    
    const now = new Date();
    let remindersSent = 0;
    let challengesRejected = 0;
    let defaultLossesGiven = 0;
    
    for (const challenge of pendingChallenges) {
      try {
        // Ligin ayarlarını getir
        const leagueSettings = await leagueSettingsRepository.findOne({
          where: { league: { id: challenge.league.id } }
        });
        
        if (!leagueSettings) {
          console.log(`⚠️ Challenge ${challenge.id} için lig ayarları bulunamadı, atlanıyor.`);
          continue;
        }
        
        const offerResponseDays = leagueSettings.offerResponseDays;
        
        // Challenge ne kadar önce oluşturuldu? (gün cinsinden)
        const challengeCreatedAt = new Date(challenge.createdAt);
        const daysSinceCreated = Math.floor((now.getTime() - challengeCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Gece 12'ye kaç saat kaldı?
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Bir sonraki gün başı
        const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // SENARYO 1: Hatırlatma (1 gün kala)
        if (daysSinceCreated === offerResponseDays - 1) {
          // Hatırlatma bildirimi gönder
          await notificationService.createNotification({
            recipientId: challenge.challenged.id,
            type: NotificationType.PENDING_MATCH_REQUEST,
            message: `${challenge.league.description} liginde ${challenge.challenger.name} kullanıcısından bekleyen bir maç teklifiniz var. Yarın sona erecek!`,
            relatedEntityId: challenge.id,
            relatedEntityType: 'challenge'
          });
          
          remindersSent++;
          console.log(`⏰ Challenge ${challenge.id} için hatırlatma gönderildi.`);
        }
        
        // SENARYO 2: Süre dolmak üzere (bu gece 12'den sonra süre aşacak)
        if (daysSinceCreated >= offerResponseDays - 1 && hoursUntilMidnight <= 24) {
          // Gece 12'den sonra süre aşacak mı kontrol et
          const expiresAt = new Date(challengeCreatedAt);
          expiresAt.setDate(expiresAt.getDate() + offerResponseDays);
          
          if (expiresAt <= midnight) {
            // Süre dolacak, işlem yap
            
            // Kullanıcı legal olarak reject edebilir mi kontrol et
            const rejectedCount = await matchChallengeRepository.countRejectedChallengesByUserInLeague(
              challenge.challenged.id,
              challenge.league.id
            );
            
            const canLegallyReject = rejectedCount < leagueSettings.consecutiveWOLimit;
            
            if (canLegallyReject) {
              // Legal olarak reject et
              await matchChallengeRepository.rejectChallenge(challenge.id);
              
              // Challenger'a bildirim gönder
              await notificationService.createNotification({
                recipientId: challenge.challenger.id,
                type: NotificationType.MATCH_REJECTED,
                message: `${challenge.challenged.name} maç teklifinizi yanıtsız bıraktı ve otomatik olarak reddedildi.`,
                relatedEntityId: challenge.id,
                relatedEntityType: 'challenge'
              });
              
              challengesRejected++;
              console.log(`❌ Challenge ${challenge.id} otomatik olarak reddedildi (legal).`);
              
            } else {
              // Legal olarak reject edemez, default loss ver
              
              // Random bir kort seç
              const courts = await courtRepository.find({ where: { closed: false } });
              let selectedCourtId: number | undefined = undefined;
              
              if (courts.length > 0) {
                const randomCourt = courts[Math.floor(Math.random() * courts.length)];
                selectedCourtId = randomCourt.id;
              }
              
              // Challenger kazanan olarak maç sonucu kaydet (6-0 6-0)
              await leagueStandingsService.updateRanking(
                challenge.league.id,
                challenge.challenger.id,  // Kazanan
                challenge.challenged.id,  // Kaybeden
                '6-0 6-0',
                selectedCourtId
              );
              
              // Challenge'ı accepted olarak işaretle (maç oynandı)
              await matchChallengeRepository.acceptChallenge(challenge.id);
              
              // Her iki oyuncuya bildirim gönder
              await notificationService.createNotification({
                recipientId: challenge.challenged.id,
                type: NotificationType.SYSTEM_NOTIFICATION,
                message: `${challenge.league.description} liginde ${challenge.challenger.name} ile maç teklifinize yanıt vermediniz. Consecutiveş WO limitini aştığınız için otomatik yenilgi verildi (6-0 6-0).`,
                relatedEntityId: challenge.id,
                relatedEntityType: 'challenge'
              });
              
              await notificationService.createNotification({
                recipientId: challenge.challenger.id,
                type: NotificationType.MATCH_ACCEPTED,
                message: `${challenge.league.description} liginde ${challenge.challenged.name} maç teklifinize yanıt vermedi. Otomatik kazanç aldınız (6-0 6-0).`,
                relatedEntityId: challenge.id,
                relatedEntityType: 'challenge'
              });
              
              defaultLossesGiven++;
              console.log(`🏆 Challenge ${challenge.id} için default loss verildi (challenger kazandı).`);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Challenge ${challenge.id} işlenirken hata:`, error);
      }
    }
    
    console.log(`✅ İşlem tamamlandı:`);
    console.log(`   - ${remindersSent} hatırlatma gönderildi`);
    console.log(`   - ${challengesRejected} challenge otomatik reddedildi`);
    console.log(`   - ${defaultLossesGiven} default loss verildi`);
    
  } catch (error) {
    console.error("❌ Pending challenge işleme hatası:", error);
  }
};

