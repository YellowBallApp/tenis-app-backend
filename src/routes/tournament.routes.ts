import { Router } from 'express';
import { TournamentController } from '../controllers/tournament.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const tournamentController = new TournamentController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Tüm turnuvaları getir
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Turnuva listesi
 */
router.get('/', tournamentController.getAllTournaments);

/**
 * @swagger
 * /api/tournaments/{id}/bracket:
 *   get:
 *     summary: Turnuva bracket'ını getir
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Turnuva bracket'ı
 */
router.get('/:id/bracket', tournamentController.getTournamentBracket);

/**
 * @swagger
 * /api/tournaments:
 *   post:
 *     summary: Yeni turnuva oluştur (Admin)
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - size
 *               - startDate
 *               - playerIds
 *             properties:
 *               name:
 *                 type: string
 *               size:
 *                 type: number
 *                 enum: [8, 16, 32]
 *               startDate:
 *                 type: string
 *                 format: date
 *               playerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Turnuva oluşturuldu
 */
router.post('/', tournamentController.createTournament);

/**
 * @swagger
 * /api/tournaments/matches/{matchId}/result:
 *   post:
 *     summary: Turnuva maç sonucunu kaydet
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winnerId
 *               - score
 *             properties:
 *               winnerId:
 *                 type: string
 *               score:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maç sonucu kaydedildi
 */
router.post('/matches/:matchId/result', tournamentController.reportMatchResult);

export default router;

