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
 *           enum: [example, cleanup, updateStandings, dailyNotifications]
 *         description: Çalıştırılacak job'ın adı
 *     responses:
 *       200:
 *         description: Job başarıyla çalıştırıldı
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

