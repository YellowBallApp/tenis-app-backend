import { Router } from 'express';
import { matchChallengeController } from '../controllers/matchChallenge.controller';
import { authMiddleware as authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Match Challenges
 *   description: Maç teklif sistemi API'leri
 */

/**
 * @swagger
 * /match-challenges:
 *   post:
 *     summary: Yeni maç teklifi oluştur
 *     tags: [Match Challenges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengedId
 *               - leagueId
 *             properties:
 *               challengedId:
 *                 type: string
 *               leagueId:
 *                 type: number
 *               message:
 *                 type: string
 *               proposedDate:
 *                 type: string
 *                 format: date-time
 *               expiresInDays:
 *                 type: number
 *     responses:
 *       201:
 *         description: Maç teklifi başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz
 */
router.post('/', authenticateToken, matchChallengeController.createChallenge);

/**
 * @swagger
 * /match-challenges/pending:
 *   get:
 *     summary: Kullanıcının aldığı bekleyen teklifleri getir
 *     tags: [Match Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bekleyen teklifler listesi
 *       401:
 *         description: Yetkisiz
 */
router.get('/pending', authenticateToken, matchChallengeController.getPendingChallenges);

/**
 * @swagger
 * /match-challenges/sent:
 *   get:
 *     summary: Kullanıcının gönderdiği teklifleri getir
 *     tags: [Match Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gönderilen teklifler listesi
 *       401:
 *         description: Yetkisiz
 */
router.get('/sent', authenticateToken, matchChallengeController.getSentChallenges);

/**
 * @swagger
 * /match-challenges/my:
 *   get:
 *     summary: Kullanıcının tüm challengelarını getir
 *     tags: [Match Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tüm challengelar listesi
 *       401:
 *         description: Yetkisiz
 */
router.get('/my', authenticateToken, matchChallengeController.getUserChallenges);

/**
 * @swagger
 * /match-challenges/all:
 *   get:
 *     summary: Tüm challengeları getir (admin)
 *     tags: [Match Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tüm challengelar listesi
 *       401:
 *         description: Yetkisiz
 */
router.get('/all', authenticateToken, matchChallengeController.getAllChallenges);

/**
 * @swagger
 * /match-challenges/{id}:
 *   get:
 *     summary: ID'ye göre challenge detayını getir
 *     tags: [Match Challenges]
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
 *         description: Challenge detayı
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Challenge bulunamadı
 */
router.get('/:id', authenticateToken, matchChallengeController.getChallengeById);

/**
 * @swagger
 * /match-challenges/{id}/accept:
 *   put:
 *     summary: Challenge'ı kabul et
 *     tags: [Match Challenges]
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
 *         description: Challenge kabul edildi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Challenge bulunamadı
 */
router.put('/:id/accept', authenticateToken, matchChallengeController.acceptChallenge);

/**
 * @swagger
 * /match-challenges/{id}/reject:
 *   put:
 *     summary: Challenge'ı reddet
 *     tags: [Match Challenges]
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
 *         description: Challenge reddedildi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Challenge bulunamadı
 */
router.put('/:id/reject', authenticateToken, matchChallengeController.rejectChallenge);

/**
 * @swagger
 * /match-challenges/{id}/cancel:
 *   put:
 *     summary: Challenge'ı iptal et
 *     tags: [Match Challenges]
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
 *         description: Challenge iptal edildi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Challenge bulunamadı
 */
router.put('/:id/cancel', authenticateToken, matchChallengeController.cancelChallenge);

/**
 * @swagger
 * /match-challenges/{id}:
 *   delete:
 *     summary: Challenge'ı sil
 *     tags: [Match Challenges]
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
 *         description: Challenge silindi
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Challenge bulunamadı
 */
router.delete('/:id', authenticateToken, matchChallengeController.deleteChallenge);

export default router;

