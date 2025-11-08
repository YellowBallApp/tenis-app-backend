import userController from "../controllers/user.controller";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Kullanıcı profili getir
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı profili
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/profile", authMiddleware, userController.getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Kullanıcı profilini güncelle
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 description: Base64 encoded image
 *     responses:
 *       200:
 *         description: Profil güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
router.put("/profile", authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Tüm kullanıcıları listele
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/all", authMiddleware, userController.getAllUsers);

/**
 * @swagger
 * /api/user/available:
 *   get:
 *     summary: Belirli bir tarihte rezervasyonu olmayan kullanıcıları getir
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-01-15'
 *         description: Tarih (YYYY-MM-DD formatında)
 *     responses:
 *       200:
 *         description: Müsait kullanıcı listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Geçersiz tarih formatı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/available", authMiddleware, userController.getAvailableUsersForDate);

export default router;
