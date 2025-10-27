import { Router } from 'express';
import { eloController } from '../controllers/elo.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/elo/top-players:
 *   get:
 *     summary: En yüksek ELO'ya sahip oyuncuları getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: minMatches
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/top-players', eloController.getTopPlayers);

/**
 * @swagger
 * /api/elo/distribution:
 *   get:
 *     summary: ELO dağılımını getirir (yıldız seviyesine göre)
 *     tags: [ELO]
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/distribution', eloController.getEloDistribution);

/**
 * @swagger
 * /api/elo/top-gainers:
 *   get:
 *     summary: Son N gündeki en çok ELO kazanan oyuncuları getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/top-gainers', eloController.getTopGainers);

/**
 * @swagger
 * /api/elo/star/{starRating}:
 *   get:
 *     summary: Belirli yıldız seviyesindeki oyuncuları getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: path
 *         name: starRating
 *         required: true
 *         schema:
 *           type: number
 *           enum: [1.0, 1.5, 2.0, 2.5, 3.0]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/star/:starRating', eloController.getPlayersByStarRating);

/**
 * @swagger
 * /api/elo/user/{userId}/history:
 *   get:
 *     summary: Kullanıcının ELO geçmişini getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/user/:userId/history', eloController.getUserEloHistory);

/**
 * @swagger
 * /api/elo/user/{userId}/stats:
 *   get:
 *     summary: Kullanıcının ELO istatistiklerini getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/user/:userId/stats', eloController.getUserEloStats);

/**
 * @swagger
 * /api/elo/user/{userId}/history/range:
 *   get:
 *     summary: Kullanıcının belirli tarih aralığındaki ELO geçmişini getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/user/:userId/history/range', eloController.getUserEloHistoryByDateRange);

/**
 * @swagger
 * /api/elo/user/{userId}/total-change:
 *   get:
 *     summary: Kullanıcının toplam ELO değişimini getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/user/:userId/total-change', eloController.getUserTotalEloChange);

/**
 * @swagger
 * /api/elo/inactive-players:
 *   get:
 *     summary: İnaktif oyuncuları getirir
 *     tags: [ELO]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/inactive-players', authMiddleware, eloController.getInactivePlayers);

/**
 * @swagger
 * /api/elo/apply-decay:
 *   post:
 *     summary: ELO decay uygular (admin endpoint)
 *     tags: [ELO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.post('/apply-decay', authMiddleware, eloController.applyDecay);

export default router;

