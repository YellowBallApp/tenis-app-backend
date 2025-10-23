import { Router } from 'express';
import { CourtController } from '../controllers/court.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const courtController = new CourtController();

// Authentication gerektiren rotalar
router.use(authMiddleware);

/**
 * @swagger
 * /api/courts:
 *   get:
 *     summary: Tüm kortları getir
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kort listesi
 */
router.get('/', courtController.getAllCourts);

/**
 * @swagger
 * /api/courts/active:
 *   get:
 *     summary: Aktif kortları getir
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktif kort listesi
 */
router.get('/active', courtController.getActiveCourts);

/**
 * @swagger
 * /api/courts/{id}:
 *   get:
 *     summary: ID'ye göre kort getir
 *     tags: [Courts]
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
 *         description: Kort bilgisi
 */
router.get('/:id', courtController.getCourtById);

/**
 * @swagger
 * /api/courts:
 *   post:
 *     summary: Yeni kort oluştur
 *     tags: [Courts]
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
 *             properties:
 *               name:
 *                 type: string
 *               indoors:
 *                 type: boolean
 *               groundType:
 *                 type: string
 *                 enum: [grass, clay, hard]
 *               closed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Kort oluşturuldu
 */
router.post('/', courtController.createCourt);

/**
 * @swagger
 * /api/courts/{id}:
 *   put:
 *     summary: Kort güncelle
 *     tags: [Courts]
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
 *               name:
 *                 type: string
 *               indoors:
 *                 type: boolean
 *               groundType:
 *                 type: string
 *                 enum: [grass, clay, hard]
 *               closed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kort güncellendi
 */
router.put('/:id', courtController.updateCourt);

/**
 * @swagger
 * /api/courts/{id}:
 *   delete:
 *     summary: Kort sil
 *     tags: [Courts]
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
 *         description: Kort silindi
 */
router.delete('/:id', courtController.deleteCourt);

export default router;

