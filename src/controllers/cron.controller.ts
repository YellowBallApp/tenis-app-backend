import { Request, Response } from "express";
import { runJobManually } from "../cron/cronManager";

/**
 * Cron Controller
 * Cron job'ların manuel yönetimi için controller
 */

export class CronController {
  /**
   * Manuel olarak bir cron job'ı çalıştırır
   */
  static async runJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobName } = req.params;

      const validJobNames = ["example", "cleanup", "updateStandings", "dailyNotifications", "processChallenges"];

      if (!validJobNames.includes(jobName)) {
        return res.status(400).json({
          success: false,
          message: `Geçersiz job adı. Geçerli job'lar: ${validJobNames.join(", ")}`
        });
      }

      await runJobManually(jobName);

      return res.status(200).json({
        success: true,
        message: `${jobName} job'ı başarıyla çalıştırıldı.`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Cron job çalıştırma hatası:", error);
      return res.status(500).json({
        success: false,
        message: "Job çalıştırılırken bir hata oluştu.",
        error: error instanceof Error ? error.message : "Bilinmeyen hata"
      });
    }
  }

  /**
   * Tüm cron job'ların durumunu döndürür
   */
  static getJobsStatus(req: Request, res: Response): Response {
    return res.status(200).json({
      success: true,
      jobs: [
        {
          name: "cleanupOldReservations",
          key: "cleanup",
          schedule: "0 2 * * *",
          description: "90 gün öncesine ait eski rezervasyonları temizler",
          nextRun: "Her gün 02:00",
          timezone: "Europe/Istanbul",
          active: true
        },
        {
          name: "processPendingChallenges",
          key: "processChallenges",
          schedule: "55 23 * * *",
          description: "Bekleyen maç tekliflerini işler, hatırlatma gönderir ve süresi dolanlar için otomatik işlem yapar",
          nextRun: "Her gün 23:55",
          timezone: "Europe/Istanbul",
          active: true
        },
        {
          name: "updateLeagueStandings",
          key: "updateStandings",
          schedule: "0 0 * * *",
          description: "Aktif liglerin sıralamalarını günceller",
          nextRun: "Her gün 00:00",
          timezone: "Europe/Istanbul",
          active: true
        },
        {
          name: "sendDailyNotifications",
          key: "dailyNotifications",
          schedule: "0 8 * * *",
          description: "Bugünkü rezervasyonlar için kullanıcılara hatırlatma gönderir",
          nextRun: "Her gün 08:00",
          timezone: "Europe/Istanbul",
          active: true
        },
        {
          name: "exampleJob",
          key: "example",
          schedule: "*/5 * * * *",
          description: "Test amaçlı örnek job",
          nextRun: "Her 5 dakikada bir",
          timezone: "Europe/Istanbul",
          active: false,
          note: "Varsayılan olarak devre dışı - Test için aktif edilebilir"
        }
      ],
      serverTime: new Date().toISOString(),
      serverTimezone: "Europe/Istanbul"
    });
  }
}

