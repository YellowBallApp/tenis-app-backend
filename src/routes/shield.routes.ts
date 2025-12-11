import { Router } from 'express';
import shieldController from '../controllers/shield.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/shield/activate:
 *   post:
 *     summary: Shield'i aktif eder
 *     tags: [Shield]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *               - days
 *             properties:
 *               leagueId:
 *                 type: number
 *               days:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shield başarıyla aktif edildi
 */
router.post('/activate', authMiddleware, shieldController.activateShield);

/**
 * @swagger
 * /api/shield/status/:leagueId:
 *   get:
 *     summary: Shield durumunu getirir
 *     tags: [Shield]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Shield durumu
 */
router.get('/status/:leagueId', authMiddleware, shieldController.getShieldStatus);

export default router;

