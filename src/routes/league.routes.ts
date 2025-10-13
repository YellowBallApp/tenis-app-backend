import { Router } from 'express';
import { LeagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const leagueController = new LeagueController();

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

/**
 * @swagger
 * /api/league/settings:
 *   get:
 *     summary: Lig ayarlarını getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lig ayarları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LeagueSettings'
 */
router.get('/settings', leagueController.getLeagueSettings);

/**
 * @swagger
 * /api/league/settings:
 *   put:
 *     summary: Lig ayarlarını güncelle
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeagueSettings'
 *     responses:
 *       200:
 *         description: Ayarlar güncellendi
 */
router.put('/settings', leagueController.updateLeagueSettings);

/**
 * @swagger
 * /api/league/rankings:
 *   get:
 *     summary: Lig sıralamasını getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lig sıralaması
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       position:
 *                         type: number
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       description:
 *                         type: string
 */
router.get('/rankings', leagueController.getLeagueRankings);

/**
 * @swagger
 * /api/league/user/{userId}:
 *   get:
 *     summary: Kullanıcının lig bilgilerini getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı lig bilgileri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     position:
 *                       type: number
 *                     totalMatches:
 *                       type: number
 *                     wins:
 *                       type: number
 *                     losses:
 *                       type: number
 *                     winRate:
 *                       type: number
 *                     description:
 *                       type: string
 */
router.get('/user/:userId', leagueController.getUserLeagueInfo);

/**
 * @swagger
 * /api/league/available-opponents/{userId}:
 *   get:
 *     summary: Teklif yapılabilecek rakipleri getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Rakip listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       position:
 *                         type: number
 *                       canChallenge:
 *                         type: boolean
 */
router.get('/available-opponents/:userId', leagueController.getAvailableOpponents);

/**
 * @swagger
 * /api/league/challenge:
 *   post:
 *     summary: Maç teklifi gönder
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengerId
 *               - opponentId
 *             properties:
 *               challengerId:
 *                 type: string
 *               opponentId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meydan okuma gönderildi
 *       400:
 *         description: Geçersiz istek
 */
router.post('/challenge', leagueController.sendMatchChallenge);

/**
 * @swagger
 * /api/league/match-result:
 *   post:
 *     summary: Maç sonucunu kaydet
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - winnerId
 *               - loserId
 *               - score
 *             properties:
 *               matchId:
 *                 type: number
 *               winnerId:
 *                 type: string
 *               loserId:
 *                 type: string
 *               score:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maç sonucu kaydedildi
 *       400:
 *         description: Geçersiz veri
 */
router.post('/match-result', leagueController.recordMatchResult);

export default router;

