import { Router } from "express";
import coachReviewController from "../controllers/coachReview.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authMiddleware);

// Antrenöre review oluştur
router.post("/", coachReviewController.create);

// Antrenörün tüm review'larını getir
router.get("/coach/:coachId", coachReviewController.getByCoachId);

// Kullanıcının tüm review'larını getir
router.get("/user", coachReviewController.getByUserId);

// Review güncelle
router.put("/:id", coachReviewController.update);

// Review sil
router.delete("/:id", coachReviewController.delete);

export default router;

