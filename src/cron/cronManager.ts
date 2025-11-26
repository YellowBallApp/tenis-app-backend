import cron, { ScheduledTask } from "node-cron";
import { cleanupOldReservations } from "./jobs/cleanupOldReservations";
import { processPendingChallenges } from "./jobs/processPendingChallenges";
import { updateWeatherForecast } from "./jobs/updateWeatherForecast";

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

  console.log(`✅ ${cronJobs.length} adet cron job başarıyla yapılandırıldı.`);
  
  // Aktif job'ları listele
  console.log("📋 Aktif cron job'ları:");
  console.log("  - Rezervasyon temizleme: Her gün 02:00");
  console.log("  - Hava durumu güncelleme: Her gün 23:55");
  console.log("  - Maç teklifi işleme: Her gün 23:55");
};

export const stopAllCronJobs = () => {
  console.log("🛑 Tüm cron job'ları durduruluyor...");
  cronJobs.forEach(job => job.stop());
  console.log("✅ Tüm cron job'ları durduruldu.");
};

// Örnek: Manuel olarak bir job'ı çalıştırma
export const runJobManually = async (jobName: string) => {
  console.log(`🔧 Manuel job çalıştırılıyor: ${jobName}`);
  
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
    default:
      console.error(`❌ Bilinmeyen job: ${jobName}`);
  }
};

