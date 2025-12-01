import coachController from "../controllers/coach.controller";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/coaches:
 *   get:
 *     summary: Tüm antrenörleri listele
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Antrenör listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", authMiddleware, coachController.getAll);

/**
 * @swagger
 * /api/coaches/{id}:
 *   get:
 *     summary: Belirli bir antrenörü getir
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Antrenör detayı
 *       404:
 *         description: Antrenör bulunamadı
 */
router.get("/:id", authMiddleware, coachController.getById);

export default router;

