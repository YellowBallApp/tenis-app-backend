import { Router } from "express";
import memberReviewController from "../controllers/memberReview.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authMiddleware);

// Üyeye review oluştur
router.post("/", memberReviewController.create);

// Tüm yorumları getir (Admin - query param: onlyApproved)
router.get("/all", memberReviewController.getAll);

// Bekleyen yorumları getir (Admin)
router.get("/pending", memberReviewController.getPending);

// Üyenin tüm review'larını getir
router.get("/member/:memberId", memberReviewController.getByMemberId);

// Kullanıcının tüm review'larını getir
router.get("/user", memberReviewController.getByUserId);

// Bekleyen yorum sayısı (Admin)
router.get("/pending/count", memberReviewController.getPendingCount);

// Review onayla (Admin)
router.put("/:id/approve", memberReviewController.approve);

// Review güncelle
router.put("/:id", memberReviewController.update);

// Review sil
router.delete("/:id", memberReviewController.delete);

export default router;

