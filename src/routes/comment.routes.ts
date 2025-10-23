import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Maç yorumları yönetimi
 */

/**
 * @swagger
 * /api/comments/match/{matchHistoryId}:
 *   get:
 *     summary: Maça ait tüm yorumları getir
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchHistoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/match/:matchHistoryId', authMiddleware, commentController.getMatchComments);

/**
 * @swagger
 * /api/comments/match/{matchHistoryId}/count:
 *   get:
 *     summary: Maçın yorum sayısını getir
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchHistoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/match/:matchHistoryId/count', authMiddleware, commentController.getCommentCount);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Yeni yorum oluştur
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchHistoryId
 *               - comment
 *             properties:
 *               matchHistoryId:
 *                 type: integer
 *               comment:
 *                 type: string
 *               commentType:
 *                 type: string
 *                 enum: [match_comment, coach_comment]
 *     responses:
 *       201:
 *         description: Yorum oluşturuldu
 */
router.post('/', authMiddleware, commentController.createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Belirli bir yorumu getir
 *     tags: [Comments]
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
router.get('/:id', authMiddleware, commentController.getCommentById);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Yorumu güncelle
 *     tags: [Comments]
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
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.put('/:id', authMiddleware, commentController.updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Yorumu sil
 *     tags: [Comments]
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
router.delete('/:id', authMiddleware, commentController.deleteComment);

export default router;

