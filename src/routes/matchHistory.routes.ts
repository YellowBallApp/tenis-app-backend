import { Router } from 'express';
import { matchHistoryController } from '../controllers/matchHistory.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: MatchHistory
 *   description: Maç geçmişi yönetimi
 */

/**
 * @swagger
 * /api/match-history:
 *   get:
 *     summary: Tüm maç geçmişlerini getir
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', authMiddleware, matchHistoryController.getAll);

/**
 * @swagger
 * /api/match-history/{id}:
 *   get:
 *     summary: ID'ye göre maç geçmişi getir
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/:id', authMiddleware, matchHistoryController.getById);

/**
 * @swagger
 * /api/match-history/user/{userId}:
 *   get:
 *     summary: Kullanıcıya göre maç geçmişi getir
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
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
router.get('/user/:userId', authMiddleware, matchHistoryController.getByUserId);

/**
 * @swagger
 * /api/match-history/user/{userId}/stats:
 *   get:
 *     summary: Kullanıcının maç istatistiklerini getir
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
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
router.get('/user/:userId/stats', authMiddleware, matchHistoryController.getUserStats);

/**
 * @swagger
 * /api/match-history/league/{leagueId}:
 *   get:
 *     summary: Lige göre maç geçmişi getir
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/league/:leagueId', authMiddleware, matchHistoryController.getByLeagueId);

/**
 * @swagger
 * /api/match-history:
 *   post:
 *     summary: Yeni maç geçmişi oluştur
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winnerIds
 *               - loserIds
 *               - score
 *             properties:
 *               winnerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               loserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               score:
 *                 type: string
 *               matchDate:
 *                 type: string
 *                 format: date-time
 *               leagueStandingId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Maç geçmişi oluşturuldu
 */
router.post('/', authMiddleware, matchHistoryController.create);

/**
 * @swagger
 * /api/match-history/{id}:
 *   put:
 *     summary: Maç geçmişini güncelle
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.put('/:id', authMiddleware, matchHistoryController.update);

/**
 * @swagger
 * /api/match-history/{id}:
 *   delete:
 *     summary: Maç geçmişini sil
 *     tags: [MatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.delete('/:id', authMiddleware, matchHistoryController.delete);

export default router;

