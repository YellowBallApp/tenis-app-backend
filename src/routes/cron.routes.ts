import { Router } from "express";
import { CronController } from "../controllers/cron.controller";

const router = Router();

/**
 * @swagger
 * /api/cron/run/{jobName}:
 *   post:
 *     summary: Manuel olarak bir cron job'ı çalıştır
 *     tags: [Cron]
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [example, cleanup, updateStandings, dailyNotifications, processChallenges, updateWeather, sendMatchResultNotifications]
 *         description: Çalıştırılacak job'ın adı
 *       - in: query
 *         name: testMode
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Test modu (true ise son 24 saat içindeki verileri kontrol eder)
 *     responses:
 *       200:
 *         description: Job başarıyla çalıştırıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 testMode:
 *                   type: boolean
 *       400:
 *         description: Geçersiz job adı
 *       500:
 *         description: Sunucu hatası
 */
router.post("/run/:jobName", CronController.runJob);

/**
 * @swagger
 * /api/cron/status:
 *   get:
 *     summary: Tüm cron job'larının durumunu görüntüle
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: Cron job durumları
 */
router.get("/status", CronController.getJobsStatus);

export default router;

