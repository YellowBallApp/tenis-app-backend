import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const reservationController = new ReservationController();

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Tarihe göre rezervasyonları getir
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Rezervasyon tarihi (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Rezervasyon listesi
 */
router.get('/', reservationController.getReservationsByDate);

/**
 * @swagger
 * /api/reservations/my:
 *   get:
 *     summary: Kullanıcının rezervasyonlarını getir
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı rezervasyonları
 */
router.get('/my', reservationController.getUserReservations);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Yeni rezervasyon oluştur
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courtNumber
 *               - startTime
 *               - endTime
 *             properties:
 *               courtNumber:
 *                 type: number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rezervasyon oluşturuldu
 */
router.post('/', reservationController.createReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Rezervasyon iptal et
 *     tags: [Reservations]
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
 *         description: Rezervasyon iptal edildi
 */
router.delete('/:id', reservationController.cancelReservation);

export default router;

