import cron, { ScheduledTask } from "node-cron";
import { cleanupOldReservations } from "./jobs/cleanupOldReservations";
import { processPendingChallenges } from "./jobs/processPendingChallenges";
import { updateWeatherForecast } from "./jobs/updateWeatherForecast";
import { sendMatchResultNotifications } from "./jobs/sendMatchResultNotifications";

const cronJobs: ScheduledTask[] = [];

export const initializeCronJobs = () => {
  console.log("🚀 Cron job'ları başlatılıyor...");

  // Eski rezervasyonları temizle - Her gün gece 02:00'de çalışır
  const cleanupTask = cron.schedule(
    "0 2 * * *",
    cleanupOldReservations,
    {
      timezone: "Europe/Istanbul"
    }
  );
  cronJobs.push(cleanupTask);

  // Bekleyen maç tekliflerini işle - Her gün gece 23:55'te çalışır
  const processChallengesTask = cron.schedule(
    "55 23 * * *",
    processPendingChallenges,
    {
      timezone: "Europe/Istanbul"
    }
  );
  cronJobs.push(processChallengesTask);

  // Hava durumu güncelleme - Her gün gece 23:55'te çalışır (challenge job'undan önce)
  const updateWeatherTask = cron.schedule(
    "55 23 * * *",
    updateWeatherForecast,
    {
      timezone: "Europe/Istanbul"
    }
  );
  cronJobs.push(updateWeatherTask);

  // Maç sonucu bildirimi gönderme - Her saat başı çalışır (örn: 14:00, 15:00, 16:00...)
  const sendMatchResultTask = cron.schedule(
    "0 * * * *",
    () => sendMatchResultNotifications(false), // Normal mod için false
    {
      timezone: "Europe/Istanbul"
    }
  );
  cronJobs.push(sendMatchResultTask);

  console.log(`✅ ${cronJobs.length} adet cron job başarıyla yapılandırıldı.`);
  
  // Aktif job'ları listele
  console.log("📋 Aktif cron job'ları:");
  console.log("  - Rezervasyon temizleme: Her gün 02:00");
  console.log("  - Hava durumu güncelleme: Her gün 23:55");
  console.log("  - Maç teklifi işleme: Her gün 23:55");
  console.log("  - Maç sonucu bildirimi: Her saat başı");
};

export const stopAllCronJobs = () => {
  console.log("🛑 Tüm cron job'ları durduruluyor...");
  cronJobs.forEach(job => job.stop());
  console.log("✅ Tüm cron job'ları durduruldu.");
};

// Örnek: Manuel olarak bir job'ı çalıştırma
export const runJobManually = async (jobName: string, testMode: boolean = false) => {
  console.log(`🔧 Manuel job çalıştırılıyor: ${jobName}${testMode ? ' (TEST MODU)' : ''}`);
  
  switch (jobName) {
    case "cleanup":
      await cleanupOldReservations();
      break;
    case "processChallenges":
      await processPendingChallenges();
      break;
    case "updateWeather":
      await updateWeatherForecast();
      break;
    case "sendMatchResultNotifications":
      await sendMatchResultNotifications(testMode);
      break;
    default:
      console.error(`❌ Bilinmeyen job: ${jobName}`);
  }
};

