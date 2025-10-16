import { Router } from 'express';
import { LeagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const leagueController = new LeagueController();

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

// ==================== League Standings & Match Routes ====================

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
 *     parameters:
 *       - in: query
 *         name: leagueId
 *         schema:
 *           type: integer
 *         description: Lig ID (opsiyonel, belirtilmezse tüm ligler)
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
 *                       league:
 *                         $ref: '#/components/schemas/League'
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
 *       - in: query
 *         name: leagueId
 *         schema:
 *           type: integer
 *         description: Lig ID (opsiyonel)
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
 *                     league:
 *                       $ref: '#/components/schemas/League'
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
 *       - in: query
 *         name: leagueId
 *         schema:
 *           type: integer
 *         description: Lig ID (opsiyonel)
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
 *                       league:
 *                         $ref: '#/components/schemas/League'
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

// ==================== League Standings CRUD Routes ====================

/**
 * @swagger
 * /api/league/standings:
 *   get:
 *     summary: Tüm standings'leri getir
 *     tags: [League Standings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Standings listesi
 */
router.get('/standings', leagueController.getAllStandings);

/**
 * @swagger
 * /api/league/standings/{id}:
 *   get:
 *     summary: ID'ye göre standing getir
 *     tags: [League Standings]
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
 *         description: Standing detayı
 */
router.get('/standings/:id', leagueController.getStandingById);

/**
 * @swagger
 * /api/league/standings/league/{leagueId}:
 *   get:
 *     summary: Belirli bir lige ait standings'leri getir
 *     tags: [League Standings]
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
 *         description: Lig standings listesi
 */
router.get('/standings/league/:leagueId', leagueController.getStandingsByLeagueId);

/**
 * @swagger
 * /api/league/standings/user/{userId}:
 *   get:
 *     summary: Belirli bir kullanıcıya ait standings'leri getir
 *     tags: [League Standings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kullanıcı standings listesi
 */
router.get('/standings/user/:userId', leagueController.getStandingsByUserId);

/**
 * @swagger
 * /api/league/standings:
 *   post:
 *     summary: Yeni standing oluştur
 *     tags: [League Standings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leagueRanking:
 *                 type: number
 *               description:
 *                 type: string
 *               userId:
 *                 type: number
 *               leagueId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Standing oluşturuldu
 */
router.post('/standings', leagueController.createStanding);

/**
 * @swagger
 * /api/league/standings/{id}:
 *   put:
 *     summary: Standing güncelle
 *     tags: [League Standings]
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
 *             properties:
 *               leagueRanking:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Standing güncellendi
 */
router.put('/standings/:id', leagueController.updateStanding);

/**
 * @swagger
 * /api/league/standings/{id}:
 *   delete:
 *     summary: Standing sil
 *     tags: [League Standings]
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
 *         description: Standing silindi
 */
router.delete('/standings/:id', leagueController.deleteStanding);

/**
 * @swagger
 * /api/league/standings/ranking:
 *   put:
 *     summary: Kullanıcının lig sıralamasını güncelle (challenge kazandığında)
 *     tags: [League Standings]
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
 *               - challengerId
 *               - challengedId
 *             properties:
 *               leagueId:
 *                 type: number
 *               challengerId:
 *                 type: string
 *               challengedId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sıralama güncellendi
 */
router.put('/standings/ranking', leagueController.updateUserRanking);

// ==================== League Entity CRUD Routes ====================
// Not: Bu route'lar en sonda tanımlanmalı ki /settings, /rankings gibi özel route'larla çakışmasın

/**
 * @swagger
 * /api/league/all:
 *   get:
 *     summary: Tüm ligleri listele
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lig listesi
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
 *                     $ref: '#/components/schemas/League'
 */
router.get('/all', leagueController.getAllLeagues);

/**
 * @swagger
 * /api/league/entity/{id}:
 *   get:
 *     summary: Belirli bir ligi getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lig ID
 *     responses:
 *       200:
 *         description: Lig detayı
 *       404:
 *         description: Lig bulunamadı
 */
router.get('/entity/:id', leagueController.getLeagueById);

/**
 * @swagger
 * /api/league/code/{code}:
 *   get:
 *     summary: Code'a göre ligi getir
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Lig kodu (örn. DL2025)
 *     responses:
 *       200:
 *         description: Lig detayı
 *       404:
 *         description: Lig bulunamadı
 */
router.get('/code/:code', leagueController.getLeagueByCode);

/**
 * @swagger
 * /api/league/create:
 *   post:
 *     summary: Yeni lig oluştur
 *     tags: [League]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lig oluşturuldu
 */
router.post('/create', leagueController.createLeague);

/**
 * @swagger
 * /api/league/entity/{id}:
 *   put:
 *     summary: Lig güncelle
 *     tags: [League]
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
 *         description: Lig güncellendi
 *       404:
 *         description: Lig bulunamadı
 */
router.put('/entity/:id', leagueController.updateLeague);

/**
 * @swagger
 * /api/league/entity/{id}:
 *   delete:
 *     summary: Lig sil
 *     tags: [League]
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
 *         description: Lig silindi
 *       404:
 *         description: Lig bulunamadı
 */
router.delete('/entity/:id', leagueController.deleteLeague);

export default router;

