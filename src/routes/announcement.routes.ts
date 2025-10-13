import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const announcementController = new AnnouncementController();

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Tüm duyuruları getir
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: Duyuru listesi
 */
router.get('/', announcementController.getAllAnnouncements);

// Admin işlemleri
router.use(authMiddleware);

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Yeni duyuru oluştur (Admin)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetGroup:
 *                 type: string
 *               isPinned:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Duyuru oluşturuldu
 */
router.post('/', announcementController.createAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     summary: Duyuru güncelle
 *     tags: [Announcements]
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
 *         description: Duyuru güncellendi
 */
router.put('/:id', announcementController.updateAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Duyuru sil
 *     tags: [Announcements]
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
 *         description: Duyuru silindi
 */
router.delete('/:id', announcementController.deleteAnnouncement);

export default router;

