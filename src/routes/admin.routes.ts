import { Router } from "express";
import adminController from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

// Tüm admin route'ları admin yetkisi gerektirir
router.use(requireAdmin);

// Kullanıcı yönetimi
router.post("/users", adminController.createUser);
router.get("/users", adminController.getAllUsers);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.patch("/users/:id/password", adminController.updateUserPassword);

// Blocked time slot yönetimi
router.post("/blocked-time-slots", adminController.createBlockedTimeSlot);
router.post("/blocked-time-slots/bulk", adminController.createBulkBlockedTimeSlots);
router.get("/blocked-time-slots", adminController.getAllBlockedTimeSlots);
router.put("/blocked-time-slots/:id", adminController.updateBlockedTimeSlot);
router.delete("/blocked-time-slots/:id", adminController.deleteBlockedTimeSlot);

export default router;

