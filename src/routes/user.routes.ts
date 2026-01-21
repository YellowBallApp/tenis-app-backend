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
 * /api/user/change-password:
 *   post:
 *     summary: Kullanıcı şifresini değiştir
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mevcut şifre
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Yeni şifre (en az 6 karakter)
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Şifre başarıyla değiştirildi
 *       400:
 *         description: Geçersiz istek veya validasyon hatası
 *       401:
 *         description: Yetkisiz erişim
 *       400:
 *         description: Mevcut şifre hatalı
 */
router.post("/change-password", authMiddleware, userController.changePassword);

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
 * /api/user/{id}:
 *   get:
 *     summary: ID'ye göre kullanıcı getir
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get("/:id", authMiddleware, userController.getById);

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
