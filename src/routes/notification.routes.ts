import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Bildirim yönetimi
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Kullanıcının tüm bildirimlerini getir (pagination ile)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', authMiddleware, notificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Okunmamış bildirim sayısını getir
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Tüm bildirimleri okundu olarak işaretle
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/delete-all:
 *   delete:
 *     summary: Tüm bildirimleri sil
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.delete('/delete-all', authMiddleware, notificationController.deleteAllNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Belirli bir bildirimi getir
 *     tags: [Notifications]
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
router.get('/:id', authMiddleware, notificationController.getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Bildirimi okundu olarak işaretle
 *     tags: [Notifications]
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
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/delete-by-related-entity:
 *   delete:
 *     summary: Related entity'ye göre bildirimleri sil (rezervasyon için)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: relatedEntityId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: relatedEntityType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.delete('/delete-by-related-entity', authMiddleware, notificationController.deleteByRelatedEntity);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Bildirimi sil
 *     tags: [Notifications]
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
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

export default router;

