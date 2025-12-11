import { Router } from 'express';
import leagueTemplateController from '../controllers/leagueTemplate.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

/**
 * @swagger
 * /api/league-template/all:
 *   get:
 *     summary: Tüm lig şablonlarını listele
 *     tags: [League Template]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Şablon listesi
 */
router.get('/all', leagueTemplateController.getAllTemplates);

/**
 * @swagger
 * /api/league-template/{id}:
 *   get:
 *     summary: Belirli bir şablonu getir
 *     tags: [League Template]
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
 *         description: Şablon detayı
 */
router.get('/:id', leagueTemplateController.getTemplateById);

/**
 * @swagger
 * /api/league-template/create:
 *   post:
 *     summary: Yeni lig şablonu oluştur
 *     tags: [League Template]
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Şablon oluşturuldu
 */
router.post('/create', leagueTemplateController.createTemplate);

/**
 * @swagger
 * /api/league-template/{id}:
 *   put:
 *     summary: Lig şablonu güncelle
 *     tags: [League Template]
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
 *         description: Şablon güncellendi
 */
router.put('/:id', leagueTemplateController.updateTemplate);

/**
 * @swagger
 * /api/league-template/{id}:
 *   delete:
 *     summary: Lig şablonu sil
 *     tags: [League Template]
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
 *         description: Şablon silindi
 */
router.delete('/:id', leagueTemplateController.deleteTemplate);

export default router;

