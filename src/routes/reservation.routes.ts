import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const reservationController = new ReservationController();

// Public endpoint - Bloke edilmiş saatleri getir (auth gerektirmez)
/**
 * @swagger
 * /api/reservations/blocked-hours:
 *   get:
 *     summary: Belirli bir kort ve tarih için bloke edilmiş saatleri getir (Public)
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: courtId
 *         required: true
 *         schema:
 *           type: number
 *         description: Kort ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tarih (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Bloke edilmiş saatler listesi
 */
router.get('/blocked-hours', reservationController.getBlockedTimeSlots);

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

/**
 * @swagger
 * /api/reservations/upcoming:
 *   get:
 *     summary: Kullanıcının yakın zamandaki rezervasyonlarını getir
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 2
 *         description: Kaç adet rezervasyon getirileceği
 *     responses:
 *       200:
 *         description: Kullanıcının yakın rezervasyonları
 */
router.get('/upcoming', reservationController.getUpcomingReservations);

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
 * /api/reservations/has-active:
 *   get:
 *     summary: Kullanıcının aktif rezervasyonu var mı kontrol et
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktif rezervasyon kontrolü sonucu
 */
router.get('/has-active', reservationController.hasActiveReservation);

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
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Katılımcı kullanıcı ID'leri
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
 *   get:
 *     summary: ID'ye göre rezervasyon getir
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
 *         description: Rezervasyon detayı
 */
router.get('/:id', reservationController.getReservationById);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Rezervasyon güncelle
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courtId:
 *                 type: number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rezervasyon güncellendi
 */
router.put('/:id', reservationController.updateReservation);

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

