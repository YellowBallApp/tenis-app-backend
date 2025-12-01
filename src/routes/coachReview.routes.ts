import { Router } from "express";
import coachReviewController from "../controllers/coachReview.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authMiddleware);

// Antrenöre review oluştur
router.post("/", coachReviewController.create);

// Tüm yorumları getir (Admin - query param: onlyApproved)
router.get("/all", coachReviewController.getAll);

// Bekleyen yorumları getir (Admin)
router.get("/pending", coachReviewController.getPending);

// Antrenörün tüm review'larını getir
router.get("/coach/:coachId", coachReviewController.getByCoachId);

// Kullanıcının tüm review'larını getir
router.get("/user", coachReviewController.getByUserId);

// Bekleyen yorum sayısı (Admin)
router.get("/pending/count", coachReviewController.getPendingCount);

// Review onayla (Admin)
router.put("/:id/approve", coachReviewController.approve);

// Review güncelle
router.put("/:id", coachReviewController.update);

// Review sil
router.delete("/:id", coachReviewController.delete);

export default router;

